-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."badge_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."boost_status" AS ENUM('pending_payment', 'paid', 'in_progress', 'under_review', 'approved', 'rejected', 'completed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."boost_type" AS ENUM('video_shoutout', 'custom_photo', 'personal_message');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('photo', 'video', 'text');--> statement-breakpoint
CREATE TYPE "public"."gift_type" AS ENUM('balloon', 'lightning', 'trophy', 'diamond', 'fire', 'crown', 'rocket');--> statement-breakpoint
CREATE TYPE "public"."live_session_status" AS ENUM('scheduled', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('dismiss', 'warn', 'mute_24h', 'mute_7d', 'ban', 'delete_content');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_subscriber', 'new_gift', 'boost_request', 'boost_approved', 'boost_rejected', 'athlete_live', 'badge_unlocked', 'payout_completed');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('inappropriate', 'spam', 'harassment', 'copyright', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'bronze', 'silver', 'gold');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('deposit', 'subscription', 'gift', 'boost_payment', 'boost_refund', 'payout', 'earnings');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('fan', 'athlete', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"content_type" "content_type" NOT NULL,
	"media_url" text,
	"caption" text,
	"required_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'fan' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_name" varchar(50),
	"conference" varchar(100),
	"logo_url" text,
	"nil_contact_email" varchar(255),
	"nil_contact_name" varchar(255),
	"reporting_frequency" varchar(20) DEFAULT 'monthly',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fan_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"wallet_balance_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fan_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fan_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"price_cents" integer NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" "live_session_status" DEFAULT 'scheduled' NOT NULL,
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"total_gifts_cents" integer DEFAULT 0 NOT NULL,
	"stream_key" text,
	"playback_url" text,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"is_removed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"fan_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"gift_type" "gift_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gifts_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "boosts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fan_id" uuid NOT NULL,
	"athlete_id" uuid NOT NULL,
	"boost_type" "boost_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"request_details" text NOT NULL,
	"status" "boost_status" DEFAULT 'pending_payment' NOT NULL,
	"due_date" timestamp NOT NULL,
	"deliverable_url" text,
	"deliverable_hash" varchar(64),
	"delivered_at" timestamp,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"athlete_share_cents" integer NOT NULL,
	"school_share_cents" integer NOT NULL,
	"platform_share_cents" integer NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"stripe_transfer_id" varchar(255),
	"approved_by" uuid,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" uuid NOT NULL,
	"recipient_type" varchar(20) NOT NULL,
	"recipient_id" uuid,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fan_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fan_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fan_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"criteria" varchar(100) NOT NULL,
	"tier" "badge_tier" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "badges_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid,
	"target_user_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" "moderation_action" NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"muted_by" uuid NOT NULL,
	"reason" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid,
	"details" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nil_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"data" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"sent_at" timestamp,
	"sent_to" text,
	"file_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid,
	"display_name" varchar(100) NOT NULL,
	"bio" text,
	"sport" varchar(100) NOT NULL,
	"avatar_url" text,
	"cover_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"tier_pricing" jsonb DEFAULT '{"gold":2499,"bronze":499,"silver":999}'::jsonb NOT NULL,
	"total_earnings_cents" integer DEFAULT 0 NOT NULL,
	"available_balance_cents" integer DEFAULT 0 NOT NULL,
	"pending_balance_cents" integer DEFAULT 0 NOT NULL,
	"ytd_earnings_cents" integer DEFAULT 0 NOT NULL,
	"w9_submitted" timestamp,
	"tax_id_last4" varchar(4),
	"social_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"in_transfer_portal" boolean DEFAULT false NOT NULL,
	"transfer_portal_date" timestamp,
	"previous_school_id" uuid,
	CONSTRAINT "athlete_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "athlete_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"sponsor_id" uuid NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"logo_url" text,
	"website_url" text,
	"category" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sponsors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "social_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"token_expiry" timestamp,
	"platform_user_id" varchar(100) NOT NULL,
	"platform_username" varchar(100) NOT NULL,
	"platform_display_name" varchar(200),
	"profile_picture_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used" timestamp DEFAULT now(),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"content" text NOT NULL,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"hashtags" jsonb DEFAULT '[]'::jsonb,
	"platform_post_id" varchar(100),
	"platform_url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"metrics" jsonb,
	"scheduled_for" timestamp,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fan_profiles" ADD CONSTRAINT "fan_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_fan_id_fan_profiles_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_fan_id_fan_profiles_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_fan_id_fan_profiles_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_ledger" ADD CONSTRAINT "payout_ledger_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_fan_id_fan_profiles_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fan_badges" ADD CONSTRAINT "fan_badges_fan_id_fan_profiles_id_fk" FOREIGN KEY ("fan_id") REFERENCES "public"."fan_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fan_badges" ADD CONSTRAINT "fan_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_id_users_id_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mutes" ADD CONSTRAINT "user_mutes_muted_by_users_id_fk" FOREIGN KEY ("muted_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nil_reports" ADD CONSTRAINT "nil_reports_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_previous_school_id_schools_id_fk" FOREIGN KEY ("previous_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sponsors" ADD CONSTRAINT "athlete_sponsors_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_sponsors" ADD CONSTRAINT "athlete_sponsors_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_connection_id_social_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."social_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_athlete_idx" ON "posts" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "posts_tier_idx" ON "posts" USING btree ("required_tier" enum_ops);--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role" enum_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token_hash" text_ops);--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fan_profiles_user_idx" ON "fan_profiles" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "subscriptions_athlete_idx" ON "subscriptions" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "subscriptions_fan_athlete_idx" ON "subscriptions" USING btree ("fan_id" uuid_ops,"athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "subscriptions_fan_idx" ON "subscriptions" USING btree ("fan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "live_sessions_athlete_idx" ON "live_sessions" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "live_sessions_created_idx" ON "live_sessions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "live_sessions_status_idx" ON "live_sessions" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "chat_messages_created_idx" ON "chat_messages" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "chat_messages_session_idx" ON "chat_messages" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "gifts_athlete_idx" ON "gifts" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "gifts_fan_idx" ON "gifts" USING btree ("fan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "gifts_idempotency_idx" ON "gifts" USING btree ("idempotency_key" text_ops);--> statement-breakpoint
CREATE INDEX "gifts_session_idx" ON "gifts" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "boosts_athlete_idx" ON "boosts" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "boosts_fan_idx" ON "boosts" USING btree ("fan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "boosts_status_idx" ON "boosts" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "payouts_athlete_idx" ON "payouts" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "payout_ledger_payout_idx" ON "payout_ledger" USING btree ("payout_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wallet_transactions_fan_idx" ON "wallet_transactions" USING btree ("fan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions" USING btree ("type" enum_ops);--> statement-breakpoint
CREATE INDEX "fan_badges_badge_idx" ON "fan_badges" USING btree ("badge_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fan_badges_fan_badge_idx" ON "fan_badges" USING btree ("fan_id" uuid_ops,"badge_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "fan_badges_fan_idx" ON "fan_badges" USING btree ("fan_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reports_content_idx" ON "reports" USING btree ("content_type" text_ops,"content_id" text_ops);--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "moderation_actions_moderator_idx" ON "moderation_actions" USING btree ("moderator_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "moderation_actions_target_idx" ON "moderation_actions" USING btree ("target_user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "notifications_read_idx" ON "notifications" USING btree ("read_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_mutes_expires_idx" ON "user_mutes" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "user_mutes_session_idx" ON "user_mutes" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_mutes_user_idx" ON "user_mutes" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action" text_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type" text_ops,"resource_id" text_ops);--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "nil_reports_period_idx" ON "nil_reports" USING btree ("period_start" timestamp_ops,"period_end" timestamp_ops);--> statement-breakpoint
CREATE INDEX "nil_reports_school_idx" ON "nil_reports" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "nil_reports_type_idx" ON "nil_reports" USING btree ("report_type" text_ops);--> statement-breakpoint
CREATE INDEX "athlete_profiles_school_idx" ON "athlete_profiles" USING btree ("school_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "athlete_profiles_sport_idx" ON "athlete_profiles" USING btree ("sport" text_ops);--> statement-breakpoint
CREATE INDEX "athlete_profiles_user_idx" ON "athlete_profiles" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "athlete_profiles_verification_idx" ON "athlete_profiles" USING btree ("verification_status" enum_ops);--> statement-breakpoint
CREATE INDEX "athlete_sponsors_athlete_idx" ON "athlete_sponsors" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "athlete_sponsors_sponsor_idx" ON "athlete_sponsors" USING btree ("sponsor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "social_connections_athlete_idx" ON "social_connections" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "social_connections_platform_idx" ON "social_connections" USING btree ("platform" text_ops);--> statement-breakpoint
CREATE INDEX "social_connections_unique_idx" ON "social_connections" USING btree ("athlete_id" text_ops,"platform" uuid_ops);--> statement-breakpoint
CREATE INDEX "social_posts_athlete_idx" ON "social_posts" USING btree ("athlete_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "social_posts_connection_idx" ON "social_posts" USING btree ("connection_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "social_posts_scheduled_idx" ON "social_posts" USING btree ("scheduled_for" timestamp_ops);--> statement-breakpoint
CREATE INDEX "social_posts_status_idx" ON "social_posts" USING btree ("status" text_ops);
*/