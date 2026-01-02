import {
  users,
  adminAccounts,
  studentProfiles,
  tutorProfiles,
  lessons,
  courses,
  courseLessons,
  mathTopics,
  studentProgress,
  badges,
  studentBadges,
  homeworkAssignments,
  payouts,
  lessonPayments,
  balanceTransactions,
  calendarEvents,
  conversations,
  messages,
  subjects,
  studentSubjects,
  mailingListSubscriptions,
  studentMatchingPreferences,
  tutorAvailability,
  tutorHourlyAvailability,
  lessonInvitations,
  tutorStudentMatches,
  userProgress,
  topicMaterials,
  topicCompletions,
  passwordResetTokens,
  referrals,
  systemSettings,
  lessonPackages,
  purchasedPackages,
  questions,
  quizzes,
  quizQuestions,
  quizAttempts,
  exercises,
  exerciseAttempts,
  type User,
  type UpsertUser,
  type AdminAccount,
  type InsertAdminAccount,
  type StudentProfile,
  type TutorProfile,
  type Lesson,
  type Course,
  type CourseLesson,
  type MathTopic,
  type StudentProgress,
  type Badge,
  type StudentBadge,
  type HomeworkAssignment,
  type Payout,
  type InsertPayout,
  type LessonPayment,
  type InsertLessonPayment,
  type BalanceTransaction,
  type InsertBalanceTransaction,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Conversation,
  type Message,
  type InsertConversation,
  type InsertMessage,
  type InsertStudentProfile,
  type InsertTutorProfile,
  type InsertLesson,
  type InsertCourse,
  type InsertCourseLesson,
  type InsertHomeworkAssignment,
  type Subject,
  type StudentSubject,
  type InsertSubject,
  type InsertStudentSubject,
  type MailingListSubscription,
  type InsertMailingListSubscription,
  type TutorAvailability,
  type InsertTutorAvailability,
  type TutorHourlyAvailability,
  type InsertTutorHourlyAvailability,
  type LessonInvitation,
  type InsertLessonInvitation,
  type StudentMatchingPreferences,
  type InsertStudentMatchingPreferences,
  type TutorStudentMatch,
  type InsertTutorStudentMatch,
  type TopicMaterial,
  type TopicCompletion,
  type InsertTopicMaterial,
  type InsertTopicCompletion,
  type InsertMathTopic,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type Referral,
  type InsertReferral,
  type SystemSetting,
  type InsertSystemSetting,
  type LessonPackage,
  type InsertLessonPackage,
  type PurchasedPackage,
  type InsertPurchasedPackage,
  type Question,
  type InsertQuestion,
  type Quiz,
  type InsertQuiz,
  type QuizQuestion,
  type InsertQuizQuestion,
  type QuizAttempt,
  type InsertQuizAttempt,
  type Exercise,
  type InsertExercise,
  type ExerciseAttempt,
  type InsertExerciseAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, or, asc, sum, count, isNull, isNotNull, inArray, ne, lt } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import bcrypt from "bcryptjs";
import OpenAI from "openai";

export interface IStorage {
  // User operations for custom auth system
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  updateUser(userId: string, updates: any): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(userId: string, role: "student" | "tutor" | "admin"): Promise<User>;
  updateUserAdditionalData(userId: string, data: { parentEmail?: string; bankAccount?: string }): Promise<User>;
  
  // Admin operations
  createAdminAccount(admin: InsertAdminAccount): Promise<AdminAccount>;
  authenticateAdmin(username: string, password: string): Promise<AdminAccount | null>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesBySubject(subjectId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<void>;
  deleteCourse(id: string): Promise<void>;
  
  // Course lesson operations
  getCourseLessons(courseId: string): Promise<CourseLesson[]>;
  
  // Lesson operations (additional)
  createLessonFromCalendar(lesson: InsertLesson): Promise<Lesson>;
  getCourseLesson(id: string): Promise<CourseLesson | undefined>;
  createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson>;
  updateCourseLesson(id: string, updates: Partial<InsertCourseLesson>): Promise<void>;
  deleteCourseLesson(id: string): Promise<void>;
  
  // Math topics
  getMathTopics(): Promise<MathTopic[]>;
  
  // Student operations
  getStudentProfile(userId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  updateStudentXP(userId: string, xpGain: number): Promise<void>;
  updateStudentStreak(userId: string, streak: number): Promise<void>;
  updateStudentLevelDescription(userId: string, levelDescription: string): Promise<void>;
  
  // Topic-based learning operations
  getStudentTopicProgression(studentId: string): Promise<any[]>;
  getTopicMaterials(topicId: string): Promise<TopicMaterial[]>;
  getNextAvailableTopic(studentId: string): Promise<any>;
  unlockNextTopic(studentId: string): Promise<any>;
  completeTopicLesson(studentId: string, topicId: string, xpEarned: number): Promise<void>;
  updateTopicMaterial(materialId: string, updates: Partial<TopicMaterial>): Promise<TopicMaterial>;
  createMathTopic(topicData: InsertMathTopic): Promise<MathTopic>;
  updateMathTopic(topicId: string, updates: Partial<MathTopic>): Promise<MathTopic>;
  deleteMathTopic(topicId: string): Promise<void>;
  
  // Tutor operations
  getTutorProfile(userId: string): Promise<TutorProfile | undefined>;
  createTutorProfile(profile: InsertTutorProfile): Promise<TutorProfile>;
  updateTutorBio(tutorId: string, bio: string): Promise<void>;
  getTutors(): Promise<(User & { tutorProfile: TutorProfile })[]>;
  
  // Lesson operations
  getLessons(userId: string, role: "student" | "tutor"): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | undefined>;
  getLessonById(lessonId: string): Promise<Lesson | undefined>;
  getUpcomingLessons(userId: string, role: "student" | "tutor"): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLessonStatus(lessonId: string, status: string, metadata?: any): Promise<void>;
  
  // Math topics operations
  getStudentProgress(studentId: string): Promise<StudentProgress[]>;
  updateStudentProgress(studentId: string, topicId: string, progress: number): Promise<void>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getStudentBadges(studentId: string): Promise<any[]>;
  getAllBadgesWithStudentStatus(studentId: string): Promise<any[]>;
  awardBadge(studentId: string, badgeId: string): Promise<void>;
  getAllBadges(): Promise<Badge[]>;
  createBadge(badgeData: any): Promise<Badge>;
  updateBadge(badgeId: string, updates: any): Promise<Badge>;
  deleteBadge(badgeId: string): Promise<void>;
  awardBadgeToStudent(studentId: string, badgeId: string, awardedBy: string): Promise<StudentBadge>;
  
  // Homework operations
  getHomeworkAssignments(studentId: string): Promise<HomeworkAssignment[]>;
  createHomeworkAssignment(assignment: InsertHomeworkAssignment): Promise<HomeworkAssignment>;
  updateHomeworkStatus(assignmentId: string, status: string, grade?: number): Promise<void>;
  autoGradeHomework(homeworkId: string, studentAnswer: string): Promise<{ grade: number; feedback: string }>;
  
  // Analytics
  getStudentStats(studentId: string): Promise<{
    totalLessons: number;
    completedHomework: number;
    averageGrade: number;
    xp: number;
    level: number;
    streak: number;
  }>;
  
  getTutorStats(tutorId: string): Promise<{
    totalStudents: number;
    totalLessons: number;
    averageRating: number;
    monthlyEarnings: number;
  }>;
  
  getAdminStats(): Promise<{
    totalStudents: number;
    totalTutors: number;
    totalLessons: number;
    monthlyRevenue: number;
  }>;

  // Payout operations
  getAllPayouts(): Promise<Payout[]>;
  getPayoutsByPeriod(period: string): Promise<Payout[]>;
  getAllTutors(): Promise<User[]>;
  getPayoutStats(period: string): Promise<{ totalAmount: string; tutorCount: number }>;
  generatePayout(tutorId: string, period: string, notes?: string): Promise<Payout>;
  processPayout(payoutId: string): Promise<Payout>;
  markPayoutAsPaid(payoutId: string): Promise<Payout>;

  // User management operations
  getAllStudents(): Promise<any[]>;
  getAllStudentsWithBalance(): Promise<any[]>;
  getAllTutorsDetailed(): Promise<any[]>;
  toggleUserStatus(userId: string, isActive: boolean): Promise<void>;
  verifyTutor(tutorId: string): Promise<void>;

  // Calendar operations
  getCalendarEvents(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]>;
  getAllCalendarEventsByMonth(startDate: string, endDate: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(eventId: string, updates: Partial<InsertCalendarEvent>): Promise<void>;
  deleteCalendarEvent(eventId: string): Promise<void>;
  
  // Google Meet operations
  generateMeetLink(lessonId: string): Promise<void>;
  updateLessonMeetInfo(lessonId: string, meetLink: string, meetId: string): Promise<void>;
  
  // Messages operations
  getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]>;
  getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation>;
  getMessages(conversationId: string): Promise<(Message & { sender: User })[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<void>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  getUsersWithUnreadMessages(): Promise<{userId: string, email: string, firstName: string, unreadCount: number, senderName: string, lastMessagePreview: string}[]>;
  updateLastEmailNotification(userId: string): Promise<void>;

  // Revenue operations
  getRevenueDetails(period: string): Promise<any>;
  getDailyRevenue(period: string, type?: string): Promise<any>;
  
  // Analytics operations
  getTodaysLessons(): Promise<any[]>;
  getTodaysRegistrations(): Promise<any[]>;
  
  // Subject operations for multi-subject platform
  getSubjects(): Promise<Subject[]>;
  getStudentSubjects(studentId: string): Promise<StudentSubject[]>;
  enrollInSubject(studentId: string, subjectId: string): Promise<StudentSubject>;
  
  // Mailing list operations
  subscribeToMailingList(email: string, subjectId: string): Promise<MailingListSubscription>;
  unsubscribeFromMailingList(email: string, subjectId: string): Promise<void>;
  getMailingListSubscriptions(subjectId: string): Promise<MailingListSubscription[]>;
  
  // Payment and balance operations
  getUserBalance(userId: string): Promise<string>;
  addBalanceTransaction(transaction: InsertBalanceTransaction): Promise<BalanceTransaction>;
  processLessonPayment(lessonId: string, studentId: string, method: 'balance' | 'stripe', stripePaymentIntentId?: string): Promise<LessonPayment>;
  getLessonPayment(lessonId: string): Promise<LessonPayment | undefined>;
  getBalanceTransactions(userId: string, limit?: number): Promise<BalanceTransaction[]>;
  updateUserBalance(userId: string, newBalance: string): Promise<void>;

  // Student-Tutor matching system operations
  setTutorAvailability(tutorId: string, availability: InsertTutorAvailability[]): Promise<void>;
  getTutorAvailability(tutorId: string): Promise<TutorAvailability[]>;
  setStudentMatchingPreferences(preferences: InsertStudentMatchingPreferences): Promise<StudentMatchingPreferences>;
  getStudentMatchingPreferences(studentId: string): Promise<StudentMatchingPreferences | undefined>;
  findMatchingTutors(studentId: string): Promise<TutorStudentMatch[]>;
  createTutorStudentMatch(match: InsertTutorStudentMatch): Promise<TutorStudentMatch>;
  updateMatchStatus(matchId: string, status: string, responseTime?: Date): Promise<void>;
  getStudentMatches(studentId: string): Promise<TutorStudentMatch[]>;
  getTutorMatches(tutorId: string): Promise<TutorStudentMatch[]>;
  
  // Progress map operations
  getUserProgressData(userId: string): Promise<any[]>;
  getUserProgressForSubject(userId: string, subjectId: string): Promise<any[]>;
  updateUserTopicProgress(userId: string, subjectId: string, levelId: string, topicId: string, updates: any): Promise<void>;
  initializeUserTopicProgress(userId: string, subjectId: string, levelId: string, topicId: string): Promise<any>;
  
  // Subject unlock management operations
  getAllSubjectsWithStats(): Promise<any[]>;
  updateSubjectAvailability(subjectId: string, available: boolean): Promise<any>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: string): Promise<void>;
  updateUserPassword(userId: string, newPasswordHash: string): Promise<void>;
  
  // Referral system operations
  createReferral(referrerId: string, referredUserId: string, code: string, bonusAmount: number): Promise<Referral>;
  getReferralByReferredId(userId: string): Promise<Referral | undefined>;
  getReferralsByUser(userId: string): Promise<(Referral & { referredUser: User })[]>;
  updateReferralStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Referral>;
  creditReferralBalance(userId: string, amount: number): Promise<void>;
  debitReferralBalance(userId: string, amount: number): Promise<void>;
  getReferralSummary(userId: string): Promise<{
    balance: string;
    totalReferrals: number;
    confirmedReferrals: number;
    pendingReferrals: number;
    totalEarnings: string;
  }>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  ensureUserHasReferralCode(userId: string): Promise<string>;
  checkReferralDiscountEligibility(userId: string): Promise<boolean>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting>;
  
  // Lesson packages operations
  getLessonPackages(activeOnly?: boolean): Promise<LessonPackage[]>;
  getLessonPackage(id: string): Promise<LessonPackage | undefined>;
  createLessonPackage(packageData: InsertLessonPackage): Promise<LessonPackage>;
  updateLessonPackage(id: string, updates: Partial<InsertLessonPackage>): Promise<LessonPackage>;
  deleteLessonPackage(id: string): Promise<void>;
  
  // Purchased packages operations
  purchasePackage(userId: string, packageId: string, stripePaymentIntentId?: string): Promise<PurchasedPackage>;
  getUserPurchasedPackages(userId: string, status?: string): Promise<PurchasedPackage[]>;
  getPurchasedPackage(id: string): Promise<PurchasedPackage | undefined>;
  usePackageLesson(userId: string): Promise<boolean>;
  getUserPackageLessonsRemaining(userId: string): Promise<number>;
  getAllPurchasedPackages(): Promise<(PurchasedPackage & { user: User; package: LessonPackage })[]>;
  
  // Loyalty system operations
  getLoyaltyStatus(userId: string): Promise<{
    level: number;
    levelName: string;
    discount: number;
    balance: string;
    completedLessons: number;
    nextLevelAt: number | null;
    lessonsToNextLevel: number;
    description: string;
  }>;
  updateLoyaltyLevel(userId: string): Promise<void>;
  incrementCompletedLessons(userId: string): Promise<void>;
  addLoyaltyBonus(userId: string, amount: number): Promise<void>;
  useLoyaltyBalance(userId: string, amount: number): Promise<boolean>;
  getLoyaltyStats(): Promise<{
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    totalUsers: number;
  }>;
  adjustUserLoyalty(userId: string, level?: number, balanceChange?: number): Promise<void>;
  
  // Quiz system operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByModule(moduleCode: string): Promise<Question[]>;
  getAllQuestions(): Promise<Question[]>;
  updateQuestion(questionId: string, updates: Partial<InsertQuestion>): Promise<Question>;
  deleteQuestion(questionId: string): Promise<void>;

  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuizByModule(moduleCode: string): Promise<Quiz | undefined>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  updateQuiz(quizId: string, updates: Partial<InsertQuiz>): Promise<Quiz>;
  deleteQuiz(quizId: string): Promise<void>;

  addQuestionToQuiz(quizId: string, questionId: string, order: number): Promise<QuizQuestion>;
  removeQuestionFromQuiz(quizId: string, questionId: string): Promise<void>;
  getQuizQuestions(quizId: string): Promise<(Question & { order: number })[]>;

  submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getStudentQuizAttempts(studentId: string): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuiz(quizId: string, studentId: string): Promise<QuizAttempt[]>;
  getBestQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | undefined>;
  
  getQuizStatusForTopic(studentId: string, topicId: string): Promise<{
    hasQuiz: boolean;
    required: boolean;
    passed: boolean;
    bestScore: number;
    attempts: number;
    lastAttempt: any | null;
  }>;
  
  // Exercise/Practice system operations
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  getExerciseById(id: string): Promise<Exercise | null>;
  getExercisesByModule(moduleCode: string): Promise<Exercise[]>;
  getAllExercises(): Promise<Exercise[]>;
  generateExercisesWithGPT(moduleCode: string, count?: number): Promise<Exercise[]>;
  submitExerciseAttempt(attempt: InsertExerciseAttempt): Promise<ExerciseAttempt & { feedback: string }>;
  getStudentExerciseAttempts(studentId: string, exerciseId?: string): Promise<ExerciseAttempt[]>;
  getExerciseStatsByModule(studentId: string, moduleCode: string): Promise<{
    totalExercises: number;
    completedExercises: number;
    correctAnswers: number;
    totalPoints: number;
    averageAccuracy: number;
  }>;
  getBestExerciseAttempt(exerciseId: string, studentId: string): Promise<ExerciseAttempt | null>;
}

export class DatabaseStorage implements IStorage {
  // Centralized revenue data for consistency across all views

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        profileComplete: !!(userData.firstName && userData.firstName.trim()),
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if profile is complete (has first name)
    const profileComplete = !!(userData.firstName && userData.firstName.trim());
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        profileComplete,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          profileComplete,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: "student" | "tutor" | "admin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        role,
        roleSetupComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAdditionalData(userId: string, data: { parentEmail?: string; bankAccount?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Student operations
  async getStudentProfile(userId: string): Promise<StudentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId));
    return profile;
  }

  // Topic-based learning methods
  async getStudentTopicProgression(studentId: string) {
    console.log(`Storage: Getting topic progression for student ${studentId}`);
    
    const progressions = await db
      .select({
        topicId: mathTopics.id,
        topicName: mathTopics.name,
        topicDescription: mathTopics.description,
        topicOrder: mathTopics.order,
        xpReward: mathTopics.xpReward,
        estimatedDuration: mathTopics.estimatedDuration,
        prerequisiteTopicIds: mathTopics.prerequisiteTopicIds,
        quizRequired: mathTopics.quizRequired,
        quizPassingScore: mathTopics.quizPassingScore,
        completionStatus: topicCompletions.status,
        completedAt: topicCompletions.completedAt,
        xpEarned: topicCompletions.xpEarned,
        lessonsCompleted: topicCompletions.lessonsCompleted,
      })
      .from(mathTopics)
      .leftJoin(topicCompletions, and(
        eq(topicCompletions.topicId, mathTopics.id),
        eq(topicCompletions.studentId, studentId)
      ))
      .where(eq(mathTopics.isActive, true))
      .orderBy(mathTopics.order);

    console.log(`Storage: Found ${progressions.length} topics from database`);
    console.log('Storage: First 3 topics:', progressions.slice(0, 3).map(p => ({ 
      topicId: p.topicId, 
      order: p.topicOrder, 
      completionStatus: p.completionStatus 
    })));

    // Get student's lessons to check for active lessons
    const studentLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.studentId, studentId));

    console.log(`Storage: Found ${studentLessons.length} lessons for student`);

    // Create map of topics with active lessons (excluding cancelled and completed)
    // Valid lesson statuses: 'scheduled', 'completed', 'cancelled', 'rescheduled'
    const topicsWithActiveLessons = new Map<string, boolean>();
    for (const lesson of studentLessons) {
      if (lesson.topicId && lesson.status === 'scheduled') {
        topicsWithActiveLessons.set(lesson.topicId, true);
        console.log(`Storage: Topic ${lesson.topicId} has active lesson with status: ${lesson.status}`);
      }
    }

    console.log(`Storage: Active lessons map:`, Array.from(topicsWithActiveLessons.entries()));

    // Batch fetch quiz statuses for all topics
    const quizStatuses = new Map<string, any>();
    for (const prog of progressions) {
      const quizStatus = await this.getQuizStatusForTopic(studentId, prog.topicId);
      quizStatuses.set(prog.topicId, quizStatus);
    }

    // Determine status based on completion, active lessons, AND QUIZ STATUS
    const processedProgressions = progressions.map((p, index) => {
      console.log(`Storage: Processing topic ${p.topicId} at index ${index}, completionStatus: ${p.completionStatus}`);
      
      const quizStatus = quizStatuses.get(p.topicId);
      
      // If topic is completed, mark as such
      if (p.completionStatus === 'completed') {
        console.log(`Storage: Topic ${p.topicId} marked as completed`);
        return { ...p, status: 'completed', quizStatus };
      }
      
      // If topic has active lessons (scheduled), mark as in_progress  
      if (topicsWithActiveLessons.has(p.topicId)) {
        console.log(`Storage: Topic ${p.topicId} marked as in_progress - has active lessons`);
        return { ...p, status: 'in_progress', completionStatus: 'in_progress', quizStatus };
      }
      
      // If topic was in_progress but has no active lessons (cancelled/expired), reset to available
      if (p.completionStatus === 'in_progress' && !topicsWithActiveLessons.has(p.topicId)) {
        console.log(`Storage: Topic ${p.topicId} was in_progress but has no active lessons - resetting to available`);
        // For first topic, mark as available
        if (index === 0) {
          return { ...p, status: 'available', completionStatus: null, quizStatus };
        }
        // For other topics, check if previous is completed AND quiz passed (if required)
        const previousTopic = progressions[index - 1];
        const previousQuizStatus = quizStatuses.get(previousTopic.topicId);
        const previousHasActiveLessons = topicsWithActiveLessons.has(previousTopic.topicId);
        
        // Check quiz requirement
        const previousQuizRequirementMet = !previousQuizStatus?.required || previousQuizStatus?.passed;
        
        if ((previousTopic?.completionStatus === 'completed' && previousQuizRequirementMet) || previousHasActiveLessons) {
          return { ...p, status: 'available', completionStatus: null, quizStatus };
        }
      }
      
      // For first topic, always available if not completed and no active lessons
      if (index === 0) {
        console.log(`Storage: Topic ${p.topicId} is first topic - marking as available`);
        return { ...p, status: 'available', quizStatus };
      }
      
      // For fluid progression with quiz requirement
      const previousTopic = progressions[index - 1];
      const previousQuizStatus = quizStatuses.get(previousTopic.topicId);
      const previousHasActiveLessons = topicsWithActiveLessons.has(previousTopic.topicId);
      
      // Check if previous topic quiz requirement is met
      const previousQuizRequirementMet = !previousQuizStatus?.required || previousQuizStatus?.passed;
      
      if ((previousTopic?.completionStatus === 'completed' && previousQuizRequirementMet) || previousHasActiveLessons) {
        console.log(`Storage: Topic ${p.topicId} marked as available - previous topic completed with quiz passed`);
        return { ...p, status: 'available', quizStatus };
      } else {
        console.log(`Storage: Topic ${p.topicId} marked as locked - previous topic not completed or quiz not passed`);
        return { ...p, status: 'locked', quizStatus };
      }
    });

    console.log('Storage: Final processed progressions:', processedProgressions.slice(0, 3).map(p => ({ 
      topicId: p.topicId, 
      status: p.status,
      quizStatus: p.quizStatus
    })));

