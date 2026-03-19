import { db, schema } from '~/server/db'

const stateRules = [
  {
    state: 'CA',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'Student-athletes may not enter into NIL agreements that conflict with school or conference rules',
      'No involvement with alcohol, tobacco, or adult entertainment brands',
      'Must maintain amateur status under NCAA and conference rules',
    ]),
  },
  {
    state: 'TX',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'NIL agreements must be consistent with University of Texas System policies',
      'No endorsement of alcohol, tobacco, or gambling products',
      'Schools may not compensate athletes for NIL activities',
    ]),
  },
  {
    state: 'FL',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'Student-athletes may not receive compensation for work not performed',
      'NIL activities must not interfere with athletic obligations',
      'No deals with adult entertainment or gambling entities',
    ]),
  },
  {
    state: 'NY',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'NIL activities must comply with SUNY and NCAA guidelines',
      'Student-athletes may not endorse alcohol, tobacco, or cannabis products',
      'Reporting requirements may apply to high-value agreements',
    ]),
  },
  {
    state: 'GA',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'No NIL agreements that conflict with USG/NCAA rules',
      'Alcohol, tobacco, and gambling endorsements prohibited',
    ]),
  },
  {
    state: 'IL',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'Must comply with Big Ten Conference NIL policies',
      'No deals that conflict with institutional values',
      'Representative disclosure required for agreements over $600',
    ]),
  },
  {
    state: 'OH',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'NIL activities must not interfere with athletic participation',
      'No agreements with alcohol, tobacco, or adult entertainment brands',
      'Must report deals exceeding $600 to athletic department',
    ]),
  },
  {
    state: 'NC',
    modelType: 'dual' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'Public school athletes: subject to UNC System Board of Governors NIL policy',
      'Private school athletes: governed by school-specific policies',
      'Both: no alcohol, tobacco, or gambling endorsements',
    ]),
  },
  {
    state: 'HI',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'Must comply with NCAA and conference rules',
      'No endorsement deals with alcohol or tobacco brands',
    ]),
  },
  {
    state: 'CO',
    modelType: 'unified' as const,
    minAge: 13,
    restrictions: JSON.stringify([
      'NIL agreements must be in writing and disclosed to the school',
      'No deals with gambling or cannabis-related businesses',
      'Student-athletes may retain professional representation',
    ]),
  },
]

async function seed() {
  console.log('Seeding state_nil_rules...')
  let created = 0
  let skipped = 0

  for (const rule of stateRules) {
    try {
      await db
        .insert(schema.stateNilRules)
        .values(rule)
        .onConflictDoNothing()
      created++
    } catch (err) {
      console.error(`Failed to seed ${rule.state}:`, err)
      skipped++
    }
  }

  console.log(`Seeded ${created} state NIL rules (${skipped} skipped)`)
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
