import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc-server'
import { athleteRepresentatives } from '../../db/schema/existing-db-schema'

const repRelationshipEnum = z.enum(['agent', 'manager', 'family', 'attorney', 'other'])
const splitPercentageEnum = z.number().min(0).max(50)

export const representativesRouter = createTRPCRouter({
  // List all active representatives for an athlete
  list: protectedProcedure
    .input(z.object({ athleteId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const reps = await ctx.db
        .select()
        .from(athleteRepresentatives)
        .where(
          and(
            eq(athleteRepresentatives.athleteId, input.athleteId),
            eq(athleteRepresentatives.status, 'active'),
          ),
        )
        .orderBy(athleteRepresentatives.createdAt)
      return reps
    }),

  // Add a new representative
  add: protectedProcedure
    .input(
      z.object({
        athleteId: z.string().uuid(),
        repName: z.string().min(1).max(255),
        repEmail: z.string().email().max(255),
        repPhone: z.string().max(50).optional(),
        relationship: repRelationshipEnum,
        splitPercentage: splitPercentageEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { athleteId, splitPercentage, ...rest } = input

      // Validate total split doesn't exceed 50%
      const existingReps = await ctx.db
        .select({ splitPercentage: athleteRepresentatives.splitPercentage })
        .from(athleteRepresentatives)
        .where(
          and(
            eq(athleteRepresentatives.athleteId, athleteId),
            eq(athleteRepresentatives.status, 'active'),
          ),
        )

      const totalExistingSplit = existingReps.reduce(
        (sum, r) => sum + r.splitPercentage,
        0,
      )

      if (totalExistingSplit + splitPercentage > 50) {
        throw new Error(
          `Total rep split would be ${totalExistingSplit + splitPercentage}%. Maximum allowed is 50%.`,
        )
      }

      const [created] = await ctx.db
        .insert(athleteRepresentatives)
        .values({
          athleteId,
          splitPercentage,
          ...rest,
          status: 'active',
        })
        .returning()

      return created
    }),

  // Update a representative (split %, details)
  update: protectedProcedure
    .input(
      z.object({
        repId: z.string().uuid(),
        athleteId: z.string().uuid(),
        repName: z.string().min(1).max(255).optional(),
        repEmail: z.string().email().max(255).optional(),
        repPhone: z.string().max(50).optional(),
        relationship: repRelationshipEnum.optional(),
        splitPercentage: splitPercentageEnum.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { repId, athleteId, splitPercentage, ...rest } = input

      // Validate the rep belongs to this athlete
      const existing = await ctx.db
        .select()
        .from(athleteRepresentatives)
        .where(
          and(
            eq(athleteRepresentatives.id, repId),
            eq(athleteRepresentatives.athleteId, athleteId),
          ),
        )
        .limit(1)

      if (!existing.length) {
        throw new Error('Representative not found')
      }

      // If updating split, validate total doesn't exceed 50%
      if (splitPercentage !== undefined) {
        const otherReps = await ctx.db
          .select({ splitPercentage: athleteRepresentatives.splitPercentage })
          .from(athleteRepresentatives)
          .where(
            and(
              eq(athleteRepresentatives.athleteId, athleteId),
              eq(athleteRepresentatives.status, 'active'),
              eq(athleteRepresentatives.id, repId),
            ),
          )

        const totalOtherSplit = await ctx.db
          .select({ split: athleteRepresentatives.splitPercentage })
          .from(athleteRepresentatives)
          .where(
            and(
              eq(athleteRepresentatives.athleteId, athleteId),
              eq(athleteRepresentatives.status, 'active'),
            ),
          )
          .then((rows) =>
            rows
              .filter((r) => r.split !== existing[0].splitPercentage)
              .reduce((sum, r) => sum + r.split, 0),
          )

        if (totalOtherSplit + splitPercentage > 50) {
          throw new Error(
            `Total rep split would be ${totalOtherSplit + splitPercentage}%. Maximum allowed is 50%.`,
          )
        }
      }

      const updates: Partial<typeof athleteRepresentatives.$inferInsert> = {
        ...rest,
      }
      if (splitPercentage !== undefined) {
        updates.splitPercentage = splitPercentage
      }

      const [updated] = await ctx.db
        .update(athleteRepresentatives)
        .set(updates)
        .where(
          and(
            eq(athleteRepresentatives.id, repId),
            eq(athleteRepresentatives.athleteId, athleteId),
          ),
        )
        .returning()

      return updated
    }),

  // Deactivate (soft-delete) a representative
  deactivate: protectedProcedure
    .input(
      z.object({
        repId: z.string().uuid(),
        athleteId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { repId, athleteId } = input

      const [deactivated] = await ctx.db
        .update(athleteRepresentatives)
        .set({ status: 'inactive' })
        .where(
          and(
            eq(athleteRepresentatives.id, repId),
            eq(athleteRepresentatives.athleteId, athleteId),
          ),
        )
        .returning()

      return deactivated
    }),
})
