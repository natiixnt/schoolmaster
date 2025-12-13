import { relations } from "drizzle-orm/relations";
import { users, lessons, mathTopics, courses, courseLessons, conversations, payouts, subjects, mailingListSubscriptions, userProgress, studentProfiles, studentProgress, studentBadges, badges, tutorProfiles, calendarEvents, messages, studentSubjects, balanceTransactions, lessonPayments, studentMatchingPreferences, tutorAvailability, tutorStudentMatches, lessonInvitations, tutorHourlyAvailability, homeworkAssignments, lessonActions, topicCompletions, topicMaterials } from "./schema";

export const lessonsRelations = relations(lessons, ({one, many}) => ({
	user_studentId: one(users, {
		fields: [lessons.studentId],
		references: [users.id],
		relationName: "lessons_studentId_users_id"
	}),
	user_tutorId: one(users, {
		fields: [lessons.tutorId],
		references: [users.id],
		relationName: "lessons_tutorId_users_id"
	}),
	mathTopic: one(mathTopics, {
		fields: [lessons.topicId],
		references: [mathTopics.id]
	}),
	calendarEvents: many(calendarEvents),
	lessonPayments: many(lessonPayments),
	homeworkAssignments: many(homeworkAssignments),
	lessonActions: many(lessonActions),
}));

export const usersRelations = relations(users, ({many}) => ({
	lessons_studentId: many(lessons, {
		relationName: "lessons_studentId_users_id"
	}),
	lessons_tutorId: many(lessons, {
		relationName: "lessons_tutorId_users_id"
	}),
	conversations_user1Id: many(conversations, {
		relationName: "conversations_user1Id_users_id"
	}),
	conversations_user2Id: many(conversations, {
		relationName: "conversations_user2Id_users_id"
	}),
	payouts: many(payouts),
	userProgresses: many(userProgress),
	studentProfiles: many(studentProfiles),
	studentProgresses: many(studentProgress),
	studentBadges: many(studentBadges),
	tutorProfiles: many(tutorProfiles),
	calendarEvents: many(calendarEvents),
	messages: many(messages),
	studentSubjects: many(studentSubjects),
	balanceTransactions: many(balanceTransactions),
	lessonPayments_studentId: many(lessonPayments, {
		relationName: "lessonPayments_studentId_users_id"
	}),
	lessonPayments_tutorId: many(lessonPayments, {
		relationName: "lessonPayments_tutorId_users_id"
	}),
	studentMatchingPreferences_studentId: many(studentMatchingPreferences, {
		relationName: "studentMatchingPreferences_studentId_users_id"
	}),
	studentMatchingPreferences_assignedTutorId: many(studentMatchingPreferences, {
		relationName: "studentMatchingPreferences_assignedTutorId_users_id"
	}),
	tutorAvailabilities: many(tutorAvailability),
	tutorStudentMatches_studentId: many(tutorStudentMatches, {
		relationName: "tutorStudentMatches_studentId_users_id"
	}),
	tutorStudentMatches_tutorId: many(tutorStudentMatches, {
		relationName: "tutorStudentMatches_tutorId_users_id"
	}),
	lessonInvitations_tutorId: many(lessonInvitations, {
		relationName: "lessonInvitations_tutorId_users_id"
	}),
	lessonInvitations_studentId: many(lessonInvitations, {
		relationName: "lessonInvitations_studentId_users_id"
	}),
	tutorHourlyAvailabilities: many(tutorHourlyAvailability),
	topicCompletions: many(topicCompletions),
}));

