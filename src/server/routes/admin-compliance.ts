import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { stateNilRules } from '~/server/db/schema/existing-db-schema'
import { AppBindings, AppDb } from '~/server/types'

const adminCompliance = new Hono<AppBindings>()

// GET /api/v1/admin/compliance/states
adminCompliance.get('/api/v1/admin/compliance/states', async (c) => {
  const db = c.var.db as AppDb
  const rules = await db
    .select()
    .from(stateNilRules)
    .orderBy(stateNilRules.state)
  return c.json({ states: rules })
})

// GET /api/v1/admin/compliance/states/:state
adminCompliance.get('/api/v1/admin/compliance/states/:state', async (c) => {
  const db = c.var.db as AppDb
  const state = c.req.param('state').toUpperCase()
  const [rule] = await db
    .select()
    .from(stateNilRules)
    .where(eq(stateNilRules.state, state))
  if (!rule) return c.json({ error: `No rule found for state: ${state}` }, 404)
  return c.json({ state: rule })
})

// POST /api/v1/admin/compliance/states
adminCompliance.post('/api/v1/admin/compliance/states', async (c) => {
  const db = c.var.db as AppDb
  const body = await c.req.json() as {
    state: string
    modelType: 'unified' | 'dual' | 'prohibited'
    minAge: number
    restrictions?: string
  }

  if (!body.state || !body.modelType || body.minAge == null) {
    return c.json({ error: 'Missing required fields: state, modelType, minAge' }, 400)
  }

  const stateCode = body.state.toUpperCase()
  if (stateCode.length !== 2) {
    return c.json({ error: 'State must be a 2-letter ISO code (e.g., CA, TX)' }, 400)
  }

  const [existing] = await db
    .select()
    .from(stateNilRules)
    .where(eq(stateNilRules.state, stateCode))
  if (existing) {
    return c.json({ error: `Rule already exists for state: ${stateCode}. Use PATCH to update.` }, 409)
  }

  const [created] = await db
    .insert(stateNilRules)
    .values({
      state: stateCode,
      modelType: body.modelType,
      minAge: body.minAge,
      restrictions: body.restrictions ?? null,
    })
    .returning()

  return c.json({ state: created }, 201)
})

// PATCH /api/v1/admin/compliance/states/:state
adminCompliance.patch('/api/v1/admin/compliance/states/:state', async (c) => {
  const db = c.var.db as AppDb
  const state = c.req.param('state').toUpperCase()
  const body = await c.req.json() as {
    modelType?: 'unified' | 'dual' | 'prohibited'
    minAge?: number
    restrictions?: string
  }

  const updates: Record<string, unknown> = {}
  if (body.modelType != null) updates.modelType = body.modelType
  if (body.minAge != null) updates.minAge = body.minAge
  if (body.restrictions != null) updates.restrictions = body.restrictions
  updates.updatedAt = new Date()

  if (Object.keys(updates).length === 1) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  const [updated] = await db
    .update(stateNilRules)
    .set(updates)
    .where(eq(stateNilRules.state, state))
    .returning()

  if (!updated) return c.json({ error: `No rule found for state: ${state}` }, 404)
  return c.json({ state: updated })
})

export default adminCompliance
