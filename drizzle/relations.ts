import { relations } from "drizzle-orm/relations";
import { athleteProfiles, posts, users, refreshTokens, fanProfiles, subscriptions, liveSessions, chatMessages, gifts, boosts, payouts, payoutLedger, walletTransactions, fanBadges, badges, reports, moderationActions, notifications, userMutes, auditLogs, schools, nilReports, athleteSponsors, sponsors, socialConnections, socialPosts } from "./schema";

export const postsRelations = relations(posts, ({one}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [posts.athleteId],
		references: [athleteProfiles.id]
	}),
}));

export const athleteProfilesRelations = relations(athleteProfiles, ({one, many}) => ({
	posts: many(posts),
	subscriptions: many(subscriptions),
	liveSessions: many(liveSessions),
	gifts: many(gifts),
	boosts: many(boosts),
	payouts: many(payouts),
	user: one(users, {
		fields: [athleteProfiles.userId],
		references: [users.id]
	}),
	school_schoolId: one(schools, {
		fields: [athleteProfiles.schoolId],
		references: [schools.id],
		relationName: "athleteProfiles_schoolId_schools_id"
	}),
	school_previousSchoolId: one(schools, {
		fields: [athleteProfiles.previousSchoolId],
		references: [schools.id],
		relationName: "athleteProfiles_previousSchoolId_schools_id"
	}),
	athleteSponsors: many(athleteSponsors),
	socialConnections: many(socialConnections),
	socialPosts: many(socialPosts),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	refreshTokens: many(refreshTokens),
	fanProfiles: many(fanProfiles),
	chatMessages: many(chatMessages),
	boosts: many(boosts),
	payouts: many(payouts),
	reports_reporterId: many(reports, {
		relationName: "reports_reporterId_users_id"
	}),
	reports_resolvedBy: many(reports, {
		relationName: "reports_resolvedBy_users_id"
	}),
	moderationActions_targetUserId: many(moderationActions, {
		relationName: "moderationActions_targetUserId_users_id"
	}),
	moderationActions_moderatorId: many(moderationActions, {
		relationName: "moderationActions_moderatorId_users_id"
	}),
	notifications: many(notifications),
	userMutes_userId: many(userMutes, {
		relationName: "userMutes_userId_users_id"
	}),
	userMutes_mutedBy: many(userMutes, {
		relationName: "userMutes_mutedBy_users_id"
	}),
	auditLogs: many(auditLogs),
	athleteProfiles: many(athleteProfiles),
}));

export const fanProfilesRelations = relations(fanProfiles, ({one, many}) => ({
	user: one(users, {
		fields: [fanProfiles.userId],
		references: [users.id]
	}),
	subscriptions: many(subscriptions),
	gifts: many(gifts),
	boosts: many(boosts),
	walletTransactions: many(walletTransactions),
	fanBadges: many(fanBadges),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	fanProfile: one(fanProfiles, {
		fields: [subscriptions.fanId],
		references: [fanProfiles.id]
	}),
	athleteProfile: one(athleteProfiles, {
		fields: [subscriptions.athleteId],
		references: [athleteProfiles.id]
	}),
}));

export const liveSessionsRelations = relations(liveSessions, ({one, many}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [liveSessions.athleteId],
		references: [athleteProfiles.id]
	}),
	chatMessages: many(chatMessages),
	gifts: many(gifts),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	liveSession: one(liveSessions, {
		fields: [chatMessages.sessionId],
		references: [liveSessions.id]
	}),
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
}));

export const giftsRelations = relations(gifts, ({one}) => ({
	liveSession: one(liveSessions, {
		fields: [gifts.sessionId],
		references: [liveSessions.id]
	}),
	fanProfile: one(fanProfiles, {
		fields: [gifts.fanId],
		references: [fanProfiles.id]
	}),
	athleteProfile: one(athleteProfiles, {
		fields: [gifts.athleteId],
		references: [athleteProfiles.id]
	}),
}));

