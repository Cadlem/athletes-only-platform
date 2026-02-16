import { defineConfig } from 'drizzle-kit'
import { env } from './src/server/env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema',
  dbCredentials: {
    url: env().DATABASE_URL,
  },
})
