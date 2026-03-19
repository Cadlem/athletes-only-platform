/**
 * NCAA Roster Scraper — CLI entry point
 *
 * Usage (run via dotenvx so DATABASE_URL is set):
 *   dotenvx run -- tsx src/server/scraper/run-scraper.ts
 *   dotenvx run -- tsx src/server/scraper/run-scraper.ts --school=alabama
 *   dotenvx run -- tsx src/server/scraper/run-scraper.ts --school=alabama --sport=football
 *   dotenvx run -- tsx src/server/scraper/run-scraper.ts --sport=football
 *
 * Flags:
 *   --school=<name>   Short name or name fragment (case-insensitive). Omit to scrape all schools.
 *   --sport=<name>    Canonical sport name (case-insensitive). Omit to scrape all sports.
 *   --dry-run         Parse rosters but do NOT write to the database.
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { schema } from '~/server/db'
import { scrapeRuns } from '~/server/db/schema/existing-db-schema'
import { findSchool, NCAA_SCHOOLS, NcaaSchool } from './ncaa-schools'
import { findSport, SPORTS, SportConfig } from './sports-config'
import { scrapeSchool } from './scrape-school'

// ─── Parse CLI flags ──────────────────────────────────────────────────────────

function parseArgs(): { school?: string; sport?: string; dryRun: boolean } {
  const args = process.argv.slice(2)
  let school: string | undefined
  let sport: string | undefined
  let dryRun = false

  for (const arg of args) {
    if (arg.startsWith('--school=')) school = arg.slice('--school='.length)
    else if (arg.startsWith('--sport=')) sport = arg.slice('--sport='.length)
    else if (arg === '--dry-run') dryRun = true
  }

  return { school, sport, dryRun }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { school: schoolArg, sport: sportArg, dryRun } = parseArgs()

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set. Run with: dotenvx run -- tsx src/server/scraper/run-scraper.ts')
    process.exit(1)
  }

  // Resolve schools
  let schools: NcaaSchool[]
  if (schoolArg) {
    const found = findSchool(schoolArg)
    if (!found) {
      console.error(`ERROR: School not found: "${schoolArg}"`)
      console.error('Available schools:', NCAA_SCHOOLS.map(s => s.shortName).join(', '))
      process.exit(1)
    }
    schools = [found]
  } else {
    schools = NCAA_SCHOOLS
  }

  // Resolve sports
  let sports: SportConfig[]
  if (sportArg) {
    const found = findSport(sportArg)
    if (!found) {
      console.error(`ERROR: Sport not found: "${sportArg}"`)
      console.error('Available sports:', SPORTS.map(s => s.name).join(', '))
      process.exit(1)
    }
    sports = [found]
  } else {
    sports = SPORTS
  }

  console.log(`\nScraping ${schools.length} school(s) × ${sports.length} sport(s)`)
  if (dryRun) console.log('DRY RUN — no database writes')
  console.log()

  if (dryRun) {
    // Dry run: just attempt fetches, print parsed results, no DB
    for (const school of schools) {
      for (const sport of sports) {
        const url = school.rosterUrlTemplate.replace('{sport}', sport.slugs[0])
        process.stdout.write(`  ${school.shortName} / ${sport.name} → ${url} ... `)
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'AthletesOnly-Scraper/1.0 (dry-run)' },
            signal: AbortSignal.timeout(15_000),
          })
          if (res.ok) {
            const html = await res.text()
            const { parseRosterHtml } = await import('./roster-parser')
            const athletes = parseRosterHtml(html, url)
            console.log(`${athletes.length} athletes parsed`)
          } else {
            console.log(`HTTP ${res.status}`)
          }
        } catch (err) {
          console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    return
  }

  // Live run: connect to DB
  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  // Create a top-level scrape run record
  const [topRun] = await db
    .insert(scrapeRuns)
    .values({
      schoolId: null,
      sport: sportArg ?? null,
      status: 'running',
      startedAt: new Date().toISOString(),
    })
    .returning({ id: scrapeRuns.id })

  const runId = topRun.id
  console.log(`Run ID: ${runId}\n`)

  let grandTotalFound = 0
  let grandTotalCreated = 0
  let grandTotalSkipped = 0
  const grandErrors: string[] = []

  for (const school of schools) {
    console.log(`── ${school.name} (${school.conference}) ──`)
    try {
      const result = await scrapeSchool(db, school, sports, runId)
      console.log(
        `   Sports with rosters: ${result.sportsWithRosters}/${result.sportsAttempted}  ` +
        `Found: ${result.totalFound}  Created: ${result.totalCreated}  Skipped: ${result.totalSkipped}`
      )
      if (result.errors.length > 0) {
        console.log(`   Errors (${result.errors.length}):`)
        result.errors.slice(0, 5).forEach(e => console.log(`     • ${e}`))
        if (result.errors.length > 5) console.log(`     ... and ${result.errors.length - 5} more`)
      }
      grandTotalFound += result.totalFound
      grandTotalCreated += result.totalCreated
      grandTotalSkipped += result.totalSkipped
      grandErrors.push(...result.errors)
    } catch (err) {
      const msg = `School "${school.name}" failed: ${err instanceof Error ? err.message : String(err)}`
      console.error(`   ERROR: ${msg}`)
      grandErrors.push(msg)
    }
    console.log()
  }

  // Update top-level run record
  await db
    .update(scrapeRuns)
    .set({
      status: grandErrors.length > 0 ? 'failed' : 'completed',
      athletesFound: grandTotalFound,
      athletesCreated: grandTotalCreated,
      athletesSkipped: grandTotalSkipped,
      errors: grandErrors.slice(0, 200),  // cap stored errors
      completedAt: new Date().toISOString(),
    })
    .where(eq(scrapeRuns.id, runId))

  console.log('═══ Summary ═══════════════════════════════')
  console.log(`  Schools scraped : ${schools.length}`)
  console.log(`  Athletes found  : ${grandTotalFound}`)
  console.log(`  Profiles created: ${grandTotalCreated}`)
  console.log(`  Duplicates skip : ${grandTotalSkipped}`)
  console.log(`  Errors          : ${grandErrors.length}`)
  console.log(`  Run ID          : ${runId}`)
  console.log()

  await client.end()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
