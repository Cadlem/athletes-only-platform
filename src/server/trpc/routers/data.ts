import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'postgres'
import { createTRPCRouter, publicProcedure } from '../trpc-server'
import * as schema from '../../db/schema/existing-db-schema'

// Create db connection
const sql = postgres(process.env.DATABASE_URL || 'postgresql://localhost:5432/athletes_only')
const db = drizzle(sql, { schema })

export const dataRouter = createTRPCRouter({
  // Get all athletes
  athletes: publicProcedure.query(async () => {
    try {
      const athletes = await db.select({
        id: schema.athleteProfiles.id,
        displayName: schema.athleteProfiles.displayName,
        sport: schema.athleteProfiles.sport,
        bio: schema.athleteProfiles.bio,
        avatarUrl: schema.athleteProfiles.avatarUrl,
        verificationStatus: schema.athleteProfiles.verificationStatus,
      }).from(schema.athleteProfiles)
      return athletes
    } catch (e) {
      console.error('Error fetching athletes:', e)
      return []
    }
  }),

  // Get schools
  schools: publicProcedure.query(async () => {
    try {
      const schools = await db.select().from(schema.schools)
      return schools
    } catch (e) {
      console.error('Error fetching schools:', e)
      return []
    }
  }),

  // Get live sessions
  liveSessions: publicProcedure.query(async () => {
    try {
      const sessions = await db.select().from(schema.liveSessions)
      return sessions
    } catch (e) {
      console.error('Error fetching live sessions:', e)
      return []
    }
  }),

  // Get posts
  posts: publicProcedure.query(async () => {
    try {
      const posts = await db.select({
        id: schema.posts.id,
        athleteId: schema.posts.athleteId,
        contentType: schema.posts.contentType,
        mediaUrl: schema.posts.mediaUrl,
        caption: schema.posts.caption,
        requiredTier: schema.posts.requiredTier,
        createdAt: schema.posts.createdAt,
      }).from(schema.posts)
      return posts
    } catch (e) {
      console.error('Error fetching posts:', e)
      return []
    }
  }),
})