export const boostsRelations = relations(boosts, ({one}) => ({
	fanProfile: one(fanProfiles, {
		fields: [boosts.fanId],
		references: [fanProfiles.id]
	}),
	athleteProfile: one(athleteProfiles, {
		fields: [boosts.athleteId],
		references: [athleteProfiles.id]
	}),
	user: one(users, {
		fields: [boosts.reviewedBy],
		references: [users.id]
	}),
}));

export const payoutsRelations = relations(payouts, ({one, many}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [payouts.athleteId],
		references: [athleteProfiles.id]
	}),
	user: one(users, {
		fields: [payouts.approvedBy],
		references: [users.id]
	}),
	payoutLedgers: many(payoutLedger),
}));

export const payoutLedgerRelations = relations(payoutLedger, ({one}) => ({
	payout: one(payouts, {
		fields: [payoutLedger.payoutId],
		references: [payouts.id]
	}),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({one}) => ({
	fanProfile: one(fanProfiles, {
		fields: [walletTransactions.fanId],
		references: [fanProfiles.id]
	}),
}));

export const fanBadgesRelations = relations(fanBadges, ({one}) => ({
	fanProfile: one(fanProfiles, {
		fields: [fanBadges.fanId],
		references: [fanProfiles.id]
	}),
	badge: one(badges, {
		fields: [fanBadges.badgeId],
		references: [badges.id]
	}),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	fanBadges: many(fanBadges),
}));

export const reportsRelations = relations(reports, ({one, many}) => ({
	user_reporterId: one(users, {
		fields: [reports.reporterId],
		references: [users.id],
		relationName: "reports_reporterId_users_id"
	}),
	user_resolvedBy: one(users, {
		fields: [reports.resolvedBy],
		references: [users.id],
		relationName: "reports_resolvedBy_users_id"
	}),
	moderationActions: many(moderationActions),
}));

export const moderationActionsRelations = relations(moderationActions, ({one}) => ({
	report: one(reports, {
		fields: [moderationActions.reportId],
		references: [reports.id]
	}),
	user_targetUserId: one(users, {
		fields: [moderationActions.targetUserId],
		references: [users.id],
		relationName: "moderationActions_targetUserId_users_id"
	}),
	user_moderatorId: one(users, {
		fields: [moderationActions.moderatorId],
		references: [users.id],
		relationName: "moderationActions_moderatorId_users_id"
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const userMutesRelations = relations(userMutes, ({one}) => ({
	user_userId: one(users, {
		fields: [userMutes.userId],
		references: [users.id],
		relationName: "userMutes_userId_users_id"
	}),
	user_mutedBy: one(users, {
		fields: [userMutes.mutedBy],
		references: [users.id],
		relationName: "userMutes_mutedBy_users_id"
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const nilReportsRelations = relations(nilReports, ({one}) => ({
	school: one(schools, {
		fields: [nilReports.schoolId],
		references: [schools.id]
	}),
}));

export const schoolsRelations = relations(schools, ({many}) => ({
	nilReports: many(nilReports),
	athleteProfiles_schoolId: many(athleteProfiles, {
		relationName: "athleteProfiles_schoolId_schools_id"
	}),
	athleteProfiles_previousSchoolId: many(athleteProfiles, {
		relationName: "athleteProfiles_previousSchoolId_schools_id"
	}),
}));

export const athleteSponsorsRelations = relations(athleteSponsors, ({one}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [athleteSponsors.athleteId],
		references: [athleteProfiles.id]
	}),
	sponsor: one(sponsors, {
		fields: [athleteSponsors.sponsorId],
		references: [sponsors.id]
	}),
}));

export const sponsorsRelations = relations(sponsors, ({many}) => ({
	athleteSponsors: many(athleteSponsors),
}));

export const socialConnectionsRelations = relations(socialConnections, ({one, many}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [socialConnections.athleteId],
		references: [athleteProfiles.id]
	}),
	socialPosts: many(socialPosts),
}));

export const socialPostsRelations = relations(socialPosts, ({one}) => ({
	athleteProfile: one(athleteProfiles, {
		fields: [socialPosts.athleteId],
		references: [athleteProfiles.id]
	}),
	socialConnection: one(socialConnections, {
		fields: [socialPosts.connectionId],
		references: [socialConnections.id]
	}),
}));