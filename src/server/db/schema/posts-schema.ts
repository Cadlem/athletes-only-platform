import { pgTable, serial, text, integer, index } from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title'),
  ownerId: text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [
  index('posts_slug_idx').on(table.slug),
  index('posts_title_idx').on(table.title),
])

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  ownerId: text('owner_id').notNull().references(() => user.id),
})