export const mathTopicsRelations = relations(mathTopics, ({one, many}) => ({
	lessons: many(lessons),
	mathTopic: one(mathTopics, {
		fields: [mathTopics.parentId],
		references: [mathTopics.id],
		relationName: "mathTopics_parentId_mathTopics_id"
	}),
	mathTopics: many(mathTopics, {
		relationName: "mathTopics_parentId_mathTopics_id"
	}),
	courses: many(courses),
	studentProgresses: many(studentProgress),
	topicCompletions: many(topicCompletions),
	topicMaterials: many(topicMaterials),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	mathTopic: one(mathTopics, {
		fields: [courses.mathTopicId],
		references: [mathTopics.id]
	}),
	courseLessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({one}) => ({
	course: one(courses, {
		fields: [courseLessons.courseId],
		references: [courses.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_user1Id: one(users, {
		fields: [conversations.user1Id],
		references: [users.id],
		relationName: "conversations_user1Id_users_id"
	}),
	user_user2Id: one(users, {
		fields: [conversations.user2Id],
		references: [users.id],
		relationName: "conversations_user2Id_users_id"
	}),
	messages: many(messages),
}));

export const payoutsRelations = relations(payouts, ({one}) => ({
	user: one(users, {
		fields: [payouts.tutorId],
		references: [users.id]
	}),
}));

export const mailingListSubscriptionsRelations = relations(mailingListSubscriptions, ({one}) => ({
	subject: one(subjects, {
		fields: [mailingListSubscriptions.subjectId],
		references: [subjects.id]
	}),
}));

export const subjectsRelations = relations(subjects, ({many}) => ({
	mailingListSubscriptions: many(mailingListSubscriptions),
	studentSubjects: many(studentSubjects),
	studentMatchingPreferences: many(studentMatchingPreferences),
	tutorStudentMatches: many(tutorStudentMatches),
	lessonInvitations: many(lessonInvitations),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	user: one(users, {
		fields: [userProgress.userId],
		references: [users.id]
	}),
}));

export const studentProfilesRelations = relations(studentProfiles, ({one}) => ({
	user: one(users, {
		fields: [studentProfiles.userId],
		references: [users.id]
	}),
}));

export const studentProgressRelations = relations(studentProgress, ({one}) => ({
	user: one(users, {
		fields: [studentProgress.studentId],
		references: [users.id]
	}),
	mathTopic: one(mathTopics, {
		fields: [studentProgress.topicId],
		references: [mathTopics.id]
	}),
}));

export const studentBadgesRelations = relations(studentBadges, ({one}) => ({
	user: one(users, {
		fields: [studentBadges.studentId],
		references: [users.id]
	}),
	badge: one(badges, {
		fields: [studentBadges.badgeId],
		references: [badges.id]
	}),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	studentBadges: many(studentBadges),
}));

export const tutorProfilesRelations = relations(tutorProfiles, ({one}) => ({
	user: one(users, {
		fields: [tutorProfiles.userId],
		references: [users.id]
	}),
}));

export const calendarEventsRelations = relations(calendarEvents, ({one}) => ({
	user: one(users, {
		fields: [calendarEvents.userId],
		references: [users.id]
	}),
	lesson: one(lessons, {
		fields: [calendarEvents.lessonId],
		references: [lessons.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	user: one(users, {
		fields: [messages.senderId],
		references: [users.id]
	}),
}));

export const studentSubjectsRelations = relations(studentSubjects, ({one}) => ({
	user: one(users, {
		fields: [studentSubjects.studentId],
		references: [users.id]
	}),
	subject: one(subjects, {
		fields: [studentSubjects.subjectId],
		references: [subjects.id]
	}),
}));

export const balanceTransactionsRelations = relations(balanceTransactions, ({one, many}) => ({
	user: one(users, {
		fields: [balanceTransactions.userId],
		references: [users.id]
	}),
	lessonPayments: many(lessonPayments),
}));

export const lessonPaymentsRelations = relations(lessonPayments, ({one}) => ({
	lesson: one(lessons, {
		fields: [lessonPayments.lessonId],
		references: [lessons.id]
	}),
	user_studentId: one(users, {
		fields: [lessonPayments.studentId],
		references: [users.id],
		relationName: "lessonPayments_studentId_users_id"
	}),
	user_tutorId: one(users, {
		fields: [lessonPayments.tutorId],
		references: [users.id],
		relationName: "lessonPayments_tutorId_users_id"
	}),
	balanceTransaction: one(balanceTransactions, {
		fields: [lessonPayments.balanceTransactionId],
		references: [balanceTransactions.id]
	}),
}));

export const studentMatchingPreferencesRelations = relations(studentMatchingPreferences, ({one, many}) => ({
	user_studentId: one(users, {
		fields: [studentMatchingPreferences.studentId],
		references: [users.id],
		relationName: "studentMatchingPreferences_studentId_users_id"
	}),
	subject: one(subjects, {
		fields: [studentMatchingPreferences.subjectId],
		references: [subjects.id]
	}),
	user_assignedTutorId: one(users, {
		fields: [studentMatchingPreferences.assignedTutorId],
		references: [users.id],
		relationName: "studentMatchingPreferences_assignedTutorId_users_id"
	}),
	lessonInvitations: many(lessonInvitations),
}));

export const tutorAvailabilityRelations = relations(tutorAvailability, ({one}) => ({
	user: one(users, {
		fields: [tutorAvailability.tutorId],
		references: [users.id]
	}),
}));

export const tutorStudentMatchesRelations = relations(tutorStudentMatches, ({one}) => ({
	user_studentId: one(users, {
		fields: [tutorStudentMatches.studentId],
		references: [users.id],
		relationName: "tutorStudentMatches_studentId_users_id"
	}),
	user_tutorId: one(users, {
		fields: [tutorStudentMatches.tutorId],
		references: [users.id],
		relationName: "tutorStudentMatches_tutorId_users_id"
	}),
	subject: one(subjects, {
		fields: [tutorStudentMatches.subjectId],
		references: [subjects.id]
	}),
}));

export const lessonInvitationsRelations = relations(lessonInvitations, ({one}) => ({
	user_tutorId: one(users, {
		fields: [lessonInvitations.tutorId],
		references: [users.id],
		relationName: "lessonInvitations_tutorId_users_id"
	}),
	user_studentId: one(users, {
		fields: [lessonInvitations.studentId],
		references: [users.id],
		relationName: "lessonInvitations_studentId_users_id"
	}),
	subject: one(subjects, {
		fields: [lessonInvitations.subjectId],
		references: [subjects.id]
	}),
	studentMatchingPreference: one(studentMatchingPreferences, {
		fields: [lessonInvitations.studentMatchingPreferenceId],
		references: [studentMatchingPreferences.id]
	}),
}));

export const tutorHourlyAvailabilityRelations = relations(tutorHourlyAvailability, ({one}) => ({
	user: one(users, {
		fields: [tutorHourlyAvailability.tutorId],
		references: [users.id]
	}),
}));

export const homeworkAssignmentsRelations = relations(homeworkAssignments, ({one}) => ({
	lesson: one(lessons, {
		fields: [homeworkAssignments.lessonId],
		references: [lessons.id]
	}),
}));

export const lessonActionsRelations = relations(lessonActions, ({one}) => ({
	lesson: one(lessons, {
		fields: [lessonActions.lessonId],
		references: [lessons.id]
	}),
}));

export const topicCompletionsRelations = relations(topicCompletions, ({one}) => ({
	user: one(users, {
		fields: [topicCompletions.studentId],
		references: [users.id]
	}),
	mathTopic: one(mathTopics, {
		fields: [topicCompletions.topicId],
		references: [mathTopics.id]
	}),
}));

export const topicMaterialsRelations = relations(topicMaterials, ({one}) => ({
	mathTopic: one(mathTopics, {
		fields: [topicMaterials.topicId],
		references: [mathTopics.id]
	}),
}));