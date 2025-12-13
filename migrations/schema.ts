import { pgTable, varchar, text, timestamp, foreignKey, integer, numeric, boolean, index, jsonb, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const paymentMethod = pgEnum("payment_method", ['stripe', 'balance', 'direct'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'completed', 'failed', 'refunded'])
export const transactionType = pgEnum("transaction_type", ['deposit', 'withdrawal', 'lesson_payment', 'refund'])
export const userRole = pgEnum("user_role", ['student', 'tutor', 'admin'])


export const badges = pgTable("badges", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	icon: varchar().notNull(),
	category: varchar().notNull(),
	requirement: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const lessons = pgTable("lessons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	tutorId: varchar("tutor_id").notNull(),
	topicId: varchar("topic_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).notNull(),
	duration: integer().default(60).notNull(),
	status: varchar().default('scheduled').notNull(),
	price: numeric({ precision: 8, scale:  2 }).default('100.00').notNull(),
	studentNotes: text("student_notes"),
	tutorNotes: text("tutor_notes"),
	rating: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	meetLink: varchar("meet_link"),
	meetId: varchar("meet_id"),
	googleCalendarEventId: varchar("google_calendar_event_id"),
	icalUid: varchar("ical_uid"),
	originalScheduledAt: timestamp("original_scheduled_at", { mode: 'string' }),
	cancellationReason: text("cancellation_reason"),
	cancelledBy: varchar("cancelled_by"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	rescheduleCount: integer("reschedule_count").default(0),
	cancellationFee: numeric("cancellation_fee", { precision: 8, scale:  2 }),
	payoutReduction: numeric("payout_reduction", { precision: 8, scale:  2 }),
	paymentStatus: varchar("payment_status").default('unpaid').notNull(),
	materialAccessTime: timestamp("material_access_time", { mode: 'string' }),
	topicCompletedAt: timestamp("topic_completed_at", { mode: 'string' }),
	xpAwarded: integer("xp_awarded").default(50).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "lessons_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "lessons_tutor_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [mathTopics.id],
			name: "lessons_topic_id_math_topics_id_fk"
		}),
]);

export const mathTopics = pgTable("math_topics", {
	id: varchar().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	order: integer().notNull(),
	parentId: varchar("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	difficultyLevel: varchar("difficulty_level"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	prerequisiteTopicIds: text("prerequisite_topic_ids").array(),
	xpReward: integer("xp_reward").default(50).notNull(),
	estimatedDuration: integer("estimated_duration").default(60).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "math_topics_parent_id_math_topics_id_fk"
		}),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const courses = pgTable("courses", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	description: text(),
	mathTopicId: varchar("math_topic_id"),
	difficultyLevel: varchar("difficulty_level").notNull(),
	duration: integer(),
	price: numeric({ precision: 10, scale:  2 }).default('100.00').notNull(),
	isActive: boolean("is_active").default(true),
	order: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	subjectId: varchar("subject_id"),
}, (table) => [
	foreignKey({
			columns: [table.mathTopicId],
			foreignColumns: [mathTopics.id],
			name: "courses_math_topic_id_math_topics_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	role: userRole(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true).notNull(),
	profileComplete: boolean("profile_complete").default(false).notNull(),
	balance: numeric({ precision: 10, scale:  2 }).default('0.00').notNull(),
	roleSetupComplete: boolean("role_setup_complete").default(false).notNull(),
	passwordHash: varchar("password_hash"),
	googleId: varchar("google_id"),
	appleId: varchar("apple_id"),
	parentEmail: varchar("parent_email"),
	bankAccount: varchar("bank_account"),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const adminAccounts = pgTable("admin_accounts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	username: varchar().notNull(),
	passwordHash: varchar("password_hash").notNull(),
	email: varchar(),
	fullName: varchar("full_name"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("admin_accounts_username_unique").on(table.username),
]);

export const courseLessons = pgTable("course_lessons", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	courseId: varchar("course_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	content: text(),
	order: integer().notNull(),
	duration: integer(),
	videoUrl: varchar("video_url"),
	exerciseCount: integer("exercise_count").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "course_lessons_course_id_courses_id_fk"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	user1Id: varchar("user1_id").notNull(),
	user2Id: varchar("user2_id").notNull(),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.user1Id],
			foreignColumns: [users.id],
			name: "conversations_user1_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.user2Id],
			foreignColumns: [users.id],
			name: "conversations_user2_id_users_id_fk"
		}),
]);

export const payouts = pgTable("payouts", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	tutorId: varchar("tutor_id").notNull(),
	amount: varchar().notNull(),
	period: varchar().notNull(),
	status: varchar().default('pending').notNull(),
	lessonCount: integer("lesson_count").default(0).notNull(),
	commission: varchar().default('0.15').notNull(),
	netAmount: varchar("net_amount").notNull(),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	notes: varchar(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "payouts_tutor_id_users_id_fk"
		}),
]);