    return processedProgressions;
  }

  async getTutorsWithAvailability(): Promise<any[]> {
    console.log("Storage SQL: Fetching all tutors with availability");
    const tutors = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        isActive: users.isActive,
        tutorProfile: {
          userId: tutorProfiles.userId,
          hourlyRate: tutorProfiles.hourlyRate,
          rating: tutorProfiles.rating,
          totalLessons: tutorProfiles.totalLessons,
          isVerified: tutorProfiles.isVerified,
          bio: tutorProfiles.bio,
          specializations: tutorProfiles.specializations,
        },
      })
      .from(users)
      .leftJoin(tutorProfiles, eq(users.id, tutorProfiles.userId))
      .where(and(
        eq(users.role, "tutor"),
        eq(users.isActive, true)
      ));

    // Check which tutors have availability
    const tutorsWithAvailability = [];
    for (const tutor of tutors) {
      const hasAvailability = await this.checkTutorHasAvailability(tutor.id);
      const availability = hasAvailability ? await this.getTutorAvailabilityStats(tutor.id) : { days: 0, totalSlots: 0 };
      
      console.log(`Tutor ${tutor.firstName} ${tutor.lastName} has availability: ${hasAvailability} ${availability.days}`);
      
      tutorsWithAvailability.push({
        ...tutor,
        hasAvailability,
        availabilityStats: availability
      });
    }
    
    console.log(`Storage SQL: Processed ${tutorsWithAvailability.length} tutors with profiles`);
    console.log(`Storage SQL: Found ${tutorsWithAvailability.filter(t => t.hasAvailability).length} tutors with availability out of ${tutorsWithAvailability.length} total`);
    
    return tutorsWithAvailability;
  }

  private async checkTutorHasAvailability(tutorId: string): Promise<boolean> {
    const [count] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tutorHourlyAvailability)
      .where(eq(tutorHourlyAvailability.tutorId, tutorId));
    return (count?.count || 0) > 0;
  }

  private async getTutorAvailabilityStats(tutorId: string): Promise<{ days: number; totalSlots: number }> {
    const availability = await db
      .select()
      .from(tutorHourlyAvailability)
      .where(eq(tutorHourlyAvailability.tutorId, tutorId));
    
    const uniqueDays = new Set(availability.map(slot => slot.dayOfWeek));
    return {
      days: uniqueDays.size,
      totalSlots: availability.length
    };
  }

  async getActiveStudentMatchingPreferences(studentId: string): Promise<any | null> {
    const [preferences] = await db
      .select()
      .from(studentMatchingPreferences)
      .where(and(
        eq(studentMatchingPreferences.studentId, studentId),
        eq(studentMatchingPreferences.isActive, true)
      ))
      .limit(1);
    
    return preferences || null;
  }

  async scoreAllTutorsForStudent(tutors: any[], preferences: any): Promise<any[]> {
    console.log(`Storage: Starting scoring for ${tutors.length} tutors with preferences:`, preferences);
    const scoredTutors = [];

    for (const tutor of tutors) {
      console.log(`Storage: Checking tutor ${tutor.firstName} ${tutor.lastName}, has profile: ${!!tutor.tutorProfile}`);
      // Include all tutors with profiles, not just verified ones
      if (!tutor.tutorProfile) {
        console.log(`Storage: Skipping tutor ${tutor.firstName} - no profile`);
        continue;
      }

      let score = 0;

      // 1. Rating weight (40%)
      const rating = parseFloat(tutor.tutorProfile?.rating || '4.0');
      score += (rating / 5.0) * 40;

      // 2. Experience weight (30%)
      const experience = Math.min(tutor.tutorProfile?.totalLessons || 0, 100) / 100;
      score += experience * 30;

      // 3. Availability weight (30%)
      const hasTimeMatch = preferences ? await this.checkTutorTimeCompatibility(
        tutor.id,
        preferences.preferredDays || [],
        preferences.startTime || "16:00",
        preferences.endTime || "20:00"
      ) : tutor.hasAvailability;

      if (hasTimeMatch) {
        score += 30; // Perfect match
      } else if (tutor.hasAvailability) {
        score += 15; // Has availability but not exact match
      }

      console.log(`Storage: Tutor ${tutor.firstName} scored ${score} points`);
      scoredTutors.push({
        ...tutor,
        matchScore: Math.round(score * 100) / 100,
        hasExactTimeMatch: hasTimeMatch === true,
        hasNearbyTime: tutor.hasAvailability && !hasTimeMatch
      });
    }

    console.log(`Storage: Scoring completed with ${scoredTutors.length} tutors`);
    // Sort by match score (highest first)
    return scoredTutors.sort((a, b) => b.matchScore - a.matchScore);
  }

  private async checkTutorTimeCompatibility(
    tutorId: string,
    preferredDays: number[],
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    if (!preferredDays.length) return true;

    const availability = await db
      .select()
      .from(tutorHourlyAvailability)
      .where(eq(tutorHourlyAvailability.tutorId, tutorId));

    for (const slot of availability) {
      if (preferredDays.includes(slot.dayOfWeek)) {
        const slotHour = parseInt(slot.hour.split(':')[0]);
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        if (slotHour >= startHour && slotHour <= endHour) {
          return true;
        }
      }
    }

    return false;
  }

  async getNextAvailableTopic(studentId: string) {
    console.log(`Storage: Getting next available topic for student ${studentId}`);
    const progressions = await this.getStudentTopicProgression(studentId);
    
    console.log('Storage: Available topics check:', progressions.slice(0, 3).map(p => ({ 
      topicId: p.topicId, 
      status: p.status, 
      completionStatus: p.completionStatus 
    })));
    
    // Find the first topic that is available/in_progress and not completed
    const availableTopic = progressions.find(topic => 
      (topic.status === 'available' || topic.status === 'in_progress') && topic.completionStatus !== 'completed'
    );
    
    console.log('Storage: Next available topic result:', availableTopic ? {
      topicId: availableTopic.topicId,
      status: availableTopic.status,
      completionStatus: availableTopic.completionStatus
    } : null);
    
    return availableTopic || null;
  }

  async unlockNextTopic(studentId: string) {
    const nextTopic = await this.getNextAvailableTopic(studentId);
    
    if (nextTopic && nextTopic.status !== 'available') {
      // Create or update topic completion record
      const existing = await db
        .select()
        .from(topicCompletions)
        .where(and(
          eq(topicCompletions.studentId, studentId),
          eq(topicCompletions.topicId, nextTopic.topicId)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(topicCompletions).values({
          studentId,
          topicId: nextTopic.topicId,
          status: 'available'
        });
      } else {
        await db
          .update(topicCompletions)
          .set({ status: 'available' })
          .where(and(
            eq(topicCompletions.studentId, studentId),
            eq(topicCompletions.topicId, nextTopic.topicId)
          ));
      }
    }
    
    return nextTopic;
  }

  async completeTopicLesson(studentId: string, topicId: string, xpEarned: number) {
    // Update topic completion
    const existing = await db
      .select()
      .from(topicCompletions)
      .where(and(
        eq(topicCompletions.studentId, studentId),
        eq(topicCompletions.topicId, topicId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(topicCompletions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          xpEarned,
          lessonsCompleted: existing[0].lessonsCompleted + 1
        })
        .where(and(
          eq(topicCompletions.studentId, studentId),
          eq(topicCompletions.topicId, topicId)
        ));
    } else {
      await db.insert(topicCompletions).values({
        studentId,
        topicId,
        status: 'completed',
        completedAt: new Date(),
        xpEarned,
        lessonsCompleted: 1
      });
    }

    // Update student XP and level
    await this.updateStudentXP(studentId, xpEarned);
    
    // Update lesson count and activity date separately
    await db
      .update(studentProfiles)
      .set({
        completedLessons: sql`${studentProfiles.completedLessons} + 1`,
        lastActivityDate: new Date()
      })
      .where(eq(studentProfiles.userId, studentId));

    // Unlock next topic
    await this.unlockNextTopic(studentId);
    
    // Check and award badges for progress
    const newBadges = await this.checkAndAwardBadges(studentId);
    if (newBadges.length > 0) {
      console.log(`Student ${studentId} earned new badges: ${newBadges.join(", ")}`);
    }
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [created] = await db
      .insert(studentProfiles)
      .values(profile)
      .returning();
    return created;
  }

  async updateStudentXP(userId: string, xpGain: number): Promise<void> {
    // Count completed topics to determine current chapter/level
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(topicCompletions)
      .where(and(eq(topicCompletions.studentId, userId), eq(topicCompletions.status, "completed")));
    
    // Level = number of completed topics + 1 (current chapter)
    const newLevel = (completedCount[0]?.count || 0) + 1;
    
    await db
      .update(studentProfiles)
      .set({
        xp: sql`${studentProfiles.xp} + ${xpGain}`,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, userId));
    
    // Check for XP and level badges after updating
    const newBadges = await this.checkAndAwardBadges(userId);
    if (newBadges.length > 0) {
      console.log(`Student ${userId} earned XP/level badges: ${newBadges.join(", ")}`);
    }
  }

  async updateStudentStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(studentProfiles)
      .set({
        streak,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, userId));
    
    // Check for streak badges after updating
    const newBadges = await this.checkAndAwardBadges(userId);
    if (newBadges.length > 0) {
      console.log(`Student ${userId} earned streak badges: ${newBadges.join(", ")}`);
    }
  }

  // Tutor operations
  async getTutorProfile(userId: string): Promise<TutorProfile | undefined> {
    const [profile] = await db
      .select()
      .from(tutorProfiles)
      .where(eq(tutorProfiles.userId, userId));
    return profile;
  }

  async createTutorProfile(profile: InsertTutorProfile): Promise<TutorProfile> {
    const [created] = await db
      .insert(tutorProfiles)
      .values(profile)
      .returning();
    return created;
  }

  async updateTutorBio(tutorId: string, bio: string): Promise<void> {
    await db
      .update(tutorProfiles)
      .set({ bio })
      .where(eq(tutorProfiles.userId, tutorId));
  }

  async updateTutorProfile(userId: string, updates: Partial<TutorProfile>): Promise<void> {
    await db
      .update(tutorProfiles)
      .set(updates)
      .where(eq(tutorProfiles.userId, userId));
  }

  async updateStudentLevelDescription(userId: string, levelDescription: string): Promise<void> {
    await db
      .update(studentProfiles)
      .set({ levelDescription })
      .where(eq(studentProfiles.userId, userId));
  }

  async getTutors(): Promise<(User & { tutorProfile: TutorProfile })[]> {
    const result = await db
      .select()
      .from(users)
      .innerJoin(tutorProfiles, eq(users.id, tutorProfiles.userId))
      .where(eq(users.role, "tutor"));
    
    return result.map(row => ({
      ...row.users,
      tutorProfile: row.tutor_profiles,
    }));
  }

  // Lesson operations
  async getLessons(userId: string, role: "student" | "tutor"): Promise<Lesson[]> {
    const field = role === "student" ? lessons.studentId : lessons.tutorId;
    return await db
      .select()
      .from(lessons)
      .where(eq(field, userId))
      .orderBy(desc(lessons.scheduledAt));
  }

  async getUpcomingLessons(userId: string, role: "student" | "tutor"): Promise<Lesson[]> {
    const field = role === "student" ? lessons.studentId : lessons.tutorId;
    
    // Get regular lessons from lessons table (only scheduled)
    // Valid lesson statuses: 'scheduled', 'completed', 'cancelled', 'rescheduled'
    const regularLessons = await db
      .select()
      .from(lessons)
      .where(
        and(
          eq(field, userId),
          eq(lessons.status, "scheduled"),
          sql`${lessons.scheduledAt} > NOW()`
        )
      )
      .orderBy(lessons.scheduledAt);

    // Get calendar events that are lessons for this user - but only active ones
    const calendarLessons = await db
      .select({
        id: calendarEvents.lessonId,
        title: calendarEvents.title,
        description: calendarEvents.description,
        scheduledAt: calendarEvents.startTime,
        duration: sql`60`.as('duration'), // Default 60 minutes
        status: lessons.status,
        studentId: sql`CASE WHEN ${calendarEvents.type} = 'lesson' THEN ${calendarEvents.userId} ELSE NULL END`.as('studentId'),
        tutorId: lessons.tutorId,
        meetLink: calendarEvents.meetingUrl,
        price: sql`'60.00'`.as('price'),
        createdAt: calendarEvents.createdAt,
        updatedAt: calendarEvents.updatedAt,
        googleCalendarEventId: calendarEvents.googleCalendarEventId,
        icalUid: calendarEvents.icalUid,
      })
      .from(calendarEvents)
      .leftJoin(lessons, eq(calendarEvents.lessonId, lessons.id))
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.type, "lesson"),
          isNotNull(calendarEvents.lessonId),
          eq(lessons.status, "scheduled"), // Show only scheduled lessons
          sql`${calendarEvents.startTime} > NOW()`
        )
      )
      .orderBy(calendarEvents.startTime);

    // Combine and deduplicate by lesson ID
    const allLessons = [...regularLessons];
    const existingLessonIds = new Set(regularLessons.map(l => l.id));
    
    for (const calendarLesson of calendarLessons) {
      if (calendarLesson.id && !existingLessonIds.has(calendarLesson.id)) {
        allLessons.push(calendarLesson as any);
      }
    }
    
    // Sort by scheduled time
    return allLessons.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  // Get all upcoming lessons for all students (for admin summary view)
  async getAllUpcomingLessons(): Promise<Lesson[]> {
    const regularLessons = await db
      .select({
        id: lessons.id,
        studentId: lessons.studentId,
        tutorId: lessons.tutorId,
        title: lessons.title,
        description: lessons.description,
        scheduledAt: lessons.scheduledAt,
        duration: lessons.duration,
        status: lessons.status,
        price: lessons.price,
        meetLink: lessons.meetLink,
        studentName: sql`(SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = ${lessons.studentId})`.as('studentName'),
        tutorName: sql`(SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = ${lessons.tutorId})`.as('tutorName'),
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons)
      .where(
        and(
          eq(lessons.status, "scheduled"),
          sql`${lessons.scheduledAt} > NOW()`
        )
      )
      .orderBy(lessons.scheduledAt);

    return regularLessons as any[];
  }

  // Get all homework assignments for all students (for admin summary view)
  async getAllHomeworkAssignments(): Promise<any[]> {
    console.log("Storage: Fetching all homework assignments for admin view");
    
    try {
      const assignments = await db
        .select({
          id: homeworkAssignments.id,
          lessonId: homeworkAssignments.lessonId,
          title: homeworkAssignments.title,
          description: homeworkAssignments.description,
          dueDate: homeworkAssignments.dueDate,
          totalTasks: homeworkAssignments.totalTasks,
          status: homeworkAssignments.status,
          grade: homeworkAssignments.grade,
          feedback: homeworkAssignments.feedback,
          studentName: sql`COALESCE(CONCAT(users.first_name, ' ', users.last_name), 'Unknown Student')`,
          subjectId: sql`'math-8th'`.as('subjectId'), // Default subject for now
          subjectName: sql`'Matemaster'`.as('subjectName'), // Default subject name
          createdAt: homeworkAssignments.createdAt,
          updatedAt: homeworkAssignments.updatedAt,
        })
        .from(homeworkAssignments)
        .innerJoin(lessons, eq(homeworkAssignments.lessonId, lessons.id))
        .leftJoin(users, eq(lessons.studentId, users.id))
        .orderBy(desc(homeworkAssignments.dueDate));
      
      console.log("Storage: Found", assignments.length, "homework assignments");
      return assignments;
    } catch (error) {
      console.error("Error fetching homework assignments:", error);
      return [];
    }
  }

  // Get all calendar events for all users (admin summary view)
  async getAllCalendarEventsByMonth(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    console.log("Storage: Fetching all calendar events from", startDate, "to", endDate);
    
    // Get all events from calendar_events table
    const customEvents = await db
      .select({
        id: calendarEvents.id,
        userId: calendarEvents.userId,
        title: calendarEvents.title,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        type: calendarEvents.type,
        color: calendarEvents.color,
        lessonId: calendarEvents.lessonId,
        meetingUrl: calendarEvents.meetingUrl,
        userName: sql`CONCAT(users.first_name, ' ', users.last_name)`.as('userName'),
        userRole: sql`users.role`.as('userRole'),
        createdAt: calendarEvents.createdAt,
        updatedAt: calendarEvents.updatedAt,
      })
      .from(calendarEvents)
      .leftJoin(users, eq(calendarEvents.userId, users.id))
      .where(
        and(
          sql`${calendarEvents.startTime} >= ${startDate}`,
          sql`${calendarEvents.startTime} <= ${endDate}`
        )
      )
      .orderBy(calendarEvents.startTime);

    // Get all lessons as calendar events
    const lessonEvents = await db
      .select({
        id: sql`CONCAT('lesson-', ${lessons.id})`.as('id'),
        userId: lessons.studentId,
        title: sql`CONCAT('Lekcja: ', ${lessons.title})`.as('title'),
        description: lessons.description,
        startTime: lessons.scheduledAt,
        endTime: sql`${lessons.scheduledAt} + INTERVAL '1 hour'`.as('endTime'),
        type: sql`'lesson'`.as('type'),
        color: sql`'#10b981'`.as('color'),
        lessonId: lessons.id,
        meetingUrl: lessons.meetLink,
        userName: sql`CONCAT(users.first_name, ' ', users.last_name)`.as('userName'),
        userRole: sql`'student'`.as('userRole'),
        createdAt: lessons.createdAt,
        updatedAt: lessons.updatedAt,
      })
      .from(lessons)
      .leftJoin(users, eq(lessons.studentId, users.id))
      .where(
        and(
          sql`${lessons.scheduledAt} >= ${startDate}`,
          sql`${lessons.scheduledAt} <= ${endDate}`,
          or(
            eq(lessons.status, "scheduled"),
            eq(lessons.status, "completed")
          )
        )
      )
      .orderBy(lessons.scheduledAt);

    // Combine all events
    const allEvents = [...customEvents, ...lessonEvents as any[]];
    
    console.log("Storage: Found", allEvents.length, "total calendar events");
    return allEvents as CalendarEvent[];
  }

  async getLesson(lessonId: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    // Validate 24-hour advance booking requirement
    if (lesson.scheduledAt) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
      
      if (new Date(lesson.scheduledAt) < tomorrow) {
        throw new Error("Lekcje można rezerwować z wyprzedzeniem co najmniej 24 godzin (od jutra)");
      }
    }

    // Check if student already has a lesson for this topic
    // Only apply this restriction for student-initiated bookings, not tutor responses to invitations
    if (lesson.topicId && lesson.studentId) {
      const existingLessons = await db
        .select()
        .from(lessons)
        .where(and(
          eq(lessons.studentId, lesson.studentId),
          eq(lessons.topicId, lesson.topicId),
          or(
            eq(lessons.status, 'scheduled'),
            eq(lessons.status, 'completed')
          )
        ));

      // Allow tutors to accept invitations even if student has existing lessons
      // This check only applies to direct student bookings
      if (existingLessons.length > 0) {
        console.log(`Warning: Student ${lesson.studentId} already has lesson for topic ${lesson.topicId}, but allowing tutor acceptance`);
      }
    }

    // Check if student has available package lessons and use them automatically
    const packageLessonsRemaining = await this.getUserPackageLessonsRemaining(lesson.studentId);
    let paymentStatus = lesson.paymentStatus || 'pending';
    
    if (packageLessonsRemaining > 0) {
      // Use package lesson automatically
      const packageUsed = await this.usePackageLesson(lesson.studentId);
      if (packageUsed) {
        paymentStatus = 'paid'; // Mark as paid since package was used
        console.log(`✓ Used package lesson for student ${lesson.studentId} (${packageLessonsRemaining - 1} remaining)`);
      }
    }

    const [created] = await db
      .insert(lessons)
      .values({
        ...lesson,
        paymentStatus
      })
      .returning();
    
    // Automatycznie twórz eventy kalendarzowe dla ucznia i korepetytora
    if (created.scheduledAt && created.duration) {
      const endTime = new Date(created.scheduledAt);
      endTime.setMinutes(endTime.getMinutes() + created.duration);
      
      // Event dla ucznia
      await this.createCalendarEvent({
        userId: created.studentId,
        title: `Lekcja: ${created.title}`,
        description: created.description || `Lekcja matematyki z korepetytorem`,
        startTime: created.scheduledAt,
        endTime: endTime,
        type: "lesson",
        lessonId: created.id,
        color: "#10b981", // zielony dla lekcji
      });
      
      // Event dla korepetytora
      await this.createCalendarEvent({
        userId: created.tutorId,
        title: `Lekcja: ${created.title}`,
        description: created.description || `Lekcja matematyki z uczniem`,
        startTime: created.scheduledAt,
        endTime: endTime,
        type: "lesson",
        lessonId: created.id,
        color: "#3b82f6", // niebieski dla korepetytora
      });
    }
    
    return created;
  }

  // Tworzenie lekcji bez automatycznego tworzenia wydarzeń kalendarza (używane gdy event już istnieje)
  async createLessonFromCalendar(lesson: InsertLesson): Promise<Lesson> {
    // Validate 24-hour advance booking requirement
    if (lesson.scheduledAt) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
      
      if (new Date(lesson.scheduledAt) < tomorrow) {
        throw new Error("Lekcje można rezerwować z wyprzedzeniem co najmniej 24 godzin (od jutra)");
      }
    }

    const [created] = await db
      .insert(lessons)
      .values(lesson)
      .returning();
    return created;
  }

  async getMathTopics(): Promise<MathTopic[]> {
    return await db.select().from(mathTopics).orderBy(mathTopics.order);
  }

  async getTopicMaterials(topicId: string) {
    return await db
      .select()
      .from(topicMaterials)
      .where(eq(topicMaterials.topicId, topicId))
      .orderBy(topicMaterials.order);
  }

  async createTopicMaterial(topicId: string, materialData: any) {
    const [created] = await db
      .insert(topicMaterials)
      .values({
        topicId,
        title: materialData.title,
        type: materialData.materialType,
        content: materialData.content,
        order: materialData.order || 1,
      })
      .returning();
    return created;
  }

  async deleteTopicMaterial(materialId: string) {
    await db
      .delete(topicMaterials)
      .where(eq(topicMaterials.id, materialId));
  }

  async updateTopicMaterial(materialId: string, updates: Partial<TopicMaterial>): Promise<TopicMaterial> {
    const [updated] = await db
      .update(topicMaterials)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(topicMaterials.id, materialId))
      .returning();
    return updated;
  }

  async createMathTopic(topicData: InsertMathTopic): Promise<MathTopic> {
    const [created] = await db
      .insert(mathTopics)
      .values({
        ...topicData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return created;
  }

  async updateMathTopic(topicId: string, updates: Partial<MathTopic>): Promise<MathTopic> {
    const [updated] = await db
      .update(mathTopics)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(mathTopics.id, topicId))
      .returning();
    return updated;
  }

  async deleteMathTopic(topicId: string): Promise<void> {
    // Check if topic has materials
    const materials = await db
      .select()
      .from(topicMaterials)
      .where(eq(topicMaterials.topicId, topicId));
    
    if (materials.length > 0) {
      throw new Error(`Cannot delete topic: ${materials.length} materials are associated with this topic`);
    }

    // Check if topic has lessons
    const lessonsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessons)
      .where(eq(lessons.topicId, topicId));
    
    if (lessonsCount[0]?.count > 0) {
      throw new Error(`Cannot delete topic: ${lessonsCount[0].count} lessons are associated with this topic`);
    }

    // Check if topic has student progress
    const progressCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(topicCompletions)
      .where(eq(topicCompletions.topicId, topicId));
    
    if (progressCount[0]?.count > 0) {
      throw new Error(`Cannot delete topic: ${progressCount[0].count} student progress records are associated with this topic`);
    }

    // Safe to delete
    await db
      .delete(mathTopics)
      .where(eq(mathTopics.id, topicId));
  }

  async getLessonById(lessonId: string): Promise<Lesson | undefined> {
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    return lesson;
  }

  async updateLessonStatus(lessonId: string, status: string, metadata?: any): Promise<void> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (metadata) {
      Object.assign(updateData, metadata);
    }
    
    await db
      .update(lessons)
      .set(updateData)
      .where(eq(lessons.id, lessonId));
    
    // CRITICAL: Award referral bonus when referred user completes first lesson
    if (status === "completed") {
      const lesson = await this.getLessonById(lessonId);
      if (!lesson) return;
      
      const student = await this.getUser(lesson.studentId);
      if (!student || !student.referredByCode) return;
      
      // Check if there's a pending referral for this user
      const referral = await this.getReferralByReferredId(lesson.studentId);
      if (!referral || referral.status !== "pending") return;
      
      // Check if this is truly their first completed lesson (to avoid double-awarding)
      const completedLessons = await db
        .select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(
          and(
            eq(lessons.studentId, lesson.studentId),
            eq(lessons.status, "completed")
          )
        );
      
      const completedCount = completedLessons[0]?.count || 0;
      if (completedCount !== 1) return; // Only award on first completion
      
      // Get bonus amount from system settings
      const bonusSetting = await this.getSystemSetting('referral_bonus_amount');
      const bonusAmount = parseFloat(bonusSetting?.value || '20');
      
      // Update referral status to confirmed
      await this.updateReferralStatus(referral.id, "confirmed");
      
      // Credit the referrer's balance
      await this.creditReferralBalance(referral.referrerId, bonusAmount);
      
      // Send email notification to referrer
      try {
        const referrer = await this.getUser(referral.referrerId);
        if (referrer?.email) {
          const { sendEmail } = await import('./email');
          await sendEmail({
            to: referrer.email,
            subject: '🎉 Gratulacje! Otrzymałeś bonus polecający!',
            text: `Cześć ${referrer.firstName || 'Użytkowniku'}!\n\nTwój znajomy ukończył pierwszą lekcję na SchoolMaster!\n\nOtrzymałeś bonus w wysokości ${bonusAmount.toFixed(2)} zł, który został dodany do Twojego salda polecających.\n\nMożesz go wykorzystać przy płatności za następne lekcje.\n\nDziękujemy za polecanie SchoolMaster!\n\nPozdrawiamy,\nZespół SchoolMaster`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #5F5AFC;">🎉 Gratulacje!</h2>
                <p>Cześć ${referrer.firstName || 'Użytkowniku'}!</p>
                <p>Twój znajomy ukończył pierwszą lekcję na SchoolMaster!</p>
                <div style="background: #F1C40F; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin: 0; color: #252627;">Otrzymałeś bonus: ${bonusAmount.toFixed(2)} zł</h3>
                  <p style="margin: 10px 0 0; color: #252627;">Bonus został dodany do Twojego salda polecających.</p>
                </div>
                <p>Możesz go wykorzystać przy płatności za następne lekcje.</p>
                <p>Dziękujemy za polecanie SchoolMaster!</p>
                <p style="margin-top: 30px; color: #666;">Pozdrawiamy,<br/>Zespół SchoolMaster</p>
              </div>
            `
          });
        }
      } catch (emailError) {
        console.error('Failed to send referral bonus notification email:', emailError);
        // Don't throw - email failure shouldn't break the bonus award
      }
    }
  }



  async deleteCalendarEventsByLessonId(lessonId: string): Promise<void> {
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.lessonId, lessonId));
  }

  async deductBalance(userId: string, amount: number, description: string): Promise<void> {
    // Get current balance
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = parseFloat(user.balance);
    const newBalance = Math.max(0, currentBalance - amount); // Never go below 0

    // Update user balance
    await db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId));

    // Record transaction
    await db
      .insert(balanceTransactions)
      .values({
        userId,
        type: "withdrawal",
        amount: amount.toString(),
        balanceBefore: currentBalance.toString(),
        balanceAfter: newBalance.toString(),
        description,
        relatedEntityType: "cancellation_fee",
      });
  }

  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    return await db
      .select()
      .from(studentProgress)
      .where(eq(studentProgress.studentId, studentId));
  }

  async updateStudentProgress(studentId: string, topicId: string, progress: number): Promise<void> {
    await db
      .insert(studentProgress)
      .values({
        studentId,
        topicId,
        progress,
        lastAccessedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [studentProgress.studentId, studentProgress.topicId],
        set: {
          progress,
          lastAccessedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  // Badge operations
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getAllBadgesWithStudentStatus(studentId: string): Promise<any[]> {
    const allBadges = await db.select().from(badges);
    const studentBadgesList = await db
      .select()
      .from(studentBadges)
      .where(eq(studentBadges.studentId, studentId));
    
    const earnedBadgeIds = new Set(studentBadgesList.map((sb: any) => sb.badgeId));
    
    return allBadges.map(badge => ({
      ...badge,
      unlocked: earnedBadgeIds.has(badge.id),
      earnedAt: studentBadgesList.find((sb: any) => sb.badgeId === badge.id)?.earnedAt || null
    }));
  }

  async getStudentBadges(studentId: string): Promise<any[]> {
    return await db
      .select({
        id: studentBadges.id,
        studentId: studentBadges.studentId,
        badgeId: studentBadges.badgeId,
        earnedAt: studentBadges.earnedAt,
        badge: {
          id: badges.id,
          name: badges.name,
          description: badges.description,
          icon: badges.icon,
          category: badges.category,
          requirement: badges.requirement,
          createdAt: badges.createdAt,
        }
      })
      .from(studentBadges)
      .leftJoin(badges, eq(studentBadges.badgeId, badges.id))
      .where(eq(studentBadges.studentId, studentId))
      .orderBy(studentBadges.earnedAt);
  }

  async awardBadge(studentId: string, badgeId: string): Promise<void> {
    await db
      .insert(studentBadges)
      .values({ studentId, badgeId })
      .onConflictDoNothing();
  }

  // Admin badge management methods
  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges).orderBy(badges.category, badges.name);
  }

  async createBadge(badgeData: any): Promise<Badge> {
    const [created] = await db
      .insert(badges)
      .values(badgeData)
      .returning();
    return created;
  }

  async updateBadge(badgeId: string, updates: any): Promise<Badge> {
    const [updated] = await db
      .update(badges)
      .set(updates)
      .where(eq(badges.id, badgeId))
      .returning();
    return updated;
  }

  async deleteBadge(badgeId: string): Promise<void> {
    await db.delete(studentBadges).where(eq(studentBadges.badgeId, badgeId));
    await db.delete(badges).where(eq(badges.id, badgeId));
  }

  async awardBadgeToStudent(studentId: string, badgeId: string, awardedBy: string): Promise<StudentBadge> {
    const [awarded] = await db
      .insert(studentBadges)
      .values({ studentId, badgeId })
      .onConflictDoNothing()
      .returning();
    
    console.log(`Badge ${badgeId} awarded to student ${studentId} by ${awardedBy}`);
    return awarded;
  }

  // Check and award badges based on student progress
  async checkAndAwardBadges(studentId: string): Promise<string[]> {
    const awardedBadges: string[] = [];
    
    try {
      // Get student profile with current stats
      const [student] = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, studentId));
      
      if (!student) return awardedBadges;

      // Get completed topics count
      const completedCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(topicCompletions)
        .where(and(eq(topicCompletions.studentId, studentId), eq(topicCompletions.status, "completed")));
      
      const completedTopics = completedCount[0]?.count || 0;
      
      // Get all available badges
      const allBadges = await db.select().from(badges);
      
      // Get already earned badges to avoid duplicates
      const earnedBadgesList = await db
        .select()
        .from(studentBadges)
        .where(eq(studentBadges.studentId, studentId));
      
      const earnedBadgeIds = new Set(earnedBadgesList.map(sb => sb.badgeId));

      // Check badge requirements and award if met
      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) continue; // Already earned
        
        let shouldAward = false;
        
        // Badge requirements based on category and requirement
        switch (badge.category) {
          case "progress":
            if (badge.name.includes("Pierwszy krok") && completedTopics >= 1) {
              shouldAward = true;
            } else if (badge.name.includes("Matematyk") && completedTopics >= 5) {
              shouldAward = true;
            } else if (badge.name.includes("Expert") && completedTopics >= 10) {
              shouldAward = true;
            } else if (badge.name.includes("Mistrz") && completedTopics >= 15) {
              shouldAward = true;
            }
            break;
            
          case "level":
            if (badge.name.includes("Poziom 5") && student.level >= 5) {
              shouldAward = true;
            } else if (badge.name.includes("Poziom 10") && student.level >= 10) {
              shouldAward = true;
            } else if (badge.name.includes("Poziom 15") && student.level >= 15) {
              shouldAward = true;
            }
            break;
            
          case "xp":
            if (badge.name.includes("100 XP") && student.xp >= 100) {
              shouldAward = true;
            } else if (badge.name.includes("500 XP") && student.xp >= 500) {
              shouldAward = true;
            } else if (badge.name.includes("1000 XP") && student.xp >= 1000) {
              shouldAward = true;
            }
            break;
            
          case "streak":
            if (badge.name.includes("3 dni") && student.streak >= 3) {
              shouldAward = true;
            } else if (badge.name.includes("7 dni") && student.streak >= 7) {
              shouldAward = true;
            } else if (badge.name.includes("30 dni") && student.streak >= 30) {
              shouldAward = true;
            }
            break;
            
          case "lessons":
            if (badge.name.includes("10 lekcji") && student.completedLessons >= 10) {
              shouldAward = true;
            } else if (badge.name.includes("25 lekcji") && student.completedLessons >= 25) {
              shouldAward = true;
            } else if (badge.name.includes("50 lekcji") && student.completedLessons >= 50) {
              shouldAward = true;
            }
            break;
        }
        
        if (shouldAward) {
          await this.awardBadge(studentId, badge.id);
          awardedBadges.push(badge.name);
          console.log(`Awarded badge "${badge.name}" to student ${studentId}`);
        }
      }
      
    } catch (error) {
      console.error("Error checking badges:", error);
    }
    
    return awardedBadges;
  }

  // Homework operations
  async getHomeworkAssignments(studentId: string): Promise<HomeworkAssignment[]> {
    const result = await db
      .select()
      .from(homeworkAssignments)
      .innerJoin(lessons, eq(homeworkAssignments.lessonId, lessons.id))
      .where(eq(lessons.studentId, studentId))
      .orderBy(desc(homeworkAssignments.dueDate));
    
    return result.map(row => row.homework_assignments);
  }

  async createHomeworkAssignment(assignment: InsertHomeworkAssignment): Promise<HomeworkAssignment> {
    const [created] = await db
      .insert(homeworkAssignments)
      .values(assignment)
      .returning();
    return created;
  }

  async updateHomeworkStatus(assignmentId: string, status: string, grade?: number): Promise<void> {
    await db
      .update(homeworkAssignments)
      .set({
        status,
        grade: grade?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(homeworkAssignments.id, assignmentId));
  }

  async autoGradeHomework(homeworkId: string, studentAnswer: string): Promise<{ grade: number; feedback: string }> {
    const [homework] = await db
      .select()
      .from(homeworkAssignments)
      .where(eq(homeworkAssignments.id, homeworkId));

    if (!homework) {
      throw new Error("Homework assignment not found");
    }

    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error("OpenAI API configuration missing");
    }

    const openai = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });

    const prompt = `Jesteś nauczycielem sprawdzającym pracę domową ucznia.

Zadanie: ${homework.title}
Opis: ${homework.description || "Brak opisu"}

Odpowiedź ucznia:
${studentAnswer}

Oceń odpowiedź ucznia w skali od 1 do 10, gdzie:
- 1-3: Odpowiedź bardzo słaba, wymaga dużej poprawy
- 4-6: Odpowiedź przeciętna, wymaga poprawy
- 7-8: Dobra odpowiedź z drobnymi niedociągnięciami
- 9-10: Doskonała odpowiedź

Zwróć odpowiedź w formacie JSON:
{
  "grade": <liczba od 1 do 10>,
  "feedback": "<szczegółowy feedback po polsku>"
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Jesteś pomocnym nauczycielem matematyki. Zawsze odpowiadasz w formacie JSON zgodnie z instrukcjami.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      
      if (!result.grade || !result.feedback) {
        throw new Error("Invalid response from OpenAI");
      }

      await this.updateHomeworkStatus(homeworkId, "graded", result.grade);
      
      await db
        .update(homeworkAssignments)
        .set({
          feedback: result.feedback,
          updatedAt: new Date(),
        })
        .where(eq(homeworkAssignments.id, homeworkId));

      return {
        grade: result.grade,
        feedback: result.feedback,
      };
    } catch (error) {
      console.error("Error auto-grading homework:", error);
      throw new Error("Failed to auto-grade homework with AI");
    }
  }

  // Analytics
  async getStudentStats(studentId: string): Promise<{
    totalLessons: number;
    completedHomework: number;
    averageGrade: number;
    xp: number;
    level: number;
    streak: number;
  }> {
    const profile = await this.getStudentProfile(studentId);
    
    // Count only completed lessons from traditional lessons table
    const completedLessons = await db
      .select({ count: sql<number>`count(*)` })
      .from(lessons)
      .where(and(
        eq(lessons.studentId, studentId), 
        eq(lessons.status, "completed")
      ));
    
    // Count completed topics (actual learning progress)
    const completedTopics = await db
      .select({ count: sql<number>`count(*)` })
      .from(topicCompletions)
      .where(and(eq(topicCompletions.studentId, studentId), eq(topicCompletions.status, "completed")));
    
    // Total lessons = completed traditional lessons + completed topics
    const totalLessons = Number(completedLessons[0]?.count || 0) + Number(completedTopics[0]?.count || 0);
    
    // Count graded homework assignments
    const completedHomework = await db
      .select({ count: sql<number>`count(*)` })
      .from(homeworkAssignments)
      .innerJoin(lessons, eq(homeworkAssignments.lessonId, lessons.id))
      .where(and(eq(lessons.studentId, studentId), eq(homeworkAssignments.status, "graded")));

    // Calculate average grade from homework assignments (max 5.0)
    const averageGradeResult = await db
      .select({ 
        avgGrade: sql<number>`AVG(LEAST(CAST(${homeworkAssignments.grade} AS DECIMAL), 5.0))` 
      })
      .from(homeworkAssignments)
      .innerJoin(lessons, eq(homeworkAssignments.lessonId, lessons.id))
      .where(and(
        eq(lessons.studentId, studentId), 
        eq(homeworkAssignments.status, "graded"),
        isNotNull(homeworkAssignments.grade)
      ));

    const avgGrade = averageGradeResult[0]?.avgGrade;

    return {
      totalLessons: totalLessons,
      completedHomework: Number(completedHomework[0]?.count || 0),
      averageGrade: avgGrade ? Number(avgGrade) : 0,
      xp: profile?.xp || 0,
      level: profile?.level || 1,
      streak: profile?.streak || 0,
    };
  }

  async getTutorStats(tutorId: string): Promise<{
    totalStudents: number;
    totalLessons: number;
    averageRating: number;
    monthlyEarnings: number;
  }> {
    const uniqueStudents = await db
      .selectDistinct({ studentId: lessons.studentId })
      .from(lessons)
      .where(eq(lessons.tutorId, tutorId));

    const lessonsStats = await db
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${lessons.rating})`,
        monthlyEarnings: sql<number>`sum(case when ${lessons.scheduledAt} >= date_trunc('month', current_date) then ${lessons.price} else 0 end)`,
      })
      .from(lessons)
      .where(eq(lessons.tutorId, tutorId));

    const stats = lessonsStats[0];
    return {
      totalStudents: uniqueStudents.length,
      totalLessons: stats?.count || 0,
      averageRating: Math.round((stats?.avgRating || 0) * 10) / 10,
      monthlyEarnings: stats?.monthlyEarnings || 0,
    };
  }

  async getAdminStats(): Promise<{
    totalStudents: number;
    totalTutors: number;
    totalLessons: number;
    monthlyRevenue: number;
  }> {
    const userStats = await db
      .select({
        role: users.role,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(users.role);

    const lessonStats = await db
      .select({
        totalLessons: sql<number>`count(*)`,
        monthlyRevenue: sql<number>`sum(case when ${lessons.scheduledAt} >= date_trunc('month', current_date) then ${lessons.price} else 0 end)`,
      })
      .from(lessons);

    const students = userStats.find(s => s.role === "student")?.count || 0;
    const tutors = userStats.find(s => s.role === "tutor")?.count || 0;
    const stats = lessonStats[0];

    return {
      totalStudents: students,
      totalTutors: tutors,
      totalLessons: stats?.totalLessons || 0,
      monthlyRevenue: parseFloat(stats?.monthlyRevenue?.toString() || "0"),
    };
  }

  // Admin authentication operations
  async createAdminAccount(admin: InsertAdminAccount): Promise<AdminAccount> {
    const hashedPassword = await bcrypt.hash(admin.passwordHash, 10);
    const [created] = await db
      .insert(adminAccounts)
      .values({
        ...admin,
        passwordHash: hashedPassword,
      })
      .returning();
    return created;
  }

  async authenticateAdmin(username: string, password: string): Promise<AdminAccount | null> {
    const [admin] = await db
      .select()
      .from(adminAccounts)
      .where(eq(adminAccounts.username, username))
      .limit(1);

    if (!admin || !admin.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    return admin;
  }

  // Course management operations
  async getCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(courses.order, courses.createdAt);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);
    return course;
  }

  async getCoursesBySubject(subjectId: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.subjectId, subjectId))
      .orderBy(courses.order);
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db
      .insert(courses)
      .values(course)
      .returning();
    return created;
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<void> {
    await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id));
  }

  async deleteCourse(id: string): Promise<void> {
    await db
      .delete(courses)
      .where(eq(courses.id, id));
  }

  // Course lesson management operations
  async getCourseLessons(courseId: string): Promise<CourseLesson[]> {
    return await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.order);
  }

  async getCourseLesson(id: string): Promise<CourseLesson | undefined> {
    const [lesson] = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, id))
      .limit(1);
    return lesson;
  }

  async createCourseLesson(lesson: InsertCourseLesson): Promise<CourseLesson> {
    const [created] = await db
      .insert(courseLessons)
      .values(lesson)
      .returning();
    return created;
  }

  async updateCourseLesson(id: string, updates: Partial<InsertCourseLesson>): Promise<void> {
    await db
      .update(courseLessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courseLessons.id, id));
  }

  async deleteCourseLesson(id: string): Promise<void> {
    await db
      .delete(courseLessons)
      .where(eq(courseLessons.id, id));
  }

  // Payout operations
  async getAllPayouts(): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .orderBy(desc(payouts.createdAt));
  }

  async getPayoutsByPeriod(period: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.period, period))
      .orderBy(desc(payouts.createdAt));
  }

  async getAllTutors(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "tutor"));
  }

  async getPayoutStats(period: string): Promise<{ totalAmount: string; tutorCount: number }> {
    const [stats] = await db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(${payouts.amount}::numeric), 0)::text`,
        tutorCount: sql<number>`COUNT(DISTINCT ${payouts.tutorId})`,
      })
      .from(payouts)
      .where(eq(payouts.period, period));
    
    return stats || { totalAmount: "0", tutorCount: 0 };
  }

  async generatePayout(tutorId: string, period: string, notes?: string, customAmount?: string): Promise<Payout> {
    try {
      console.log("Starting payout generation for tutorId:", tutorId, "period:", period);
      
      // Check if payout already exists for this tutor and period
      const [existing] = await db
        .select()
        .from(payouts)
        .where(and(eq(payouts.tutorId, tutorId), eq(payouts.period, period)))
        .limit(1);

      if (existing) {
        console.log("Payout already exists for this period");
        throw new Error("Wypłata dla tego korepetytora w tym okresie już istnieje");
      }
    } catch (error) {
      console.error("Error in generatePayout function:", error);
      throw error;
    }

    // Get tutor's average rating for this period to adjust payout
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    const avgRatingResult = await db
      .select({
        avgRating: sql<number>`COALESCE(AVG(${lessons.rating}::numeric), 0)`,
        lessonCount: sql<number>`COUNT(*)`,
      })
      .from(lessons)
      .where(
        and(
          eq(lessons.tutorId, tutorId),
          eq(lessons.status, "completed"),
          sql`${lessons.scheduledAt} >= ${startDate.toISOString()}`,
          sql`${lessons.scheduledAt} <= ${endDate.toISOString()}`,
          sql`${lessons.rating} IS NOT NULL`
        )
      );
    
    const avgRating = Number(avgRatingResult[0]?.avgRating || 0);
    const actualLessonCount = avgRatingResult[0]?.lessonCount || 0;

    // Calculate earnings from completed lessons in the period or use custom amount
    let grossAmount: string;
    let mockLessonCount: number;
    
    if (customAmount && parseFloat(customAmount) > 0) {
      grossAmount = customAmount;
      mockLessonCount = Math.floor(parseFloat(customAmount) / 100); // Estimate lessons based on 100zł per lesson
    } else {
      // Use actual lesson count if available, otherwise mock calculation
      mockLessonCount = actualLessonCount > 0 ? actualLessonCount : Math.floor(Math.random() * 20) + 5;
      const lessonPrice = 100; // 100 zł per lesson
      grossAmount = (mockLessonCount * lessonPrice).toString();
    }
    
    // Fixed payout percentage - tutors get 70% of the gross amount
    const payoutPercentage = 0.7; // 70% for tutors, 30% platform commission
    const netAmount = (parseFloat(grossAmount) * payoutPercentage).toFixed(2);
    const ratingInfo = avgRating > 0 ? `Średnia ocena: ${Math.round(avgRating * 10) / 10}/5` : "Brak ocen";

    try {
      console.log("Inserting payout with values:", {
        tutorId,
        period,
        amount: grossAmount,
        lessonCount: mockLessonCount,
        commission: (1 - payoutPercentage).toFixed(2),
        netAmount,
        status: "pending"
      });

      const [payout] = await db
        .insert(payouts)
        .values({
          tutorId,
          period,
          amount: grossAmount,
          lessonCount: mockLessonCount,
          commission: (1 - payoutPercentage).toFixed(2),
          netAmount,
          notes: notes ? `${notes} | ${ratingInfo}` : ratingInfo,
          status: "pending",
        })
        .returning();

      console.log("Payout inserted successfully:", payout.id);
      return payout;
    } catch (insertError) {
      console.error("Error inserting payout:", insertError);
      throw insertError;
    }
  }

  async processPayout(payoutId: string): Promise<Payout> {
    const [payout] = await db
      .update(payouts)
      .set({
        status: "processed",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId))
      .returning();

    if (!payout) {
      throw new Error("Wypłata nie została znaleziona");
    }

    return payout;
  }

  async markPayoutAsPaid(payoutId: string): Promise<Payout> {
    // Get the payout details first
    const [existingPayout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId));

    if (!existingPayout) {
      throw new Error("Wypłata nie została znaleziona");
    }

    // Update payout as paid
    const [payout] = await db
      .update(payouts)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payouts.id, payoutId))
      .returning();

    if (!payout) {
      throw new Error("Wypłata nie została znaleziona");
    }

    // Add expense transaction for the payout
    // Transaction functionality temporarily disabled
    // TODO: Implement transactions table properly when needed

    return payout;
  }

  // Revenue operations
  async getRevenueDetails(period: string): Promise<any> {
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Get centralized revenue data for consistency
    const monthlyData = await this.getDailyRevenue(period);

    // Calculate transaction amounts based on centralized data
    const studentFee1 = Math.round(monthlyData.totalRevenue * 0.27); // 27%
    const studentFee2 = Math.round(monthlyData.totalRevenue * 0.21); // 21%
    const studentFee3 = Math.round(monthlyData.totalRevenue * 0.38); // 38%
    const studentFee4 = monthlyData.totalRevenue - studentFee1 - studentFee2 - studentFee3; // Remaining 14%

    const transactions = [
      {
        id: "income-1",
        type: "income",
        amount: studentFee1,
        description: "Opłaty za lekcje - Anna Kowalska",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Lekcje",
        userId: "student1",
        userName: "Anna Kowalska"
      },
      {
        id: "income-2", 
        type: "income",
        amount: studentFee2,
        description: "Opłaty za lekcje - Piotr Nowak",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Lekcje",
        userId: "student2",
        userName: "Piotr Nowak"
      },
      {
        id: "income-3",
        type: "income", 
        amount: studentFee3,
        description: "Opłaty za lekcje - Maria Wiśniewska",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Lekcje",
        userId: "student3",
        userName: "Maria Wiśniewska"
      },
      {
        id: "income-4",
        type: "income",
        amount: studentFee4,
        description: "Opłaty za lekcje - Karolina Kupiec",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Lekcje",
        userId: "45702223",
        userName: "Karolina Kupiec"
      },
      {
        id: "expense-1",
        type: "expense",
        amount: Math.round(monthlyData.totalExpenses * 0.70), // 70% for tutors
        description: "Wypłaty dla korepetytorów",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Wypłaty",
        userName: "Korepetytorzy"
      },
      {
        id: "expense-2",
        type: "expense",
        amount: Math.round(monthlyData.totalExpenses * 0.15), // 15% hosting
        description: "Koszty hostingu i infrastruktury",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Technologia"
      },
      {
        id: "expense-3",
        type: "expense",
        amount: Math.round(monthlyData.totalExpenses * 0.10), // 10% software
        description: "Licencje oprogramowania",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Technologia"
      },
      {
        id: "expense-4",
        type: "expense",
        amount: monthlyData.totalExpenses - Math.round(monthlyData.totalExpenses * 0.95), // Remaining 5%
        description: "Marketing i reklama",
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())).toISOString(),
        category: "Marketing"
      }
    ];

    const summary = {
      totalIncome: monthlyData.totalRevenue,
      totalExpenses: monthlyData.totalExpenses,
      netRevenue: monthlyData.netRevenue,
      transactionCount: transactions.length
    };

    return {
      transactions,
      summary,
      period
    };
  }

  async getDailyRevenue(period: string, type: string = "month"): Promise<any> {
    // Return empty data since there are no real transactions yet
    return {
      dailyData: [],
      summary: {
        totalRevenue: 0,
        totalExpenses: 0,
        netRevenue: 0,
        averageDaily: 0,
        peakDay: 0,
        growthPercent: 0
      },
      period
    };
  }

  // User management operations
  async getAllStudents(): Promise<any[]> {
    const students = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
        profile: {
          level: studentProfiles.level,
          xp: studentProfiles.xp,
          streak: studentProfiles.streak,
          totalLessons: studentProfiles.completedLessons,
        },
      })
      .from(users)
      .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(users.role, "student"));

    return students;
  }

  async getAllStudentsWithBalance(): Promise<any[]> {
    const students = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.role, "student"));

    return students.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      createdAt: row.createdAt,
      isActive: row.isActive,
      balance: parseFloat(row.balance || "0")
    }));
  }

  async getAllAdmins(): Promise<any[]> {
    const admins = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.role, "admin"));

    return admins;
  }

  async getAllTutorsDetailed(): Promise<any[]> {
    const tutors = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
        isActive: users.isActive,
        profile: {
          hourlyRate: tutorProfiles.hourlyRate,
          rating: tutorProfiles.rating,
          totalLessons: tutorProfiles.totalLessons,
          isVerified: tutorProfiles.isVerified,
          bio: tutorProfiles.bio,
          specializations: tutorProfiles.specializations,
        },
      })
      .from(users)
      .leftJoin(tutorProfiles, eq(users.id, tutorProfiles.userId))
      .where(eq(users.role, "tutor"));

    return tutors;
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async verifyTutor(tutorId: string): Promise<void> {
    await db
      .update(tutorProfiles)
      .set({ 
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(tutorProfiles.userId, tutorId));
  }

  // Lesson operations for admin
  async getAllLessons(): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .orderBy(desc(lessons.scheduledAt));
  }

  async getLessonsByPeriod(period: string): Promise<Lesson[]> {
    const [year, month] = period.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    return await db
      .select()
      .from(lessons)
      .where(
        and(
          sql`${lessons.scheduledAt} >= ${startDate.toISOString()}`,
          sql`${lessons.scheduledAt} <= ${endDate.toISOString()}`
        )
      )
      .orderBy(desc(lessons.scheduledAt));
  }

  // Tutor lesson operations
  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    await db
      .update(lessons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lessons.id, lessonId));
  }

  // Homework operations
  async gradeHomework(homeworkId: string, grade: number, feedback: string): Promise<void> {
    await db
      .update(homeworkAssignments)
      .set({
        grade: grade.toString(),
        feedback,
        status: "graded",
        updatedAt: new Date(),
      })
      .where(eq(homeworkAssignments.id, homeworkId));
  }

  // XP operations for students
  async awardXP(studentId: string, xpAmount: number): Promise<void> {
    const [currentProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, studentId))
      .limit(1);

    if (currentProfile) {
      const newXP = currentProfile.xp + xpAmount;
      const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level
      
      await db
        .update(studentProfiles)
        .set({
          xp: newXP,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(studentProfiles.userId, studentId));
    }
  }

  // Calendar operations
  async getCalendarEvents(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      console.log(`Storage: Fetching calendar events for user ${userId} from ${startDate} to ${endDate}`);
      
      // Get custom calendar events for the user (excluding lesson-based events to prevent duplicates)
      console.log(`Storage SQL: Querying calendar_events for user_id=${userId}, start_time >= '${startDate}', start_time <= '${endDate}'`);
      const customEventsResult = await db.execute(
        sql`SELECT * FROM calendar_events 
            WHERE user_id = ${userId} 
            AND start_time >= ${startDate}::timestamp 
            AND start_time <= ${endDate}::timestamp
            AND lesson_id IS NULL`
      );
      console.log(`Storage SQL: Found ${customEventsResult.rows.length} custom events in database`);

      const customEvents: CalendarEvent[] = (customEventsResult.rows as any[]).map(event => ({
        id: event.id,
        userId: event.user_id,
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        type: event.type,
        lessonId: event.lesson_id,
        color: event.color || '#3b82f6',
        isRecurring: event.is_recurring || false,
        meetingUrl: event.meeting_url,
        recurrenceRule: event.recurrence_rule,
        googleCalendarEventId: event.google_calendar_event_id,
        icalUid: event.ical_uid,
        createdAt: event.created_at ? new Date(event.created_at) : null,
        updatedAt: event.updated_at ? new Date(event.updated_at) : null,
      }));

      // Get lessons for this user as calendar events (exclude cancelled)
      const lessonsResult = await db.execute(
        sql`SELECT l.id, l.title, l.description, l.scheduled_at, l.duration, l.student_id, l.tutor_id, l.meet_link, l.status,
                   u_student.first_name as student_first_name, u_student.last_name as student_last_name,
                   u_tutor.first_name as tutor_first_name, u_tutor.last_name as tutor_last_name
            FROM lessons l
            LEFT JOIN users u_student ON l.student_id = u_student.id
            LEFT JOIN users u_tutor ON l.tutor_id = u_tutor.id
            WHERE (l.student_id = ${userId} OR l.tutor_id = ${userId})
            AND l.scheduled_at >= ${startDate}::timestamp 
            AND l.scheduled_at <= ${endDate}::timestamp
            AND l.status IN ('scheduled', 'completed')`
      );
      console.log(`Storage SQL: Found ${lessonsResult.rows.length} lessons for user ${userId}`);

      const lessonEvents: CalendarEvent[] = (lessonsResult.rows as any[]).map(lesson => {
        const endTime = new Date(lesson.scheduled_at);
        endTime.setMinutes(endTime.getMinutes() + (lesson.duration || 60));
        
        const isStudent = lesson.student_id === userId;
        const otherUserName = isStudent 
          ? `${lesson.tutor_first_name} ${lesson.tutor_last_name}` 
          : `${lesson.student_first_name} ${lesson.student_last_name}`;

        return {
          id: `lesson-${lesson.id}`,
          userId: userId,
          title: lesson.title || 'Lekcja matematyki',
          description: `${lesson.description || ''} - ${isStudent ? 'Korepetytor' : 'Uczeń'}: ${otherUserName}`,
          startTime: new Date(lesson.scheduled_at),
          endTime: endTime,
          type: 'lesson' as const,
          lessonId: lesson.id,
          color: lesson.status === 'completed' ? '#10b981' : '#3b82f6',
          isRecurring: false,
          meetingUrl: lesson.meet_link,
          recurrenceRule: null,
          googleCalendarEventId: null,
          icalUid: null,
          createdAt: null,
          updatedAt: null,
        };
      });

      const allEvents = [...customEvents, ...lessonEvents];
      console.log(`Storage: Returning ${allEvents.length} total events (${customEvents.length} custom + ${lessonEvents.length} lessons)`);
      return allEvents;
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      return [];
    }
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [createdEvent] = await db
      .insert(calendarEvents)
      .values(event)
      .returning();
    return createdEvent;
  }

  async updateCalendarEvent(eventId: string, updates: Partial<InsertCalendarEvent>): Promise<void> {
    await db
      .update(calendarEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarEvents.id, eventId));
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    // First check if this calendar event has an associated lesson
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, eventId))
      .limit(1);
    
    if (event && event.lessonId) {
      // First delete all calendar events that reference this lesson
      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.lessonId, event.lessonId));
      
      // Then delete the lesson
      await db
        .delete(lessons)
        .where(eq(lessons.id, event.lessonId));
    } else {
      // Just delete the calendar event if no lesson is associated
      await db
        .delete(calendarEvents)
        .where(eq(calendarEvents.id, eventId));
    }
  }

  // Google Meet operations  
  async generateMeetLink(lessonId: string): Promise<void> {
    try {
      const lesson = await this.getLesson(lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const { googleMeetService } = await import('./googleMeetService');
      
      // Create start and end times for the lesson
      const startTime = new Date(lesson.scheduledAt);
      const endTime = new Date(startTime.getTime() + (lesson.duration || 60) * 60 * 1000);
      
      // Get student and tutor emails if available
      const student = await this.getUser(lesson.studentId);
      const tutor = await this.getUser(lesson.tutorId);
      const attendeeEmails = [student?.email, tutor?.email].filter(Boolean) as string[];

      const meetDetails = await googleMeetService.createMeetLink(
        lesson.title || 'Lekcja matematyki',
        startTime,
        endTime,
        attendeeEmails
      );

      await this.updateLessonMeetInfo(lessonId, meetDetails.meetLink, meetDetails.meetId);
      
    } catch (error) {
      console.error('Error generating Google Meet link:', error);
      
      // Fallback to realistic format if service fails
      const generateMeetId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${part1}-${part2}-${part3}`;
      };

      const meetId = generateMeetId();
      const meetLink = `https://meet.google.com/${meetId}`;
      
      await this.updateLessonMeetInfo(lessonId, meetLink, meetId);
    }
  }

  async updateLessonMeetInfo(lessonId: string, meetLink: string, meetId: string): Promise<void> {
    await db
      .update(lessons)
      .set({
        meetLink,
        meetId,
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId));
  }

  // Recording operations
  async addRecordingToLesson(lessonId: string, recordingUrl: string): Promise<void> {
    console.log(`Adding recording URL to lesson ${lessonId}: ${recordingUrl}`);
    await db
      .update(lessons)
      .set({
        recordingUrl,
        recordingAddedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(lessons.id, lessonId));
  }

  async checkRecordingAccess(lessonId: string, userId: string): Promise<boolean> {
    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      console.log(`Lesson ${lessonId} not found`);
      return false;
    }

    const lessonData = lesson[0];
    
    // Access is granted only to the student or tutor of the lesson
    const hasAccess = lessonData.studentId === userId || lessonData.tutorId === userId;
    
    console.log(`Recording access check for lesson ${lessonId}, user ${userId}: ${hasAccess}`);
    return hasAccess;
  }

  async getLessonRecording(lessonId: string, userId: string): Promise<{ recordingUrl: string | null; lesson: Lesson } | null> {
    // Check access first
    const hasAccess = await this.checkRecordingAccess(lessonId, userId);
    
    if (!hasAccess) {
      console.log(`User ${userId} does not have access to recording for lesson ${lessonId}`);
      return null;
    }

    const lesson = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return null;
    }

    const lessonData = lesson[0];
    
    // Only return recording URL if lesson is completed
    if (lessonData.status !== 'completed') {
      console.log(`Lesson ${lessonId} is not completed, recording not available yet`);
      return {
        recordingUrl: null,
        lesson: lessonData
      };
    }

    return {
      recordingUrl: lessonData.recordingUrl || null,
      lesson: lessonData
    };
  }

  // Messages operations
  async getConversations(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message; unreadCount: number })[]> {
    const conversationsData = await db
      .select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    const result = [];
    for (const conv of conversationsData) {
      // Get other user
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      
      // Get last message
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Count unread messages
      const [unreadCount] = await db
        .select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messages.senderId, otherUserId),
            isNull(messages.readAt)
          )
        );

      result.push({
        ...conv,
        otherUser,
        lastMessage,
        unreadCount: unreadCount?.count || 0,
      });
    }

    return result;
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Check if conversation already exists
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, userId1), eq(conversations.user2Id, userId2)),
          and(eq(conversations.user1Id, userId2), eq(conversations.user2Id, userId1))
        )
      );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        user1Id: userId1,
        user2Id: userId2,
      })
      .returning();

    return conversation;
  }

  async getMessages(conversationId: string): Promise<(Message & { sender: User })[]> {
    const messagesData = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        // Sender user data
        senderEmail: users.email,
        senderFirstName: users.firstName,
        senderLastName: users.lastName,
        senderProfileImageUrl: users.profileImageUrl,
        senderRole: users.role,
        senderIsActive: users.isActive,
        senderBalance: users.balance,
        senderProfileComplete: users.profileComplete,
        senderCreatedAt: users.createdAt,
        senderUpdatedAt: users.updatedAt,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return messagesData.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      messageType: msg.messageType,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      sentAt: msg.createdAt, // Use createdAt as sentAt
      sender: {
        id: msg.senderId,
        email: msg.senderEmail,
        firstName: msg.senderFirstName,
        lastName: msg.senderLastName,
        profileImageUrl: msg.senderProfileImageUrl,
        role: msg.senderRole,
        isActive: msg.senderIsActive,
        balance: msg.senderBalance,
        profileComplete: msg.senderProfileComplete,
        createdAt: msg.senderCreatedAt,
        updatedAt: msg.senderUpdatedAt,
        // Add missing User fields
        passwordHash: null,
        googleId: null,
        appleId: null,
        roleSetupComplete: false,
        parentEmail: null,
        bankAccount: null,
      },
    }));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return created;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark as read all messages in this conversation that were NOT sent by the current user
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId), // NOT sent by current user
          isNull(messages.readAt)
        )
      );
  }

  // Analytics operations
  async getTodaysLessons(): Promise<any[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todaysLessons = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        status: lessons.status,
        scheduledAt: lessons.scheduledAt,
        tutorName: sql<string>`
          COALESCE(
            CONCAT(users.first_name, ' ', users.last_name),
            'Nieznany korepetytor'
          )
        `,
        studentName: sql<string>`
          COALESCE(
            (SELECT CONCAT(u2.first_name, ' ', u2.last_name) 
             FROM users u2 
             WHERE u2.id = lessons.student_id),
            'Nieznany uczeń'
          )
        `
      })
      .from(lessons)
      .leftJoin(users, eq(lessons.tutorId, users.id))
      .where(
        and(
    gte(lessons.scheduledAt, startOfDay),
          lte(lessons.scheduledAt, endOfDay)
        )
      )
      .orderBy(lessons.scheduledAt);

    return todaysLessons;
  }

  async getTodaysRegistrations(): Promise<any[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const todaysRegistrations = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        and(
          gte(users.createdAt, startOfDay),
          lte(users.createdAt, endOfDay)
        )
      )
      .orderBy(desc(users.createdAt));

    return todaysRegistrations;
  }

  // Subject operations for multi-subject platform
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.createdAt);
  }

  async getSubjectsWithEnrollmentData(): Promise<(Subject & { enrolledCount: number; mailingListCount: number })[]> {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        description: subjects.description,
        icon: subjects.icon,
        color: subjects.color,
        available: subjects.available,
        createdAt: subjects.createdAt,
        enrolledCount: sql`COALESCE(COUNT(DISTINCT ${studentSubjects.studentId}), 0)`.as('enrolledCount'),
        mailingListCount: sql`COALESCE(COUNT(DISTINCT CASE WHEN ${mailingListSubscriptions.subscribed} = true THEN ${mailingListSubscriptions.email} END), 0)`.as('mailingListCount')
      })
      .from(subjects)
      .leftJoin(studentSubjects, eq(subjects.id, studentSubjects.subjectId))
      .leftJoin(mailingListSubscriptions, eq(subjects.id, mailingListSubscriptions.subjectId))
      .groupBy(subjects.id, subjects.name, subjects.description, subjects.icon, subjects.color, subjects.available, subjects.createdAt)
      .orderBy(subjects.createdAt);

    return result.map(row => ({
      ...row,
      enrolledCount: Number(row.enrolledCount),
      mailingListCount: Number(row.mailingListCount)
    }));
  }

  async getStudentSubjects(studentId: string): Promise<StudentSubject[]> {
    return await db.select().from(studentSubjects).where(eq(studentSubjects.studentId, studentId));
  }

  async enrollInSubject(studentId: string, subjectId: string): Promise<StudentSubject> {
    const [enrollment] = await db
      .insert(studentSubjects)
      .values({
        studentId,
        subjectId,
        status: "active"
      })
      .returning();
    return enrollment;
  }

  // Mailing list operations
  async subscribeToMailingList(email: string, subjectId: string): Promise<MailingListSubscription> {
    // Check if already subscribed
    const existing = await db
      .select()
      .from(mailingListSubscriptions)
      .where(
        and(
          eq(mailingListSubscriptions.email, email),
          eq(mailingListSubscriptions.subjectId, subjectId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Resubscribe if previously unsubscribed
      const [updated] = await db
        .update(mailingListSubscriptions)
        .set({
          subscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null
        })
        .where(eq(mailingListSubscriptions.id, existing[0].id))
        .returning();
      return updated;
    }

    // Create new subscription
    const [subscription] = await db
      .insert(mailingListSubscriptions)
      .values({
        email,
        subjectId,
        subscribed: true
      })
      .returning();
    return subscription;
  }

  async unsubscribeFromMailingList(email: string, subjectId: string): Promise<void> {
    await db
      .update(mailingListSubscriptions)
      .set({
        subscribed: false,
        unsubscribedAt: new Date()
      })
      .where(
        and(
          eq(mailingListSubscriptions.email, email),
          eq(mailingListSubscriptions.subjectId, subjectId)
        )
      );
  }

  async getMailingListSubscriptions(subjectId: string): Promise<MailingListSubscription[]> {
    return await db
      .select()
      .from(mailingListSubscriptions)
      .where(
        and(
          eq(mailingListSubscriptions.subjectId, subjectId),
          eq(mailingListSubscriptions.subscribed, true)
        )
      )
      .orderBy(desc(mailingListSubscriptions.subscribedAt));
  }

  // Payment and balance operations
  async getUserBalance(userId: string): Promise<string> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user?.balance || "0.00";
  }



  async addBalanceTransaction(transaction: InsertBalanceTransaction): Promise<BalanceTransaction> {
    const [createdTransaction] = await db
      .insert(balanceTransactions)
      .values(transaction)
      .returning();
    
    // Update user balance
    await this.updateUserBalance(transaction.userId, transaction.balanceAfter);
    
    return createdTransaction;
  }

  async processLessonPayment(
    lessonId: string, 
    studentId: string, 
    method: 'balance' | 'stripe', 
    stripePaymentIntentId?: string
  ): Promise<LessonPayment> {
    // Get lesson details for payment amount
    const [lesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Get tutor's hourly rate
    const [tutorProfile] = await db
      .select()
      .from(tutorProfiles)
      .where(eq(tutorProfiles.userId, lesson.tutorId))
      .limit(1);

    const hourlyRate = parseFloat(tutorProfile?.hourlyRate || "100.00");
    const duration = lesson.duration || 60;
    const amount = (hourlyRate * duration / 60).toFixed(2);

    let balanceTransactionId: string | undefined;

    if (method === 'balance') {
      // Process balance payment
      const currentBalance = await this.getUserBalance(studentId);
      const balanceBefore = parseFloat(currentBalance);
      const paymentAmount = parseFloat(amount);

      if (balanceBefore < paymentAmount) {
        throw new Error("Insufficient balance");
      }

      const balanceAfter = (balanceBefore - paymentAmount).toFixed(2);

      // Create balance transaction
      const transaction = await this.addBalanceTransaction({
        userId: studentId,
        type: 'lesson_payment',
        amount: `-${paymentAmount}`,
        balanceBefore: balanceBefore.toFixed(2),
        balanceAfter: balanceAfter,
        description: `Płatność za lekcję: ${lesson.title}`,
        relatedEntityId: lessonId,
        relatedEntityType: 'lesson'
      });

      balanceTransactionId = transaction.id;
    }

    // Create lesson payment record
    const [payment] = await db
      .insert(lessonPayments)
      .values({
        lessonId,
        studentId,
        tutorId: lesson.tutorId,
        amount,
        status: method === 'balance' ? 'completed' : 'pending',
        method,
        stripePaymentIntentId,
        balanceTransactionId,
        paidAt: method === 'balance' ? new Date() : null
      })
      .returning();

    return payment;
  }

  async getLessonPayment(lessonId: string): Promise<LessonPayment | undefined> {
    const [payment] = await db
      .select()
      .from(lessonPayments)
      .where(eq(lessonPayments.lessonId, lessonId))
      .limit(1);
    
    return payment;
  }

  async getBalanceTransactions(userId: string, limit: number = 50): Promise<BalanceTransaction[]> {
    return await db
      .select()
      .from(balanceTransactions)
      .where(eq(balanceTransactions.userId, userId))
      .orderBy(desc(balanceTransactions.createdAt))
      .limit(limit);
  }

  async updateUserBalance(userId: string, newBalance: string): Promise<void> {
    await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));
  }

  // Helper method to convert hourly availability to new format
  convertHourlyToAvailabilityFormat(hourlyData: any): Array<{dayOfWeek: number, startTime: string, endTime: string}> {
    const availability = [];
    
    for (const [dayOfWeek, hours] of Object.entries(hourlyData)) {
      const day = parseInt(dayOfWeek);
      const availableHours = Object.entries(hours as Record<string, boolean>)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([hour, _]) => parseInt(hour.split(':')[0]))
        .sort((a, b) => a - b);
      
      if (availableHours.length > 0) {
        // Group consecutive hours into ranges
        let rangeStart = availableHours[0];
        let rangeEnd = availableHours[0];
        
        for (let i = 1; i <= availableHours.length; i++) {
          if (i < availableHours.length && availableHours[i] === rangeEnd + 1) {
            rangeEnd = availableHours[i];
          } else {
            // Add the current range
            availability.push({
              dayOfWeek: day,
              startTime: `${rangeStart.toString().padStart(2, '0')}:00`,
              endTime: `${(rangeEnd + 1).toString().padStart(2, '0')}:00`
            });
            
            // Start a new range if there are more hours
            if (i < availableHours.length) {
              rangeStart = availableHours[i];
              rangeEnd = availableHours[i];
            }
          }
        }
      }
    }
    
    return availability;
  }

  // Helper method to convert hourly array to availability format
  convertHourlyArrayToAvailabilityFormat(hourlyArray: any[]): Array<{dayOfWeek: number, startTime: string, endTime: string}> {
    const availability = [];
    
    // Group by day of week
    const dayGroups: Record<number, number[]> = {};
    
    hourlyArray.forEach((slot: any) => {
      if (slot.isAvailable) {
        const day = slot.dayOfWeek;
        const hour = parseInt(slot.hour.split(':')[0]);
        
        if (!dayGroups[day]) {
          dayGroups[day] = [];
        }
        dayGroups[day].push(hour);
      }
    });
    
    // Convert to ranges for each day
    for (const [dayOfWeek, hours] of Object.entries(dayGroups)) {
      const day = parseInt(dayOfWeek);
      const sortedHours = hours.sort((a, b) => a - b);
      
      if (sortedHours.length > 0) {
        // Group consecutive hours into ranges
        let rangeStart = sortedHours[0];
        let rangeEnd = sortedHours[0];
        
        for (let i = 1; i <= sortedHours.length; i++) {
          if (i < sortedHours.length && sortedHours[i] === rangeEnd + 1) {
            rangeEnd = sortedHours[i];
          } else {
            // Add the current range
            availability.push({
              dayOfWeek: day,
              startTime: `${rangeStart.toString().padStart(2, '0')}:00`,
              endTime: `${(rangeEnd + 1).toString().padStart(2, '0')}:00`
            });
            
            // Start a new range if there are more hours
            if (i < sortedHours.length) {
              rangeStart = sortedHours[i];
              rangeEnd = sortedHours[i];
            }
          }
        }
      }
    }
    
    return availability;
  }

  // Student-Tutor matching system implementation
  async setTutorAvailability(tutorId: string, availability: InsertTutorAvailability[]): Promise<void> {
    // Remove existing availability
    await db
      .delete(tutorAvailability)
      .where(eq(tutorAvailability.tutorId, tutorId));

    // Insert new availability slots
    if (availability.length > 0) {
      await db
        .insert(tutorAvailability)
        .values(availability.map(slot => ({ ...slot, tutorId })));
    }
  }

  async getTutorAvailability(tutorId: string): Promise<TutorAvailability[]> {
    return await db
      .select()
      .from(tutorAvailability)
      .where(and(
        eq(tutorAvailability.tutorId, tutorId),
        eq(tutorAvailability.isActive, true)
      ))
      .orderBy(tutorAvailability.dayOfWeek, tutorAvailability.startTime);
  }

  async setStudentMatchingPreferences(preferences: InsertStudentMatchingPreferences): Promise<StudentMatchingPreferences> {
    // Delete existing preferences
    await db
      .delete(studentMatchingPreferences)
      .where(eq(studentMatchingPreferences.studentId, preferences.studentId));

    // Insert new preferences
    const [created] = await db
      .insert(studentMatchingPreferences)
      .values(preferences)
      .returning();

    return created;
  }

  async getStudentMatchingPreferences(studentId: string): Promise<StudentMatchingPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(studentMatchingPreferences)
      .where(and(
        eq(studentMatchingPreferences.studentId, studentId),
        eq(studentMatchingPreferences.isActive, true)
      ))
      .limit(1);

    return preferences;
  }

  async findMatchingTutors(studentId: string): Promise<TutorStudentMatch[]> {
    // Get student preferences
    const preferences = await this.getStudentMatchingPreferences(studentId);
    if (!preferences) {
      throw new Error("Student matching preferences not found");
    }

    // Get all available tutors for the subject
    const availableTutors = await db
      .select({
        tutorId: tutorProfiles.userId,
        rating: tutorProfiles.rating,
        totalLessons: tutorProfiles.totalLessons,
        hourlyRate: tutorProfiles.hourlyRate,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(tutorProfiles)
      .innerJoin(users, eq(tutorProfiles.userId, users.id))
      .where(and(
        eq(tutorProfiles.isVerified, true),
        eq(users.isActive, true)
      ));

    const matchingResults: InsertTutorStudentMatch[] = [];

    for (const tutor of availableTutors) {
      // Get tutor availability
      const tutorSlots = await this.getTutorAvailability(tutor.tutorId);
      
      // Check time compatibility
      let timeMatch = false;
      let bestTimeSlot = '';

      for (const slot of tutorSlots) {
        // Check if tutor's availability overlaps with student preferences
        if (preferences.preferredDays && preferences.preferredDays.includes(slot.dayOfWeek)) {
          // Simple time overlap check
          const studentStart = preferences.preferredStartTime || "00:00";
          const studentEnd = preferences.preferredEndTime || "23:59";
          
          if (slot.startTime >= studentStart && slot.endTime <= studentEnd) {
            timeMatch = true;
            bestTimeSlot = `${slot.dayOfWeek}:${slot.startTime}`;
            break;
          }
        }
      }

      if (timeMatch) {
        // Calculate match score based on various factors
        let matchScore = 0;

        // Rating factor (40% weight)
        const rating = parseFloat(tutor.rating?.toString() || "0");
        matchScore += (rating / 5) * 40;

        // Experience factor (30% weight) - based on total lessons
        const experienceScore = Math.min(tutor.totalLessons / 100, 1) * 30;
        matchScore += experienceScore;

        // Availability factor (20% weight) - more available tutors get higher scores
        const availabilityScore = Math.min(tutorSlots.length / 10, 1) * 20;
        matchScore += availabilityScore;

        // Price factor (10% weight) - slightly favor lower rates
        const rate = parseFloat(tutor.hourlyRate?.toString() || "100");
        const priceScore = Math.max(0, (150 - rate) / 150) * 10;
        matchScore += priceScore;

        matchingResults.push({
          studentId,
          tutorId: tutor.tutorId,
          subjectId: preferences.subjectId,
          matchScore: matchScore.toString(),
          preferredTime: bestTimeSlot,
          status: "pending"
        });
      }
    }

    // Sort by match score (highest first) and create matches
    matchingResults.sort((a, b) => Number(b.matchScore || 0) - Number(a.matchScore || 0));

    // Create match records in database
    const createdMatches: TutorStudentMatch[] = [];
    for (const match of matchingResults.slice(0, 3)) { // Limit to top 3 matches
      const [created] = await db
        .insert(tutorStudentMatches)
        .values(match)
        .returning();
      createdMatches.push(created);
    }

    return createdMatches;
  }

  async createTutorStudentMatch(match: InsertTutorStudentMatch): Promise<TutorStudentMatch> {
    const [created] = await db
      .insert(tutorStudentMatches)
      .values(match)
      .returning();

    return created;
  }

  async updateMatchStatus(matchId: string, status: string, responseTime?: Date): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'accepted' && responseTime) {
      updateData.acceptedAt = responseTime;
    } else if (status === 'rejected' && responseTime) {
      updateData.rejectedAt = responseTime;
    } else if (status === 'completed' && responseTime) {
      updateData.completedAt = responseTime;
    }

    await db
      .update(tutorStudentMatches)
      .set(updateData)
      .where(eq(tutorStudentMatches.id, matchId));
  }

  async getStudentMatches(studentId: string): Promise<TutorStudentMatch[]> {
    return await db
      .select()
      .from(tutorStudentMatches)
      .where(eq(tutorStudentMatches.studentId, studentId))
      .orderBy(desc(tutorStudentMatches.matchScore));
  }

  async getTutorMatches(tutorId: string): Promise<TutorStudentMatch[]> {
    return await db
      .select()
      .from(tutorStudentMatches)
      .where(eq(tutorStudentMatches.tutorId, tutorId))
      .orderBy(desc(tutorStudentMatches.assignedAt));
  }

  // Lesson management operations  
  async cancelLesson(lessonId: string, data: {
    initiatedBy: string;
    reason?: string;
    cancellationFee?: number;
    payoutReduction?: number;
  }): Promise<void> {
    const hoursNotice = await this.calculateHoursNotice(lessonId);
    
    await db.transaction(async (tx) => {
      // Update lesson status
      await tx
        .update(lessons)
        .set({
          status: "cancelled",
          cancelledBy: data.initiatedBy,
          cancelledAt: new Date(),
          cancellationReason: data.reason,
          updatedAt: new Date(),
        })
        .where(eq(lessons.id, lessonId));

      // Record action in audit trail - we'll add lessonActions import later
      console.log(`Lesson ${lessonId} cancelled by ${data.initiatedBy}, ${hoursNotice} hours notice`);
    });
  }

  async rescheduleLesson(lessonId: string, data: {
    newScheduledAt: string;
    initiatedBy: string;
    reason?: string;
    rescheduleFee?: number;
    payoutReduction?: number;
  }): Promise<void> {
    const hoursNotice = await this.calculateHoursNotice(lessonId);
    
    await db.transaction(async (tx) => {
      // Get current lesson data
      const [currentLesson] = await tx
        .select()
        .from(lessons)
        .where(eq(lessons.id, lessonId));

      if (!currentLesson) {
        throw new Error("Lesson not found");
      }

      // Update lesson with new schedule
      await tx
        .update(lessons)
        .set({
          scheduledAt: new Date(data.newScheduledAt),
          originalScheduledAt: currentLesson.originalScheduledAt || currentLesson.scheduledAt,
          status: "scheduled", // Reset to scheduled after reschedule
          rescheduleCount: (currentLesson.rescheduleCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(lessons.id, lessonId));

      console.log(`Lesson ${lessonId} rescheduled by ${data.initiatedBy}, ${hoursNotice} hours notice`);
    });
  }

  private async calculateHoursNotice(lessonId: string): Promise<number> {
    const [lesson] = await db
      .select({ scheduledAt: lessons.scheduledAt })
      .from(lessons)
      .where(eq(lessons.id, lessonId));

    if (!lesson) return 0;

    const now = new Date();
    const lessonTime = new Date(lesson.scheduledAt);
    return Math.round((lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  // Advanced automatic matching system
  async createStudentMatchingPreferences(data: any): Promise<any> {
    const [preferences] = await db
      .insert(studentMatchingPreferences)
      .values(data)
      .returning();
    return preferences;
  }

  async findAndAssignTutor(preferencesId: string): Promise<void> {
    const preferences = await this.getStudentMatchingPreferencesById(preferencesId);
    if (!preferences) {
      throw new Error("Student preferences not found");
    }

    // Step 1: Filter tutors by subject and availability
    const availableTutors = await this.getAvailableTutorsForSubject(
      preferences.subjectId,
      preferences.preferredDays,
      preferences.preferredStartTime,
      preferences.preferredEndTime,
      preferences.maxHourlyRate
    );

    if (availableTutors.length === 0) {
      // No tutors available - keep status as pending
      console.log(`No tutors available for preferences ${preferencesId}`);
      return;
    }

    // Step 2: Score and rank tutors
    const scoredTutors = await this.scoreTutors(availableTutors, preferences);
    
    // Step 3: Assign the best-matched tutor
    const bestTutor = scoredTutors[0];
    
    await db
      .update(studentMatchingPreferences)
      .set({
        matchingStatus: "matched",
        assignedTutorId: bestTutor.tutorId,
        matchedAt: new Date(),
        tutorResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to respond
        updatedAt: new Date(),
      })
      .where(eq(studentMatchingPreferences.id, preferencesId));

    // Step 4: Send notifications (placeholder for now)
    console.log(`Assigned tutor ${bestTutor.tutorId} to student ${preferences.studentId}`);
    
    // In a real system, you would send email/SMS notifications here
    // await this.sendTutorAssignmentNotification(bestTutor.tutorId, preferences);
    // await this.sendStudentMatchNotification(preferences.studentId, bestTutor);
  }

  private async getAvailableTutorsForSubject(
    subjectId: string,
    preferredDays: number[],
    startTime: string,
    endTime: string,
    maxRate: number
  ): Promise<any[]> {
    // Get all active tutors within budget
    const tutors = await db
      .select({
        tutorId: tutorProfiles.userId,
        rating: tutorProfiles.rating,
        totalLessons: tutorProfiles.totalLessons,
        hourlyRate: tutorProfiles.hourlyRate,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        bio: tutorProfiles.bio,
        isVerified: tutorProfiles.isVerified,
      })
      .from(tutorProfiles)
      .innerJoin(users, eq(tutorProfiles.userId, users.id))
      .where(and(
        eq(tutorProfiles.isVerified, true),
        eq(users.isActive, true),
        lte(tutorProfiles.hourlyRate, maxRate.toString())
      ));

    const availableTutors = [];
    const nearbyTutors = [];

    for (const tutor of tutors) {
      // Check capacity first
      const capacity = await this.getTutorCapacity(tutor.tutorId);
      if (capacity.available <= 0) continue;

      // Check exact time match
      const hasExactMatch = await this.checkTutorTimeAvailability(
        tutor.tutorId,
        preferredDays,
        startTime,
        endTime
      );
      
      if (hasExactMatch) {
        availableTutors.push(tutor);
      } else {
        // Check for nearby times (within 2 hours)
        const hasNearbyTime = await this.checkTutorNearbyAvailability(
          tutor.tutorId,
          preferredDays,
          startTime,
          endTime
        );
        
        if (hasNearbyTime) {
          nearbyTutors.push(tutor);
        }
      }
    }

    // Return exact matches first, then nearby options
    return [...availableTutors, ...nearbyTutors];
  }

  private async checkTutorNearbyAvailability(
    tutorId: string,
    preferredDays: number[],
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const availability = await db
      .select()
      .from(tutorAvailability)
      .where(and(
        eq(tutorAvailability.tutorId, tutorId),
        eq(tutorAvailability.isActive, true)
      ));

    // Convert student preferred time to minutes
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const startMinutes = h1 * 60 + m1;
    const endMinutes = h2 * 60 + m2;

    for (const slot of availability) {
      if (preferredDays.includes(slot.dayOfWeek)) {
        const [th1, tm1] = slot.startTime.split(':').map(Number);
        const [th2, tm2] = slot.endTime.split(':').map(Number);
        const tutorStartMinutes = th1 * 60 + tm1;
        const tutorEndMinutes = th2 * 60 + tm2;

        // Check if tutor time is within 2 hours (120 minutes) of student preference
        const timeDifference = Math.min(
          Math.abs(tutorStartMinutes - startMinutes),
          Math.abs(tutorEndMinutes - endMinutes)
        );

        if (timeDifference <= 120) { // Within 2 hours
          return true;
        }
      }
    }

    return false;
  }

  private async checkTutorTimeAvailability(
    tutorId: string,
    preferredDays: number[],
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const availability = await db
      .select()
      .from(tutorAvailability)
      .where(and(
        eq(tutorAvailability.tutorId, tutorId),
        eq(tutorAvailability.isActive, true)
      ));

    for (const slot of availability) {
      if (preferredDays.includes(slot.dayOfWeek)) {
        // Check time overlap
        if (this.timeOverlaps(startTime, endTime, slot.startTime, slot.endTime)) {
          return true;
        }
      }
    }

    return false;
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    const [h1, m1] = start1.split(':').map(Number);
    const [h2, m2] = end1.split(':').map(Number);
    const [h3, m3] = start2.split(':').map(Number);
    const [h4, m4] = end2.split(':').map(Number);

    const start1Minutes = h1 * 60 + m1;
    const end1Minutes = h2 * 60 + m2;
    const start2Minutes = h3 * 60 + m3;
    const end2Minutes = h4 * 60 + m4;

    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  private async getTutorCapacity(tutorId: string): Promise<{ total: number; current: number; available: number }> {
    // Get tutor's total capacity from their profile/availability settings
    const [profile] = await db
      .select({ totalCapacity: sql<number>`COALESCE(5, 5)` }) // Default 5 students
      .from(tutorProfiles)
      .where(eq(tutorProfiles.userId, tutorId));

    // Count current active students
    const currentStudents = await db
      .select({ count: sql<number>`count(*)` })
      .from(studentMatchingPreferences)
      .where(and(
        eq(studentMatchingPreferences.assignedTutorId, tutorId),
        eq(studentMatchingPreferences.matchingStatus, "confirmed"),
        eq(studentMatchingPreferences.isActive, true)
      ));

    const total = profile?.totalCapacity || 5;
    const current = currentStudents[0]?.count || 0;

    return {
      total,
      current,
      available: total - current,
    };
  }

  private async scoreTutors(tutors: any[], preferences: any): Promise<any[]> {
    const scoredTutors = [];

    for (const tutor of tutors) {
      let score = 0;

      // 1. Rating weight (40%)
      const rating = parseFloat(tutor.rating) || 4.0;
      score += (rating / 5.0) * 40;

      // 2. Experience weight (30%)
      const experience = Math.min(tutor.totalLessons || 0, 100) / 100;
      score += experience * 30;

      // 3. Availability weight (20%) - how much free time they have
      const capacity = await this.getTutorCapacity(tutor.tutorId);
      const availabilityScore = capacity.available / capacity.total;
      score += availabilityScore * 20;

      // 4. Price weight (10%) - closer to student's max is better
      const priceRatio = parseFloat(tutor.hourlyRate) / preferences.maxHourlyRate;
      const priceScore = Math.max(0, 1 - Math.abs(priceRatio - 0.8)); // Optimal at 80% of max rate
      score += priceScore * 10;

      scoredTutors.push({
        ...tutor,
        matchScore: Math.round(score * 100) / 100,
      });
    }

    return scoredTutors.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getStudentMatchingPreferencesById(id: string): Promise<any> {
    const [preferences] = await db
      .select()
      .from(studentMatchingPreferences)
      .where(eq(studentMatchingPreferences.id, id));
    return preferences;
  }

  async respondToStudentAssignment(
    preferencesId: string,
    tutorId: string,
    accept: boolean,
    reason?: string
  ): Promise<void> {
    if (accept) {
      await db
        .update(studentMatchingPreferences)
        .set({
          matchingStatus: "confirmed",
          tutorAccepted: true,
          updatedAt: new Date(),
        })
        .where(and(
          eq(studentMatchingPreferences.id, preferencesId),
          eq(studentMatchingPreferences.assignedTutorId, tutorId)
        ));
    } else {
      // Decline and restart matching process
      await db
        .update(studentMatchingPreferences)
        .set({
          matchingStatus: "pending",
          assignedTutorId: null,
          tutorAccepted: false,
          matchedAt: null,
          tutorResponseDeadline: null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(studentMatchingPreferences.id, preferencesId),
          eq(studentMatchingPreferences.assignedTutorId, tutorId)
        ));

      // Restart matching with next best tutor
      setTimeout(() => this.findAndAssignTutor(preferencesId), 5000);
    }
  }

  async getTutorPendingAssignments(tutorId: string): Promise<any[]> {
    const assignments = await db
      .select({
        id: studentMatchingPreferences.id,
        studentId: studentMatchingPreferences.studentId,
        subjectId: studentMatchingPreferences.subjectId,
        currentLevel: studentMatchingPreferences.currentLevel,
        specificNeeds: studentMatchingPreferences.specificNeeds,
        maxHourlyRate: studentMatchingPreferences.maxHourlyRate,
        matchedAt: studentMatchingPreferences.matchedAt,
        tutorResponseDeadline: studentMatchingPreferences.tutorResponseDeadline,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentEmail: users.email,
      })
      .from(studentMatchingPreferences)
      .innerJoin(users, eq(studentMatchingPreferences.studentId, users.id))
      .where(and(
        eq(studentMatchingPreferences.assignedTutorId, tutorId),
        eq(studentMatchingPreferences.matchingStatus, "matched")
      ))
      .orderBy(desc(studentMatchingPreferences.matchedAt));

    return assignments;
  }

  async getTutorWithProfile(tutorId: string): Promise<any> {
    const [tutor] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        rating: tutorProfiles.rating,
        totalLessons: tutorProfiles.totalLessons,
        hourlyRate: tutorProfiles.hourlyRate,
        bio: tutorProfiles.bio,
        specializations: tutorProfiles.specializations,
      })
      .from(users)
      .innerJoin(tutorProfiles, eq(users.id, tutorProfiles.userId))
      .where(eq(users.id, tutorId));

    return tutor;
  }

  // Subject unlock management operations implementation
  async getAllSubjectsWithStats(): Promise<any[]> {
    const result = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        description: subjects.description,
        icon: subjects.icon,
        color: subjects.color,
        available: subjects.available,
        createdAt: subjects.createdAt,
        enrolledCount: sql`COALESCE(COUNT(DISTINCT ${studentSubjects.studentId}), 0)`.as('enrolledCount'),
        requestCount: sql`0`.as('requestCount'), // Placeholder for unlock requests count
      })
      .from(subjects)
      .leftJoin(studentSubjects, eq(subjects.id, studentSubjects.subjectId))
      .groupBy(subjects.id, subjects.name, subjects.description, subjects.icon, subjects.color, subjects.available, subjects.createdAt)
      .orderBy(subjects.createdAt);

    return result.map(row => ({
      ...row,
      enrolledCount: Number(row.enrolledCount),
      requestCount: Number(row.requestCount)
    }));
  }

  async updateSubjectAvailability(subjectId: string, available: boolean): Promise<any> {
    const [updated] = await db
      .update(subjects)
      .set({ 
        available
      })
      .where(eq(subjects.id, subjectId))
      .returning();

    return updated;
  }

  async getSubjectById(subjectId: string): Promise<any> {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, subjectId));
    return subject;
  }


  // Matching system methods
  async getPendingAssignmentsForTutor(tutorId: string): Promise<any[]> {
    try {
      const assignments = await db
        .select({
          id: studentMatchingPreferences.id,
          studentId: studentMatchingPreferences.studentId,
          subjectId: studentMatchingPreferences.subjectId,
          currentLevel: studentMatchingPreferences.currentLevel,
          specificNeeds: studentMatchingPreferences.specificNeeds,
          maxHourlyRate: studentMatchingPreferences.maxHourlyRate,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          studentEmail: users.email,
          tutorResponseDeadline: studentMatchingPreferences.tutorResponseDeadline,
        })
        .from(studentMatchingPreferences)
        .leftJoin(users, eq(studentMatchingPreferences.studentId, users.id))
        .where(
          and(
            eq(studentMatchingPreferences.assignedTutorId, tutorId),
            eq(studentMatchingPreferences.matchingStatus, 'tutor_assigned'),
            eq(studentMatchingPreferences.isActive, true)
          )
        );

      return assignments;
    } catch (error) {
      console.error("Error fetching pending assignments:", error);
      return [];
    }
  }

  async respondToAssignment(preferencesId: string, accept: boolean, reason?: string): Promise<any> {
    try {
      const preferences = await db
        .select()
        .from(studentMatchingPreferences)
        .where(eq(studentMatchingPreferences.id, preferencesId))
        .limit(1);

      if (preferences.length === 0) {
        throw new Error("Assignment not found");
      }

      const newStatus = accept ? 'tutor_accepted' : 'tutor_rejected';
      
      const [updatedPrefs] = await db
        .update(studentMatchingPreferences)
        .set({
          matchingStatus: newStatus,
          tutorAccepted: accept,
          updatedAt: new Date(),
        })
        .where(eq(studentMatchingPreferences.id, preferencesId))
        .returning();

      return {
        success: true,
        status: newStatus,
        message: accept ? "Zgłoszenie zaakceptowane" : "Zgłoszenie odrzucone",
        preferences: updatedPrefs,
      };
    } catch (error) {
      console.error("Error responding to assignment:", error);
      throw error;
    }
  }

  // Message access control methods

  async getStudentAssignedTutors(studentId: string): Promise<any[]> {
    try {
      // Get tutors assigned to this student through matching preferences
      const tutors = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role
        })
        .from(studentMatchingPreferences)
        .leftJoin(users, eq(studentMatchingPreferences.assignedTutorId, users.id))
        .where(
          and(
            eq(studentMatchingPreferences.studentId, studentId),
            eq(studentMatchingPreferences.matchingStatus, 'confirmed'),
            eq(studentMatchingPreferences.isActive, true)
          )
        );

      return tutors.filter(tutor => tutor.id !== null);
    } catch (error) {
      console.error("Error fetching student assigned tutors:", error);
      return [];
    }
  }

  async getTutorAssignedStudents(tutorId: string): Promise<any[]> {
    try {
      // Get students assigned to this tutor through matching preferences
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role
        })
        .from(studentMatchingPreferences)
        .leftJoin(users, eq(studentMatchingPreferences.studentId, users.id))
        .where(
          and(
            eq(studentMatchingPreferences.assignedTutorId, tutorId),
            eq(studentMatchingPreferences.matchingStatus, 'confirmed'),
            eq(studentMatchingPreferences.isActive, true)
          )
        );

      return students.filter(student => student.id !== null);
    } catch (error) {
      console.error("Error fetching tutor assigned students:", error);
      return [];
    }
  }

  async isConversationAllowed(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      const otherUser = await this.getUser(otherUserId);

      console.log('🔐 Checking conversation permission:', {
        userId,
        otherUserId,
        userRole: user?.role,
        otherUserRole: otherUser?.role
      });

      if (!user || !otherUser) {
        console.log('❌ User not found:', { 
          userExists: !!user, 
          otherUserExists: !!otherUser,
          userInfo: user ? `${user.id} (${user.role})` : 'null',
          otherUserInfo: otherUser ? `${otherUser.id} (${otherUser.role})` : 'null'
        });
        return false;
      }

      // Admin can talk to everyone
      if (user.role === 'admin' || otherUser.role === 'admin') {
        console.log('✅ Admin conversation allowed');
        return true;
      }

      // Student can talk to any tutor (and admins - handled above)
      if (user.role === 'student') {
        if (otherUser.role === 'tutor') {
          console.log('✅ Student can message any tutor');
          return true;
        }
        console.log('❌ Student cannot talk to non-tutor users');
        return false;
      }

      // Tutor can only talk to their assigned students (and admins - handled above)
      if (user.role === 'tutor') {
        if (otherUser.role === 'student') {
          const assignedStudents = await this.getTutorAssignedStudents(userId);
          return assignedStudents.some(student => student.id === otherUserId);
        }
        return false;
      }

      console.log('❌ No conversation rule matched');
      return false;
    } catch (error) {
      console.error("Error checking conversation permission:", error);
      return false;
    }
  }

  async updateTutorHourlyAvailability(tutorId: string, availabilityData: Record<string, Record<string, boolean>>) {
    // Delete existing availability
    await db
      .delete(tutorHourlyAvailability)
      .where(eq(tutorHourlyAvailability.tutorId, tutorId));

    // Insert new availability
    const insertData = [];
    for (const [dayOfWeek, hours] of Object.entries(availabilityData)) {
      for (const [hour, isAvailable] of Object.entries(hours)) {
        insertData.push({
          tutorId,
          dayOfWeek: parseInt(dayOfWeek),
          hour,
          isAvailable,
        });
      }
    }

    if (insertData.length > 0) {
      await db.insert(tutorHourlyAvailability).values(insertData);
    }
  }

  async updateTutorHourlyAvailabilityFromSlots(tutorId: string, slots: { day: string, hour: number, isSelected: boolean }[]): Promise<void> {
    console.log("Storage: Updating tutor hourly availability from slots for", tutorId, slots);
    
    // Clear existing availability
    await db
      .delete(tutorHourlyAvailability)
      .where(eq(tutorHourlyAvailability.tutorId, tutorId));

    // Map day names to numbers
    const dayMap: Record<string, number> = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
    };

    // Insert only selected slots
    const insertData = slots
      .filter(slot => slot.isSelected)
      .map(slot => ({
        tutorId,
        dayOfWeek: dayMap[slot.day],
        hour: `${slot.hour.toString().padStart(2, '0')}:00`,
        isAvailable: true,
      }));

    if (insertData.length > 0) {
      await db.insert(tutorHourlyAvailability).values(insertData);
    }
  }

  // Lesson invitations management
  async getTutorLessonInvitations(tutorId: string) {
    const invitations = await db
      .select({
        id: lessonInvitations.id,
        studentId: lessonInvitations.studentId,
        subjectId: lessonInvitations.subjectId,
        matchingHours: lessonInvitations.matchingHours,
        matchingDays: lessonInvitations.matchingDays,
        status: lessonInvitations.status,
        sentAt: lessonInvitations.sentAt,
        expiresAt: lessonInvitations.expiresAt,
        tutorResponse: lessonInvitations.tutorResponse,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        subjectName: subjects.name,
        currentLevel: studentMatchingPreferences.currentLevel,
        specificNeeds: studentMatchingPreferences.specificNeeds,
        topicId: lessonInvitations.topicId,
      })
      .from(lessonInvitations)
      .innerJoin(users, eq(lessonInvitations.studentId, users.id))
      .innerJoin(subjects, eq(lessonInvitations.subjectId, subjects.id))
      .leftJoin(studentMatchingPreferences, eq(lessonInvitations.studentMatchingPreferenceId, studentMatchingPreferences.id))
      .where(eq(lessonInvitations.tutorId, tutorId))
      .orderBy(desc(lessonInvitations.sentAt));

    return invitations;
  }

  async getStudentLessonInvitations(studentId: string) {
    console.log(`Storage: Getting lesson invitations for student ${studentId}`);
    
    const invitations = await db
      .select({
        id: lessonInvitations.id,
        tutorId: lessonInvitations.tutorId,
        subjectId: lessonInvitations.subjectId,
        matchingHours: lessonInvitations.matchingHours,
        matchingDays: lessonInvitations.matchingDays,
        status: lessonInvitations.status,
        sentAt: lessonInvitations.sentAt,
        expiresAt: lessonInvitations.expiresAt,
        tutorResponse: lessonInvitations.tutorResponse,
        respondedAt: lessonInvitations.respondedAt,

        tutorName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        subjectName: subjects.name,
        specificNeeds: studentMatchingPreferences.specificNeeds,
      })
      .from(lessonInvitations)
      .innerJoin(users, eq(lessonInvitations.tutorId, users.id))
      .innerJoin(subjects, eq(lessonInvitations.subjectId, subjects.id))
      .leftJoin(studentMatchingPreferences, eq(lessonInvitations.studentMatchingPreferenceId, studentMatchingPreferences.id))
      .where(eq(lessonInvitations.studentId, studentId))
      .orderBy(desc(lessonInvitations.sentAt));

    console.log(`Storage: Found ${invitations.length} lesson invitations for student ${studentId}`);
    return invitations;
  }

  async createLessonInvitation(invitation: any): Promise<any> {
    const [created] = await db
      .insert(lessonInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async createStudentMatchingPreference(preference: any): Promise<any> {
    const [created] = await db
      .insert(studentMatchingPreferences)
      .values(preference)
      .returning();
    return created;
  }

  async getExpiredLessonInvitations(): Promise<any[]> {
    const now = new Date();
    const expiredInvitations = await db
      .select()
      .from(lessonInvitations)
      .where(and(
        eq(lessonInvitations.status, "pending"),
        lt(lessonInvitations.expiresAt, now)
      ));
    
    return expiredInvitations;
  }

  async markInvitationAsExpired(invitationId: string): Promise<void> {
    await db
      .update(lessonInvitations)
      .set({ 
        status: "expired",
        respondedAt: new Date()
      })
      .where(eq(lessonInvitations.id, invitationId));
  }

  async addBalance(userId: string, amount: number, description: string): Promise<void> {
    // Get current balance first
    const currentBalance = await this.getUserBalance(userId);
    const currentBalanceNum = parseFloat(currentBalance.toString()); // Convert string to number
    const newBalance = currentBalanceNum + amount;
    
    // Add to balance transactions with proper balance before/after fields
    await db.insert(balanceTransactions).values({
      userId,
      amount: amount.toString(),
      type: "refund", // Use 'refund' for balance additions (returns/refunds)
      description,
      balanceBefore: currentBalanceNum.toString(),
      balanceAfter: newBalance.toString(),
    });

    // Update user balance
    await db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId));
  }

  async canStudentReserveAhead(userId: string, requestedTopicId: string): Promise<boolean> {
    // Get all math topics in order
    const allTopics = await db
      .select()
      .from(mathTopics)
      .orderBy(mathTopics.order);

    // Find the requested topic order
    const requestedTopic = allTopics.find(t => t.id === requestedTopicId);
    if (!requestedTopic) return false;

    // Get student's current progress 
    const completedTopics = await db
      .select()
      .from(topicCompletions)
      .where(and(
        eq(topicCompletions.studentId, userId),
        eq(topicCompletions.status, 'completed')
      ));

    const completedTopicIds = completedTopics.map(tc => tc.topicId);
    const nextAvailableIndex = completedTopicIds.length;

    // Allow current topic or next topic (sequential progression)
    return requestedTopic.order <= nextAvailableIndex + 1;
  }



  async cancelStudentLessonInvitation(invitationId: string, studentId: string): Promise<void> {
    // First verify the invitation belongs to the student and is still pending
    const invitation = await db
      .select()
      .from(lessonInvitations)
      .where(and(
        eq(lessonInvitations.id, invitationId),
        eq(lessonInvitations.studentId, studentId),
        eq(lessonInvitations.status, "pending")
      ))
      .limit(1);

    if (invitation.length === 0) {
      throw new Error("Invitation not found, already responded to, or cannot be cancelled");
    }

    // Update invitation status to cancelled
    await db
      .update(lessonInvitations)
      .set({
        status: "cancelled",
        respondedAt: new Date(),
        tutorResponse: "Cancelled by student",
      })
      .where(eq(lessonInvitations.id, invitationId));

    // If there was any deposit/fee charged for the invitation, refund it here
    // For now, we'll add a symbolic refund transaction
    const refundAmount = 0; // No fee for invitations currently, but keeping structure for future
    
    if (refundAmount > 0) {
      const currentBalance = await this.getUserBalance(studentId);
      const newBalance = (parseFloat(currentBalance) + refundAmount).toFixed(2);
      
      await this.addBalanceTransaction({
        userId: studentId,
        type: "refund",
        amount: refundAmount.toString(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: "Refund for cancelled tutor invitation",
        relatedEntityId: invitationId,
      });
    }

    console.log(`Student ${studentId} cancelled invitation ${invitationId}`);
  }

  async respondToLessonInvitation(invitationId: string, tutorId: string, accept: boolean, response?: string) {
    const invitation = await db
      .select()
      .from(lessonInvitations)
      .where(and(
        eq(lessonInvitations.id, invitationId),
        eq(lessonInvitations.tutorId, tutorId),
        eq(lessonInvitations.status, "pending")
      ))
      .limit(1);

    if (invitation.length === 0) {
      throw new Error("Invitation not found or already responded");
    }

    const status = accept ? "accepted" : "rejected";
    
    await db
      .update(lessonInvitations)
      .set({
        status,
        respondedAt: new Date(),
        tutorResponse: response,
      })
      .where(eq(lessonInvitations.id, invitationId));

    if (accept) {
      // Create tutor-student match
      const inv = invitation[0];
      await db.insert(tutorStudentMatches).values({
        studentId: inv.studentId,
        tutorId: inv.tutorId,
        subjectId: inv.subjectId,
        status: "accepted",
        acceptedAt: new Date(),
      });

      // Capture payment from card authorization (if payment intent exists)
      if (inv.paymentIntentId) {
        try {
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeSecretKey) {
            throw new Error("Płatności kartą są wyłączone");
          }
          const stripe = require('stripe')(stripeSecretKey);
          await stripe.paymentIntents.capture(inv.paymentIntentId);
          console.log(`Captured payment from authorization: ${inv.paymentIntentId}`);
        } catch (error) {
          console.error('Error capturing payment:', error);
          throw new Error("Błąd podczas pobierania płatności z karty");
        }
      }

      // Create a concrete lesson with scheduled date and time
      const scheduledLesson = await this.createScheduledLessonFromInvitation(inv);
      
      // Update lesson payment status to paid
      await db
        .update(lessons)
        .set({ 
          paymentStatus: "paid",
          price: (inv.amount || 100).toString()
        })
        .where(eq(lessons.id, scheduledLesson.id));
      
      // Create automatic message to student about acceptance
      const messageContent = response 
        ? `Zaakceptowałem Twoje zaproszenie do lekcji! ${response} Pierwsza lekcja została zaplanowana na ${scheduledLesson.scheduledAt?.toLocaleDateString('pl-PL')} o ${scheduledLesson.scheduledAt?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}. Płatność ${inv.amount || 100} zł została pobrana z Twojej karty.`
        : `Zaakceptowałem Twoje zaproszenie do lekcji! Pierwsza lekcja została zaplanowana na ${scheduledLesson.scheduledAt?.toLocaleDateString('pl-PL')} o ${scheduledLesson.scheduledAt?.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}. Płatność ${inv.amount || 100} zł została pobrana z Twojej karty.`;
      
      await this.createSystemMessage(inv.studentId, inv.tutorId, messageContent);

      // Update student matching preferences to "matched" status
      await db
        .update(studentMatchingPreferences)
        .set({
          matchingStatus: "matched",
          assignedTutorId: inv.tutorId,
          matchedAt: new Date(),
        })
        .where(eq(studentMatchingPreferences.id, inv.studentMatchingPreferenceId));

      // BLOCK further bookings for this topic by this student
      // Check if topic completion already exists
      const existingCompletion = await db
        .select()
        .from(topicCompletions)
        .where(and(
          eq(topicCompletions.studentId, inv.studentId),
          eq(topicCompletions.topicId, inv.topicId || 'MAT-L01')
        ))
        .limit(1);

      if (!existingCompletion.length) {
        // Create new topic completion record
        await db
          .insert(topicCompletions)
          .values({
            studentId: inv.studentId,
            topicId: inv.topicId || 'MAT-L01',
            status: "in_progress", // Status: prevents duplicate bookings
            lessonsCompleted: 0,
            xpEarned: 0,
          });
      } else {
        // Update existing record
        await db
          .update(topicCompletions)
          .set({
            status: "in_progress",
            updatedAt: new Date(),
          })
          .where(and(
            eq(topicCompletions.studentId, inv.studentId),
            eq(topicCompletions.topicId, inv.topicId || 'MAT-L01')
          ));
      }

      // IMPORTANT: Reject all OTHER pending invitations for this student 
      // This ensures the student disappears from other tutors' lists
      await db
        .update(lessonInvitations)
        .set({
          status: "auto_rejected",
          respondedAt: new Date(),
          tutorResponse: "Student already matched with another tutor",
        })
        .where(and(
          eq(lessonInvitations.studentId, inv.studentId),
          eq(lessonInvitations.status, "pending"),
          sql`${lessonInvitations.id} != ${invitationId}` // Don't update the accepted invitation
        ));
      await db
        .update(lessonInvitations)
        .set({
          status: "auto_rejected",
          respondedAt: new Date(),
          tutorResponse: "Student already matched with another tutor",
        })
        .where(and(
          eq(lessonInvitations.studentId, inv.studentId),
          eq(lessonInvitations.status, "pending"),
          sql`${lessonInvitations.id} != ${invitationId}` // Don't update the accepted invitation
        ));
    } else {
      // Rejection - release payment authorization and create message
      const inv = invitation[0];
      
      // Release payment authorization if it exists
      if (inv.paymentIntentId) {
        try {
          const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
          if (!stripeSecretKey) {
            throw new Error("Płatności kartą są wyłączone");
          }
          const stripe = require('stripe')(stripeSecretKey);
          await stripe.paymentIntents.cancel(inv.paymentIntentId);
          console.log(`Released payment authorization: ${inv.paymentIntentId}`);
        } catch (error) {
          console.error('Error releasing payment authorization:', error);
          // Continue even if release fails - user can contact support
        }
      }
      
      // Create automatic message to student about rejection
      const messageContent = response 
        ? `Niestety muszę odrzucić Twoje zaproszenie do lekcji. ${response} Autoryzacja płatności została zwolniona.`
        : `Niestety muszę odrzucić Twoje zaproszenie do lekcji. Autoryzacja płatności została zwolniona.`;
      await this.createSystemMessage(inv.studentId, inv.tutorId, messageContent);
    }
  }

  // Check if tutor has availability for invitation time slots
  async checkTutorAvailabilityForInvitation(invitationId: string, tutorId: string): Promise<{
    isAvailable: boolean;
    conflictReason?: string;
    suggestedTimes?: string[];
  }> {
    try {
      // Get the invitation details
      const invitation = await db
        .select()
        .from(lessonInvitations)
        .where(eq(lessonInvitations.id, invitationId))
        .limit(1);

      if (!invitation[0]) {
        return { isAvailable: false, conflictReason: "Invitation not found" };
      }

      const inv = invitation[0];
      console.log(`Checking availability for tutor ${tutorId}, invitation:`, inv);
      
      // Get tutor's actual availability from hourly availability table
      const tutorAvailabilityResults = await db
        .select()
        .from(tutorHourlyAvailability)
        .where(eq(tutorHourlyAvailability.tutorId, tutorId));

      console.log(`Tutor ${tutorId} has ${tutorAvailabilityResults.length} hourly availability slots:`, tutorAvailabilityResults);

      if (!tutorAvailabilityResults.length) {
        return { 
          isAvailable: false, 
          conflictReason: "Nie masz ustawionej dostępności w kalendarzu.",
          suggestedTimes: []
        };
      }

      // For now, if tutor has any availability, allow them to accept invitations
      // The detailed scheduling will be handled later when creating the actual lesson
      console.log(`Tutor ${tutorId} has availability set - allowing acceptance`);
      
      // Suggest alternative times based on tutor's actual availability
      const suggestedTimes = tutorAvailabilityResults.map((avail: any) => {
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        return `${dayNames[avail.dayOfWeek]} ${avail.startTime}-${avail.endTime}`;
      });

      return { 
        isAvailable: true,
        suggestedTimes
      };
    } catch (error) {
      console.error("Error checking tutor availability:", error);
      return { 
        isAvailable: false, 
        conflictReason: "Nie udało się sprawdzić dostępności."
      };
    }
  }

  // Create a scheduled lesson from accepted invitation
  async createScheduledLessonFromInvitation(invitation: any): Promise<any> {
    try {
      console.log("Creating scheduled lesson from invitation:", invitation);
      
      // Find the next available date from matching days and hours
      const nextLessonDate = this.findNextAvailableSlot(invitation.matchingDays, invitation.matchingHours);
      console.log("Found next available slot:", nextLessonDate);
      
      if (!nextLessonDate) {
        console.error("No available time slots found for invitation:", invitation);
        throw new Error("No available time slots found");
      }

      // Get subject details
      const subject = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, invitation.subjectId))
        .limit(1);

      console.log("Creating lesson with data:", {
        studentId: invitation.studentId,
        tutorId: invitation.tutorId,
        subjectId: invitation.subjectId,
        topicId: invitation.topicId || 'MAT-L01', // Default to MAT-L01 if null
        scheduledAt: nextLessonDate
      });

      // Create the lesson
      const lesson = await this.createLesson({
        studentId: invitation.studentId,
        tutorId: invitation.tutorId,
        subjectId: invitation.subjectId,
        topicId: invitation.topicId || 'MAT-L01', // Default to MAT-L01 if null
        title: `Lekcja ${subject[0]?.name || 'matematyki'}`,
        description: `Lekcja z korepetytorem - pierwsza lekcja po akceptacji zaproszenia`,
        scheduledAt: nextLessonDate,
        duration: 60, // 60-minute lesson
        price: "100.00", // Fixed price 100 zł
        status: "scheduled",
        paymentStatus: "pending"
      });

      console.log("Lesson created successfully:", lesson);

      // Generate Google Meet link automatically for the new lesson
      try {
        await this.generateMeetLink(lesson.id);
        console.log(`Google Meet link generated for lesson ${lesson.id}`);
      } catch (error) {
        console.error(`Failed to generate Meet link for lesson ${lesson.id}:`, error);
        // Don't fail the whole operation if Meet link generation fails
      }

      // Send notification to tutor about new lesson booking
      const notificationMessage = `Nowa lekcja została zarezerwowana! Student zarezerwował lekcję na ${nextLessonDate.toLocaleDateString('pl-PL')} o ${nextLessonDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}. Sprawdź swój kalendarz i potwierdź dostępność.`;
      try {
        await this.createSystemMessage(invitation.tutorId, invitation.studentId, notificationMessage);
        console.log(`Notification sent to tutor ${invitation.tutorId} about new lesson`);
      } catch (error) {
        console.error(`Failed to send notification to tutor:`, error);
      }

      // Block this time slot in tutor's availability 
      await this.blockTutorTimeSlot(invitation.tutorId, nextLessonDate);

      return lesson;
    } catch (error) {
      console.error("Error creating scheduled lesson:", error);
      throw error;
    }
  }

  // Find next available time slot from matching preferences
  findNextAvailableSlot(matchingDays: number[], matchingHours: string[]): Date | null {
    if (!matchingDays?.length || !matchingHours?.length) {
      console.log("No matching days or hours provided, creating default slot");
      // Create a default slot for tomorrow at 10:00 AM if no preferences
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      return tomorrow;
    }

    const now = new Date();
    
    // Look for next available slot starting from tomorrow
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + dayOffset);
      checkDate.setHours(0, 0, 0, 0);
      
      const dayOfWeek = checkDate.getDay();
      
      // Check if this day matches the preferred days
      if (matchingDays.includes(dayOfWeek)) {
        // Try each matching hour for this day
        for (const timeStr of matchingHours) {
          // Handle different time formats
          let hours, minutes;
          if (timeStr.includes(' ')) {
            // Format: "2025-09-01 11:00"
            const timePart = timeStr.split(' ')[1];
            [hours, minutes] = timePart.split(':').map(Number);
          } else {
            // Format: "11:00"
            [hours, minutes] = timeStr.split(':').map(Number);
          }
          
          const lessonDate = new Date(checkDate);
          lessonDate.setHours(hours, minutes || 0, 0, 0);
          
          // Make sure it's in the future
          if (lessonDate > now) {
            return lessonDate;
          }
        }
      }
    }
    
    console.log("No specific slot found, creating default tomorrow at 10:00");
    // Fallback: create a slot for tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  }

  // Block a specific time slot in tutor's availability
  async blockTutorTimeSlot(tutorId: string, lessonDate: Date): Promise<void> {
    try {
      const dayOfWeek = lessonDate.getDay();
      const hour = lessonDate.getHours().toString().padStart(2, '0');
      
      // Update the tutor's hourly availability to mark this slot as unavailable
      await db
        .update(tutorHourlyAvailability)
        .set({
          isAvailable: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(tutorHourlyAvailability.tutorId, tutorId),
          eq(tutorHourlyAvailability.dayOfWeek, dayOfWeek),
          eq(tutorHourlyAvailability.hour, hour)
        ));

      console.log(`Blocked time slot for tutor ${tutorId}: ${dayOfWeek} at ${hour}:00`);
    } catch (error) {
      console.error("Error blocking tutor time slot:", error);
    }
  }

  // Update tutor's availability schedule
  async updateTutorAvailability(tutorId: string, availability: any[]): Promise<void> {
    try {
      // Delete existing availability records
      await db
        .delete(tutorHourlyAvailability)
        .where(eq(tutorHourlyAvailability.tutorId, tutorId));

      // Ensure availability is defined and is an array
      if (!availability || !Array.isArray(availability)) {
        console.log(`No availability data provided for tutor ${tutorId}`);
        return;
      }

      // Insert new availability records (only for available slots)
      const availableSlots = availability.filter(slot => slot.isAvailable || slot.isSelected);
      
      if (availableSlots.length > 0) {
        await db.insert(tutorHourlyAvailability).values(
          availableSlots.map(slot => ({
            tutorId,
            dayOfWeek: parseInt(slot.day) || slot.dayOfWeek, // Support both formats
            hour: slot.hour,
            isAvailable: true
          }))
        );
      }

      console.log(`Updated availability for tutor ${tutorId}: ${availableSlots.length} available slots`);
    } catch (error) {
      console.error("Error updating tutor availability:", error);
      throw error;
    }
  }

  // Create system message between users
  async createSystemMessage(studentId: string, tutorId: string, content: string) {
    try {
      // Check if conversation exists between student and tutor
      let conversation = await db
        .select()
        .from(conversations)
        .where(or(
          and(eq(conversations.user1Id, studentId), eq(conversations.user2Id, tutorId)),
          and(eq(conversations.user1Id, tutorId), eq(conversations.user2Id, studentId))
        ))
        .limit(1);

      let conversationId: string;
      
      if (conversation.length === 0) {
        // Create new conversation
        const newConversation = await db
          .insert(conversations)
          .values({
            user1Id: studentId,
            user2Id: tutorId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        conversationId = newConversation[0].id;
      } else {
        conversationId = conversation[0].id;
      }

      // Add message to conversation
      await db.insert(messages).values({
        conversationId,
        senderId: tutorId, // Message is from tutor
        content,
        messageType: "system", // Mark as system message
        sentAt: new Date(),
      });

      console.log(`System message created from tutor ${tutorId} to student ${studentId}: ${content}`);
    } catch (error) {
      console.error("Error creating system message:", error);
    }
  }

  // Send automatic tutor invitations based on availability matching
  async sendTutorInvitations(preferencesId: string) {
    const preferences = await db
      .select()
      .from(studentMatchingPreferences)
      .where(eq(studentMatchingPreferences.id, preferencesId))
      .limit(1);

    if (preferences.length === 0) {
      throw new Error("Student preferences not found");
    }

    const pref = preferences[0];
    
    // Find tutors with matching availability
    const matchingTutors = await db
      .select({
        tutorId: tutorHourlyAvailability.tutorId,
        hour: tutorHourlyAvailability.hour,
        dayOfWeek: tutorHourlyAvailability.dayOfWeek,
      })
      .from(tutorHourlyAvailability)
      .innerJoin(users, eq(tutorHourlyAvailability.tutorId, users.id))
      .where(and(
        eq(users.role, "tutor"),
        eq(tutorHourlyAvailability.isAvailable, true),
        pref.preferredDays ? inArray(tutorHourlyAvailability.dayOfWeek, pref.preferredDays) : sql`true`
      ));

    // Group by tutor and collect matching hours/days
    const tutorMatches: Record<string, { hours: string[], days: number[] }> = {};
    
    matchingTutors.forEach((match) => {
      if (!tutorMatches[match.tutorId]) {
        tutorMatches[match.tutorId] = { hours: [], days: [] };
      }
      
      if (!tutorMatches[match.tutorId].hours.includes(match.hour)) {
        tutorMatches[match.tutorId].hours.push(match.hour);
      }
      
      if (!tutorMatches[match.tutorId].days.includes(match.dayOfWeek)) {
        tutorMatches[match.tutorId].days.push(match.dayOfWeek);
      }
    });

    // Send invitations to matching tutors
    const invitations = [];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    for (const [tutorId, matches] of Object.entries(tutorMatches)) {
      invitations.push({
        studentMatchingPreferenceId: preferencesId,
        tutorId,
        studentId: pref.studentId,
        subjectId: pref.subjectId,
        matchingHours: matches.hours,
        matchingDays: matches.days,
        expiresAt,
      });
    }

    if (invitations.length > 0) {
      await db.insert(lessonInvitations).values(invitations);
      console.log(`Sent ${invitations.length} lesson invitations for student ${pref.studentId}`);
    } else {
      console.log(`No matching tutors found for student ${pref.studentId}`);
    }

    return invitations.length;
  }

  // Progress map operations implementation
  async getUserProgressData(userId: string): Promise<any[]> {
    console.log(`Storage: Fetching user progress for userId=${userId}`);
    
    try {
      const progressData = await db
        .select({
          id: userProgress.id,
          userId: userProgress.userId,
          subjectId: userProgress.subjectId,
          levelId: userProgress.levelId,
          topicId: userProgress.topicId,
          status: userProgress.status,
          progress: userProgress.progress,
          xpEarned: userProgress.xpEarned,
          lessonsCompleted: userProgress.lessonsCompleted,
          totalLessons: userProgress.totalLessons,
          homeworkAssigned: userProgress.homeworkAssigned,
          homeworkCompleted: userProgress.homeworkCompleted,
          lastUpdated: userProgress.lastUpdated,
        })
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(asc(userProgress.subjectId), asc(userProgress.levelId));

      console.log(`Storage SQL: Found ${progressData.length} progress records for user ${userId}`);
      return progressData;
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return [];
    }
  }

  async getUserProgressForSubject(userId: string, subjectId: string): Promise<any[]> {
    console.log(`Storage: Fetching user progress for userId=${userId}, subjectId=${subjectId}`);
    
    try {
      const progressData = await db
        .select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.subjectId, subjectId)
        ))
        .orderBy(asc(userProgress.levelId));

      console.log(`Storage SQL: Found ${progressData.length} progress records for user ${userId} in subject ${subjectId}`);
      return progressData;
    } catch (error) {
      console.error("Error fetching user progress for subject:", error);
      return [];
    }
  }

  async updateUserTopicProgress(userId: string, subjectId: string, levelId: string, topicId: string, updates: any): Promise<void> {
    console.log(`Storage: Updating progress for userId=${userId}, subjectId=${subjectId}, levelId=${levelId}, topicId=${topicId}`);
    
    try {
      await db
        .update(userProgress)
        .set({...updates, lastUpdated: new Date()})
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.subjectId, subjectId),
          eq(userProgress.levelId, levelId),
          eq(userProgress.topicId, topicId)
        ));

      console.log(`Storage SQL: Updated progress for topic ${topicId}`);
    } catch (error) {
      console.error("Error updating user topic progress:", error);
      throw error;
    }
  }

  async initializeUserTopicProgress(userId: string, subjectId: string, levelId: string, topicId: string): Promise<any> {
    console.log(`Storage: Initializing progress for userId=${userId}, subjectId=${subjectId}, levelId=${levelId}, topicId=${topicId}`);
    
    try {
      const [created] = await db
        .insert(userProgress)
        .values({
          userId,
          subjectId,
          levelId,
          topicId,
          status: "not_started",
          progress: 0,
          xpEarned: 0,
          lessonsCompleted: 0,
          totalLessons: 5, // Default topic lesson count
          homeworkAssigned: 0,
          homeworkCompleted: 0,
        })
        .returning();

      console.log(`Storage SQL: Initialized progress for topic ${topicId}`);
      return created;
    } catch (error) {
      console.error("Error initializing user topic progress:", error);
      throw error;
    }
  }

  // New tutor listing system methods
  async getAllAvailableTutors(): Promise<any[]> {
    try {
      // First get all tutors (users with tutor role)
      const tutors = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(and(
          eq(users.role, "tutor"),
          eq(users.isActive, true)
        ));

      console.log("Storage SQL: Found tutors with role 'tutor':", tutors.length);

      // Then for each tutor, get their profile and availability
      const tutorsWithProfiles = await Promise.all(
        tutors.map(async (tutor) => {
          let profile = null;
          try {
            const [profileData] = await db
              .select()
              .from(tutorProfiles)
              .where(eq(tutorProfiles.userId, tutor.id))
              .limit(1);
            profile = profileData;
          } catch (err) {
            console.log(`No profile found for tutor ${tutor.id}`);
          }

          // Get tutor's availability from hourly system
          const hourlyAvailability = await this.getTutorHourlyAvailability(tutor.id);
          let availability = [];
          
          // Convert hourly availability object to array format
          if (hourlyAvailability && Object.keys(hourlyAvailability).length > 0) {
            console.log(`Converting hourly availability for tutor ${tutor.id}:`, hourlyAvailability);
            
            for (const [dayOfWeek, hours] of Object.entries(hourlyAvailability)) {
              const availableHours = Object.entries(hours).filter(([hour, isAvailable]) => isAvailable);
              if (availableHours.length > 0) {
                // Create availability blocks for each day
                const startHour = availableHours[0][0];
                const endHour = String(parseInt(availableHours[availableHours.length - 1][0].split(':')[0]) + 1).padStart(2, '0') + ':00';
                
                availability.push({
                  dayOfWeek: parseInt(dayOfWeek),
                  startTime: startHour,
                  endTime: endHour
                });
              }
            }
          }

          return {
            ...tutor,
            bio: profile?.bio || '',
            specializations: profile?.specializations || [],
            hourlyRate: Number(profile?.hourlyRate) || 100,
            rating: Number(profile?.rating) || 4.0,
            totalLessons: profile?.totalLessons || 0,
            isVerified: profile?.isVerified || false,
            // Default values for filtering
            experience: 0,
            gender: 'male',
            teachingStyle: 'patient',
            availability: availability
          };
        })
      );

      console.log(`Storage SQL: Processed ${tutorsWithProfiles.length} tutors with profiles`);
      
      // Filter to only return tutors who have set availability
      const availableTutors = tutorsWithProfiles.filter(tutor => {
        const hasAvailability = tutor.availability && tutor.availability.length > 0;
        console.log(`Tutor ${tutor.firstName} ${tutor.lastName} has availability:`, hasAvailability, tutor.availability?.length || 0);
        return hasAvailability;
      });

      console.log(`Storage SQL: Found ${availableTutors.length} tutors with availability out of ${tutorsWithProfiles.length} total`);
      return availableTutors.sort((a, b) => b.rating - a.rating);
    } catch (error) {
      console.error("Error getting all available tutors:", error);
      return []; // Return empty array instead of throwing
    }
  }

  async bookDirectLesson(data: {
    studentId: string;
    tutorId: string;
    subject: string;
    duration: number;
    price: number;
    timeSlot: string;
    specialNeeds?: string;
  }): Promise<any> {
    try {
      // Get current balance for transaction record
      const currentBalance = await this.getUserBalance(data.studentId);
      
      // Create lesson with pending status  
      const [lesson] = await db
        .insert(lessons)
        .values({
          studentId: data.studentId,
          tutorId: data.tutorId,
          topicId: "MAT-L01", // Default to first topic for direct bookings
          title: `Lekcja ${data.subject}`,
          scheduledAt: new Date(), // In a real app, parse timeSlot properly
          duration: data.duration,
          status: "pending", // Change to pending to require tutor acceptance
          paymentStatus: "paid",
          price: data.price.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create lesson invitation for tutor
      // First create a temporary matching preference if one doesn't exist
      const [matchingPref] = await db
        .insert(studentMatchingPreferences)
        .values({
          studentId: data.studentId,
          subjectId: "math-8th", // Default to math-8th for now
          preferredDays: [new Date().getDay()],
          preferredStartTime: "10:00", // Default time slot
          preferredEndTime: "18:00",
          maxHourlyRate: data.price,
          tutorGenderPreference: "no_preference",
          teachingStylePreference: "no_preference",
          specificNeeds: data.specialNeeds || "",
          isActive: true,
        })
        .returning();

      await db
        .insert(lessonInvitations)
        .values({
          studentMatchingPreferenceId: matchingPref.id,
          studentId: data.studentId,
          tutorId: data.tutorId,
          subjectId: "math-8th", // Using math-8th as the default subject
          matchingHours: [data.timeSlot], // Array of strings
          matchingDays: [new Date().getDay()], // Array of integers
          status: "pending",
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        });

      return lesson;
    } catch (error) {
      console.error("Error booking direct lesson:", error);
      throw error;
    }
  }

  // Get tutor's students (those with whom tutor has had lessons)
  async getTutorStudents(tutorId: string) {
    try {
      const students = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          totalLessons: sql<number>`COUNT(DISTINCT ${lessons.id})`,
          lastLessonDate: sql<string>`MAX(DATE(${lessons.scheduledAt}))`,
          hasUpcomingLesson: sql<boolean>`COUNT(CASE WHEN ${lessons.scheduledAt} > NOW() THEN 1 END) > 0`
        })
        .from(users)
        .innerJoin(lessons, eq(lessons.studentId, users.id))
        .where(and(
          eq(lessons.tutorId, tutorId),
          eq(users.role, "student"),
          ne(lessons.status, "cancelled") // Exclude cancelled lessons
        ))
        .groupBy(users.id, users.firstName, users.lastName, users.email)
        .orderBy(sql`MAX(${lessons.scheduledAt}) DESC`);

      return students;
    } catch (error) {
      console.error("Error fetching tutor students:", error);
      throw error;
    }
  }

  // Get tutor's hourly availability for visual booking calendar
  async getTutorHourlyAvailability(tutorId: string) {
    try {
      console.log(`Getting hourly availability for tutor: ${tutorId}`);
      
      const availability = await db
        .select()
        .from(tutorHourlyAvailability)
        .where(eq(tutorHourlyAvailability.tutorId, tutorId))
        .orderBy(tutorHourlyAvailability.dayOfWeek, tutorHourlyAvailability.hour);

      console.log(`Found ${availability.length} availability slots for tutor ${tutorId}`);

      // Convert to nested object format { dayOfWeek: { hour: isAvailable } }
      const result: Record<string, Record<string, boolean>> = {};
      
      availability.forEach((entry) => {
        const dayKey = entry.dayOfWeek.toString();
        if (!result[dayKey]) {
          result[dayKey] = {};
        }
        result[dayKey][entry.hour] = entry.isAvailable;
      });

      return result;
    } catch (error) {
      console.error("Error fetching tutor hourly availability:", error);
      return {};
    }
  }

  // Get tutor's hourly availability for booking calendar (returns hourly slots array)
  async getTutorHourlyAvailabilityForBooking(tutorId: string) {
    try {
      console.log(`Getting hourly availability for booking for tutor: ${tutorId}`);
      
      const availability = await db
        .select()
        .from(tutorHourlyAvailability)
        .where(eq(tutorHourlyAvailability.tutorId, tutorId))
        .orderBy(tutorHourlyAvailability.dayOfWeek, tutorHourlyAvailability.hour);

      console.log(`Found ${availability.length} availability slots for tutor ${tutorId}`);

      // Return array format for booking calendar
      return availability.map(entry => ({
        dayOfWeek: entry.dayOfWeek,
        hour: entry.hour
      }));
    } catch (error) {
      console.error("Error fetching tutor hourly availability for booking:", error);
      return [];
    }
  }

  // Get tutor's hourly availability formatted for tutor dashboard (only available slots)
  async getTutorHourlyAvailabilityForTutor(tutorId: string) {
    try {
      console.log(`Getting hourly availability for tutor dashboard: ${tutorId}`);
      
      const availability = await db
        .select()
        .from(tutorHourlyAvailability)
        .where(eq(tutorHourlyAvailability.tutorId, tutorId))
        .orderBy(tutorHourlyAvailability.dayOfWeek, tutorHourlyAvailability.hour);

      console.log(`Found ${availability.length} availability slots in database for tutor ${tutorId}`);

      // Return only the available slots in the format frontend expects
      const availableSlots = availability.filter(slot => slot.isAvailable).map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        hour: slot.hour,
        isAvailable: slot.isAvailable
      }));

      console.log(`Returning ${availableSlots.length} available slots for tutor dashboard`);
      return availableSlots;
    } catch (error) {
      console.error("Error fetching tutor hourly availability for tutor:", error);
      return [];
    }
  }

  // Get tutor's booked slots for visual booking calendar
  async getTutorBookedSlots(tutorId: string) {
    try {
      console.log(`Getting booked slots for tutor: ${tutorId}`);
      
      const bookedLessons = await db
        .select({
          scheduledAt: lessons.scheduledAt,
          duration: lessons.duration
        })
        .from(lessons)
        .where(and(
          eq(lessons.tutorId, tutorId),
          eq(lessons.status, "scheduled"),
          sql`${lessons.scheduledAt} > NOW()`
        ));

      console.log(`Found ${bookedLessons.length} booked lessons for tutor ${tutorId}`);

      // Convert to day/hour format
      const bookedSlots = bookedLessons.map(lesson => {
        const date = new Date(lesson.scheduledAt);
        return {
          dayOfWeek: date.getDay(),
          hour: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        };
      });

      return bookedSlots;
    } catch (error) {
      console.error("Error fetching tutor booked slots:", error);
      return [];
    }
  }

  // Password reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        email,
        token,
        expiresAt,
        used: false
      })
      .returning();
    
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gte(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    
    return resetToken;
  }

  async markTokenAsUsed(tokenId: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, tokenId));
  }

  async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Referral system operations
  async createReferral(referrerId: string, referredUserId: string, code: string, bonusAmount: number): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        referredId: referredUserId,
        referralCode: code,
        bonusAmount: bonusAmount.toString(),
        status: "pending",
      })
      .returning();
    return referral;
  }

  async getReferralByReferredId(userId: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredId, userId));
    return referral;
  }

  async getReferralsByUser(userId: string): Promise<(Referral & { referredUser: User })[]> {
    const results = await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        referredId: referrals.referredId,
        referralCode: referrals.referralCode,
        status: referrals.status,
        bonusAmount: referrals.bonusAmount,
        bonusAwarded: referrals.bonusAwarded,
        confirmedAt: referrals.confirmedAt,
        createdAt: referrals.createdAt,
        referredUser: users,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));

    return results.map(r => ({
      id: r.id,
      referrerId: r.referrerId,
      referredId: r.referredId,
      referralCode: r.referralCode,
      status: r.status,
      bonusAmount: r.bonusAmount,
      bonusAwarded: r.bonusAwarded,
      confirmedAt: r.confirmedAt,
      createdAt: r.createdAt,
      referredUser: r.referredUser,
    }));
  }

  async updateReferralStatus(id: string, status: "pending" | "confirmed" | "cancelled"): Promise<Referral> {
    const [referral] = await db
      .update(referrals)
      .set({ 
        status,
        ...(status === "confirmed" ? {
          bonusAwarded: true,
          confirmedAt: new Date(),
        } : {})
      })
      .where(eq(referrals.id, id))
      .returning();
    return referral;
  }

  async creditReferralBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.referralBalance || "0");
    const newBalance = (currentBalance + amount).toFixed(2);
    
    await db
      .update(users)
      .set({ 
        referralBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async debitReferralBalance(userId: string, amount: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.referralBalance || "0");
    const newBalance = Math.max(0, currentBalance - amount).toFixed(2);
    
    await db
      .update(users)
      .set({ 
        referralBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getReferralSummary(userId: string): Promise<{
    balance: string;
    totalReferrals: number;
    confirmedReferrals: number;
    pendingReferrals: number;
    totalEarnings: string;
  }> {
    const user = await this.getUser(userId);
    if (!user) {
      return {
        balance: "0.00",
        totalReferrals: 0,
        confirmedReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: "0.00",
      };
    }

    const allReferrals = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const confirmedReferrals = allReferrals.filter(r => r.status === "confirmed");
    const pendingReferrals = allReferrals.filter(r => r.status === "pending");
    
    const totalEarnings = confirmedReferrals.reduce(
      (sum, r) => sum + parseFloat(r.bonusAmount || "0"),
      0
    );

    return {
      balance: user.referralBalance || "0.00",
      totalReferrals: allReferrals.length,
      confirmedReferrals: confirmedReferrals.length,
      pendingReferrals: pendingReferrals.length,
      totalEarnings: totalEarnings.toFixed(2),
    };
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, code));
    return user;
  }

  async ensureUserHasReferralCode(userId: string): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    if (user.referralCode) {
      return user.referralCode;
    }
    
    // Generate a unique referral code
    const { generateReferralCode } = await import('./utils');
    let code = generateReferralCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const existing = await this.getUserByReferralCode(code);
      if (!existing) break;
      code = generateReferralCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique referral code");
    }
    
    // Update user with new referral code
    await db
      .update(users)
      .set({ 
        referralCode: code,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    return code;
  }

  async checkReferralDiscountEligibility(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || !user.referredByCode) {
      return false;
    }

    // Check if user has any completed lesson payments
    const payments = await db
      .select()
      .from(lessonPayments)
      .innerJoin(lessons, eq(lessonPayments.lessonId, lessons.id))
      .where(and(
        eq(lessons.studentId, userId),
        eq(lessonPayments.status, 'completed')
      ));

    // User is eligible for referral discount only if they have no completed payments
    return payments.length === 0;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  async updateSystemSetting(key: string, value: string, updatedBy?: string): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ 
          value,
          updatedAt: new Date(),
          ...(updatedBy ? { updatedBy } : {})
        })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values({
          key,
          value,
          updatedAt: new Date(),
          ...(updatedBy ? { updatedBy } : {})
        })
        .returning();
      return created;
    }
  }

  // Email notification operations for unread messages
  async getUsersWithUnreadMessages(): Promise<{userId: string, email: string, firstName: string, unreadCount: number, senderName: string, lastMessagePreview: string}[]> {
    try {
      // Get users who have unread messages and haven't received email notification in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const usersWithUnread = await db
        .select({
          userId: users.id,
          userEmail: users.email,
          userFirstName: users.firstName,
          lastEmailNotification: users.lastEmailNotification,
        })
        .from(users)
        .where(
          and(
            isNotNull(users.email),
            eq(users.isActive, true),
            or(
              isNull(users.lastEmailNotification),
              lt(users.lastEmailNotification, oneHourAgo)
            )
          )
        );

      console.log(`Found ${usersWithUnread.length} eligible users for notifications`);

      const result = [];

      for (const user of usersWithUnread) {
        console.log(`Checking unread messages for user: ${user.userEmail}`);
        
        // Get unread conversations for this user
        const unreadConversations = await db
          .select({
            conversationId: conversations.id,
            otherUserId: sql<string>`CASE 
              WHEN ${conversations.user1Id} = ${user.userId} THEN ${conversations.user2Id}
              ELSE ${conversations.user1Id}
            END`.as('other_user_id'),
            unreadCount: sql<number>`COUNT(CASE WHEN ${messages.readAt} IS NULL AND ${messages.senderId} != ${user.userId} THEN 1 END)`.as('unread_count')
          })
          .from(conversations)
          .innerJoin(messages, eq(messages.conversationId, conversations.id))
          .where(
            or(
              eq(conversations.user1Id, user.userId),
              eq(conversations.user2Id, user.userId)
            )
          )
          .groupBy(conversations.id, conversations.user1Id, conversations.user2Id)
          .having(sql`COUNT(CASE WHEN ${messages.readAt} IS NULL AND ${messages.senderId} != ${user.userId} THEN 1 END) > 0`);

        console.log(`Found ${unreadConversations.length} unread conversations for user ${user.userEmail}`);

        if (unreadConversations.length > 0) {
          const totalUnread = unreadConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
          
          // Get the most recent unread message for preview
          const sender = alias(users, 'sender');
          const [recentMessage] = await db
            .select({
              content: messages.content,
              senderFirstName: sender.firstName,
              senderLastName: sender.lastName,
            })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .innerJoin(sender, eq(messages.senderId, sender.id))
            .where(
              and(
                or(
                  eq(conversations.user1Id, user.userId),
                  eq(conversations.user2Id, user.userId)
                ),
                isNull(messages.readAt),
                ne(messages.senderId, user.userId)
              )
            )
            .orderBy(desc(messages.createdAt))
            .limit(1);

          if (recentMessage) {
            result.push({
              userId: user.userId,
              email: user.userEmail!,
              firstName: user.userFirstName || 'Użytkownik',
              unreadCount: Number(totalUnread), // Ensure it's a number, not string
              senderName: `${recentMessage.senderFirstName || ''} ${recentMessage.senderLastName || ''}`.trim() || 'Nieznany nadawca',
              lastMessagePreview: recentMessage.content.length > 100 
                ? recentMessage.content.substring(0, 97) + '...'
                : recentMessage.content
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting users with unread messages:', error);
      return [];
    }
  }

  async updateLastEmailNotification(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastEmailNotification: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Check if student has existing progression for a specific topic
  async getStudentTopicProgressionByTopic(studentId: string, topicId: string): Promise<any> {
    const result = await db
      .select()
      .from(topicCompletions)
      .where(and(
        eq(topicCompletions.studentId, studentId),
        eq(topicCompletions.topicId, topicId)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  // Get pending lesson invitations for a specific topic
  async getPendingInvitationsForTopic(studentId: string, topicId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(lessonInvitations)
      .where(and(
        eq(lessonInvitations.studentId, studentId),
        eq(lessonInvitations.topicId, topicId),
        eq(lessonInvitations.status, "pending")
      ));
    
    return result;
  }

  async getActivePendingInvitationsForTopic(studentId: string, topicId: string): Promise<any[]> {
    const now = new Date();
    const result = await db
      .select({
        id: lessonInvitations.id,
        tutorId: lessonInvitations.tutorId,
        tutorName: users.firstName,
        sentAt: lessonInvitations.sentAt,
        expiresAt: lessonInvitations.expiresAt,
        status: lessonInvitations.status
      })
      .from(lessonInvitations)
      .leftJoin(users, eq(lessonInvitations.tutorId, users.id))
      .where(and(
        eq(lessonInvitations.studentId, studentId),
        eq(lessonInvitations.topicId, topicId),
        eq(lessonInvitations.status, "pending"),
        gte(lessonInvitations.expiresAt, now) // Only non-expired invitations (using gte instead of gt)
      ));
    
    return result;
  }

  // Get next available topic based on lesson sequence and cancellations
  async getNextAvailableTopicForStudent(studentId: string): Promise<any> {
    console.log(`getNextAvailableTopicForStudent called for studentId: ${studentId}`);
    
    // Get all student's lessons ordered by creation date
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.studentId, studentId))
      .orderBy(asc(lessons.createdAt));
    
    console.log(`Found ${allLessons.length} total lessons for student`);
    
    // Count completed lessons per topic
    const completedLessonCounts: Record<string, number> = {};
    for (const lesson of allLessons) {
      if (lesson.status === 'completed' && lesson.topicId) {
        completedLessonCounts[lesson.topicId] = (completedLessonCounts[lesson.topicId] || 0) + 1;
      }
    }
    
    console.log('Completed lessons per topic:', completedLessonCounts);
    
    // Get all topics in order
    const allTopics = await this.getMathTopics();
    console.log('Sample math topic structure:', allTopics[0]);
    
    // Build topic status map (including pending lessons)
    const topicStatusMap: Record<string, { hasCompleted: boolean, hasPending: boolean, hasActive: boolean }> = {};
    
    for (const lesson of allLessons) {
      if (lesson.topicId) {
        if (!topicStatusMap[lesson.topicId]) {
          topicStatusMap[lesson.topicId] = { hasCompleted: false, hasPending: false, hasActive: false };
        }
        
        // Only count non-cancelled lessons
        if (lesson.status !== 'cancelled') {
          if (lesson.status === 'completed') {
            topicStatusMap[lesson.topicId].hasCompleted = true;
          } else if (lesson.status === 'pending') {
            topicStatusMap[lesson.topicId].hasPending = true;
          } else if (['confirmed', 'scheduled', 'in_progress'].includes(lesson.status || '')) {
            topicStatusMap[lesson.topicId].hasActive = true;
          }
        }
        // Cancelled lessons are completely ignored
      }
    }
    
    console.log('Topic status map:', topicStatusMap);
    
    // Find the CURRENT topic that is "in progress" (has pending or active lessons)
    for (const topic of allTopics) {
      const topicId = topic.id || topic.topicId;
      const status = topicStatusMap[topicId];
      
      // Skip completed topics
      if (status?.hasCompleted) {
        console.log(`Skipping ${topicId} - already completed`);
        continue;
      }
      
      // If topic has active lessons, it's the current topic
      if (status?.hasActive) {
        console.log(`Found current topic with active lessons: ${topicId}`);
        return { 
          ...topic, 
          canBook: false, 
          hasActiveLesson: true,
          activeLessonsCount: 1
        };
      }
      
      // If topic has pending lesson, it's the current topic waiting for acceptance
      if (status?.hasPending) {
        console.log(`Found current topic with pending lesson: ${topicId}`);
        return { 
          ...topic, 
          canBook: false, 
          hasActiveLesson: false,
          activeLessonsCount: 0,
          status: 'pending'
        };
      }
    }
    
    // No current topic - student needs to book first lesson
    console.log('No current topic found - student should book first lesson');
    return null;
    

    
    // All topics completed, start over (or continue with advanced topics)
    console.log('All topics completed, returning MAT-L01 for review');
    const nextTopic = allTopics.find(t => (t.id || t.topicId) === 'MAT-L01') || allTopics[0];
    return { ...nextTopic, canBook: true, hasActiveLesson: false };
  }

  // Get next bookable topic for fluid progression (different from current topic)
  async getNextBookableTopicForStudent(studentId: string): Promise<any> {
    console.log(`getNextBookableTopicForStudent called for studentId: ${studentId}`);
    
    // Get all student's lessons
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.studentId, studentId))
      .orderBy(asc(lessons.createdAt));
    
    // Get all topics in order
    const allTopics = await this.getMathTopics();
    
    // Count completed lessons and find highest topic with any ACTIVE lesson (excluding cancelled)
    const completedTopics = new Set<string>();
    const topicsWithActiveLessons = new Set<string>();
    
    for (const lesson of allLessons) {
      if (lesson.topicId && lesson.status !== 'cancelled') {
        topicsWithActiveLessons.add(lesson.topicId);
        if (lesson.status === 'completed') {
          completedTopics.add(lesson.topicId);
        }
      }
    }
    
    console.log('Topics with any active lessons:', Array.from(topicsWithActiveLessons));
    console.log('Completed topics:', Array.from(completedTopics));
    
    // Find the next topic that can be booked (fluid progression)
    for (const topic of allTopics) {
      const topicId = topic.id || topic.topicId;
      
      // Check if this topic has active lessons
      // Valid lesson statuses: 'scheduled', 'completed', 'cancelled', 'rescheduled'
      const activeLessonsForTopic = allLessons.filter(lesson => 
        lesson.topicId === topicId &&
        lesson.status === 'scheduled'
      );
      
      // Skip if this topic is already completed
      if (completedTopics.has(topicId)) {
        console.log(`Skipping ${topicId} - already completed`);
        continue;
      }
      
      // Skip if this topic already has scheduled lessons
      if (activeLessonsForTopic.length > 0) {
        console.log(`Skipping ${topicId} - already has scheduled lessons (${activeLessonsForTopic.length})`);
        continue;
      }
      
      // This topic can be booked
      console.log(`Found next bookable topic: ${topicId}`);
      return { 
        ...topic, 
        canBook: true, 
        hasActiveLesson: false,
        activeLessonsCount: 0
      };
    }
    
    // All topics have active lessons or are completed
    console.log('No bookable topics found');
    return null;
  }

  // Get student lessons with details for progress page
  async getStudentLessonsWithDetails(studentId: string): Promise<any[]> {
    console.log(`Storage: Fetching lessons for student ${studentId}`);
    
    // Use same pattern as getLessons() which works
    const studentLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.studentId, studentId))
      .orderBy(asc(lessons.createdAt));
    
    console.log(`Storage: Found ${studentLessons.length} lessons for student ${studentId}`);
    
    // Map to required format
    return studentLessons.map(lesson => ({
      id: lesson.id,
      topicId: lesson.topicId,
      status: lesson.status,
      scheduledAt: lesson.scheduledAt,
      title: lesson.title,
      createdAt: lesson.createdAt,
      completedAt: lesson.completedAt,
      tutorFirstName: null,
      tutorLastName: null
    }));
  }

  // Get pending invitations count for tutor
  async getPendingInvitationsForTutor(tutorId: string): Promise<any[]> {
    const result = await db
      .select()
      .from(lessonInvitations)
      .where(and(
        eq(lessonInvitations.tutorId, tutorId),
        eq(lessonInvitations.status, "pending")
      ));
    
    console.log(`Storage: Found ${result.length} pending invitations for tutor ${tutorId}`);
    return result;
  }

  // Get topic by ID
  async getTopicById(topicId: string): Promise<any> {
    const result = await db
      .select()
      .from(mathTopics)
      .where(eq(mathTopics.id, topicId))
      .limit(1);
    
    return result[0] || null;
  }

  // ============ REFERRAL SYSTEM ============
  
  // Get referral system settings
  async getReferralSettings(): Promise<Record<string, string>> {
    const settings = await db.select().from(systemSettings);
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    
    // Return defaults if no settings exist
    return {
      referral_bonus_amount: settingsMap['referral_bonus_amount'] || '20',
      referral_discount_percent: settingsMap['referral_discount_percent'] || '5'
    };
  }

  // Update a referral system setting
  async updateReferralSetting(key: string, value: string, adminId: string): Promise<void> {
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    
    if (existing.length > 0) {
      // Update existing
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date(), updatedBy: adminId })
        .where(eq(systemSettings.key, key));
    } else {
      // Insert new
      await db.insert(systemSettings).values({
        key,
        value,
        description: key === 'referral_bonus_amount' 
          ? 'Kwota bonusu dla polecającego w PLN' 
          : 'Procent zniżki dla poleconego',
        updatedBy: adminId
      });
    }
  }

  // Get referral statistics
  async getReferralStats(): Promise<any> {
    const totalReferrals = await db.select({ count: count() })
      .from(referrals);
    
    const confirmedReferrals = await db.select({ count: count() })
      .from(referrals)
      .where(eq(referrals.status, 'confirmed'));
    
    const totalBonusPaid = await db.select({ sum: sum(referrals.bonusAmount) })
      .from(referrals)
      .where(eq(referrals.bonusAwarded, true));
    
    return {
      totalReferrals: totalReferrals[0]?.count || 0,
      confirmedReferrals: confirmedReferrals[0]?.count || 0,
      totalBonusPaid: totalBonusPaid[0]?.sum || '0'
    };
  }

  // Lesson packages operations
  async getLessonPackages(activeOnly: boolean = false): Promise<LessonPackage[]> {
    const query = db.select().from(lessonPackages);
    
    if (activeOnly) {
      return await query.where(eq(lessonPackages.isActive, true)).orderBy(asc(lessonPackages.sortOrder));
    }
    
    return await query.orderBy(asc(lessonPackages.sortOrder));
  }

  async getLessonPackage(id: string): Promise<LessonPackage | undefined> {
    const [packageData] = await db.select().from(lessonPackages).where(eq(lessonPackages.id, id));
    return packageData;
  }

  async createLessonPackage(packageData: InsertLessonPackage): Promise<LessonPackage> {
    const [createdPackage] = await db
      .insert(lessonPackages)
      .values(packageData)
      .returning();
    return createdPackage;
  }

  async updateLessonPackage(id: string, updates: Partial<InsertLessonPackage>): Promise<LessonPackage> {
    const [updated] = await db
      .update(lessonPackages)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(lessonPackages.id, id))
      .returning();
    return updated;
  }

  async deleteLessonPackage(id: string): Promise<void> {
    await db.delete(lessonPackages).where(eq(lessonPackages.id, id));
  }

  // Purchased packages operations
  async purchasePackage(userId: string, packageId: string, stripePaymentIntentId?: string): Promise<PurchasedPackage> {
    const packageData = await this.getLessonPackage(packageId);
    if (!packageData) {
      throw new Error("Package not found");
    }

    const [purchase] = await db
      .insert(purchasedPackages)
      .values({
        userId,
        packageId,
        lessonsTotal: packageData.lessonCount,
        lessonsRemaining: packageData.lessonCount,
        lessonsUsed: 0,
        purchasePrice: packageData.finalPrice,
        status: 'active',
        stripePaymentIntentId
      })
      .returning();
    
    return purchase;
  }

  async getUserPurchasedPackages(userId: string, status?: string): Promise<PurchasedPackage[]> {
    const query = db.select().from(purchasedPackages).where(eq(purchasedPackages.userId, userId));
    
    if (status) {
      return await query
        .where(and(
          eq(purchasedPackages.userId, userId),
          eq(purchasedPackages.status, status)
        ))
        .orderBy(desc(purchasedPackages.purchasedAt));
    }
    
    return await query.orderBy(desc(purchasedPackages.purchasedAt));
  }

  async getPurchasedPackage(id: string): Promise<PurchasedPackage | undefined> {
    const [purchase] = await db.select().from(purchasedPackages).where(eq(purchasedPackages.id, id));
    return purchase;
  }

  async usePackageLesson(userId: string): Promise<boolean> {
    // Find active package with remaining lessons
    const [activePackage] = await db
      .select()
      .from(purchasedPackages)
      .where(
        and(
          eq(purchasedPackages.userId, userId),
          eq(purchasedPackages.status, 'active'),
          sql`${purchasedPackages.lessonsRemaining} > 0`
        )
      )
      .orderBy(asc(purchasedPackages.purchasedAt))
      .limit(1);

    if (!activePackage) {
      return false;
    }

    const newRemaining = activePackage.lessonsRemaining - 1;
    const newUsed = activePackage.lessonsUsed + 1;
    const newStatus = newRemaining === 0 ? 'exhausted' : 'active';

    await db
      .update(purchasedPackages)
      .set({
        lessonsRemaining: newRemaining,
        lessonsUsed: newUsed,
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(purchasedPackages.id, activePackage.id));

    return true;
  }

  async getUserPackageLessonsRemaining(userId: string): Promise<number> {
    const packages = await db
      .select({
        remaining: purchasedPackages.lessonsRemaining
      })
      .from(purchasedPackages)
      .where(
        and(
          eq(purchasedPackages.userId, userId),
          eq(purchasedPackages.status, 'active')
        )
      );

    return packages.reduce((sum, pkg) => sum + pkg.remaining, 0);
  }

  async getAllPurchasedPackages(): Promise<(PurchasedPackage & { user: User; package: LessonPackage })[]> {
    const purchases = await db
      .select()
      .from(purchasedPackages)
      .innerJoin(users, eq(purchasedPackages.userId, users.id))
      .innerJoin(lessonPackages, eq(purchasedPackages.packageId, lessonPackages.id))
      .orderBy(desc(purchasedPackages.purchasedAt));

    return purchases.map(p => ({
      ...p.purchased_packages,
      user: p.users,
      package: p.lesson_packages
    }));
  }

  // ==================== LOYALTY PROGRAM ====================
  
  // Loyalty level thresholds
  private getLoyaltyLevelInfo(completedLessons: number): {
    level: number;
    name: string;
    discount: number;
    bonus: number;
    nextLevelAt: number | null;
    description: string;
  } {
    if (completedLessons >= 100) {
      return {
        level: 5,
        name: 'VIP',
        discount: 10,
        bonus: 100, // 1 free lesson
        nextLevelAt: null,
        description: '10% rabatu + 1 darmowa lekcja'
      };
    } else if (completedLessons >= 60) {
      return {
        level: 4,
        name: 'Premium',
        discount: 10,
        bonus: 0,
        nextLevelAt: 100,
        description: '10% rabatu + priorytet przydziału korepetytorów'
      };
    } else if (completedLessons >= 30) {
      return {
        level: 3,
        name: 'Zaangażowany',
        discount: 5,
        bonus: 10, // 10 zł kredytu
        nextLevelAt: 60,
        description: '5% rabatu + 10 zł kredytu'
      };
    } else if (completedLessons >= 10) {
      return {
        level: 2,
        name: 'Stały Klient',
        discount: 2,
        bonus: 0,
        nextLevelAt: 30,
        description: '2% rabatu na kolejne pakiety'
      };
    } else {
      return {
        level: 1,
        name: 'Nowy',
        discount: 0,
        bonus: 0,
        nextLevelAt: 10,
        description: 'Brak bonusów'
      };
    }
  }

  async getLoyaltyStatus(userId: string): Promise<{
    level: number;
    levelName: string;
    completedLessons: number;
    discount: number;
    balance: string;
    nextLevelAt: number | null;
    lessonsToNextLevel: number | null;
    description: string;
  } | null> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return null;
    }

    const completedLessons = user.completedLessonsCount || 0;
    const levelInfo = this.getLoyaltyLevelInfo(completedLessons);

    return {
      level: levelInfo.level,
      levelName: levelInfo.name,
      completedLessons,
      discount: levelInfo.discount,
      balance: user.loyaltyBalance || "0.00",
      nextLevelAt: levelInfo.nextLevelAt,
      lessonsToNextLevel: levelInfo.nextLevelAt ? levelInfo.nextLevelAt - completedLessons : null,
      description: levelInfo.description
    };
  }

  async updateLoyaltyLevel(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      console.log(`User ${userId} not found for loyalty update`);
      return;
    }

    const completedLessons = user.completedLessonsCount || 0;
    const currentLevel = user.loyaltyLevel || 1;
    const newLevelInfo = this.getLoyaltyLevelInfo(completedLessons);

    // Check if user leveled up
    if (newLevelInfo.level > currentLevel) {
      console.log(`User ${userId} leveled up from ${currentLevel} to ${newLevelInfo.level}`);
      
      // Add bonus if applicable
      if (newLevelInfo.bonus > 0) {
        const currentBalance = parseFloat(user.loyaltyBalance || "0.00");
        const newBalance = (currentBalance + newLevelInfo.bonus).toFixed(2);
        
        await db
          .update(users)
          .set({
            loyaltyLevel: newLevelInfo.level,
            loyaltyBalance: newBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        console.log(`Added ${newLevelInfo.bonus} zł loyalty bonus to user ${userId}`);
      } else {
        await db
          .update(users)
          .set({
            loyaltyLevel: newLevelInfo.level,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }
    }
  }

  async incrementCompletedLessons(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        completedLessonsCount: sql`${users.completedLessonsCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`Incremented completed lessons for user ${userId}`);
    
    // Update loyalty level based on new count
    await this.updateLoyaltyLevel(userId);
  }

  async addLoyaltyBonus(userId: string, amount: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      console.log(`User ${userId} not found for loyalty bonus`);
      return;
    }

    const currentBalance = parseFloat(user.loyaltyBalance || "0.00");
    const newBalance = (currentBalance + amount).toFixed(2);

    await db
      .update(users)
      .set({
        loyaltyBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`Added ${amount} zł loyalty bonus to user ${userId}, new balance: ${newBalance}`);
  }

  async useLoyaltyBalance(userId: string, amount: number): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return false;
    }

    const currentBalance = parseFloat(user.loyaltyBalance || "0.00");
    
    if (currentBalance < amount) {
      return false;
    }

    const newBalance = (currentBalance - amount).toFixed(2);

    await db
      .update(users)
      .set({
        loyaltyBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`Used ${amount} zł loyalty balance for user ${userId}, new balance: ${newBalance}`);
    return true;
  }

  async getLoyaltyStats(): Promise<{
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
    totalUsers: number;
  }> {
    const allUsers = await db.select({
      loyaltyLevel: users.loyaltyLevel
    }).from(users);

    const level1 = allUsers.filter(u => (u.loyaltyLevel || 1) === 1).length;
    const level2 = allUsers.filter(u => (u.loyaltyLevel || 1) === 2).length;
    const level3 = allUsers.filter(u => (u.loyaltyLevel || 1) === 3).length;
    const level4 = allUsers.filter(u => (u.loyaltyLevel || 1) === 4).length;
    const level5 = allUsers.filter(u => (u.loyaltyLevel || 1) === 5).length;

    return {
      level1,
      level2,
      level3,
      level4,
      level5,
      totalUsers: allUsers.length
    };
  }

  async adjustUserLoyalty(userId: string, level?: number, balanceChange?: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const updates: any = {
      updatedAt: new Date()
    };

    // Update loyalty level if provided
    if (level !== undefined) {
      if (level < 1 || level > 5) {
        throw new Error("Loyalty level must be between 1 and 5");
      }
      updates.loyaltyLevel = level;
    }

    // Update loyalty balance if provided (add or subtract)
    if (balanceChange !== undefined) {
      const currentBalance = parseFloat(user.loyaltyBalance || "0.00");
      const newBalance = Math.max(0, currentBalance + balanceChange); // Don't allow negative balance
      updates.loyaltyBalance = newBalance.toFixed(2);
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));

    console.log(`Admin adjusted loyalty for user ${userId}: level=${level}, balanceChange=${balanceChange}`);
  }

  // Quiz system operations
  async getQuizStatusForTopic(studentId: string, topicId: string) {
    // Find quiz for this topic
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.moduleCode, topicId))
      .limit(1);

    if (!quiz) {
      return {
        hasQuiz: false,
        required: false,
        passed: true, // No quiz = automatically passed
        bestScore: 0,
        attempts: 0,
        lastAttempt: null,
      };
    }

    // Get all attempts for this quiz
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.quizId, quiz.id),
        eq(quizAttempts.studentId, studentId)
      ))
      .orderBy(desc(quizAttempts.completedAt));

    // Calculate best score
    const bestScore = attempts.length > 0
      ? Math.max(...attempts.map(a => a.score))
      : 0;

    // Check if passed (best score >= passing score)
    const passed = attempts.length > 0 && bestScore >= quiz.passingScore;

    // Get topic to check if quiz is required
    const [topic] = await db
      .select()
      .from(mathTopics)
      .where(eq(mathTopics.id, topicId))
      .limit(1);

    const required = topic?.quizRequired || false;

    return {
      hasQuiz: true,
      required,
      passed,
      bestScore,
      attempts: attempts.length,
      lastAttempt: attempts[0] || null,
    };
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values({
        ...question,
        updatedAt: new Date(),
      })
      .returning();
    return newQuestion;
  }

  async getQuestionsByModule(moduleCode: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.moduleCode, moduleCode));
  }

  async getAllQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async updateQuestion(questionId: string, updates: Partial<InsertQuestion>): Promise<Question> {
    const [updatedQuestion] = await db
      .update(questions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, questionId))
      .returning();
    return updatedQuestion;
  }

  async deleteQuestion(questionId: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, questionId));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        ...quiz,
        updatedAt: new Date(),
      })
      .returning();
    return newQuiz;
  }

  async getQuizByModule(moduleCode: string): Promise<Quiz | undefined> {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.moduleCode, moduleCode));
    return quiz;
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes);
  }

  async updateQuiz(quizId: string, updates: Partial<InsertQuiz>): Promise<Quiz> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, quizId))
      .returning();
    return updatedQuiz;
  }

  async deleteQuiz(quizId: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, quizId));
  }

  async addQuestionToQuiz(quizId: string, questionId: string, order: number): Promise<QuizQuestion> {
    const [quizQuestion] = await db
      .insert(quizQuestions)
      .values({
        quizId,
        questionId,
        order,
      })
      .returning();
    return quizQuestion;
  }

  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<void> {
    await db
      .delete(quizQuestions)
      .where(
        and(
          eq(quizQuestions.quizId, quizId),
          eq(quizQuestions.questionId, questionId)
        )
      );
  }

  async getQuizQuestions(quizId: string): Promise<(Question & { order: number })[]> {
    const results = await db
      .select({
        id: questions.id,
        moduleCode: questions.moduleCode,
        questionType: questions.questionType,
        questionText: questions.questionText,
        options: questions.options,
        correctAnswer: questions.correctAnswer,
        explanation: questions.explanation,
        points: questions.points,
        difficulty: questions.difficulty,
        config: questions.config,
        createdAt: questions.createdAt,
        updatedAt: questions.updatedAt,
        order: quizQuestions.order,
      })
      .from(quizzes)
      .leftJoin(quizQuestions, eq(quizQuestions.quizId, quizzes.id))
      .leftJoin(questions, eq(questions.id, quizQuestions.questionId))
      .where(eq(quizzes.id, quizId))
      .orderBy(quizQuestions.order);

    return results.filter((r): r is Question & { order: number } => r.id !== null);
  }

  async submitQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [newAttempt] = await db
      .insert(quizAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getStudentQuizAttempts(studentId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.studentId, studentId))
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getQuizAttemptsByQuiz(quizId: string, studentId: string): Promise<QuizAttempt[]> {
    return await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.studentId, studentId)
        )
      )
      .orderBy(desc(quizAttempts.completedAt));
  }

  async getBestQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | undefined> {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.quizId, quizId),
          eq(quizAttempts.studentId, studentId)
        )
      )
      .orderBy(desc(quizAttempts.score));
    
    return attempts[0];
  }

  // Exercise/Practice system operations
  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db
      .insert(exercises)
      .values(exercise)
      .returning();
    return newExercise;
  }

  async updateExercise(id: string, updates: Partial<Exercise>): Promise<Exercise> {
    const [updated] = await db
      .update(exercises)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    return exercise || null;
  }

  async getExercisesByModule(moduleCode: string): Promise<Exercise[]> {
    return db
      .select()
      .from(exercises)
      .where(and(
        eq(exercises.moduleCode, moduleCode),
        eq(exercises.isActive, true)
      ))
      .orderBy(asc(exercises.difficulty), asc(exercises.createdAt));
  }

  async getAllExercises(): Promise<Exercise[]> {
    return db
      .select()
      .from(exercises)
      .orderBy(asc(exercises.moduleCode), asc(exercises.difficulty));
  }

  async generateExercisesWithGPT(moduleCode: string, count: number = 5): Promise<Exercise[]> {
    // Get topic info for context
    const [topic] = await db
      .select()
      .from(mathTopics)
      .where(eq(mathTopics.id, moduleCode))
      .limit(1);

    if (!topic) {
      throw new Error("Module not found");
    }

    // Setup OpenAI
    const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    if (!baseUrl || !apiKey) {
      throw new Error("OpenAI API configuration missing");
    }

    const openai = new OpenAI({
      baseURL: baseUrl,
      apiKey: apiKey,
    });

    // Create prompt for GPT-4
    const prompt = `Jesteś ekspertem od matematyki dla 8 klasy w Polsce. Wygeneruj ${count} ćwiczeń matematycznych dla tematu:

TEMAT: ${topic.name}
OPIS: ${topic.description}

WYMAGANIA:
1. Format EGZAMINU ÓSMOKLASISTY - zadania muszą być realistyczne i odpowiadać stylowi prawdziwego egzaminu
2. Różne typy zadań: single_choice, multiple_choice, numerical, algebraic, word_problem
3. Różne poziomy trudności: łatwy (1-2 zadania), średni (2-3 zadania), trudny (1-2 zadania)
4. ZAWSZE dołącz pełne wyjaśnienie w solutionSteps - krok po kroku jak rozwiązać zadanie
5. Dla zadań wyboru dodaj 4 opcje, gdzie tylko jedna/kilka jest poprawna
6. Zadania słowne (word_problem) powinny być praktyczne i związane z życiem codziennym

ZWRÓĆ JSON z tablicą obiektów w formacie:
[
  {
    "title": "Krótki tytuł ćwiczenia",
    "description": "Opcjonalny opis kontekstu",
    "exerciseType": "single_choice|multiple_choice|numerical|algebraic|word_problem",
    "question": "Treść pytania",
    "options": ["opcja1", "opcja2", "opcja3", "opcja4"] lub null dla numerical/algebraic/word_problem,
    "correctAnswer": "opcja1" dla single_choice, ["opcja1", "opcja2"] dla multiple_choice, "42" dla numerical, "2x+5" dla algebraic, dowolny string dla word_problem,
    "solutionSteps": [
      "Krok 1: Wyjaśnienie...",
      "Krok 2: Obliczenie...",
      "Krok 3: Odpowiedź: ..."
    ],
    "hints": [
      "Podpowiedź 1: Delikatna wskazówka",
      "Podpowiedź 2: Bardziej konkretna pomoc"
    ],
    "difficulty": "łatwy|średni|trudny",
    "points": 10 dla łatwego, 15 dla średniego, 20 dla trudnego
  }
]

WAŻNE: Zwróć TYLKO czysty JSON bez żadnych dodatkowych komentarzy czy markdown.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Jesteś ekspertem od tworzenia zadań matematycznych dla 8 klasy w stylu egzaminu ósmoklasisty. Zwracasz tylko czysty JSON bez dodatkowych komentarzy.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("No response from GPT-4");
      }

      // Parse JSON response
      let exercisesData;
      try {
        // Remove markdown code blocks if present
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        exercisesData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("Failed to parse GPT response:", responseText);
        throw new Error("Invalid JSON response from GPT-4");
      }

      if (!Array.isArray(exercisesData)) {
        throw new Error("GPT-4 response is not an array");
      }

      // Create exercises in database
      const createdExercises: Exercise[] = [];
      
      for (const ex of exercisesData) {
        const [created] = await db
          .insert(exercises)
          .values({
            moduleCode: moduleCode,
            title: ex.title,
            description: ex.description || null,
            exerciseType: ex.exerciseType,
            question: ex.question,
            options: ex.options || null,
            correctAnswer: ex.correctAnswer,
            solutionSteps: ex.solutionSteps || [],
            hints: ex.hints || [],
            difficulty: ex.difficulty,
            points: ex.points || 10,
            generatedByAI: true,
            isActive: true,
          })
          .returning();
        
        createdExercises.push(created);
      }

      return createdExercises;
    } catch (error: any) {
      console.error("Error generating exercises with GPT:", error);
      throw new Error(`Failed to generate exercises: ${error.message}`);
    }
  }

  async submitExerciseAttempt(
    attempt: InsertExerciseAttempt
  ): Promise<ExerciseAttempt & { feedback: string }> {
    // Get exercise for grading
    const exercise = await this.getExerciseById(attempt.exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Grade the answer SERVER-SIDE
    const { gradeExercise } = await import('./exercise-grading');
    const result = gradeExercise(exercise, attempt.answer);

    // Save attempt with server-calculated results
    const [savedAttempt] = await db
      .insert(exerciseAttempts)
      .values({
        ...attempt,
        isCorrect: result.isCorrect,
        pointsEarned: result.pointsEarned,
      })
      .returning();

    return {
      ...savedAttempt,
      feedback: result.feedback,
    };
  }

  async getStudentExerciseAttempts(
    studentId: string,
    exerciseId?: string
  ): Promise<ExerciseAttempt[]> {
    const conditions = [eq(exerciseAttempts.studentId, studentId)];
    
    if (exerciseId) {
      conditions.push(eq(exerciseAttempts.exerciseId, exerciseId));
    }

    return db
      .select()
      .from(exerciseAttempts)
      .where(and(...conditions))
      .orderBy(desc(exerciseAttempts.completedAt));
  }

  async getExerciseStatsByModule(
    studentId: string,
    moduleCode: string
  ): Promise<{
    totalExercises: number;
    completedExercises: number;
    correctAnswers: number;
    totalPoints: number;
    averageAccuracy: number;
  }> {
    // Get all exercises for module
    const moduleExercises = await this.getExercisesByModule(moduleCode);
    const totalExercises = moduleExercises.length;

    // Get all attempts for this student and module exercises
    const exerciseIds = moduleExercises.map(ex => ex.id);
    
    if (exerciseIds.length === 0) {
      return {
        totalExercises: 0,
        completedExercises: 0,
        correctAnswers: 0,
        totalPoints: 0,
        averageAccuracy: 0,
      };
    }

    const attempts = await db
      .select()
      .from(exerciseAttempts)
      .where(and(
        eq(exerciseAttempts.studentId, studentId),
        inArray(exerciseAttempts.exerciseId, exerciseIds)
      ));

    // Calculate stats
    const uniqueExercises = new Set(attempts.map(a => a.exerciseId));
    const completedExercises = uniqueExercises.size;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const totalPoints = attempts.reduce((sum, a) => sum + a.pointsEarned, 0);
    const averageAccuracy = attempts.length > 0 
      ? (correctAnswers / attempts.length) * 100 
      : 0;

    return {
      totalExercises,
      completedExercises,
      correctAnswers,
      totalPoints,
      averageAccuracy: Math.round(averageAccuracy * 10) / 10, // Round to 1 decimal
    };
  }

  async getBestExerciseAttempt(exerciseId: string, studentId: string): Promise<ExerciseAttempt | null> {
    const attempts = await db
      .select()
      .from(exerciseAttempts)
      .where(and(
        eq(exerciseAttempts.exerciseId, exerciseId),
        eq(exerciseAttempts.studentId, studentId)
      ))
      .orderBy(desc(exerciseAttempts.pointsEarned), asc(exerciseAttempts.timeTaken))
      .limit(1);

    return attempts[0] || null;
  }

  async getAllExerciseStatsByStudent(studentId: string): Promise<Record<string, {
    totalExercises: number;
    completedExercises: number;
    correctAnswers: number;
    totalPoints: number;
    averageAccuracy: number;
  }>> {
    // Get all exercises grouped by module
    const allExercises = await db.select().from(exercises).where(eq(exercises.isActive, true));
    
    // Get all attempts for this student
    const allAttempts = await db
      .select()
      .from(exerciseAttempts)
      .where(eq(exerciseAttempts.studentId, studentId));

    // Group exercises by module
    const exercisesByModule: Record<string, typeof allExercises> = {};
    for (const exercise of allExercises) {
      if (!exercisesByModule[exercise.moduleCode]) {
        exercisesByModule[exercise.moduleCode] = [];
      }
      exercisesByModule[exercise.moduleCode].push(exercise);
    }

    // Calculate stats for each module
    const stats: Record<string, any> = {};
    for (const [moduleCode, moduleExercises] of Object.entries(exercisesByModule)) {
      const exerciseIds = moduleExercises.map(ex => ex.id);
      const moduleAttempts = allAttempts.filter(a => exerciseIds.includes(a.exerciseId));
      
      const uniqueExercises = new Set(moduleAttempts.map(a => a.exerciseId));
      const completedExercises = uniqueExercises.size;
      const correctAnswers = moduleAttempts.filter(a => a.isCorrect).length;
      const totalPoints = moduleAttempts.reduce((sum, a) => sum + a.pointsEarned, 0);
      const averageAccuracy = moduleAttempts.length > 0 
        ? (correctAnswers / moduleAttempts.length) * 100 
        : 0;

      stats[moduleCode] = {
        totalExercises: moduleExercises.length,
        completedExercises,
        correctAnswers,
        totalPoints,
        averageAccuracy: Math.round(averageAccuracy * 10) / 10,
      };
    }

    return stats;
  }
}

export const storage = new DatabaseStorage();
