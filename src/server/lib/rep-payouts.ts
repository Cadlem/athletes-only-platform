import { eq, and } from 'drizzle-orm'
import { athleteRepresentatives } from '../db/schema/existing-db-schema'

export interface RepSplit {
  repId: string
  amountCents: number
}

// ATHLETE_PLATFORM_SHARE is 90% (platform takes 10%)
const ATHLETE_PLATFORM_SHARE_BPS = 9000 // 90% in basis points

/**
 * Calculate representative splits for a given athlete's earnings.
 *
 * @param athleteEarningsCents - The total earnings amount in cents (e.g. $100 = 10000 cents)
 * @param athleteId - The athlete's UUID
 * @returns Array of { repId, amountCents } for each active rep
 *
 * Example: $100 revenue
 *   → Platform takes 10% = $10
 *   → Athlete share = $90
 *   → If rep has 15% split → 15% of $90 = $13.50
 */
export async function calculateRepSplits(
  db: any,
  athleteEarningsCents: number,
  athleteId: string,
): Promise<RepSplit[]> {
  // Athlete's share after platform cut (90% of total)
  const athleteShareCents = Math.round(
    (athleteEarningsCents * ATHLETE_PLATFORM_SHARE_BPS) / 10000,
  )

  // Get all active reps for this athlete
  const reps = await db
    .select()
    .from(athleteRepresentatives)
    .where(
      and(
        eq(athleteRepresentatives.athleteId, athleteId),
        eq(athleteRepresentatives.status, 'active'),
      ),
    )

  if (!reps.length) {
    return []
  }

  return reps.map((rep: typeof athleteRepresentatives.$inferSelect) => {
    // Split is a percentage of the athlete's 90% share
    const repAmountCents = Math.round(
      (athleteShareCents * rep.splitPercentage) / 100,
    )
    return {
      repId: rep.id,
      amountCents: repAmountCents,
    }
  })
}

/**
 * Update rep total earnings after a payout is processed.
 * Call this after creating payout_ledger entries for each rep split.
 */
export async function updateRepEarnings(
  db: any,
  splits: RepSplit[],
): Promise<void> {
  for (const split of splits) {
    await db
      .update(athleteRepresentatives)
      .set({
        totalEarningsCents: db.sql`${athleteRepresentatives.totalEarningsCents} + ${split.amountCents}`,
      })
      .where(eq(athleteRepresentatives.id, split.repId))
  }
}

/**
 * Full flow: calculate splits + update rep earnings.
 * Call this when processing an athlete payout.
 *
 * Returns the splits for creating payout_ledger entries.
 */
export async function processRepSplitsForPayout(
  db: any,
  athleteEarningsCents: number,
  athleteId: string,
): Promise<RepSplit[]> {
  const splits = await calculateRepSplits(db, athleteEarningsCents, athleteId)
  if (splits.length > 0) {
    await updateRepEarnings(db, splits)
  }
  return splits
}
