import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { createMiddleware } from 'hono/factory'
import { cacheGlobal } from '~/lib/cacheGlobal'
import { schema } from '~/server/db'
import { AppBindings } from '~/server/types'

export const dbMiddleware = createMiddleware<AppBindings>(async (c, next) => {
  const queryClient = cacheGlobal('client', () => postgres(c.env.DATABASE_URL!))
  const db = drizzle(queryClient, { schema })
  c.set('db', db)
  await next()
})
