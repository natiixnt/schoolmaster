import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["student", "tutor", "admin"]);

// Quiz and test system enums
export const questionTypeEnum = pgEnum("question_type", ["multiple_choice", "multiple_select", "true_false", "short_answer", "math_problem"]);
export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const exerciseTypeEnum = pgEnum("exercise_type", ["single_choice", "multiple_choice", "numerical", "algebraic", "word_problem"]);

// User storage table with multiple auth methods
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For email/password auth
  googleId: varchar("google_id"), // For Google OAuth
  appleId: varchar("apple_id"), // For Apple OAuth
  role: userRoleEnum("role"),
  isActive: boolean("is_active").notNull().default(true),
  profileComplete: boolean("profile_complete").notNull().default(false), // Track if user completed profile setup
  roleSetupComplete: boolean("role_setup_complete").notNull().default(false), // Track if user completed role selection
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // User's account balance in PLN
  parentEmail: varchar("parent_email"), // For student accounts - parent contact
  bankAccount: varchar("bank_account"), // For tutor accounts - payment details
  stripeCustomerId: varchar("stripe_customer_id"), // Stripe customer ID for payments
  lastEmailNotification: timestamp("last_email_notification"), // Track last unread message email sent
  // Referral system fields
  referralCode: varchar("referral_code").unique(), // User's unique referral code (e.g., E8-1234)
  referralBalance: decimal("referral_balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // Credit from referrals in PLN
  referredByCode: varchar("referred_by_code"), // Referral code used during signup
  // Loyalty program fields
  loyaltyLevel: integer("loyalty_level").notNull().default(1), // Level 1-5 (Nowy, Stały Klient, Zaangażowany, Premium, VIP)
  loyaltyBalance: decimal("loyalty_balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // Credit from loyalty bonuses in PLN
  completedLessonsCount: integer("completed_lessons_count").notNull().default(0), // Number of completed lessons
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student profiles with gamification data
export const studentProfiles = pgTable("student_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streak: integer("streak").notNull().default(0),
  lastActivityDate: timestamp("last_activity_date"),
  completedLessons: integer("completed_lessons").notNull().default(0),
  averageGrade: decimal("average_grade", { precision: 3, scale: 2 }),
  levelDescription: text("level_description"), // Student's own description of their academic level
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Progress tracking for topics/lessons
export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull(), // mathematics, polish, english
  levelId: varchar("level_id").notNull(), // podstawy, sredni, zaawansowany
  topicId: varchar("topic_id").notNull(), // fractions, equations, etc.
  status: varchar("status").notNull().default("not_started"), // not_started, in_progress, completed
  progress: integer("progress").notNull().default(0), // 0-100
  xpEarned: integer("xp_earned").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  totalLessons: integer("total_lessons").notNull().default(0),
  homeworkAssigned: integer("homework_assigned").notNull().default(0),
  homeworkCompleted: integer("homework_completed").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tutor profiles
export const tutorProfiles = pgTable("tutor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  specializations: text("specializations").array(),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }).notNull().default("70.00"), // Tutor receives 70zł from 100zł lesson fee
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalLessons: integer("total_lessons").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  // Featured/Premium status for recommended section
  isFeatured: boolean("is_featured").notNull().default(false),
  featuredExpiresAt: timestamp("featured_expires_at"),
  featuredSubscriptionId: varchar("featured_subscription_id"), // Stripe subscription ID
  lastFeaturedPayment: timestamp("last_featured_payment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Math topics/modules - Enhanced for sequential learning
export const mathTopics: any = pgTable("math_topics", {
  id: varchar("id").primaryKey(), // Format: MAT-L7 (Math Lesson 7)
  name: varchar("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(), // Sequential order for progression
  difficultyLevel: varchar("difficulty_level"),
  parentId: varchar("parent_id").references((): any => mathTopics.id),
  prerequisiteTopicIds: text("prerequisite_topic_ids").array(), // Topics that must be completed first
  xpReward: integer("xp_reward").notNull().default(50), // XP awarded for completion
  estimatedDuration: integer("estimated_duration").notNull().default(60), // minutes
  quizRequired: boolean("quiz_required").default(false).notNull(), // Whether quiz is required to complete topic
  quizPassingScore: integer("quiz_passing_score"), // Optional override for passing score, defaults to quiz.passingScore
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Topic materials and resources
export const topicMaterials = pgTable("topic_materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull().references(() => mathTopics.id),
  title: varchar("title").notNull(),
  description: text("description"),
  materialType: varchar("material_type").notNull(), // "theory", "exercise", "video", "worksheet"
  url: varchar("url"), // Link to PDF/video resource
  content: text("content"), // Text content or exercise questions
  isRequired: boolean("is_required").notNull().default(true), // Must be accessed to complete topic
  order: integer("order").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Topic completion tracking per student
export const topicCompletions = pgTable("topic_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  topicId: varchar("topic_id").notNull().references(() => mathTopics.id),
  status: varchar("status").notNull().default("locked"), // locked, available, in_progress, completed
  completedAt: timestamp("completed_at"),
  xpEarned: integer("xp_earned").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  materialAccessCount: integer("material_access_count").notNull().default(0),
  tutorRating: decimal("tutor_rating", { precision: 3, scale: 2 }),
  studentRating: decimal("student_rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses - structured learning paths
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  subjectId: varchar("subject_id"), // Link to subjects table
  mathTopicId: varchar("math_topic_id").references(() => mathTopics.id),
  difficultyLevel: varchar("difficulty_level").notNull(), // "podstawowy" | "rozszerzony"
  duration: integer("duration"), // total duration in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("100.00"), // Fixed lesson price: 100zł
  isActive: boolean("is_active").default(true),
  order: integer("order"), // Order for display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual lessons within courses
export const courseLessons = pgTable("course_lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content"), // Lesson content/materials
  order: integer("order").notNull(), // Order within the course
  duration: integer("duration"), // Duration in minutes
  videoUrl: varchar("video_url"),
  exerciseCount: integer("exercise_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lessons
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  tutorId: varchar("tutor_id").notNull().references(() => users.id),
  topicId: varchar("topic_id").references(() => mathTopics.id), // Optional for topic-based learning
  title: varchar("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  originalScheduledAt: timestamp("original_scheduled_at"), // For tracking rescheduling
  duration: integer("duration").notNull().default(60), // minutes
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  paymentStatus: varchar("payment_status").notNull().default("unpaid"), // unpaid, paid, refunded
  price: decimal("price", { precision: 8, scale: 2 }).notNull().default("100.00"), // Fixed price
  studentNotes: text("student_notes"),
  tutorNotes: text("tutor_notes"),
  rating: integer("rating"), // 1-5
  // Topic-based learning enhancements
  materialAccessTime: timestamp("material_access_time"), // When tutor accessed materials
  topicCompletedAt: timestamp("topic_completed_at"), // When topic was marked as completed
  xpAwarded: integer("xp_awarded").notNull().default(50), // XP awarded for completion
  // Cancellation/Rescheduling tracking
  cancellationReason: text("cancellation_reason"),
  cancelledBy: varchar("cancelled_by"), // student, tutor, admin
  cancelledAt: timestamp("cancelled_at"),
  rescheduleCount: integer("reschedule_count").default(0),
  cancellationFee: decimal("cancellation_fee", { precision: 8, scale: 2 }), // Fee charged for late cancellation
  payoutReduction: decimal("payout_reduction", { precision: 8, scale: 2 }), // Tutor payout reduction for late cancellation
  // Google Meet integration
  meetLink: varchar("meet_link"),
  meetId: varchar("meet_id"),
  // Recording
  recordingUrl: varchar("recording_url"),
  recordingAddedAt: timestamp("recording_added_at"),
  // Calendar integration
  googleCalendarEventId: varchar("google_calendar_event_id"),
  icalUid: varchar("ical_uid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student progress tracking
export const studentProgress = pgTable("student_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  topicId: varchar("topic_id").notNull().references(() => mathTopics.id),
  progress: integer("progress").notNull().default(0), // 0-100
  completedTasks: integer("completed_tasks").notNull().default(0),
  totalTasks: integer("total_tasks").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Badges/achievements
export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  category: varchar("category").notNull(), // algebra, geometry, statistics, etc.
  requirement: text("requirement"), // JSON string describing requirements
  createdAt: timestamp("created_at").defaultNow(),
});

// Student badges (earned achievements)
export const studentBadges = pgTable("student_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// Homework assignments
export const homeworkAssignments = pgTable("homework_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  title: varchar("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  totalTasks: integer("total_tasks").notNull(),
  status: varchar("status").notNull().default("assigned"), // assigned, submitted, graded
  studentAnswer: text("student_answer"), // Student's answer/submission
  grade: decimal("grade", { precision: 3, scale: 2 }),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin accounts for simple login/password authentication
export const adminAccounts = pgTable("admin_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  email: varchar("email"),
  fullName: varchar("full_name"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar events (for both lessons and custom events)
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: varchar("type").notNull().default("custom"), // lesson, custom, break
  lessonId: varchar("lesson_id").references(() => lessons.id), // null for custom events
  color: varchar("color").default("#3b82f6"), // hex color for display
  meetingUrl: varchar("meeting_url"), // Google Meet or other video call link
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"), // RRULE format
  googleCalendarEventId: varchar("google_calendar_event_id"),
  icalUid: varchar("ical_uid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages system for communication between users
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ["text", "lesson_request", "homework", "system"] }).default("text"),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lesson cancellation/rescheduling history for audit trail
export const lessonActions = pgTable("lesson_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  actionType: varchar("action_type").notNull(), // cancel, reschedule, restore
  initiatedBy: varchar("initiated_by").notNull(), // student, tutor, admin
  reason: text("reason"),
  previousScheduledAt: timestamp("previous_scheduled_at"),
  newScheduledAt: timestamp("new_scheduled_at"),
  hoursNotice: integer("hours_notice"), // How many hours before lesson was the action taken
  feeApplied: decimal("fee_applied", { precision: 8, scale: 2 }),
  payoutReduction: decimal("payout_reduction", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  tutorProfile: one(tutorProfiles, {
    fields: [users.id],
    references: [tutorProfiles.userId],
  }),
  studentLessons: many(lessons, { relationName: "studentLessons" }),
  tutorLessons: many(lessons, { relationName: "tutorLessons" }),
  studentProgress: many(studentProgress),
  studentBadges: many(studentBadges),
  user1Conversations: many(conversations, { relationName: "user1Conversations" }),
  user2Conversations: many(conversations, { relationName: "user2Conversations" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
}));

export const tutorProfilesRelations = relations(tutorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [tutorProfiles.userId],
    references: [users.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  student: one(users, {
    fields: [lessons.studentId],
    references: [users.id],
    relationName: "studentLessons",
  }),
  tutor: one(users, {
    fields: [lessons.tutorId],
    references: [users.id],
    relationName: "tutorLessons",
  }),
  topic: one(mathTopics, {
    fields: [lessons.topicId],
    references: [mathTopics.id],
  }),
  homeworkAssignments: many(homeworkAssignments),
}));

export const mathTopicsRelations = relations(mathTopics, ({ one, many }) => ({
  parent: one(mathTopics, {
    fields: [mathTopics.parentId],
    references: [mathTopics.id],
  }),
  children: many(mathTopics),
  lessons: many(lessons),
  courses: many(courses),
  studentProgress: many(studentProgress),
  topicMaterials: many(topicMaterials),
  topicCompletions: many(topicCompletions),
}));

export const topicMaterialsRelations = relations(topicMaterials, ({ one }) => ({
  topic: one(mathTopics, {
    fields: [topicMaterials.topicId],
    references: [mathTopics.id],
  }),
}));

export const topicCompletionsRelations = relations(topicCompletions, ({ one }) => ({
  student: one(users, {
    fields: [topicCompletions.studentId],
    references: [users.id],
  }),
  topic: one(mathTopics, {
    fields: [topicCompletions.topicId],
    references: [mathTopics.id],
  }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  mathTopic: one(mathTopics, {
    fields: [courses.mathTopicId],
    references: [mathTopics.id],
  }),
  courseLessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one }) => ({
  course: one(courses, {
    fields: [courseLessons.courseId],
    references: [courses.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(users, {
    fields: [studentProgress.studentId],
    references: [users.id],
  }),
  topic: one(mathTopics, {
    fields: [studentProgress.topicId],
    references: [mathTopics.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  studentBadges: many(studentBadges),
}));

export const studentBadgesRelations = relations(studentBadges, ({ one }) => ({
  student: one(users, {
    fields: [studentBadges.studentId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [studentBadges.badgeId],
    references: [badges.id],
  }),
}));

export const homeworkAssignmentsRelations = relations(homeworkAssignments, ({ one }) => ({
  lesson: one(lessons, {
    fields: [homeworkAssignments.lessonId],
    references: [lessons.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "user1Conversations",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "user2Conversations",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
}));

// Export types
// Subjects/courses table for multi-subject platform
export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  available: boolean("available").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student enrollments in subjects
export const studentSubjects = pgTable("student_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  status: varchar("status").default("active"), // active, completed, paused
});

// Mailing list subscriptions for subjects
export const mailingListSubscriptions = pgTable("mailing_list_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  subscribed: boolean("subscribed").default(true),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

// Referral system - tracks who referred whom
export const referralStatusEnum = pgEnum("referral_status", ["pending", "confirmed", "cancelled"]);
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who made the referral
  referredId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who was referred
  referralCode: varchar("referral_code").notNull(), // Code that was used
  status: referralStatusEnum("status").notNull().default("pending"), // pending until first lesson completed
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).notNull(), // Amount credited to referrer
  bonusAwarded: boolean("bonus_awarded").notNull().default(false), // Whether bonus has been given
  confirmedAt: timestamp("confirmed_at"), // When bonus was awarded/referral confirmed
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings for configurable values
export const systemSettings = pgTable("system_settings", {
  key: varchar("key").primaryKey(), // e.g., "referral_bonus_amount", "referral_discount_percent"
  value: text("value").notNull(), // JSON or string value
  description: text("description"), // Human-readable description
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id), // Admin who last updated
});

// Payment status and method enums
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["stripe", "balance", "direct"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["deposit", "withdrawal", "lesson_payment", "refund"]);

// Balance transactions for tracking all financial movements
export const balanceTransactions = pgTable("balance_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  relatedEntityId: varchar("related_entity_id"), // lesson ID, payout ID, etc.
  relatedEntityType: varchar("related_entity_type"), // "lesson", "payout", "deposit"
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced lesson payments with balance and direct payment options
export const lessonPayments = pgTable("lesson_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tutorId: varchar("tutor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  method: paymentMethodEnum("method").notNull().default("balance"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"), // For direct Stripe payments
  balanceTransactionId: varchar("balance_transaction_id").references(() => balanceTransactions.id), // For balance payments
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;
export type StudentSubject = typeof studentSubjects.$inferSelect;
export type InsertStudentSubject = typeof studentSubjects.$inferInsert;
export type MailingListSubscription = typeof mailingListSubscriptions.$inferSelect;
export type InsertMailingListSubscription = typeof mailingListSubscriptions.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type InsertBalanceTransaction = typeof balanceTransactions.$inferInsert;

// Payouts and financial management tables
export const payouts = pgTable("payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: varchar("tutor_id").notNull().references(() => users.id),
  amount: varchar("amount").notNull(), // Store as string to avoid precision issues
  period: varchar("period").notNull(), // Format: "2025-01" for monthly payouts
  status: varchar("status").notNull().default("pending"), // pending, processed, paid
  lessonCount: integer("lesson_count").notNull().default(0),
  commission: varchar("commission").notNull().default("0.15"), // Platform commission (15%)
  netAmount: varchar("net_amount").notNull(), // Amount after commission
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  notes: varchar("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tutor availability system for automatic matching
export const tutorAvailability = pgTable("tutor_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: varchar("tutor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  startTime: varchar("start_time").notNull(), // Format: "HH:MM"
  endTime: varchar("end_time").notNull(), // Format: "HH:MM"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detailed hourly availability for tutors
export const tutorHourlyAvailability = pgTable("tutor_hourly_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: varchar("tutor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, etc.
  hour: varchar("hour").notNull(), // Format: "HH:MM" (e.g., "14:00")
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lesson invitations sent to tutors when students enroll
export const lessonInvitations = pgTable("lesson_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentMatchingPreferenceId: varchar("student_matching_preference_id").references(() => studentMatchingPreferences.id, { onDelete: "cascade" }), // Optional for direct bookings
  tutorId: varchar("tutor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  topicId: varchar("topic_id").references(() => mathTopics.id), // Optional topic for specific topic lessons
  matchingHours: varchar("matching_hours").array(), // Array of matching hours
  matchingDays: integer("matching_days").array(), // Array of matching days
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected, expired
  sentAt: timestamp("sent_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at").notNull(), // Auto-reject after 24 hours
  tutorResponse: text("tutor_response"), // Optional message from tutor
  amount: decimal("amount", { precision: 8, scale: 2 }), // Lesson price
  paymentIntentId: varchar("payment_intent_id"), // Stripe Payment Intent ID for card authorization
});

// Lesson packages - predefined bundles with discounts
export const lessonPackages = pgTable("lesson_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Pakiet Starter", "Pakiet Premium"
  description: text("description"), // Package description
  lessonCount: integer("lesson_count").notNull(), // Number of lessons in package
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0.00"), // Discount percentage
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Price before discount (lessonCount * 100zł)
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(), // Price after discount
  isActive: boolean("is_active").notNull().default(true), // Whether package is available for purchase
  sortOrder: integer("sort_order").notNull().default(0), // Display order
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchased packages - tracks student package purchases and remaining lessons
export const purchasedPackages = pgTable("purchased_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packageId: varchar("package_id").notNull().references(() => lessonPackages.id),
  lessonsTotal: integer("lessons_total").notNull(), // Total lessons in purchased package
  lessonsRemaining: integer("lessons_remaining").notNull(), // Remaining lessons
  lessonsUsed: integer("lessons_used").notNull().default(0), // Lessons already used
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(), // Actual price paid
  status: varchar("status").notNull().default("active"), // active, expired, exhausted
  stripePaymentIntentId: varchar("stripe_payment_intent_id"), // Stripe payment intent ID
  purchasedAt: timestamp("purchased_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiry date
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student matching preferences for automatic tutor assignment
export const studentMatchingPreferences = pgTable("student_matching_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  preferredDays: integer("preferred_days").array(), // Array of day numbers
  preferredStartTime: varchar("preferred_start_time"), // Format: "HH:MM"
  preferredEndTime: varchar("preferred_end_time"), // Format: "HH:MM"
  tutorGenderPreference: varchar("tutor_gender_preference"), // 'male', 'female', 'no_preference'
  teachingStylePreference: varchar("teaching_style_preference"), // 'relaxed', 'demanding', 'no_preference'
  currentLevel: text("current_level"), // Student's description of their level
  specificNeeds: text("specific_needs"), // What student wants to work on
  maxHourlyRate: decimal("max_hourly_rate", { precision: 8, scale: 2 }), // Maximum rate student willing to pay
  matchingStatus: varchar("matching_status").default("pending"), // pending, matched, cancelled, on_hold
  assignedTutorId: varchar("assigned_tutor_id").references(() => users.id),
  matchedAt: timestamp("matched_at"),
  notificationsSent: boolean("notifications_sent").default(false),
  tutorAccepted: boolean("tutor_accepted"),
  tutorResponseDeadline: timestamp("tutor_response_deadline"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tutor-Student matching results
export const tutorStudentMatches = pgTable("tutor_student_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  tutorId: varchar("tutor_id").notNull().references(() => users.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }), // Calculated matching score
  status: varchar("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected', 'active', 'completed'
  preferredTime: varchar("preferred_time"), // Format: "day:HH:MM" e.g., "1:17:00" for Monday 17:00
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz and test system tables
// Questions bank for quizzes
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleCode: varchar("module_code").notNull().references(() => mathTopics.id),
  questionType: questionTypeEnum("question_type").notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options"), // For multiple choice/select - array of strings
  correctAnswer: jsonb("correct_answer").notNull(), // Flexible - can be string, array, or object
  explanation: text("explanation"), // Explanation for student
  points: integer("points").notNull().default(1),
  difficulty: difficultyEnum("difficulty").notNull(),
  config: jsonb("config"), // Type-specific metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quizzes/tests for modules
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleCode: varchar("module_code").notNull().references(() => mathTopics.id),
  title: varchar("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull(), // Percentage required to pass (e.g., 80)
  timeLimit: integer("time_limit"), // Minutes, nullable
  isRequired: boolean("is_required").notNull().default(false), // Required to unlock module
  xpReward: integer("xp_reward").notNull().default(0), // XP for passed test
  maxAttempts: integer("max_attempts"), // Max number of attempts, nullable
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Many-to-many relationship between quizzes and questions
export const quizQuestions = pgTable("quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  order: integer("order").notNull(), // Order of question in quiz
}, (table) => [
  uniqueIndex("quiz_question_unique").on(table.quizId, table.questionId),
]);

// Student quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answers: jsonb("answers").notNull(), // Student answers - array of {questionId, answer}
  score: integer("score").notNull(), // Percentage of points earned
  passed: boolean("passed").notNull(),
  timeTaken: integer("time_taken").notNull(), // Seconds
  feedback: text("feedback"), // Nullable, for manual grading
  completedAt: timestamp("completed_at").defaultNow(),
});

// Practice exercises for modules
export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleCode: varchar("module_code").notNull().references(() => mathTopics.id),
  title: text("title").notNull(),
  description: text("description"),
  exerciseType: exerciseTypeEnum("exercise_type").notNull(),
  question: text("question").notNull(),
  options: jsonb("options"), // For choice-based exercises - array of strings
  correctAnswer: jsonb("correct_answer").notNull(), // Flexible format based on type
  solutionSteps: jsonb("solution_steps"), // Array of solution steps with explanations
  hints: jsonb("hints"), // Array of hints (progressive help)
  difficulty: difficultyEnum("difficulty").notNull(),
  points: integer("points").notNull().default(10),
  generatedByAI: boolean("generated_by_ai").notNull().default(false), // AI-generated exercises
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student exercise attempts
export const exerciseAttempts = pgTable("exercise_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => users.id),
  answer: jsonb("answer").notNull(), // Student's answer
  isCorrect: boolean("is_correct").notNull(), // Server-calculated
  pointsEarned: integer("points_earned").notNull().default(0),
  timeTaken: integer("time_taken").notNull(), // Seconds
  hintsUsed: integer("hints_used").notNull().default(0), // Number of hints revealed
  completedAt: timestamp("completed_at").defaultNow(),
});

export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = typeof payouts.$inferInsert;
export type LessonPayment = typeof lessonPayments.$inferSelect;
export type InsertLessonPayment = typeof lessonPayments.$inferInsert;
export type AdminAccount = typeof adminAccounts.$inferSelect;

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type TutorProfile = typeof tutorProfiles.$inferSelect;
export type UpdateTutorProfile = Partial<TutorProfile>;
export type Course = typeof courses.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type StudentProgress = typeof studentProgress.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type StudentBadge = typeof studentBadges.$inferSelect;
export type HomeworkAssignment = typeof homeworkAssignments.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type TutorHourlyAvailability = typeof tutorHourlyAvailability.$inferSelect;
export type InsertTutorHourlyAvailability = typeof tutorHourlyAvailability.$inferInsert;
export type LessonInvitation = typeof lessonInvitations.$inferSelect;
export type InsertLessonInvitation = typeof lessonInvitations.$inferInsert;
export type LessonPackage = typeof lessonPackages.$inferSelect;
export type InsertLessonPackage = z.infer<typeof insertLessonPackageSchema>;
export type PurchasedPackage = typeof purchasedPackages.$inferSelect;
export type InsertPurchasedPackage = z.infer<typeof insertPurchasedPackageSchema>;

// Insert schemas for validation
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas
export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTutorProfileSchema = createInsertSchema(tutorProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHomeworkAssignmentSchema = createInsertSchema(homeworkAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminAccountSchema = createInsertSchema(adminAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseLessonSchema = createInsertSchema(courseLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertStudentBadgeSchema = createInsertSchema(studentBadges).omit({
  id: true,
  earnedAt: true,
});

// Topic-based learning schemas
export const insertMathTopicSchema = createInsertSchema(mathTopics).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTopicMaterialSchema = createInsertSchema(topicMaterials).omit({
  id: true,
  createdAt: true,
});

export const insertTopicCompletionSchema = createInsertSchema(topicCompletions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment-related schemas
export const insertBalanceTransactionSchema = createInsertSchema(balanceTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertLessonPaymentSchema = createInsertSchema(lessonPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Matching system schemas
export const insertTutorAvailabilitySchema = createInsertSchema(tutorAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentMatchingPreferencesSchema = createInsertSchema(studentMatchingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTutorStudentMatchSchema = createInsertSchema(tutorStudentMatches).omit({
  id: true,
  assignedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Lesson packages schemas
export const insertLessonPackageSchema = createInsertSchema(lessonPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchasedPackageSchema = createInsertSchema(purchasedPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Quiz system insert schemas
export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExerciseAttemptSchema = createInsertSchema(exerciseAttempts).omit({
  id: true,
  completedAt: true,
  isCorrect: true, // Server calculates this
  pointsEarned: true, // Server calculates this
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type InsertTutorProfile = z.infer<typeof insertTutorProfileSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertHomeworkAssignment = z.infer<typeof insertHomeworkAssignmentSchema>;
export type LessonAction = typeof lessonActions.$inferSelect;
export type InsertLessonAction = typeof lessonActions.$inferInsert;
export type InsertAdminAccount = z.infer<typeof insertAdminAccountSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseLesson = z.infer<typeof insertCourseLessonSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertStudentBadge = z.infer<typeof insertStudentBadgeSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
// Topic-based learning types
export type MathTopic = typeof mathTopics.$inferSelect;
export type InsertMathTopic = z.infer<typeof insertMathTopicSchema>;
export type TopicMaterial = typeof topicMaterials.$inferSelect;
export type InsertTopicMaterial = z.infer<typeof insertTopicMaterialSchema>;
export type TopicCompletion = typeof topicCompletions.$inferSelect;
export type InsertTopicCompletion = z.infer<typeof insertTopicCompletionSchema>;
// Matching system types
export type TutorAvailability = typeof tutorAvailability.$inferSelect;
export type InsertTutorAvailability = z.infer<typeof insertTutorAvailabilitySchema>;
export type StudentMatchingPreferences = typeof studentMatchingPreferences.$inferSelect;
export type InsertStudentMatchingPreferences = z.infer<typeof insertStudentMatchingPreferencesSchema>;
export type TutorStudentMatch = typeof tutorStudentMatches.$inferSelect;
export type InsertTutorStudentMatch = z.infer<typeof insertTutorStudentMatchSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Quiz system types
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// Exercise system types
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type ExerciseAttempt = typeof exerciseAttempts.$inferSelect;
export type InsertExerciseAttempt = z.infer<typeof insertExerciseAttemptSchema>;

export const lessonInvitationsRelations = relations(lessonInvitations, ({ one }) => ({
  student: one(users, {
    fields: [lessonInvitations.studentId],
    references: [users.id],
    relationName: "studentInvitations",
  }),
  tutor: one(users, {
    fields: [lessonInvitations.tutorId],
    references: [users.id],
    relationName: "tutorInvitations",
  }),
  subject: one(subjects, {
    fields: [lessonInvitations.subjectId],
    references: [subjects.id],
  }),
  topic: one(mathTopics, {
    fields: [lessonInvitations.topicId],
    references: [mathTopics.id],
  }),
}));

// Quiz system relations
export const questionsRelations = relations(questions, ({ one, many }) => ({
  module: one(mathTopics, {
    fields: [questions.moduleCode],
    references: [mathTopics.id],
  }),
  quizQuestions: many(quizQuestions),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  module: one(mathTopics, {
    fields: [quizzes.moduleCode],
    references: [mathTopics.id],
  }),
  quizQuestions: many(quizQuestions),
  quizAttempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  question: one(questions, {
    fields: [quizQuestions.questionId],
    references: [questions.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [quizAttempts.studentId],
    references: [users.id],
  }),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  module: one(mathTopics, {
    fields: [exercises.moduleCode],
    references: [mathTopics.id],
  }),
  attempts: many(exerciseAttempts),
}));

export const exerciseAttemptsRelations = relations(exerciseAttempts, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseAttempts.exerciseId],
    references: [exercises.id],
  }),
  student: one(users, {
    fields: [exerciseAttempts.studentId],
    references: [users.id],
  }),
}));
