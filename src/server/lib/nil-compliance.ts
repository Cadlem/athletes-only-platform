import { eq } from 'drizzle-orm'
import { AppDb } from '~/server/types'
import { stateNilRules } from '~/server/db/schema/existing-db-schema'

export interface ComplianceResult {
  allowed: boolean
  modelType: string | null
  restrictions: string[]
  reason?: string
}

interface StateNilRule {
  state: string
  modelType: 'unified' | 'dual' | 'prohibited'
  minAge: number
  restrictions: string | null
  updatedAt: Date | null
}

/**
 * Check NIL compliance for an athlete in a given state.
 *
 * @param db - Drizzle db instance
 * @param state - 2-letter US state code (e.g., 'CA', 'TX')
 * @param athleteType - 'public' (public university) or 'private' (private university)
 */
export async function checkNILCompliance(
  db: AppDb,
  state: string,
  athleteType: 'public' | 'private'
): Promise<ComplianceResult> {
  const stateCode = state.toUpperCase()

  let rule: StateNilRule | undefined
  try {
    const rows = await db
      .select()
      .from(stateNilRules)
      .where(eq(stateNilRules.state, stateCode))
      .limit(1)
    rule = rows[0]
  } catch {
    // DB not available or table not yet migrated — fail open with a warning
    return {
      allowed: true,
      modelType: null,
      restrictions: [],
      reason: 'Compliance database unavailable; allowing by default',
    }
  }

  if (!rule) {
    return {
      allowed: true,
      modelType: null,
      restrictions: [],
      reason: `No NIL rule found for state ${stateCode}; allowing by default`,
    }
  }

  // Prohibited states block all NIL activity
  if (rule.modelType === 'prohibited') {
    return {
      allowed: false,
      modelType: 'prohibited',
      restrictions: parseRestrictions(rule.restrictions),
      reason: `NIL is prohibited in ${stateCode} for ${athleteType} school athletes`,
    }
  }

  // Dual model states have separate rules for public vs private
  if (rule.modelType === 'dual') {
    const restrictions = parseRestrictions(rule.restrictions)
    // In dual-model states, public school athletes may be restricted while private are not,
    // or vice versa. Parse restrictions to determine allowed types.
    if (athleteType === 'public' && restrictions.some(r => r.toLowerCase().includes('public prohibited'))) {
      return {
        allowed: false,
        modelType: 'dual',
        restrictions,
        reason: `NIL is restricted for public school athletes in ${stateCode}`,
      }
    }
    return {
      allowed: true,
      modelType: 'dual',
      restrictions,
    }
  }

  // Unified model — all schools follow same rules
  return {
    allowed: true,
    modelType: 'unified',
    restrictions: parseRestrictions(rule.restrictions),
  }
}

function parseRestrictions(restrictions: string | null): string[] {
  if (!restrictions) return []
  try {
    const parsed = JSON.parse(restrictions)
    return Array.isArray(parsed) ? parsed : [restrictions]
  } catch {
    return restrictions.split(';').map(r => r.trim()).filter(Boolean)
  }
}
