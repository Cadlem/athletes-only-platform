import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { athleteProfiles, preSubscriptions } from '~/server/db/schema/existing-db-schema'
import { AppBindings } from '~/server/types'

const preSubscription = new Hono<AppBindings>()

// POST /api/v1/athletes/unclaimed/:id/pre-subscribe
preSubscription.post('/api/v1/athletes/unclaimed/:id/pre-subscribe', async (c) => {
  const db = c.var.db
  const user = c.var.user

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Fan profile ID is stored as profileId on the user
  const fanId = user.profileId as string | undefined
  if (!fanId) {
    return c.json({ error: 'Fan profile not found' }, 403)
  }

  const athleteProfileId = c.req.param('id')

  // Validate athlete exists and is unclaimed
  const [athlete] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, athleteProfileId))

  if (!athlete) {
    return c.json({ error: 'Athlete not found' }, 404)
  }

  if (athlete.claimStatus !== 'unclaimed') {
    return c.json({ error: 'Athlete is not unclaimed' }, 400)
  }

  // Check fan doesn't already have a pre-subscription for this athlete
  const [existing] = await db
    .select()
    .from(preSubscriptions)
    .where(
      and(
        eq(preSubscriptions.fanId, fanId),
        eq(preSubscriptions.athleteProfileId, athleteProfileId),
      ),
    )

  if (existing) {
    return c.json({ error: 'Already pre-subscribed to this athlete' }, 409)
  }

  // Parse body
  const body = await c.req.json() as { tier: 'bronze' | 'silver' | 'gold' }
  const { tier } = body

  if (!tier || !['bronze', 'silver', 'gold'].includes(tier)) {
    return c.json({ error: 'Invalid tier. Must be bronze, silver, or gold.' }, 400)
  }

  // Get monthly amount from athlete's tierPricing
  const tierPricing = athlete.tierPricing as Record<string, number>
  const monthlyAmountCents = tierPricing[tier]

  if (!monthlyAmountCents) {
    return c.json({ error: `Pricing not found for tier: ${tier}` }, 400)
  }

  // Calculate expiresAt: 90 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 90)

  // Create pre-subscription
  const [record] = await db
    .insert(preSubscriptions)
    .values({
      fanId,
      athleteProfileId,
      tier,
      monthlyAmountCents,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    })
    .returning()

  // Increment preSubscriberCount
  await db
    .update(athleteProfiles)
    .set({ preSubscriberCount: athleteProfiles.preSubscriberCount + 1 })
    .where(eq(athleteProfiles.id, athleteProfileId))

  return c.json({ preSubscription: record }, 201)
})

// DELETE /api/v1/athletes/unclaimed/:id/pre-subscribe
preSubscription.delete('/api/v1/athletes/unclaimed/:id/pre-subscribe', async (c) => {
  const db = c.var.db
  const user = c.var.user

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const fanId = user.profileId as string | undefined
  if (!fanId) {
    return c.json({ error: 'Fan profile not found' }, 403)
  }

  const athleteProfileId = c.req.param('id')

  // Find pre-subscription
  const [existing] = await db
    .select()
    .from(preSubscriptions)
    .where(
      and(
        eq(preSubscriptions.fanId, fanId),
        eq(preSubscriptions.athleteProfileId, athleteProfileId),
      ),
    )

  if (!existing) {
    return c.json({ error: 'Pre-subscription not found' }, 404)
  }

  // Delete pre-subscription
  await db
    .delete(preSubscriptions)
    .where(eq(preSubscriptions.id, existing.id))

  // Decrement preSubscriberCount (floor at 0)
  const [athlete] = await db
    .select({ preSubscriberCount: athleteProfiles.preSubscriberCount })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, athleteProfileId))

  if (athlete && athlete.preSubscriberCount > 0) {
    await db
      .update(athleteProfiles)
      .set({ preSubscriberCount: athlete.preSubscriberCount - 1 })
      .where(eq(athleteProfiles.id, athleteProfileId))
  }

  return c.json({ message: 'Pre-subscription cancelled' }, 200)
})

export default preSubscription