export const subjects = pgTable("subjects", {
	id: varchar().primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	icon: varchar().notNull(),
	color: varchar().notNull(),
	available: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const mailingListSubscriptions = pgTable("mailing_list_subscriptions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	subjectId: varchar("subject_id").notNull(),
	subscribed: boolean().default(true),
	subscribedAt: timestamp("subscribed_at", { mode: 'string' }).defaultNow(),
	unsubscribedAt: timestamp("unsubscribed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "mailing_list_subscriptions_subject_id_subjects_id_fk"
		}).onDelete("cascade"),
]);

export const userProgress = pgTable("user_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
	topicId: varchar("topic_id").notNull(),
	levelId: varchar("level_id").notNull(),
	status: varchar().default('not_started').notNull(),
	progress: integer().default(0).notNull(),
	xpEarned: integer("xp_earned").default(0).notNull(),
	lessonsCompleted: integer("lessons_completed").default(0).notNull(),
	totalLessons: integer("total_lessons").default(0).notNull(),
	homeworkCompleted: integer("homework_completed").default(0).notNull(),
	homeworkAssigned: integer("homework_assigned").default(0).notNull(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_progress_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const studentProfiles = pgTable("student_profiles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	xp: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	streak: integer().default(0).notNull(),
	lastActivityDate: timestamp("last_activity_date", { mode: 'string' }),
	completedLessons: integer("completed_lessons").default(0).notNull(),
	averageGrade: numeric("average_grade", { precision: 3, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	levelDescription: text("level_description"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "student_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const studentProgress = pgTable("student_progress", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	topicId: varchar("topic_id").notNull(),
	progress: integer().default(0).notNull(),
	completedTasks: integer("completed_tasks").default(0).notNull(),
	totalTasks: integer("total_tasks").default(0).notNull(),
	lastAccessedAt: timestamp("last_accessed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "student_progress_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [mathTopics.id],
			name: "student_progress_topic_id_math_topics_id_fk"
		}),
]);

export const studentBadges = pgTable("student_badges", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	badgeId: varchar("badge_id").notNull(),
	earnedAt: timestamp("earned_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "student_badges_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.badgeId],
			foreignColumns: [badges.id],
			name: "student_badges_badge_id_badges_id_fk"
		}),
]);

export const tutorProfiles = pgTable("tutor_profiles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	bio: text(),
	specializations: text().array(),
	hourlyRate: numeric("hourly_rate", { precision: 8, scale:  2 }).default('70.00').notNull(),
	rating: numeric({ precision: 3, scale:  2 }),
	totalLessons: integer("total_lessons").default(0).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tutor_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const calendarEvents = pgTable("calendar_events", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	type: varchar().default('custom').notNull(),
	lessonId: varchar("lesson_id"),
	color: varchar().default('#3b82f6'),
	isRecurring: boolean("is_recurring").default(false),
	recurrenceRule: text("recurrence_rule"),
	googleCalendarEventId: varchar("google_calendar_event_id"),
	icalUid: varchar("ical_uid"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	meetingUrl: varchar("meeting_url"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "calendar_events_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "calendar_events_lesson_id_lessons_id_fk"
		}),
]);

export const messages = pgTable("messages", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	conversationId: varchar("conversation_id").notNull(),
	senderId: varchar("sender_id").notNull(),
	content: text().notNull(),
	messageType: varchar("message_type").default('text'),
	readAt: timestamp("read_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_conversations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}),
]);

export const studentSubjects = pgTable("student_subjects", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
	status: varchar().default('active'),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "student_subjects_student_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "student_subjects_subject_id_subjects_id_fk"
		}).onDelete("cascade"),
]);

export const balanceTransactions = pgTable("balance_transactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: transactionType().notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	balanceBefore: numeric("balance_before", { precision: 10, scale:  2 }).notNull(),
	balanceAfter: numeric("balance_after", { precision: 10, scale:  2 }).notNull(),
	description: text().notNull(),
	relatedEntityId: varchar("related_entity_id"),
	relatedEntityType: varchar("related_entity_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "balance_transactions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const lessonPayments = pgTable("lesson_payments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	studentId: varchar("student_id").notNull(),
	tutorId: varchar("tutor_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: paymentStatus().default('pending').notNull(),
	method: paymentMethod().default('balance').notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id"),
	balanceTransactionId: varchar("balance_transaction_id"),
	paidAt: timestamp("paid_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "lesson_payments_lesson_id_lessons_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "lesson_payments_student_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "lesson_payments_tutor_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.balanceTransactionId],
			foreignColumns: [balanceTransactions.id],
			name: "lesson_payments_balance_transaction_id_balance_transactions_id_"
		}),
]);

