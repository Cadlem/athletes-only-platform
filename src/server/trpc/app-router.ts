import { helloRouter } from './routers/hello'
import { dataRouter } from './routers/data'
import { representativesRouter } from './routers/representatives'
import { createTRPCRouter } from './trpc-server'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  hello: helloRouter,
  data: dataRouter,
  representatives: representativesRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
