import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import crypto from 'node:crypto'
import {
  athleteProfiles,
  auditLogs,
  fanProfiles,
  preSubscriptions,
  refreshTokens,
  users,
} from '~/server/db/schema/existing-db-schema'
import { createNotification } from '~/server/lib/notifications'
import { AppBindings } from '~/server/types'

const claim = new Hono<AppBindings>()

// POST /api/v1/athletes/claim/:id
// Body: { email: string, password: string, displayName?: string }
// Claims an athlete profile: creates/links user account and transitions profile to claimed/active
claim.post('/api/v1/athletes/claim/:id', async (c) => {
  const db = c.var.db
  const auth = c.var.auth
  const athleteId = c.req.param('id')

  const body = await c.req.json() as { email: string; password: string; displayName?: string }
  const { email, password, displayName } = body

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400)
  }

  // Validate athlete exists and is unclaimed
  const [athlete] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, athleteId))

  if (!athlete) {
    return c.json({ error: 'Athlete profile not found' }, 404)
  }

  if (athlete.claimStatus !== 'unclaimed') {
    return c.json({ error: 'Profile is not available for claiming' }, 400)
  }

  // Check if user already exists with this email
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))

  let userId: string
  let isNewUser = false

  if (existingUser) {
    userId = existingUser.id
  } else {
    isNewUser = true
    const passwordHash = await hashPassword(password)
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        role: 'fan',
        status: 'active',
      })
      .returning({ id: users.id })

    userId = newUser.id

    // Create fan profile for new user
    const fanDisplayName = displayName || email.split('@')[0]
    await db.insert(fanProfiles).values({
      userId,
      displayName: fanDisplayName,
    })
  }

  // Transition athlete profile directly to claimed/active (MVP: no pending step)
  await db
    .update(athleteProfiles)
    .set({
      claimStatus: 'claimed',
      verificationStatus: 'verified',
      claimedBy: userId,
      claimedAt: new Date().toISOString(),
    })
    .where(eq(athleteProfiles.id, athleteId))

  // Activate all pending pre-subscriptions and notify fans
  const now = new Date().toISOString()
  const pending = await db
    .select()
    .from(preSubscriptions)
    .where(eq(preSubscriptions.athleteProfileId, athleteId))

  const activated: string[] = []

  for (const sub of pending) {
    if (sub.status === 'pending') {
      await db
        .update(preSubscriptions)
        .set({ status: 'activated', activatedAt: now })
        .where(eq(preSubscriptions.id, sub.id))

      // Get fan's userId via fanProfile
      const [fanProfile] = await db
        .select({ userId: fanProfiles.userId, displayName: fanProfiles.displayName })
        .from(fanProfiles)
        .where(eq(fanProfiles.id, sub.fanId))

      if (fanProfile) {
        await createNotification(db, {
          userId: fanProfile.userId,
          type: 'athlete_claimed',
          title: `${athlete.displayName} just joined Athletes Only!`,
          body: 'Your subscription is now active. You can start receiving content from them.',
          data: { athleteId, fanId: sub.fanId, tier: sub.tier },
        })
      }

      activated.push(sub.id)
    }
  }

  // Create better-auth session (sets cookie automatically)
  const session = await auth.createSession(userId, c.req.raw.headers)

  // Also store in refresh_tokens for explicit bearer-token auth
  const token = session.token
  const expiresAt = new Date(session.expiresAt)
  await db.insert(refreshTokens).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: token,
    expiresAt: expiresAt.toISOString(),
  })

  // Create audit log entry
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId,
    action: 'athlete_claim_completed',
    resourceType: 'athlete_profile',
    resourceId: athleteId,
    details: { isNewUser, email },
  })

  return c.json({
    token,
    athlete: {
      id: athlete.id,
      displayName: athlete.displayName,
      sport: athlete.sport,
      claimStatus: 'claimed',
      verificationStatus: 'verified',
    },
    isNewUser,
    preSubscriberCount: pending.length,
    activatedCount: activated.length,
  })
})

// POST /api/v1/athletes/claim/:id/confirm
// Confirms and finalizes a pending claim (for two-step flow)
// MVP: mostly a no-op since claim already sets claimed/active
claim.post('/api/v1/athletes/claim/:id/confirm', async (c) => {
  const db = c.var.db
  const user = c.var.user
  const athleteId = c.req.param('id')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [athlete] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, athleteId))

  if (!athlete) {
    return c.json({ error: 'Athlete profile not found' }, 404)
  }

  // Already claimed in single step — just return success
  if (athlete.claimStatus === 'claimed' || athlete.claimStatus === 'active') {
    return c.json({
      message: 'Profile already claimed',
      athlete: {
        id: athlete.id,
        displayName: athlete.displayName,
        claimStatus: athlete.claimStatus,
        verificationStatus: athlete.verificationStatus,
      },
    })
  }

  if (athlete.claimStatus !== 'pending_claim') {
    return c.json({ error: 'Profile is not in pending claim state' }, 400)
  }

  if (athlete.claimedBy !== user.id) {
    return c.json({ error: 'You did not initiate this claim' }, 403)
  }

  // Finalize claim
  await db
    .update(athleteProfiles)
    .set({
      claimStatus: 'claimed',
      verificationStatus: 'verified',
    })
    .where(eq(athleteProfiles.id, athleteId))

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: user.id,
    action: 'athlete_claim_confirmed',
    resourceType: 'athlete_profile',
    resourceId: athleteId,
    details: {},
  })

  return c.json({
    message: 'Profile claimed successfully',
    athlete: {
      id: athlete.id,
      displayName: athlete.displayName,
      sport: athlete.sport,
      claimStatus: 'claimed',
      verificationStatus: 'verified',
    },
  })
})

// POST /api/v1/athletes/claim/:id/verify
// Auto-approve for MVP (scrape data was validated during import)
claim.post('/api/v1/athletes/claim/:id/verify', async (c) => {
  const db = c.var.db
  const user = c.var.user
  const athleteId = c.req.param('id')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const [athlete] = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.id, athleteId))

  if (!athlete) {
    return c.json({ error: 'Athlete profile not found' }, 404)
  }

  if (athlete.claimStatus !== 'pending_claim') {
    return c.json({ error: 'Profile is not in pending claim state' }, 400)
  }

  if (athlete.claimedBy !== user.id) {
    return c.json({ error: 'You did not initiate this claim' }, 403)
  }

  // Auto-approve for MVP
  await db
    .update(athleteProfiles)
    .set({
      claimStatus: 'claimed',
      verificationStatus: 'verified',
    })
    .where(eq(athleteProfiles.id, athleteId))

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: user.id,
    action: 'athlete_claim_verified',
    resourceType: 'athlete_profile',
    resourceId: athleteId,
    details: { autoApproved: true },
  })

  return c.json({
    verified: true,
    athlete: {
      id: athlete.id,
      displayName: athlete.displayName,
      claimStatus: 'claimed',
      verificationStatus: 'verified',
    },
  })
})

// --- helpers ---

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex')
  return `$2b$10$${salt}${hash.substring(0, 22)}`
}