export const studentMatchingPreferences = pgTable("student_matching_preferences", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
	preferredDays: integer("preferred_days").array(),
	preferredStartTime: varchar("preferred_start_time"),
	preferredEndTime: varchar("preferred_end_time"),
	tutorGenderPreference: varchar("tutor_gender_preference"),
	teachingStylePreference: varchar("teaching_style_preference"),
	currentLevel: text("current_level"),
	specificNeeds: text("specific_needs"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	maxHourlyRate: numeric("max_hourly_rate", { precision: 8, scale:  2 }),
	matchingStatus: varchar("matching_status").default('pending'),
	assignedTutorId: varchar("assigned_tutor_id"),
	matchedAt: timestamp("matched_at", { mode: 'string' }),
	notificationsSent: boolean("notifications_sent").default(false),
	tutorAccepted: boolean("tutor_accepted"),
	tutorResponseDeadline: timestamp("tutor_response_deadline", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "student_matching_preferences_student_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "student_matching_preferences_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.assignedTutorId],
			foreignColumns: [users.id],
			name: "student_matching_preferences_assigned_tutor_id_users_id_fk"
		}),
]);

export const tutorAvailability = pgTable("tutor_availability", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	tutorId: varchar("tutor_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	startTime: varchar("start_time").notNull(),
	endTime: varchar("end_time").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "tutor_availability_tutor_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const tutorStudentMatches = pgTable("tutor_student_matches", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	tutorId: varchar("tutor_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
	matchScore: numeric("match_score", { precision: 5, scale:  2 }),
	status: varchar().default('pending').notNull(),
	preferredTime: varchar("preferred_time"),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "tutor_student_matches_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "tutor_student_matches_tutor_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "tutor_student_matches_subject_id_subjects_id_fk"
		}),
]);

export const lessonInvitations = pgTable("lesson_invitations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentMatchingPreferenceId: varchar("student_matching_preference_id").notNull(),
	tutorId: varchar("tutor_id").notNull(),
	studentId: varchar("student_id").notNull(),
	subjectId: varchar("subject_id").notNull(),
	matchingHours: varchar("matching_hours").array(),
	matchingDays: integer("matching_days").array(),
	status: varchar().default('pending').notNull(),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	tutorResponse: text("tutor_response"),
}, (table) => [
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "lesson_invitations_tutor_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "lesson_invitations_student_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "lesson_invitations_subject_id_subjects_id_fk"
		}),
	foreignKey({
			columns: [table.studentMatchingPreferenceId],
			foreignColumns: [studentMatchingPreferences.id],
			name: "lesson_invitations_student_matching_preference_id_student_match"
		}).onDelete("cascade"),
]);

export const tutorHourlyAvailability = pgTable("tutor_hourly_availability", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	tutorId: varchar("tutor_id").notNull(),
	dayOfWeek: integer("day_of_week").notNull(),
	hour: varchar().notNull(),
	isAvailable: boolean("is_available").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tutorId],
			foreignColumns: [users.id],
			name: "tutor_hourly_availability_tutor_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const homeworkAssignments = pgTable("homework_assignments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	title: varchar().notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	totalTasks: integer("total_tasks").notNull(),
	status: varchar().default('assigned').notNull(),
	grade: numeric({ precision: 3, scale:  2 }),
	feedback: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "homework_assignments_lesson_id_lessons_id_fk"
		}),
]);

export const lessonActions = pgTable("lesson_actions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	lessonId: varchar("lesson_id").notNull(),
	actionType: varchar("action_type").notNull(),
	initiatedBy: varchar("initiated_by").notNull(),
	reason: text(),
	previousScheduledAt: timestamp("previous_scheduled_at", { mode: 'string' }),
	newScheduledAt: timestamp("new_scheduled_at", { mode: 'string' }),
	hoursNotice: integer("hours_notice"),
	feeApplied: numeric("fee_applied", { precision: 8, scale:  2 }),
	payoutReduction: numeric("payout_reduction", { precision: 8, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.lessonId],
			foreignColumns: [lessons.id],
			name: "lesson_actions_lesson_id_lessons_id_fk"
		}),
]);

export const topicCompletions = pgTable("topic_completions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	studentId: varchar("student_id").notNull(),
	topicId: varchar("topic_id").notNull(),
	status: varchar().default('locked').notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	xpEarned: integer("xp_earned").default(0).notNull(),
	lessonsCompleted: integer("lessons_completed").default(0).notNull(),
	materialAccessCount: integer("material_access_count").default(0).notNull(),
	tutorRating: numeric("tutor_rating", { precision: 3, scale:  2 }),
	studentRating: numeric("student_rating", { precision: 3, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "topic_completions_student_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [mathTopics.id],
			name: "topic_completions_topic_id_math_topics_id_fk"
		}),
]);

export const topicMaterials = pgTable("topic_materials", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	topicId: varchar("topic_id").notNull(),
	title: varchar().notNull(),
	type: varchar().notNull(),
	url: varchar(),
	content: text(),
	isRequired: boolean("is_required").default(true).notNull(),
	order: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [mathTopics.id],
			name: "topic_materials_topic_id_math_topics_id_fk"
		}),
]);
