import { and, eq } from 'drizzle-orm'
import { athleteProfiles, schools, scrapeRuns, users } from '~/server/db/schema/existing-db-schema'
import { AppDb } from '~/server/types'
import { NcaaSchool } from './ncaa-schools'
import { parseRosterHtml } from './roster-parser'
import { SportConfig, SPORTS } from './sports-config'

const USER_AGENT = 'Mozilla/5.0 (compatible; AthletesOnly-Scraper/1.0; +https://athletes.only)'
const RATE_LIMIT_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── HTTP fetch with rate limit ──────────────────────────────────────────────

let _lastFetchAt = 0

async function fetchWithRateLimit(url: string): Promise<{ html: string; ok: boolean; status: number }> {
  const now = Date.now()
  const elapsed = now - _lastFetchAt
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed)
  }
  _lastFetchAt = Date.now()

  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) return { html: '', ok: false, status: res.status }
  const html = await res.text()
  return { html, ok: true, status: res.status }
}

// ─── School DB resolution ────────────────────────────────────────────────────

export async function resolveSchoolId(db: AppDb, name: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.name, name))
  if (existing) return existing.id

  const [created] = await db
    .insert(schools)
    .values({ name })
    .returning({ id: schools.id })
  return created?.id ?? null
}

// ─── Athlete import (scraped source) ─────────────────────────────────────────

interface AthleteImportData {
  name: string
  sport: string
  schoolId: string | null
  position?: string
  jerseyNumber?: string
  headshotUrl?: string
  year?: string
  hometown?: string
  rosterSourceUrl: string
}

type ImportResult = { created: true } | { skipped: true } | { error: string }

async function importScrapedAthlete(db: AppDb, data: AthleteImportData): Promise<ImportResult> {
  const { name, sport, schoolId, position, jerseyNumber, headshotUrl, year, hometown, rosterSourceUrl } = data

  if (!name?.trim() || !sport?.trim()) {
    return { error: `Missing required fields: ${JSON.stringify({ name, sport })}` }
  }

  // Duplicate check: same displayName + sport + schoolId among unclaimed/scraped
  const conditions = [
    eq(athleteProfiles.displayName, name),
    eq(athleteProfiles.sport, sport),
    eq(athleteProfiles.claimStatus, 'unclaimed'),
  ] as const

  const allConditions = schoolId
    ? [...conditions, eq(athleteProfiles.schoolId, schoolId)]
    : [...conditions]

  const [existing] = await db
    .select({ id: athleteProfiles.id })
    .from(athleteProfiles)
    .where(and(...allConditions))

  if (existing) return { skipped: true }

  // Create placeholder user
  const placeholderEmail = `unclaimed_${crypto.randomUUID()}@placeholder.athletes-only`
  const [user] = await db
    .insert(users)
    .values({
      email: placeholderEmail,
      passwordHash: 'unclaimed_placeholder',
      role: 'athlete',
      status: 'active',
    })
    .returning({ id: users.id })

  await db.insert(athleteProfiles).values({
    userId: user.id,
    schoolId,
    displayName: name,
    sport,
    avatarUrl: headshotUrl?.trim() || null,
    position: position ?? null,
    jerseyNumber: jerseyNumber ?? null,
    year: year ?? null,
    hometown: hometown ?? null,
    claimStatus: 'unclaimed',
    source: 'scraped',
    rosterSourceUrl,
  })

  return { created: true }
}

// ─── Scrape one sport for one school ─────────────────────────────────────────

export interface SportScrapeResult {
  sport: string
  url: string | null
  athletesFound: number
  created: number
  skipped: number
  errors: string[]
}

