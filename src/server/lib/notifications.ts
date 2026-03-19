import { eq } from 'drizzle-orm'
import { notifications, notificationType } from '~/server/db/schema/existing-db-schema'
import type { AppBindings } from '~/server/types'
import type { notificationType as NotificationTypeEnum } from '~/server/db/schema/existing-db-schema'

/**
 * Create a notification for a user.
 */
export async function createNotification(
  db: AppBindings['Variables']['db'],
  params: {
    userId: string
    type: NotificationTypeEnum
    title: string
    body: string
    data?: Record<string, unknown>
  },
): Promise<void> {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? null,
  })
}
