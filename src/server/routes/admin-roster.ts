import { and, count, eq, inArray } from 'drizzle-orm'
import { Hono } from 'hono'
import { athleteProfiles, schools, users } from '~/server/db/schema/existing-db-schema'
import { AppBindings, AppDb } from '~/server/types'

const adminRoster = new Hono<AppBindings>()

// --- CSV parsing ---

function splitCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < row.length; i++) {
    const ch = row[i]
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l)
  if (lines.length < 2) return []
  const headers = splitCSVRow(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = splitCSVRow(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (values[i] ?? '').trim() })
    return row
  })
}

// --- Shared import logic ---

interface AthleteData {
  name: string
  sport: string
  school?: string
  position?: string
  jerseyNumber?: string
  headshotUrl?: string
  year?: string
  hometown?: string
}

async function resolveSchool(db: AppDb, schoolName: string): Promise<string | null> {
  const [existing] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.name, schoolName))
  if (existing) return existing.id
  const [created] = await db
    .insert(schools)
    .values({ name: schoolName })
    .returning({ id: schools.id })
  return created?.id ?? null
}

type ImportResult =
  | { created: true }
  | { skipped: true }
  | { error: string }

async function importAthlete(db: AppDb, data: AthleteData): Promise<ImportResult> {
  const { name, sport, school, position, jerseyNumber, headshotUrl, year, hometown } = data

  if (!name?.trim() || !sport?.trim()) {
    return { error: `Missing required fields (name, sport): ${JSON.stringify({ name, sport })}` }
  }

  const schoolId = school?.trim() ? await resolveSchool(db, school.trim()) : null

  // Duplicate check: same displayName + sport + schoolId among unclaimed
  const dupeConditions = [
    eq(athleteProfiles.displayName, name),
    eq(athleteProfiles.sport, sport),
    eq(athleteProfiles.claimStatus, 'unclaimed'),
  ] as const
  const allConditions = schoolId
    ? [...dupeConditions, eq(athleteProfiles.schoolId, schoolId)]
    : [...dupeConditions]

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
    source: 'csv_import',
  })

  return { created: true }
}

// --- Routes ---

// POST /api/v1/admin/roster/import
adminRoster.post('/api/v1/admin/roster/import', async (c) => {
  const db = c.var.db
  const contentType = c.req.header('content-type') ?? ''

  let rows: AthleteData[]

  if (contentType.includes('multipart/form-data')) {
    const formData = await c.req.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return c.json({ error: 'Missing CSV file field named "file"' }, 400)
    }
    const text = await (file as File).text()
    rows = parseCSV(text) as AthleteData[]
  } else {
    const body = await c.req.json()
    if (!Array.isArray(body)) return c.json({ error: 'Expected JSON array' }, 400)
    rows = body as AthleteData[]
  }

  if (rows.length === 0) return c.json({ error: 'No rows to import' }, 400)

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      const result = await importAthlete(db, row)
      if ('error' in result) errors.push(result.error)
      else if ('skipped' in result) skipped++
      else created++
    } catch (err) {
      errors.push(`Row "${row.name ?? '?'}": ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return c.json({ total: rows.length, created, skipped, errors })
})

// POST /api/v1/admin/roster/manual
adminRoster.post('/api/v1/admin/roster/manual', async (c) => {
  const db = c.var.db
  const body = await c.req.json() as AthleteData

  try {
    const result = await importAthlete(db, body)
    if ('error' in result) return c.json({ error: result.error }, 400)
    if ('skipped' in result) return c.json({ message: 'Duplicate profile, skipped', skipped: true })
    return c.json({ message: 'Profile created', created: true }, 201)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})

// GET /api/v1/admin/roster/stats
adminRoster.get('/api/v1/admin/roster/stats', async (c) => {
  const db = c.var.db

  const [bySchool, bySport, byClaimStatus] = await Promise.all([
    db
      .select({ schoolId: athleteProfiles.schoolId, count: count() })
      .from(athleteProfiles)
      .groupBy(athleteProfiles.schoolId),
    db
      .select({ sport: athleteProfiles.sport, count: count() })
      .from(athleteProfiles)
      .groupBy(athleteProfiles.sport),
    db
      .select({ claimStatus: athleteProfiles.claimStatus, count: count() })
      .from(athleteProfiles)
      .groupBy(athleteProfiles.claimStatus),
  ])

  // Resolve school names
  const schoolIds = bySchool.map(r => r.schoolId).filter((id): id is string => !!id)
  const schoolNameMap: Record<string, string> = {}
  if (schoolIds.length > 0) {
    const schoolRows = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(inArray(schools.id, schoolIds))
    schoolRows.forEach(s => { schoolNameMap[s.id] = s.name })
  }

  return c.json({
    bySchool: bySchool.map(r => ({
      school: r.schoolId ? (schoolNameMap[r.schoolId] ?? r.schoolId) : 'Unknown',
      count: Number(r.count),
    })),
    bySport: bySport.map(r => ({ sport: r.sport, count: Number(r.count) })),
    byClaimStatus: byClaimStatus.map(r => ({ claimStatus: r.claimStatus, count: Number(r.count) })),
  })
})

export default adminRoster
