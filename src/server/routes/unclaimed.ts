import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { athleteProfiles } from '~/server/db/schema/existing-db-schema'
import { AppBindings } from '~/server/types'

const unclaimed = new Hono<AppBindings>()

unclaimed.get('/api/v1/athletes/unclaimed', async (c) => {
  const db = c.var.db
  const athletes = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.claimStatus, 'unclaimed'))
  return c.json({ athletes })
})

unclaimed.get('/api/v1/athletes/unclaimed/:id', async (c) => {
  const db = c.var.db
  const id = c.req.param('id')
  const [athlete] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, id))
  if (!athlete || athlete.claimStatus !== 'unclaimed') {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ athlete })
})

export default unclaimed