async function scrapeOneSport(
  db: AppDb,
  school: NcaaSchool,
  sport: SportConfig,
  schoolDbId: string,
): Promise<SportScrapeResult> {
  const result: SportScrapeResult = {
    sport: sport.name,
    url: null,
    athletesFound: 0,
    created: 0,
    skipped: 0,
    errors: [],
  }

  // Try each slug until one returns 200
  let html = ''
  let resolvedUrl: string | null = null

  for (const slug of sport.slugs) {
    const url = school.rosterUrlTemplate.replace('{sport}', slug)
    const { html: body, ok } = await fetchWithRateLimit(url)
    if (ok && body.length > 500) {
      html = body
      resolvedUrl = url
      break
    }
  }

  if (!resolvedUrl || !html) {
    // Not an error — school may just not have this sport
    return result
  }

  result.url = resolvedUrl
  const athletes = parseRosterHtml(html, resolvedUrl)
  result.athletesFound = athletes.length

  for (const athlete of athletes) {
    try {
      const importResult = await importScrapedAthlete(db, {
        name: athlete.name,
        sport: sport.name,
        schoolId: schoolDbId,
        position: athlete.position,
        jerseyNumber: athlete.jerseyNumber,
        headshotUrl: athlete.headshotUrl,
        year: athlete.year,
        hometown: athlete.hometown,
        rosterSourceUrl: resolvedUrl,
      })

      if ('created' in importResult) result.created++
      else if ('skipped' in importResult) result.skipped++
      else result.errors.push(importResult.error)
    } catch (err) {
      result.errors.push(`"${athlete.name}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

// ─── Scrape all sports for one school ────────────────────────────────────────

export interface SchoolScrapeResult {
  schoolName: string
  sportsAttempted: number
  sportsWithRosters: number
  totalFound: number
  totalCreated: number
  totalSkipped: number
  errors: string[]
  sportResults: SportScrapeResult[]
}

export async function scrapeSchool(
  db: AppDb,
  school: NcaaSchool,
  sportsToScrape: SportConfig[] = SPORTS,
  runId?: string,
): Promise<SchoolScrapeResult> {
  const schoolDbId = await resolveSchoolId(db, school.name)
  if (!schoolDbId) {
    return {
      schoolName: school.name,
      sportsAttempted: 0,
      sportsWithRosters: 0,
      totalFound: 0,
      totalCreated: 0,
      totalSkipped: 0,
      errors: [`Failed to resolve school DB ID for "${school.name}"`],
      sportResults: [],
    }
  }

  const sportResults: SportScrapeResult[] = []
  let totalFound = 0
  let totalCreated = 0
  let totalSkipped = 0
  const allErrors: string[] = []

  for (const sport of sportsToScrape) {
    // Create a per-sport scrape run record if we have a parent runId
    let sportRunId: string | undefined
    if (runId) {
      const [row] = await db
        .insert(scrapeRuns)
        .values({
          schoolId: schoolDbId,
          sport: sport.name,
          status: 'running',
          startedAt: new Date().toISOString(),
        })
        .returning({ id: scrapeRuns.id })
      sportRunId = row?.id
    }

    let sportResult: SportScrapeResult
    try {
      sportResult = await scrapeOneSport(db, school, sport, schoolDbId)
    } catch (err) {
      sportResult = {
        sport: sport.name,
        url: null,
        athletesFound: 0,
        created: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      }
    }

    sportResults.push(sportResult)
    totalFound += sportResult.athletesFound
    totalCreated += sportResult.created
    totalSkipped += sportResult.skipped
    allErrors.push(...sportResult.errors.map(e => `[${sport.name}] ${e}`))

    // Update the sport run record
    if (sportRunId) {
      await db
        .update(scrapeRuns)
        .set({
          status: sportResult.errors.length > 0 ? 'failed' : 'completed',
          athletesFound: sportResult.athletesFound,
          athletesCreated: sportResult.created,
          athletesSkipped: sportResult.skipped,
          errors: sportResult.errors,
          completedAt: new Date().toISOString(),
        })
        .where(eq(scrapeRuns.id, sportRunId))
    }
  }

  return {
    schoolName: school.name,
    sportsAttempted: sportsToScrape.length,
    sportsWithRosters: sportResults.filter(r => r.athletesFound > 0).length,
    totalFound,
    totalCreated,
    totalSkipped,
    errors: allErrors,
    sportResults,
  }
}
