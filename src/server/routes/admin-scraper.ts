import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { scrapeRuns, schools } from '~/server/db/schema/existing-db-schema'
import { AppBindings, AppDb } from '~/server/types'
import { findSchool, findSchoolByDbName, NCAA_SCHOOLS } from '../scraper/ncaa-schools'
import { findSport, SPORTS } from '../scraper/sports-config'
import { scrapeSchool } from '../scraper/scrape-school'

const adminScraper = new Hono<AppBindings>()

// ─── Background scrape runner ────────────────────────────────────────────────

/**
 * Kick off a scrape in the background. Updates the top-level scrapeRuns row
 * when done. Errors are caught so the background promise never rejects.
 */
async function runScrapeInBackground(
  db: AppDb,
  runId: string,
  schoolArg: string | undefined,
  sportArg: string | undefined,
): Promise<void> {
  const targetSchools = schoolArg
    ? (() => { const s = findSchool(schoolArg); return s ? [s] : [] })()
    : NCAA_SCHOOLS

  const targetSports = sportArg
    ? (() => { const s = findSport(sportArg); return s ? [s] : [] })()
    : SPORTS

  if (targetSchools.length === 0 || targetSports.length === 0) {
    await db
      .update(scrapeRuns)
      .set({ status: 'failed', errors: ['Invalid school or sport filter'], completedAt: new Date().toISOString() })
      .where(eq(scrapeRuns.id, runId))
    return
  }

  let grandFound = 0
  let grandCreated = 0
  let grandSkipped = 0
  const grandErrors: string[] = []

  for (const school of targetSchools) {
    try {
      const result = await scrapeSchool(db, school, targetSports, runId)
      grandFound += result.totalFound
      grandCreated += result.totalCreated
      grandSkipped += result.totalSkipped
      grandErrors.push(...result.errors)
    } catch (err) {
      grandErrors.push(`${school.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await db
    .update(scrapeRuns)
    .set({
      status: grandErrors.length > 0 ? 'failed' : 'completed',
      athletesFound: grandFound,
      athletesCreated: grandCreated,
      athletesSkipped: grandSkipped,
      errors: grandErrors.slice(0, 200),
      completedAt: new Date().toISOString(),
    })
    .where(eq(scrapeRuns.id, runId))
}

// ─── POST /api/v1/admin/scraper/trigger ──────────────────────────────────────

adminScraper.post('/api/v1/admin/scraper/trigger', async (c) => {
  const db = c.var.db
  let body: { school?: string; sport?: string } = {}

  try {
    body = await c.req.json()
  } catch {
    // body is optional
  }

  const { school: schoolArg, sport: sportArg } = body

  // Validate inputs before creating the run record
  if (schoolArg) {
    const found = findSchool(schoolArg)
    if (!found) {
      return c.json({
        error: `School not found: "${schoolArg}". Use the shortName or a name fragment.`,
        availableSchools: NCAA_SCHOOLS.map(s => s.shortName),
      }, 400)
    }
  }

  if (sportArg) {
    const found = findSport(sportArg)
    if (!found) {
      return c.json({
        error: `Sport not found: "${sportArg}". Use the canonical sport name.`,
        availableSports: SPORTS.map(s => s.name),
      }, 400)
    }
  }

  // Resolve school DB id if a specific school was requested
  let schoolDbId: string | null = null
  if (schoolArg) {
    const schoolRecord = findSchool(schoolArg)!
    const [existing] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.name, schoolRecord.name))
    schoolDbId = existing?.id ?? null
  }

  // Create the top-level run record
  const [run] = await db
    .insert(scrapeRuns)
    .values({
      schoolId: schoolDbId,
      sport: sportArg ?? null,
      status: 'running',
      startedAt: new Date().toISOString(),
    })
    .returning({ id: scrapeRuns.id })

  const runId = run.id

  // Fire and forget — don't await
  runScrapeInBackground(db, runId, schoolArg, sportArg).catch(err => {
    console.error(`[scraper] Background run ${runId} threw unexpectedly:`, err)
  })

  return c.json({
    runId,
    status: 'running',
    school: schoolArg ?? 'all',
    sport: sportArg ?? 'all',
    message: 'Scrape started. Poll /api/v1/admin/scraper/runs/:id for status.',
  }, 202)
})

// ─── GET /api/v1/admin/scraper/runs ──────────────────────────────────────────

adminScraper.get('/api/v1/admin/scraper/runs', async (c) => {
  const db = c.var.db
  const limitParam = c.req.query('limit')
  const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, 200)

  const runs = await db
    .select({
      id: scrapeRuns.id,
      schoolId: scrapeRuns.schoolId,
      sport: scrapeRuns.sport,
      status: scrapeRuns.status,
      athletesFound: scrapeRuns.athletesFound,
      athletesCreated: scrapeRuns.athletesCreated,
      athletesSkipped: scrapeRuns.athletesSkipped,
      startedAt: scrapeRuns.startedAt,
      completedAt: scrapeRuns.completedAt,
    })
    .from(scrapeRuns)
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(limit)

  // Resolve school names
  const schoolIds = [...new Set(runs.map(r => r.schoolId).filter((id): id is string => !!id))]
  const schoolNameMap: Record<string, string> = {}
  if (schoolIds.length > 0) {
    const { inArray } = await import('drizzle-orm')
    const rows = await db.select({ id: schools.id, name: schools.name }).from(schools).where(inArray(schools.id, schoolIds))
    rows.forEach(s => { schoolNameMap[s.id] = s.name })
  }

  return c.json({
    runs: runs.map(r => ({
      ...r,
      schoolName: r.schoolId ? (schoolNameMap[r.schoolId] ?? null) : null,
    })),
    total: runs.length,
  })
})

// ─── GET /api/v1/admin/scraper/runs/:id ──────────────────────────────────────

adminScraper.get('/api/v1/admin/scraper/runs/:id', async (c) => {
  const db = c.var.db
  const id = c.req.param('id')

  const [run] = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.id, id))

  if (!run) return c.json({ error: 'Run not found' }, 404)

  let schoolName: string | null = null
  if (run.schoolId) {
    const [s] = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, run.schoolId))
    schoolName = s?.name ?? null
  }

  return c.json({ ...run, schoolName })
})

// ─── POST /api/v1/admin/scraper/expanded ─────────────────────────────────────

interface ExpandedBodySingle {
  schoolId: string
  sport: string
}
interface ExpandedBodyMulti {
  sports: string[]
  schoolId?: string
}

adminScraper.post('/api/v1/admin/scraper/expanded', async (c) => {
  const db = c.var.db
  let body: ExpandedBodySingle | ExpandedBodyMulti

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  // ── Resolve target schools ────────────────────────────────────────────────
  let targetSchools: typeof NCAA_SCHOOLS = []

  if ('schoolId' in body && body.schoolId) {
    // Single school: look up by DB UUID
    const [schoolRecord] = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(eq(schools.id, body.schoolId))

    if (!schoolRecord) {
      return c.json({ error: `School not found in DB: "${body.schoolId}"` }, 404)
    }

    const ncaaSchool = findSchoolByDbName(schoolRecord.name)
    if (!ncaaSchool) {
      return c.json({
        error: `School "${schoolRecord.name}" is not in the NCAA scraper catalog.`,
        availableSchools: NCAA_SCHOOLS.map(s => s.name),
      }, 400)
    }
    targetSchools = [ncaaSchool]
  } else {
    // All schools
    targetSchools = NCAA_SCHOOLS
  }

  // ── Resolve target sports ─────────────────────────────────────────────────
  let targetSports: ReturnType<typeof findSport>[] = []

  if ('sport' in body && body.sport) {
    // Single sport
    const s = findSport(body.sport)
    if (!s) {
      return c.json({
        error: `Sport not found: "${body.sport}". Use the canonical name.`,
        availableSports: SPORTS.map(s => s.name),
      }, 400)
    }
    targetSports = [s]
  } else if ('sports' in body && Array.isArray(body.sports)) {
    if (body.sports.length === 0) {
      return c.json({ error: 'sports array cannot be empty' }, 400)
    }
    const resolved: ReturnType<typeof findSport>[] = []
    const notFound: string[] = []
    for (const sportName of body.sports) {
      const s = findSport(sportName)
      if (s) resolved.push(s)
      else notFound.push(sportName)
    }
    if (notFound.length > 0) {
      return c.json({
        error: `Unknown sport(s): ${notFound.join(', ')}`,
        availableSports: SPORTS.map(s => s.name),
      }, 400)
    }
    targetSports = resolved
  } else {
    return c.json({
      error: 'Body must contain either { schoolId, sport } or { sports: string[] }',
    }, 400)
  }

  // ── Create the top-level scrape run ───────────────────────────────────────
  const [run] = await db
    .insert(scrapeRuns)
    .values({
      schoolId: 'schoolId' in body && body.schoolId ? body.schoolId : null,
      sport: targetSports.length === 1 ? targetSports[0].name : null,
      status: 'running',
      startedAt: new Date().toISOString(),
    })
    .returning({ id: scrapeRuns.id })

  const runId = run.id

  // Fire and forget
  runScrapeInBackground(
    db,
    runId,
    targetSchools.length === 1 ? targetSchools[0].shortName : undefined,
    targetSports.length === 1 ? targetSports[0].name : undefined,
  ).catch(err => {
    console.error(`[scraper] Expanded run ${runId} threw unexpectedly:`, err)
  })

  return c.json({
    runId,
    status: 'running',
    schools: targetSchools.map(s => ({ name: s.name, shortName: s.shortName })),
    sports: targetSports.map(s => s.name),
    message: 'Scrape started. Poll /api/v1/admin/scraper/runs/:id for status.',
  }, 202)
})

// ─── GET /api/v1/admin/scraper/schools ───────────────────────────────────────

adminScraper.get('/api/v1/admin/scraper/schools', (c) => {
  return c.json({
    schools: NCAA_SCHOOLS.map(s => ({
      name: s.name,
      shortName: s.shortName,
      conference: s.conference,
      domain: s.domain,
    })),
    total: NCAA_SCHOOLS.length,
  })
})

// ─── GET /api/v1/admin/scraper/sports ────────────────────────────────────────

adminScraper.get('/api/v1/admin/scraper/sports', (c) => {
  return c.json({
    sports: SPORTS.map(s => ({ name: s.name, slugs: s.slugs })),
    total: SPORTS.length,
  })
})

export default adminScraper
