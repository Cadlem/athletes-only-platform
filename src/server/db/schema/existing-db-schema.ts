import { pgTable, index, foreignKey, uuid, text, boolean, timestamp, unique, varchar, integer, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const badgeTier = pgEnum("badge_tier", ['bronze', 'silver', 'gold', 'platinum'])
export const boostStatus = pgEnum("boost_status", ['pending_payment', 'paid', 'in_progress', 'under_review', 'approved', 'rejected', 'completed', 'refunded'])
export const boostType = pgEnum("boost_type", ['video_shoutout', 'custom_photo', 'personal_message'])
export const contentType = pgEnum("content_type", ['photo', 'video', 'text'])
export const giftType = pgEnum("gift_type", ['balloon', 'lightning', 'trophy', 'diamond', 'fire', 'crown', 'rocket'])
export const liveSessionStatus = pgEnum("live_session_status", ['scheduled', 'live', 'ended'])
export const moderationAction = pgEnum("moderation_action", ['dismiss', 'warn', 'mute_24h', 'mute_7d', 'ban', 'delete_content'])
export const notificationType = pgEnum("notification_type", ['new_subscriber', 'new_gift', 'boost_request', 'boost_approved', 'boost_rejected', 'athlete_live', 'badge_unlocked', 'payout_completed'])
export const payoutStatus = pgEnum("payout_status", ['pending', 'processing', 'completed', 'failed'])
export const reportReason = pgEnum("report_reason", ['inappropriate', 'spam', 'harassment', 'copyright', 'other'])
export const reportStatus = pgEnum("report_status", ['pending', 'reviewing', 'resolved', 'dismissed'])
export const subscriptionTier = pgEnum("subscription_tier", ['free', 'bronze', 'silver', 'gold'])
export const transactionType = pgEnum("transaction_type", ['deposit', 'subscription', 'gift', 'boost_payment', 'boost_refund', 'payout', 'earnings'])
export const userRole = pgEnum("user_role", ['fan', 'athlete', 'moderator', 'admin'])
export const userStatus = pgEnum("user_status", ['active', 'suspended', 'pending'])
export const verificationStatus = pgEnum("verification_status", ['pending', 'verified', 'rejected'])
export const claimStatus = pgEnum("claim_status", ['unclaimed', 'pending_claim', 'claimed', 'active'])
export const profileSource = pgEnum("profile_source", ['signup', 'scraped', 'csv_import', 'manual'])
export const repRelationship = pgEnum("rep_relationship", ['agent', 'manager', 'family', 'attorney', 'other'])


export const posts = pgTable("posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	contentType: contentType("content_type").notNull(),
	mediaUrl: text("media_url"),
	caption: text(),
	requiredTier: subscriptionTier("required_tier").default('free').notNull(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("posts_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("posts_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("posts_tier_idx").using("btree", table.requiredTier.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "posts_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: userRole().default('fan').notNull(),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("users_role_idx").using("btree", table.role.asc().nullsLast().op("enum_ops")),
	unique("users_email_unique").on(table.email),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("refresh_tokens_token_idx").using("btree", table.tokenHash.asc().nullsLast().op("text_ops")),
	index("refresh_tokens_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const schools = pgTable("schools", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	shortName: varchar("short_name", { length: 50 }),
	conference: varchar({ length: 100 }),
	logoUrl: text("logo_url"),
	nilContactEmail: varchar("nil_contact_email", { length: 255 }),
	nilContactName: varchar("nil_contact_name", { length: 255 }),
	reportingFrequency: varchar("reporting_frequency", { length: 20 }).default('monthly'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
]);

export const fanProfiles = pgTable("fan_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	avatarUrl: text("avatar_url"),
	walletBalanceCents: integer("wallet_balance_cents").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fan_profiles_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fan_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("fan_profiles_user_id_unique").on(table.userId),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fanId: uuid("fan_id").notNull(),
	athleteId: uuid("athlete_id").notNull(),
	tier: subscriptionTier().notNull(),
	priceCents: integer("price_cents").notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("subscriptions_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("subscriptions_fan_athlete_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops"), table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("subscriptions_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "subscriptions_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "subscriptions_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const liveSessions = pgTable("live_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	status: liveSessionStatus().default('scheduled').notNull(),
	viewerCount: integer("viewer_count").default(0).notNull(),
	peakViewers: integer("peak_viewers").default(0).notNull(),
	totalGiftsCents: integer("total_gifts_cents").default(0).notNull(),
	streamKey: text("stream_key"),
	playbackUrl: text("playback_url"),
	startedAt: timestamp("started_at", { mode: 'string' }),
	endedAt: timestamp("ended_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("live_sessions_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("live_sessions_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("live_sessions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "live_sessions_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	userId: uuid("user_id").notNull(),
	message: text().notNull(),
	isRemoved: boolean("is_removed").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_messages_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("chat_messages_session_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [liveSessions.id],
			name: "chat_messages_session_id_live_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chat_messages_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const gifts = pgTable("gifts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	fanId: uuid("fan_id").notNull(),
	athleteId: uuid("athlete_id").notNull(),
	giftType: giftType("gift_type").notNull(),
	amountCents: integer("amount_cents").notNull(),
	idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("gifts_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("gifts_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	index("gifts_idempotency_idx").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	index("gifts_session_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [liveSessions.id],
			name: "gifts_session_id_live_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "gifts_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "gifts_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
	unique("gifts_idempotency_key_unique").on(table.idempotencyKey),
]);

export const boosts = pgTable("boosts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fanId: uuid("fan_id").notNull(),
	athleteId: uuid("athlete_id").notNull(),
	boostType: boostType("boost_type").notNull(),
	amountCents: integer("amount_cents").notNull(),
	requestDetails: text("request_details").notNull(),
	status: boostStatus().default('pending_payment').notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	deliverableUrl: text("deliverable_url"),
	deliverableHash: varchar("deliverable_hash", { length: 64 }),
	deliveredAt: timestamp("delivered_at", { mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("boosts_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("boosts_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	index("boosts_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "boosts_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "boosts_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.reviewedBy],
			foreignColumns: [users.id],
			name: "boosts_reviewed_by_users_id_fk"
		}),
]);

export const payouts = pgTable("payouts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	amountCents: integer("amount_cents").notNull(),
	athleteShareCents: integer("athlete_share_cents").notNull(),
	schoolShareCents: integer("school_share_cents").notNull(),
	platformShareCents: integer("platform_share_cents").notNull(),
	status: payoutStatus().default('pending').notNull(),
	stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payouts_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("payouts_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "payouts_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "payouts_approved_by_users_id_fk"
		}),
]);

export const payoutLedger = pgTable("payout_ledger", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	payoutId: uuid("payout_id").notNull(),
	recipientType: varchar("recipient_type", { length: 20 }).notNull(),
	recipientId: uuid("recipient_id"),
	amountCents: integer("amount_cents").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("payout_ledger_payout_idx").using("btree", table.payoutId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.payoutId],
			foreignColumns: [payouts.id],
			name: "payout_ledger_payout_id_payouts_id_fk"
		}).onDelete("cascade"),
]);

export const walletTransactions = pgTable("wallet_transactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fanId: uuid("fan_id").notNull(),
	type: transactionType().notNull(),
	amountCents: integer("amount_cents").notNull(),
	description: text(),
	referenceId: uuid("reference_id"),
	referenceType: varchar("reference_type", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("wallet_transactions_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	index("wallet_transactions_type_idx").using("btree", table.type.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "wallet_transactions_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const fanBadges = pgTable("fan_badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fanId: uuid("fan_id").notNull(),
	badgeId: uuid("badge_id").notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("fan_badges_badge_idx").using("btree", table.badgeId.asc().nullsLast().op("uuid_ops")),
	index("fan_badges_fan_badge_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops"), table.badgeId.asc().nullsLast().op("uuid_ops")),
	index("fan_badges_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "fan_badges_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.badgeId],
			foreignColumns: [badges.id],
			name: "fan_badges_badge_id_badges_id_fk"
		}).onDelete("cascade"),
]);

export const badges = pgTable("badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text().notNull(),
	icon: varchar({ length: 50 }).notNull(),
	criteria: varchar({ length: 100 }).notNull(),
	tier: badgeTier().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("badges_name_unique").on(table.name),
]);

export const reports = pgTable("reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reporterId: uuid("reporter_id").notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	contentId: uuid("content_id").notNull(),
	reason: reportReason().notNull(),
	details: text(),
	status: reportStatus().default('pending').notNull(),
	resolvedBy: uuid("resolved_by"),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reports_content_idx").using("btree", table.contentType.asc().nullsLast().op("text_ops"), table.contentId.asc().nullsLast().op("text_ops")),
	index("reports_reporter_idx").using("btree", table.reporterId.asc().nullsLast().op("uuid_ops")),
	index("reports_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.reporterId],
			foreignColumns: [users.id],
			name: "reports_reporter_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.resolvedBy],
			foreignColumns: [users.id],
			name: "reports_resolved_by_users_id_fk"
		}),
]);

export const moderationActions = pgTable("moderation_actions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reportId: uuid("report_id"),
	targetUserId: uuid("target_user_id").notNull(),
	moderatorId: uuid("moderator_id").notNull(),
	action: moderationAction().notNull(),
	reason: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("moderation_actions_moderator_idx").using("btree", table.moderatorId.asc().nullsLast().op("uuid_ops")),
	index("moderation_actions_target_idx").using("btree", table.targetUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [reports.id],
			name: "moderation_actions_report_id_reports_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [users.id],
			name: "moderation_actions_target_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.moderatorId],
			foreignColumns: [users.id],
			name: "moderation_actions_moderator_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: notificationType().notNull(),
	title: varchar({ length: 255 }).notNull(),
	body: text().notNull(),
	data: jsonb(),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("notifications_read_idx").using("btree", table.readAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const userMutes = pgTable("user_mutes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: uuid("session_id"),
	mutedBy: uuid("muted_by").notNull(),
	reason: text(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("user_mutes_expires_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("user_mutes_session_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("user_mutes_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_mutes_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.mutedBy],
			foreignColumns: [users.id],
			name: "user_mutes_muted_by_users_id_fk"
		}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: varchar({ length: 100 }).notNull(),
	resourceType: varchar("resource_type", { length: 50 }).notNull(),
	resourceId: uuid("resource_id"),
	details: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("audit_logs_action_idx").using("btree", table.action.asc().nullsLast().op("text_ops")),
	index("audit_logs_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("audit_logs_resource_idx").using("btree", table.resourceType.asc().nullsLast().op("text_ops"), table.resourceId.asc().nullsLast().op("text_ops")),
	index("audit_logs_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const nilReports = pgTable("nil_reports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	schoolId: uuid("school_id").notNull(),
	reportType: varchar("report_type", { length: 50 }).notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	data: jsonb().notNull(),
	status: varchar({ length: 20 }).default('completed').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	sentTo: text("sent_to"),
	fileUrl: text("file_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("nil_reports_period_idx").using("btree", table.periodStart.asc().nullsLast().op("timestamp_ops"), table.periodEnd.asc().nullsLast().op("timestamp_ops")),
	index("nil_reports_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("nil_reports_type_idx").using("btree", table.reportType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "nil_reports_school_id_schools_id_fk"
		}).onDelete("cascade"),
]);

export const athleteProfiles = pgTable("athlete_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	schoolId: uuid("school_id"),
	displayName: varchar("display_name", { length: 100 }).notNull(),
	bio: text(),
	sport: varchar({ length: 100 }).notNull(),
	avatarUrl: text("avatar_url"),
	coverUrl: text("cover_url"),
	verificationStatus: verificationStatus("verification_status").default('pending').notNull(),
	tierPricing: jsonb("tier_pricing").default(sql`jsonb_build_object('gold'::text, 2499::bigint, 'bronze'::text, 499::bigint, 'silver'::text, 999::bigint)`).notNull(),
	totalEarningsCents: integer("total_earnings_cents").default(0).notNull(),
	availableBalanceCents: integer("available_balance_cents").default(0).notNull(),
	pendingBalanceCents: integer("pending_balance_cents").default(0).notNull(),
	ytdEarningsCents: integer("ytd_earnings_cents").default(0).notNull(),
	w9Submitted: timestamp("w9_submitted", { mode: 'string' }),
	taxIdLast4: varchar("tax_id_last4", { length: 4 }),
	socialLinks: jsonb("social_links"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	inTransferPortal: boolean("in_transfer_portal").default(false).notNull(),
	transferPortalDate: timestamp("transfer_portal_date", { mode: 'string' }),
	previousSchoolId: uuid("previous_school_id"),
	claimStatus: claimStatus("claim_status").default('unclaimed').notNull(),
	source: profileSource("source").default('signup').notNull(),
	claimedBy: uuid("claimed_by"),
	claimedAt: timestamp("claimed_at", { mode: 'string' }),
	rosterSourceUrl: text("roster_source_url"),
	preSubscriberCount: integer("pre_subscriber_count").default(0).notNull(),
}, (table) => [
	index("athlete_profiles_school_idx").using("btree", table.schoolId.asc().nullsLast().op("uuid_ops")),
	index("athlete_profiles_sport_idx").using("btree", table.sport.asc().nullsLast().op("text_ops")),
	index("athlete_profiles_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("athlete_profiles_verification_idx").using("btree", table.verificationStatus.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "athlete_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.schoolId],
			foreignColumns: [schools.id],
			name: "athlete_profiles_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.previousSchoolId],
			foreignColumns: [schools.id],
			name: "athlete_profiles_previous_school_id_schools_id_fk"
		}),
	foreignKey({
			columns: [table.claimedBy],
			foreignColumns: [users.id],
			name: "athlete_profiles_claimed_by_users_id_fk"
		}),
	index("athlete_profiles_claim_status_idx").using("btree", table.claimStatus.asc().nullsLast().op("enum_ops")),
	unique("athlete_profiles_user_id_unique").on(table.userId),
]);

export const athleteSponsors = pgTable("athlete_sponsors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	sponsorId: uuid("sponsor_id").notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).defaultNow().notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("athlete_sponsors_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("athlete_sponsors_sponsor_idx").using("btree", table.sponsorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "athlete_sponsors_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sponsorId],
			foreignColumns: [sponsors.id],
			name: "athlete_sponsors_sponsor_id_sponsors_id_fk"
		}).onDelete("cascade"),
]);

export const sponsors = pgTable("sponsors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	logoUrl: text("logo_url"),
	websiteUrl: text("website_url"),
	category: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("sponsors_name_unique").on(table.name),
]);

export const socialConnections = pgTable("social_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	platform: varchar({ length: 20 }).notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	tokenExpiry: timestamp("token_expiry", { mode: 'string' }),
	platformUserId: varchar("platform_user_id", { length: 100 }).notNull(),
	platformUsername: varchar("platform_username", { length: 100 }).notNull(),
	platformDisplayName: varchar("platform_display_name", { length: 200 }),
	profilePictureUrl: text("profile_picture_url"),
	isActive: boolean("is_active").default(true).notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }).defaultNow(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_connections_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("social_connections_platform_idx").using("btree", table.platform.asc().nullsLast().op("text_ops")),
	index("social_connections_unique_idx").using("btree", table.athleteId.asc().nullsLast().op("text_ops"), table.platform.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "social_connections_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const socialPosts = pgTable("social_posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	connectionId: uuid("connection_id").notNull(),
	content: text().notNull(),
	mediaUrls: jsonb("media_urls").default([]),
	hashtags: jsonb().default([]),
	platformPostId: varchar("platform_post_id", { length: 100 }),
	platformUrl: text("platform_url"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	errorMessage: text("error_message"),
	metrics: jsonb(),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	postedAt: timestamp("posted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_posts_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("social_posts_connection_idx").using("btree", table.connectionId.asc().nullsLast().op("uuid_ops")),
	index("social_posts_scheduled_idx").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
	index("social_posts_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "social_posts_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectionId],
			foreignColumns: [socialConnections.id],
			name: "social_posts_connection_id_social_connections_id_fk"
		}).onDelete("cascade"),
]);

export const preSubscriptions = pgTable("pre_subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fanId: uuid("fan_id").notNull(),
	athleteProfileId: uuid("athlete_profile_id").notNull(),
	tier: subscriptionTier().notNull(),
	monthlyAmountCents: integer("monthly_amount_cents").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	activatedAt: timestamp("activated_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	index("pre_subscriptions_fan_idx").using("btree", table.fanId.asc().nullsLast().op("uuid_ops")),
	index("pre_subscriptions_athlete_idx").using("btree", table.athleteProfileId.asc().nullsLast().op("uuid_ops")),
	index("pre_subscriptions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.fanId],
			foreignColumns: [fanProfiles.id],
			name: "pre_subscriptions_fan_id_fan_profiles_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.athleteProfileId],
			foreignColumns: [athleteProfiles.id],
			name: "pre_subscriptions_athlete_profile_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);

export const athleteRepresentatives = pgTable("athlete_representatives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	athleteId: uuid("athlete_id").notNull(),
	repName: varchar("rep_name", { length: 255 }).notNull(),
	repEmail: varchar("rep_email", { length: 255 }).notNull(),
	repPhone: varchar("rep_phone", { length: 50 }),
	relationship: repRelationship().notNull(),
	splitPercentage: integer("split_percentage").notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	stripeAccountId: varchar("stripe_account_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("athlete_representatives_athlete_idx").using("btree", table.athleteId.asc().nullsLast().op("uuid_ops")),
	index("athlete_representatives_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.athleteId],
			foreignColumns: [athleteProfiles.id],
			name: "athlete_representatives_athlete_id_athlete_profiles_id_fk"
		}).onDelete("cascade"),
]);