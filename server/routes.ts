import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { and, lt, eq } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./auth-passport";
import { db } from "./db";
import { users } from "@shared/schema";
import { 
  insertLessonSchema, 
  insertHomeworkAssignmentSchema, 
  insertAdminAccountSchema, 
  insertCourseSchema, 
  insertCourseLessonSchema, 
  insertCalendarEventSchema, 
  insertLessonPaymentSchema, 
  insertBalanceTransactionSchema, 
  insertMathTopicSchema, 
  insertTopicMaterialSchema,
  insertQuestionSchema,
  insertQuizSchema,
  insertQuizQuestionSchema,
  insertExerciseSchema,
  insertExerciseAttemptSchema,
  type InsertQuestion,
  type InsertQuiz,
} from "@shared/schema";
import { filterProfanity, containsProfanity, getProfanitySeverity } from "@shared/profanityFilter";
import { z } from "zod";
import session from "express-session";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail, sendUnreadMessageNotification } from "./email-service";

// Initialize Stripe (optional)
const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-07-30.basil",
    })
  : null;

// Extend session interface to include adminId
declare module 'express-session' {
  export interface SessionData {
    adminId?: string;
  }
}

// Helper function to initialize default progress structure for a user
async function initializeDefaultProgressForUser(userId: string) {
  console.log(`Initializing default progress structure for user: ${userId}`);
  
  const defaultTopics = [
    // Podstawy (Level 1)
    { subjectId: 'math-8th', levelId: 'podstawy', topicId: 'liczby-calkowite', name: 'Liczby całkowite' },
    { subjectId: 'math-8th', levelId: 'podstawy', topicId: 'ulamki-dziesietne', name: 'Ułamki dziesiętne' },
    { subjectId: 'math-8th', levelId: 'podstawy', topicId: 'procenty', name: 'Procenty' },
    { subjectId: 'math-8th', levelId: 'podstawy', topicId: 'proporcjonalnosc', name: 'Proporcjonalność' },
    
    // Średni (Level 2)
    { subjectId: 'math-8th', levelId: 'sredni', topicId: 'rownania-liniowe', name: 'Równania liniowe' },
    { subjectId: 'math-8th', levelId: 'sredni', topicId: 'nierownosci', name: 'Nierówności' },
    { subjectId: 'math-8th', levelId: 'sredni', topicId: 'funkcje-liniowe', name: 'Funkcje liniowe' },
    { subjectId: 'math-8th', levelId: 'sredni', topicId: 'uklady-rownan', name: 'Układy równań' },
    
    // Zaawansowany (Level 3)
    { subjectId: 'math-8th', levelId: 'zaawansowany', topicId: 'trojkaty-podobne', name: 'Trójkąty podobne' },
    { subjectId: 'math-8th', levelId: 'zaawansowany', topicId: 'twierdzenie-pitagorasa', name: 'Twierdzenie Pitagorasa' },
    { subjectId: 'math-8th', levelId: 'zaawansowany', topicId: 'geometria-przestrzenna', name: 'Geometria przestrzenna' },
    { subjectId: 'math-8th', levelId: 'zaawansowany', topicId: 'statystyka', name: 'Statystyka i prawdopodobieństwo' },
  ];
  
  try {
    for (const topic of defaultTopics) {
      await storage.initializeUserTopicProgress(
        userId,
        topic.subjectId,
        topic.levelId,
        topic.topicId
      );
    }
    console.log(`Initialized ${defaultTopics.length} topics for user ${userId}`);
  } catch (error) {
    console.error("Error initializing default progress:", error);
  }
}

// Admin authentication middleware
const isAdminAuthenticated = (req: any, res: any, next: any) => {
  // Check session first, then fallback to cookie
  const adminId = req.session?.adminId || req.cookies?.['admin-session'];
  
  if (adminId) {
    // Sync session if only cookie exists
    if (!req.session.adminId && req.cookies?.['admin-session']) {
      req.session.adminId = req.cookies['admin-session'];
    }
    return next();
  }
  return res.status(401).json({ message: "Admin authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const getStripeClient = (res: Response) => {
    if (!stripe) {
      res.status(503).json({ message: "Płatności kartą są wyłączone" });
      return null;
    }
    return stripe;
  };

  const getStripeWebhookSecret = (res: Response) => {
    if (!stripe || !stripeWebhookSecret) {
      res.status(503).json({ message: "Stripe webhook jest wyłączony" });
      return null;
    }
    return stripeWebhookSecret;
  };
  // Auth middleware
  setupAuth(app);

  // Quiz validation schemas
  const quizAnswerSchema = z.object({
    questionId: z.string(),
    answer: z.any(), // Can be string, array, boolean depending on question type
  });

  const submitQuizAttemptSchema = z.object({
    quizId: z.string(),
    answers: z.array(quizAnswerSchema),
    timeTaken: z.number().int().min(0).optional(),
  });

  const addQuestionToQuizSchema = z.object({
    questionId: z.string(),
    order: z.number().int().min(1),
  });

  // Admin Auth routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const admin = await storage.authenticateAdmin(username, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store admin session
      req.session.adminId = admin.id;
      
      // Set secure session cookie
      res.cookie('admin-session', admin.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.json({ message: "Admin login successful", admin: { id: admin.id, username: admin.username } });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.adminId = undefined;
    
    // Clear admin session cookie
    res.clearCookie('admin-session');
    
    res.json({ message: "Admin logout successful" });
  });

  app.get('/api/admin/me', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Here we could fetch admin details if needed
      res.json({ adminId: req.session.adminId });
    } catch (error) {
      console.error("Error fetching admin:", error);
      res.status(500).json({ message: "Failed to fetch admin" });
    }
  });

  // Regular Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get profile based on role
      let profile = null;
      if (user.role === "student") {
        profile = await storage.getStudentProfile(userId);
        if (!profile) {
          profile = await storage.createStudentProfile({ userId });
        }
      } else if (user.role === "tutor") {
        profile = await storage.getTutorProfile(userId);
      }
      
      // Check if user is eligible for referral discount (server-side validation)
      const hasReferralDiscountAvailable = await storage.checkReferralDiscountEligibility(userId);
      
      res.json({ ...user, profile, hasReferralDiscountAvailable });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get student profile
  app.get('/api/student/profile/:userId?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Only allow users to access their own profile unless they're admin
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const profile = await storage.getStudentProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Student profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ message: "Failed to fetch student profile" });
    }
  });

  app.get('/api/tutor/profile/:userId?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Only allow users to access their own profile unless they're admin
      if (userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const profile = await storage.getTutorProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Tutor profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({ message: "Failed to fetch tutor profile" });
    }
  });

  app.post('/api/auth/setup-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role, parentEmail, bankAccount } = req.body;

      if (!["student", "tutor"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Validate required fields based on role
      if (role === "student" && (!parentEmail || !parentEmail.includes("@"))) {
        return res.status(400).json({ message: "Email rodzica jest wymagany dla uczniów" });
      }

      if (role === "tutor" && (!bankAccount || bankAccount.replace(/\s/g, '').length < 20)) {
        return res.status(400).json({ message: "Numer konta bankowego jest wymagany dla korepetytorów" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Create appropriate profile based on role
      if (role === "student") {
        try {
          await storage.createStudentProfile({
            userId,
            xp: 0,
            level: 1,
            streak: 0,
            completedLessons: 0,
          });

          // Store parent email in user data
          await storage.updateUserAdditionalData(userId, { parentEmail });
        } catch (error) {
          // Profile might already exist, ignore error
          console.log("Student profile might already exist for user:", userId);
        }
      } else if (role === "tutor") {
        try {
          await storage.createTutorProfile({
            userId,
            bio: "",
            specializations: ["mathematics"],
            hourlyRate: "100.00",
            rating: "5.00",
            totalLessons: 0,
            isVerified: false,
          });

          // Store bank account in user data
          await storage.updateUserAdditionalData(userId, { bankAccount });
        } catch (error) {
          // Profile might already exist, ignore error
          console.log("Tutor profile might already exist for user:", userId);
        }
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting up user role:", error);
      res.status(500).json({ message: "Failed to setup user role" });
    }
  });

  app.patch('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, levelDescription, bio } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        email,
      });

      // If levelDescription is provided and user is a student, update their profile
      if (levelDescription !== undefined && req.user.role === "student") {
        await storage.updateStudentLevelDescription(userId, levelDescription);
      }

      // If bio is provided and user is a tutor, update their profile
      if (bio !== undefined && req.user.role === "tutor") {
        await storage.updateTutorBio(userId, bio);
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/auth/change-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role, parentEmail, bankAccount } = req.body;

      if (!["student", "tutor"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Validate required fields based on role
      if (role === "student" && (!parentEmail || !parentEmail.includes("@"))) {
        return res.status(400).json({ message: "Email rodzica jest wymagany dla uczniów" });
      }

      if (role === "tutor" && (!bankAccount || bankAccount.replace(/\s/g, '').length < 20)) {
        return res.status(400).json({ message: "Numer konta bankowego jest wymagany dla korepetytorów" });
      }

      // Update user role
      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Update additional data
      const additionalData: { parentEmail?: string; bankAccount?: string } = {};
      if (role === "student" && parentEmail) {
        additionalData.parentEmail = parentEmail;
      }
      if (role === "tutor" && bankAccount) {
        additionalData.bankAccount = bankAccount;
      }
      
      if (Object.keys(additionalData).length > 0) {
        await storage.updateUserAdditionalData(userId, additionalData);
      }

      // Create appropriate profile based on new role
      if (role === "student") {
        try {
          await storage.createStudentProfile({
            userId,
            xp: 0,
            level: 1,
            streak: 0,
            completedLessons: 0,
          });
        } catch (error) {
          // Profile might already exist, ignore error
          console.log("Student profile might already exist for user:", userId);
        }
      } else if (role === "tutor") {
        try {
          await storage.createTutorProfile({
            userId,
            bio: "",
            specializations: ["mathematics"],
            hourlyRate: "100.00",
            rating: "5.00",
            totalLessons: 0,
            isVerified: false,
          });
        } catch (error) {
          // Profile might already exist, ignore error
          console.log("Tutor profile might already exist for user:", userId);
        }
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error changing role:", error);
      res.status(500).json({ message: "Failed to change role" });
    }
  });

  // Referral system routes
  // Capture referral code from URL (e.g., /ref/E8-ABC123)
  app.get('/ref/:code', async (req, res) => {
    try {
      const code = req.params.code;
      
      // Validate code format
      if (!code || !code.startsWith('E8-')) {
        return res.redirect('/');
      }
      
      // Check if referral code exists
      const referrer = await storage.getUserByReferralCode(code);
      if (!referrer) {
        return res.redirect('/');
      }
      
      // Redirect to registration with referral code in URL
      // Frontend will capture this and store in localStorage
      res.redirect(`/register?ref=${code}`);
    } catch (error) {
      console.error("Error processing referral code:", error);
      res.redirect('/');
    }
  });

  // Get user's referral summary (dashboard data)
  app.get('/api/referrals/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Ensure user has a referral code
      await storage.ensureUserHasReferralCode(userId);
      
      // Get updated user with referral code
      const user = await storage.getUser(userId);
      
      // Get referral summary
      const summary = await storage.getReferralSummary(userId);
      
      // Get referral history
      const history = await storage.getReferralsByUser(userId);
      
      res.json({
        referralCode: user?.referralCode,
        balance: summary.balance,
        totalReferrals: summary.totalReferrals,
        confirmedReferrals: summary.confirmedReferrals,
        pendingReferrals: summary.pendingReferrals,
        totalEarnings: summary.totalEarnings,
        history: history.map(h => ({
          id: h.id,
          referredUserName: `${h.referredUser.firstName || ''} ${h.referredUser.lastName || ''}`.trim() || 'User',
          status: h.status,
          bonusAmount: h.bonusAmount,
          bonusAwarded: h.bonusAwarded,
          confirmedAt: h.confirmedAt,
          createdAt: h.createdAt,
        }))
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
      res.status(500).json({ message: "Failed to fetch referral data" });
    }
  });

  // Apply referral code (called during registration or first purchase)
  app.post('/api/referrals/apply', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { referralCode } = req.body;
      
      if (!referralCode || !referralCode.startsWith('E8-')) {
        return res.status(400).json({ message: "Invalid referral code format" });
      }
      
      // Check if user already has a referral applied
      const existingReferral = await storage.getReferralByReferredId(userId);
      if (existingReferral) {
        return res.status(400).json({ message: "You have already used a referral code" });
      }
      
      // Find the referrer
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ message: "Referral code not found" });
      }
      
      // Can't refer yourself
      if (referrer.id === userId) {
        return res.status(400).json({ message: "You cannot use your own referral code" });
      }
      
      // Get bonus amount from system settings (default 20 PLN)
      const bonusSetting = await storage.getSystemSetting('referral_bonus_amount');
      const bonusAmount = bonusSetting ? parseFloat(bonusSetting.value) : 20;
      
      // Update user's referredByCode
      await storage.updateUser(userId, { referredByCode: referralCode });
      
      // Create referral record
      const referral = await storage.createReferral(
        referrer.id,
        userId,
        referralCode,
        bonusAmount
      );
      
      res.json({
        message: "Referral code applied successfully",
        referral: {
          id: referral.id,
          status: referral.status,
          bonusAmount: referral.bonusAmount,
        }
      });
    } catch (error) {
      console.error("Error applying referral code:", error);
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

  // Get referral status by ID
  app.get('/api/referrals/status/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const referralId = req.params.id;
      
      // Get all user's referrals
      const referrals = await storage.getReferralsByUser(userId);
      const referral = referrals.find(r => r.id === referralId);
      
      if (!referral) {
        return res.status(404).json({ message: "Referral not found" });
      }
      
      res.json({
        id: referral.id,
        status: referral.status,
        bonusAmount: referral.bonusAmount,
        bonusAwarded: referral.bonusAwarded,
        confirmedAt: referral.confirmedAt,
        createdAt: referral.createdAt,
      });
    } catch (error) {
      console.error("Error fetching referral status:", error);
      res.status(500).json({ message: "Failed to fetch referral status" });
    }
  });

  // Student routes
  app.get('/api/student/dashboard', async (req: any, res) => {
    try {
      // Check for demo mode (accessed from admin with studentId parameter)
      const isDemoMode = req.query.studentId;
      let userId;
      
      if (isDemoMode) {
        // Demo mode - use provided studentId
        userId = req.query.studentId;
      } else {
        // Regular mode - use authenticated user
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        userId = req.user.id;
        const user = await storage.getUser(userId);
        
        if (user?.role !== "student") {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      let stats, upcomingLessons, homeworkAssignments, progress: any[], badges;
      
      if (isDemoMode && userId === "summary") {
        // Summary mode - show all students' data
        stats = { totalLessons: 0, completedHomework: 0, averageGrade: 0, xp: 0, level: 0, streak: 0 };
        upcomingLessons = await storage.getAllUpcomingLessons();
        homeworkAssignments = await storage.getAllHomeworkAssignments();
        progress = [];
        badges = [];
      } else {
        // Individual student mode
        stats = await storage.getStudentStats(userId);
        upcomingLessons = await storage.getUpcomingLessons(userId, "student");
        homeworkAssignments = await storage.getHomeworkAssignments(userId);
        progress = await storage.getStudentProgress(userId);
        
        // Check and award badges before fetching badges
        await storage.checkAndAwardBadges(userId);
        badges = await storage.getAllBadgesWithStudentStatus(userId);
      }

      res.json({
        stats,
        upcomingLessons,
        homeworkAssignments,
        progress,
        badges,
      });
    } catch (error) {
      console.error("Error fetching student dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Password reset endpoints
  app.post('/api/auth/forgot-password', async (req: any, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Podaj prawidłowy adres email" });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, return success even if email doesn't exist
        return res.json({ message: "Jeśli konto o podanym adresie email istnieje, otrzymasz link do resetowania hasła" });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Save token to database
      await storage.createPasswordResetToken(email, resetToken, expiresAt);
      
      // Send email
      const emailSent = await sendPasswordResetEmail(email, resetToken, user.firstName || undefined);
      
      if (emailSent) {
        res.json({ message: "Link do resetowania hasła został wysłany na podany adres email" });
      } else {
        res.status(500).json({ message: "Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie." });
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Wystąpił błąd. Spróbuj ponownie." });
    }
  });

  app.post('/api/auth/reset-password', async (req: any, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token i nowe hasło są wymagane" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Hasło musi mieć co najmniej 6 znaków" });
      }
      
      // Verify token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token jest nieprawidłowy lub wygasł" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(resetToken.email);
      if (!user) {
        return res.status(404).json({ message: "Nie znaleziono użytkownika" });
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      // Update password
      await storage.updateUserPassword(user.id, passwordHash);
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);
      
      res.json({ message: "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować." });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie." });
    }
  });

  // Progress map endpoints
  app.get('/api/student/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`Progress map request for user: ${userId}`);
      
      const progressData = await storage.getUserProgressData(userId);
      
      // If no progress data exists, initialize with default structure
      if (progressData.length === 0) {
        console.log(`No progress data found for user ${userId}, initializing default structure`);
        await initializeDefaultProgressForUser(userId);
        const newProgressData = await storage.getUserProgressData(userId);
        return res.json(newProgressData);
      }
      
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress data" });
    }
  });

  app.get('/api/student/progress/:subjectId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subjectId } = req.params;
      console.log(`Progress map request for user: ${userId}, subject: ${subjectId}`);
      
      const progressData = await storage.getUserProgressForSubject(userId, subjectId);
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching user progress for subject:", error);
      res.status(500).json({ message: "Failed to fetch progress data" });
    }
  });

  app.patch('/api/student/progress/:subjectId/:levelId/:topicId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subjectId, levelId, topicId } = req.params;
      const updates = req.body;
      
      console.log(`Updating progress for user: ${userId}, subject: ${subjectId}, level: ${levelId}, topic: ${topicId}`);
      
      await storage.updateUserTopicProgress(userId, subjectId, levelId, topicId, updates);
      res.json({ message: "Progress updated successfully" });
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Topic-based learning endpoints
  app.get('/api/student/topic-progression', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const progression = await storage.getStudentTopicProgression(userId);
      res.json(progression);
    } catch (error) {
      console.error("Error fetching topic progression:", error);
      res.status(500).json({ message: "Failed to fetch topic progression" });
    }
  });

  app.get('/api/student/next-topic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const nextTopic = await storage.getNextAvailableTopicForStudent(userId);
      res.json(nextTopic);
    } catch (error) {
      console.error("Error fetching next topic:", error);
      res.status(500).json({ message: "Failed to fetch next topic" });
    }
  });

  // Get next bookable topic for student (for booking new lessons)
  app.get('/api/student/next-bookable-topic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const nextBookableTopic = await storage.getNextBookableTopicForStudent(userId);
      res.json(nextBookableTopic);
    } catch (error) {
      console.error("Error fetching next bookable topic:", error);
      res.status(500).json({ message: "Failed to fetch next bookable topic" });
    }
  });

  // Get student lessons with details for progress page
  app.get('/api/student/lessons-details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const lessons = await storage.getStudentLessonsWithDetails(userId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching student lessons:", error);
      res.status(500).json({ message: "Failed to fetch student lessons" });
    }
  });

  app.get('/api/topic/:topicId/materials', isAuthenticated, async (req: any, res) => {
    try {
      const { topicId } = req.params;
      const materials = await storage.getTopicMaterials(topicId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching topic materials:", error);
      res.status(500).json({ message: "Failed to fetch topic materials" });
    }
  });

  // Endpoint to check if student can book a topic (used by frontend before showing tutor modal)
  app.post('/api/lessons/book-topic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { topicId } = req.body;

      // Validate that student can access this topic
      const nextTopic = await storage.getNextAvailableTopic(userId);
      if (!nextTopic || nextTopic.topicId !== topicId) {
        return res.status(400).json({ message: "Ten temat nie jest jeszcze dostępny" });
      }

      // Check if student already has a booked lesson for this topic
      const existingProgression = await storage.getStudentTopicProgressionByTopic(userId, topicId);
      if (existingProgression && existingProgression.status === "booked") {
        return res.status(400).json({ 
          message: "Masz już zabookowaną lekcję do tego tematu. Nie możesz zarezerwować kolejnej, dopóki obecna się nie zakończy.",
          existingStatus: existingProgression.status 
        });
      }

      // Allow booking for 'in_progress' topics - student can continue working on started topics
      // Check if there are pending lesson invitations for this topic (excluding expired ones)
      const pendingInvitations = await storage.getActivePendingInvitationsForTopic(userId, topicId);
      if (pendingInvitations.length > 0) {
        return res.status(400).json({ 
          message: "Masz już wysłane zaproszenia korepetytorów do tego tematu. Poczekaj na odpowiedź przed wysłaniem kolejnych.",
          pendingCount: pendingInvitations.length,
          status: "pending_invitations",
          invitations: pendingInvitations.map(inv => ({
            tutorName: inv.tutorName,
            sentAt: inv.sentAt,
            expiresAt: inv.expiresAt
          }))
        });
      }

      // If all checks pass, return success (frontend will then show tutor selection modal)
      res.json({ 
        message: "Temat dostępny do rezerwacji",
        topicId,
        canBook: true
      });
    } catch (error) {
      console.error("Error checking topic booking availability:", error);
      res.status(500).json({ message: "Failed to check topic availability" });
    }
  });

  app.post('/api/student/book-topic-lesson', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { topicId, tutorId, scheduledAt } = req.body;

      // Validate that student can access this topic
      const nextTopic = await storage.getNextAvailableTopic(userId);
      if (!nextTopic || nextTopic.topicId !== topicId) {
        return res.status(400).json({ message: "Ten temat nie jest jeszcze dostępny" });
      }

      // Check if student already has a booked or pending lesson for this topic
      const existingProgression = await storage.getStudentTopicProgressionByTopic(userId, topicId);
      if (existingProgression && (existingProgression.status === "booked" || existingProgression.status === "in_progress")) {
        return res.status(400).json({ 
          message: "Masz już zabookowaną lekcję do tego tematu. Nie możesz zarezerwować kolejnej, dopóki obecna się nie zakończy.",
          existingStatus: existingProgression.status 
        });
      }

      // Check if there are pending lesson invitations for this topic
      const pendingInvitations = await storage.getPendingInvitationsForTopic(userId, topicId);
      if (pendingInvitations.length > 0) {
        return res.status(400).json({ 
          message: "Masz już wysłane zaproszenia korepetytorów do tego tematu. Poczekaj na odpowiedź przed wysłaniem kolejnych.",
          pendingCount: pendingInvitations.length 
        });
      }

      // Create lesson with topic ID
      const lessonData = {
        studentId: userId,
        tutorId,
        topicId,
        title: nextTopic.topicName,
        description: nextTopic.topicDescription,
        scheduledAt: new Date(scheduledAt),
        duration: nextTopic.estimatedDuration || 60,
        price: "100.00"
      };

      const lesson = await storage.createLessonFromCalendar(lessonData);

      // Generate Meet link
      const generateMeetId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 3; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        result += '-';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        result += '-';
        for (let i = 0; i < 3; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const meetId = generateMeetId();
      const meetLink = `https://meet.google.com/${meetId}`;

      await storage.updateLesson(lesson.id, { meetLink, meetId });

      res.json({ 
        message: "Lekcja zarezerwowana pomyślnie", 
        lesson: { ...lesson, meetLink, meetId }
      });
    } catch (error) {
      console.error("Error booking topic lesson:", error);
      res.status(500).json({ message: "Failed to book topic lesson" });
    }
  });

  app.post('/api/tutor/complete-topic/:lessonId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { lessonId } = req.params;
      const { rating, feedback } = req.body;

      // Get lesson details
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      if (lesson.tutorId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Complete the lesson
      await storage.updateLessonStatus(lessonId, "completed");
      if (rating) {
        await storage.updateLesson(lessonId, { rating });
      }

      // Increment completed lessons count for loyalty program
      await storage.incrementCompletedLessons(lesson.studentId);
      console.log(`Incremented loyalty count for student ${lesson.studentId}`);

      // Complete the topic and award XP
      const topicId = lesson.topicId;
      if (topicId) {
        // Get topic details for XP reward
        const progression = await storage.getStudentTopicProgression(lesson.studentId);
        const topic = progression.find(t => t.topicId === topicId);
        const xpEarned = topic?.xpReward || 50;

        await storage.completeTopicLesson(lesson.studentId, topicId, xpEarned);
      }

      // Check and process referral bonus if this is the student's first completed lesson
      try {
        const student = await storage.getUser(lesson.studentId);
        if (student?.referredByCode) {
          // Get referral record
          const referral = await storage.getReferralByReferredId(lesson.studentId);
          
          if (referral && referral.status === "pending") {
            // Confirm the referral
            await storage.updateReferralStatus(referral.id, "confirmed");
            
            // Credit bonus to referrer
            const bonusAmount = parseFloat(referral.bonusAmount || "20");
            await storage.creditReferralBalance(referral.referrerId, bonusAmount);
            
            // Get referrer info for notification
            const referrer = await storage.getUser(referral.referrerId);
            
            // Send email notification to referrer
            if (referrer?.email) {
              const { sendReferralBonusEmail } = await import('./email-service');
              await sendReferralBonusEmail(
                referrer.email,
                referrer.firstName || 'User',
                bonusAmount,
                `${student.firstName || ''} ${student.lastName || ''}`.trim()
              ).catch(err => console.error('Failed to send referral bonus email:', err));
            }
            
            console.log(`✓ Referral bonus of ${bonusAmount} PLN credited to user ${referral.referrerId}`);
          }
        }
      } catch (error) {
        // Don't fail the lesson completion if referral processing fails
        console.error('Error processing referral bonus:', error);
      }

      res.json({ message: "Temat ukończony pomyślnie" });
    } catch (error) {
      console.error("Error completing topic:", error);
      res.status(500).json({ message: "Failed to complete topic" });
    }
  });

  app.post('/api/tutor/access-materials/:topicId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { topicId } = req.params;
      
      // Log material access time for quality control
      // This could be expanded to track which specific materials were accessed
      res.json({ message: "Dostęp do materiałów zarejestrowany" });
    } catch (error) {
      console.error("Error accessing materials:", error);
      res.status(500).json({ message: "Failed to access materials" });
    }
  });

  app.post('/api/student/book-lesson', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate Google Meet link for the lesson
      const generateMeetId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        let result = '';
        
        // Pattern: xxx-xxxx-xxx (3-4-3 format)
        for (let i = 0; i < 3; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        result += '-';
        for (let i = 0; i < 4; i++) {
          result += i < 2 ? chars.charAt(Math.floor(Math.random() * chars.length)) : nums.charAt(Math.floor(Math.random() * nums.length));
        }
        result += '-';
        for (let i = 0; i < 3; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
      };

      const meetingId = generateMeetId();
      const meetingUrl = `https://meet.google.com/${meetingId}`;

      const lessonData = insertLessonSchema.parse({
        ...req.body,
        studentId: userId,
        meetLink: meetingUrl,
        meetId: meetingId,
      });

      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error booking lesson:", error);
      res.status(500).json({ message: "Failed to book lesson" });
    }
  });

  // Quiz endpoints for students
  app.get('/api/quizzes/:moduleCode', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const quiz = await storage.getQuizByModule(req.params.moduleCode);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found for this module" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get('/api/quizzes/:quizId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const questions = await storage.getQuizQuestions(req.params.quizId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate request body BEFORE grading logic
      const validatedData = submitQuizAttemptSchema.parse(req.body);

      // Get quiz by ID
      const quiz = await storage.getQuizById(validatedData.quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Get questions for the quiz
      const questions = await storage.getQuizQuestions(validatedData.quizId);
      
      if (questions.length === 0) {
        return res.status(400).json({ message: "Quiz has no questions" });
      }

      // Grade the attempt SERVER-SIDE
      const { gradeQuizAttempt } = await import('./quiz-grading');
      const gradingResult = gradeQuizAttempt(questions, validatedData.answers, quiz.passingScore);

      // Save attempt with SERVER-CALCULATED score
      const attempt = await storage.submitQuizAttempt({
        quizId: validatedData.quizId,
        studentId: userId,
        answers: validatedData.answers,
        score: gradingResult.score,
        passed: gradingResult.passed,
        timeTaken: validatedData.timeTaken || 0,
      });

      // Get all previous attempts for this quiz
      const allAttempts = await storage.getQuizAttemptsByQuiz(validatedData.quizId, userId);
      
      // NEW: Award XP if passed (only on first pass)
      let xpAwarded = 0;
      if (gradingResult.passed) {
        // Check if this is the first time passing this quiz
        const previousPassedAttempts = allAttempts.filter(
          (a: any) => a.passed && a.id !== attempt.id
        );
        
        // Award XP only if this is the first passed attempt
        if (previousPassedAttempts.length === 0) {
          xpAwarded = quiz.xpReward;
          await storage.updateStudentXP(userId, xpAwarded);
          console.log(`Quiz passed! Awarded ${xpAwarded} XP to student ${userId}`);
        } else {
          console.log(`Quiz already passed before - no XP awarded`);
        }
      }

      // Check if student should get help suggestion (3+ failed attempts)
      const failedAttempts = allAttempts.filter((a: any) => !a.passed);
      const suggestHelp = !gradingResult.passed && failedAttempts.length >= 2; // 2 previous + this one = 3 total

      // Return attempt with grading details and XP info
      const response = {
        id: attempt.id,
        quizId: attempt.quizId,
        score: attempt.score,
        passed: attempt.passed,
        timeTaken: attempt.timeTaken,
        questionsDetails: gradingResult.questionsDetails,
        xpAwarded,
        attemptNumber: allAttempts.length + 1,
        suggestHelp,
      };
      
      console.log("Quiz attempt response:", JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error submitting quiz attempt:", error);
      res.status(500).json({ message: "Failed to submit quiz attempt" });
    }
  });

  app.get('/api/quiz-attempts/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const attempts = await storage.getStudentQuizAttempts(userId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      res.status(500).json({ message: "Failed to fetch quiz attempts" });
    }
  });

  app.get('/api/quiz-attempts/:quizId/best', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const attempt = await storage.getBestQuizAttempt(req.params.quizId, userId);
      res.json(attempt || null);
    } catch (error) {
      console.error("Error fetching best quiz attempt:", error);
      res.status(500).json({ message: "Failed to fetch best quiz attempt" });
    }
  });

  // Admin endpoints for questions management
  app.get('/api/admin/questions', isAdminAuthenticated, async (req: any, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post('/api/admin/questions', isAdminAuthenticated, async (req: any, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.patch('/api/admin/questions/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const question = await storage.updateQuestion(id, updates);
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/admin/questions/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuestion(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Admin endpoints for quizzes management
  app.get('/api/admin/quizzes', isAdminAuthenticated, async (req: any, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.post('/api/admin/quizzes', isAdminAuthenticated, async (req: any, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.patch('/api/admin/quizzes/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const quiz = await storage.updateQuiz(id, updates);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete('/api/admin/quizzes/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteQuiz(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // Admin route to get tutors list  
  app.get('/api/admin/tutors', async (req: any, res) => {
    try {
      const tutors = await storage.getTutors();
      res.json({ tutors });
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).json({ message: "Failed to fetch tutors" });
    }
  });

  // Tutor routes
  app.get('/api/tutor/dashboard', async (req: any, res) => {
    try {
      // Check if tutorId is provided in query params (for admin preview) or use authenticated user
      const tutorId = req.query.tutorId || (req.user?.id);
      
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const stats = await storage.getTutorStats(tutorId);
      const upcomingLessons = await storage.getUpcomingLessons(tutorId, "tutor");
      const allLessons = await storage.getLessons(tutorId, "tutor");
      
      // Get pending invitations count
      const pendingInvitations = await storage.getPendingInvitationsForTutor(tutorId);

      res.json({
        stats,
        upcomingLessons,
        allLessons,
        tutorId, // Include the tutorId in response for debugging
        pendingInvitations: pendingInvitations.length
      });
    } catch (error) {
      console.error("Error fetching tutor dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.post('/api/tutor/create-homework', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const homeworkData = insertHomeworkAssignmentSchema.parse(req.body);
      const homework = await storage.createHomeworkAssignment(homeworkData);
      res.json(homework);
    } catch (error) {
      console.error("Error creating homework:", error);
      res.status(500).json({ message: "Failed to create homework" });
    }
  });

  app.patch('/api/tutor/lesson/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      await storage.updateLessonStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating lesson status:", error);
      res.status(500).json({ message: "Failed to update lesson status" });
    }
  });

  // Get pending assignments for tutor (simplified endpoint for testing)
  app.get("/api/tutor/pending-assignments", async (req: any, res) => {
    try {
      const tutorId = req.query.tutorId || "tutor1"; // For demo purposes
      
      const pendingAssignments = await storage.getPendingAssignmentsForTutor(tutorId);
      res.json(pendingAssignments);
    } catch (error) {
      console.error("Error fetching pending assignments:", error);
      res.status(500).json({ message: "Failed to fetch pending assignments" });
    }
  });

  // Tutor responds to assignment
  app.post("/api/tutor/respond-assignment", async (req: any, res) => {
    try {
      const { preferencesId, accept, reason } = req.body;
      
      if (!preferencesId || typeof accept !== 'boolean') {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const result = await storage.respondToAssignment(preferencesId, accept, reason);
      res.json(result);
    } catch (error) {
      console.error("Error responding to assignment:", error);
      res.status(500).json({ message: "Failed to respond to assignment" });
    }
  });

  // Admin routes (for custom admin accounts)
  app.get('/api/admin/dashboard', isAdminAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      const tutors = await storage.getTutors();

      res.json({
        stats,
        tutors,
      });
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Today's lessons for admin analytics
  app.get('/api/admin/todays-lessons', isAdminAuthenticated, async (req: any, res) => {
    try {
      const lessons = await storage.getTodaysLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Error fetching today's lessons:", error);
      res.status(500).json({ message: "Failed to fetch today's lessons" });
    }
  });

  // New registrations today for admin analytics
  app.get('/api/admin/new-registrations', isAdminAuthenticated, async (req: any, res) => {
    try {
      const registrations = await storage.getTodaysRegistrations();
      res.json(registrations);
    } catch (error: any) {
      console.error("Error fetching new registrations:", error);
      res.status(500).json({ message: "Failed to fetch new registrations" });
    }
  });

  // Admin tutors detailed endpoint
  app.get('/api/admin/tutors-detailed', isAdminAuthenticated, async (req: any, res) => {
    try {
      const tutors = await storage.getAllTutors();
      res.json(tutors);
    } catch (error) {
      console.error('Error fetching tutors detailed:', error);
      res.status(500).json({ message: 'Failed to fetch tutors data' });
    }
  });

  // Admin revenue details endpoint
  app.get('/api/admin/revenue-details/:period', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { period } = req.params;
      const revenueDetails = await storage.getRevenueDetails(period);
      res.json(revenueDetails);
    } catch (error) {
      console.error('Error fetching revenue details:', error);
      res.status(500).json({ message: 'Failed to fetch revenue details' });
    }
  });

  // Admin daily revenue endpoint
  app.get('/api/admin/daily-revenue/:period', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { period } = req.params;
      const { type } = req.query;
      const periodType = (type as string) || "month";
      const dailyRevenue = await storage.getDailyRevenue(period, periodType);
      res.json(dailyRevenue);
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      res.status(500).json({ message: 'Failed to fetch daily revenue' });
    }
  });

  // Get all homework assignments for admin view
  app.get('/api/admin/homework', isAdminAuthenticated, async (req: any, res) => {
    try {
      const homeworkAssignments = await storage.getAllHomeworkAssignments();
      res.json(homeworkAssignments);
    } catch (error) {
      console.error("Error fetching homework assignments:", error);
      res.status(500).json({ message: "Failed to fetch homework assignments" });
    }
  });

  // Create new homework assignment
  app.post('/api/admin/homework', isAdminAuthenticated, async (req: any, res) => {
    try {
      const homeworkData = insertHomeworkAssignmentSchema.parse(req.body);
      const homework = await storage.createHomeworkAssignment(homeworkData);
      res.status(201).json(homework);
    } catch (error: any) {
      console.error("Error creating homework assignment:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid homework data", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "Failed to create homework assignment" });
    }
  });

  app.post('/api/admin/homework/:id/auto-grade', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { studentAnswer } = req.body;

      if (!studentAnswer || studentAnswer.trim().length === 0) {
        return res.status(400).json({ message: "Student answer is required" });
      }

      const result = await storage.autoGradeHomework(id, studentAnswer);
      res.json(result);
    } catch (error: any) {
      console.error("Error auto-grading homework:", error);
      res.status(500).json({ message: error.message || "Failed to auto-grade homework" });
    }
  });

  // Referral system settings
  app.get('/api/admin/referral-settings', isAdminAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getReferralSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      res.status(500).json({ message: "Failed to fetch referral settings" });
    }
  });

  app.post('/api/admin/referral-settings', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { bonusAmount, discountPercent } = req.body;
      const adminId = req.session?.adminId || 'admin';

      await storage.updateReferralSetting('referral_bonus_amount', bonusAmount, adminId);
      await storage.updateReferralSetting('referral_discount_percent', discountPercent, adminId);

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating referral settings:", error);
      res.status(500).json({ message: "Failed to update referral settings" });
    }
  });

  app.get('/api/admin/referral-stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getReferralStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Loyalty program admin endpoints
  app.get('/api/admin/loyalty/stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getLoyaltyStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching loyalty stats:", error);
      res.status(500).json({ message: "Failed to fetch loyalty stats" });
    }
  });

  app.get('/api/admin/loyalty/users', isAdminAuthenticated, async (req: any, res) => {
    try {
      const students = await storage.getAllStudents();
      const loyaltyUsers = students.map((student: any) => {
        const completedLessons = student.completedLessonsCount || 0;
        const loyaltyLevel = student.loyaltyLevel || 1;
        const loyaltyBalance = student.loyaltyBalance || "0.00";
        
        const levelNames = ["Nowy", "Stały Klient", "Zaangażowany", "Premium", "VIP"];
        const levelName = levelNames[loyaltyLevel - 1] || "Nowy";
        
        return {
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email,
          email: student.email,
          loyaltyLevel,
          levelName,
          completedLessons,
          loyaltyBalance
        };
      });

      res.json(loyaltyUsers);
    } catch (error) {
      console.error("Error fetching loyalty users:", error);
      res.status(500).json({ message: "Failed to fetch loyalty users" });
    }
  });

  app.post('/api/admin/loyalty/adjust', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { userId, level, balanceChange } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (level !== undefined && (level < 1 || level > 5)) {
        return res.status(400).json({ message: "Loyalty level must be between 1 and 5" });
      }

      await storage.adjustUserLoyalty(userId, level, balanceChange);

      res.json({ message: "Loyalty adjusted successfully" });
    } catch (error: any) {
      console.error("Error adjusting loyalty:", error);
      res.status(500).json({ message: error.message || "Failed to adjust loyalty" });
    }
  });

  app.get('/api/admin/badges', isAdminAuthenticated, async (req: any, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post('/api/admin/badges', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { name, description, icon, category, requirement } = req.body;

      if (!name || !icon || !category) {
        return res.status(400).json({ message: "Name, icon, and category are required" });
      }

      const validCategories = ['progress', 'level', 'xp', 'streak', 'achievement'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: "Invalid category. Must be one of: progress, level, xp, streak, achievement" });
      }

      const badge = await storage.createBadge({
        name,
        description,
        icon,
        category,
        requirement,
      });

      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.put('/api/admin/badges/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, description, icon, category, requirement } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (icon !== undefined) updates.icon = icon;
      if (category !== undefined) {
        const validCategories = ['progress', 'level', 'xp', 'streak', 'achievement'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({ message: "Invalid category. Must be one of: progress, level, xp, streak, achievement" });
        }
        updates.category = category;
      }
      if (requirement !== undefined) updates.requirement = requirement;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No updates provided" });
      }

      const badge = await storage.updateBadge(id, updates);
      res.json(badge);
    } catch (error) {
      console.error("Error updating badge:", error);
      res.status(500).json({ message: "Failed to update badge" });
    }
  });

  app.delete('/api/admin/badges/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBadge(id);
      res.json({ message: "Badge deleted successfully" });
    } catch (error) {
      console.error("Error deleting badge:", error);
      res.status(500).json({ message: "Failed to delete badge" });
    }
  });

  app.post('/api/admin/students/:studentId/badges', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const { badgeId } = req.body;

      if (!badgeId) {
        return res.status(400).json({ message: "Badge ID is required" });
      }

      const adminId = req.session.adminId || req.cookies?.['admin-session'];
      const awardedBadge = await storage.awardBadgeToStudent(studentId, badgeId, adminId);
      
      res.status(201).json({ 
        message: "Badge awarded successfully",
        badge: awardedBadge 
      });
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // Create admin account (for initial setup)
  app.post('/api/admin/create', async (req, res) => {
    try {
      const adminData = insertAdminAccountSchema.parse(req.body);
      const admin = await storage.createAdminAccount(adminData);
      res.json({ message: "Admin account created successfully", adminId: admin.id });
    } catch (error) {
      console.error("Error creating admin account:", error);
      res.status(500).json({ message: "Failed to create admin account" });
    }
  });

  // Get math topics (public route for course management)
  app.get('/api/math-topics', async (req, res) => {
    try {
      const topics = await storage.getMathTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching math topics:", error);
      res.status(500).json({ message: "Failed to fetch math topics" });
    }
  });

  // Course management routes
  app.get('/api/admin/courses', isAdminAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get courses by subject
  app.get('/api/admin/courses/subject/:subjectId', isAdminAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.params;
      const courses = await storage.getCoursesBySubject(subjectId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses by subject:", error);
      res.status(500).json({ message: "Failed to fetch courses by subject" });
    }
  });

  // Admin subject unlock management endpoints
  app.get('/api/admin/subjects-management', isAdminAuthenticated, async (req: any, res) => {
    try {
      const subjects = await storage.getAllSubjectsWithStats();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects for management:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.put('/api/admin/subjects/:subjectId', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { subjectId } = req.params;
      const { available } = req.body;

      const updatedSubject = await storage.updateSubjectAvailability(subjectId, available);
      
      console.log(`Admin ${req.user.id} ${available ? 'unlocked' : 'locked'} subject ${subjectId}`);
      
      res.json(updatedSubject);
    } catch (error) {
      console.error("Error updating subject availability:", error);
      res.status(500).json({ message: "Failed to update subject" });
    }
  });

  // Get courses by subject (for students)
  app.get('/api/courses/subject/:subjectId', isAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.params;
      const courses = await storage.getCoursesBySubject(subjectId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses by subject:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/admin/courses/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/admin/courses', isAdminAuthenticated, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/admin/courses/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertCourseSchema.partial().parse(req.body);
      await storage.updateCourse(id, updates);
      res.json({ message: "Course updated successfully" });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/admin/courses/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCourse(id);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Course lesson management routes
  app.get('/api/admin/courses/:courseId/lessons', isAdminAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const lessons = await storage.getCourseLessons(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching course lessons:", error);
      res.status(500).json({ message: "Failed to fetch course lessons" });
    }
  });

  app.post('/api/admin/courses/:courseId/lessons', isAdminAuthenticated, async (req, res) => {
    try {
      const { courseId } = req.params;
      const lessonData = insertCourseLessonSchema.parse({ ...req.body, courseId });
      const lesson = await storage.createCourseLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating course lesson:", error);
      res.status(500).json({ message: "Failed to create course lesson" });
    }
  });

  app.put('/api/admin/lessons/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertCourseLessonSchema.partial().parse(req.body);
      await storage.updateCourseLesson(id, updates);
      res.json({ message: "Course lesson updated successfully" });
    } catch (error) {
      console.error("Error updating course lesson:", error);
      res.status(500).json({ message: "Failed to update course lesson" });
    }
  });

  app.delete('/api/admin/lessons/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCourseLesson(id);
      res.json({ message: "Course lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting course lesson:", error);
      res.status(500).json({ message: "Failed to delete course lesson" });
    }
  });

  // Removed old conflicting endpoint - using public endpoint at line 2938

  app.post('/api/tutor/availability', isAuthenticated, async (req, res) => {
    try {
      if (!req.user || (req.user.role !== 'tutor' && req.user.role !== 'student')) {
        return res.status(403).json({ message: "Access denied - tutors and students only" });
      }
      
      console.log('Received availability update:', req.body);
      const { availability, slots } = req.body;
      const availabilityData = availability || slots || [];
      
      await storage.updateTutorAvailability(req.user.id, availabilityData);
      res.json({ message: "Availability updated successfully" });
    } catch (error) {
      console.error("Error updating tutor availability:", error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.get('/api/tutor/booked-slots/:tutorId', isAuthenticated, async (req, res) => {
    try {
      const { tutorId } = req.params;
      
      if (!req.user || (req.user.id !== tutorId && req.user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const bookedSlots = await storage.getTutorBookedSlots(tutorId);
      res.json(bookedSlots);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({ message: "Failed to fetch booked slots" });
    }
  });

  // Public routes
  app.get('/api/math-topics', async (req, res) => {
    try {
      const topics = await storage.getMathTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching math topics:", error);
      res.status(500).json({ message: "Failed to fetch math topics" });
    }
  });

  // Get available lesson slots for a topic
  app.get('/api/topic-lesson-slots/:topicId', isAuthenticated, async (req: any, res) => {
    try {
      const { topicId } = req.params;
      const userId = req.user.id;
      
      // Get topic details
      const allTopics = await storage.getMathTopics();
      const topicDetails = allTopics.find(t => t.id === topicId);
      if (!topicDetails) {
        return res.status(404).json({ message: "Temat nie został znaleziony" });
      }

      // Get available tutors for math subject
      const tutors = await storage.getAllAvailableTutors();
      
      // Create available time slots for next 7 days
      const timeSlots = [];
      const now = new Date();
      
      for (let day = 1; day <= 7; day++) {
        const date = new Date(now);
        date.setDate(now.getDate() + day);
        
        // Skip weekends for simplicity (можно убрать если нужно)
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Morning slots (9:00-12:00)
        for (let hour = 9; hour <= 11; hour++) {
          for (const tutor of tutors) {
            const slotTime = new Date(date);
            slotTime.setHours(hour, 0, 0, 0);
            
            timeSlots.push({
              id: `${tutor.id}-${slotTime.toISOString()}`,
              tutorId: tutor.id,
              tutorName: `${tutor.firstName} ${tutor.lastName}`,
              tutorRating: tutor.rating || 5.0,
              tutorExperience: tutor.experience || "2+ lat",
              scheduledAt: slotTime.toISOString(),
              duration: topicDetails.estimatedDuration || 60,
              price: "100.00",
              topicId: topicId,
              topicName: topicDetails.name
            });
          }
        }
        
        // Afternoon slots (14:00-18:00)
        for (let hour = 14; hour <= 17; hour++) {
          for (const tutor of tutors) {
            const slotTime = new Date(date);
            slotTime.setHours(hour, 0, 0, 0);
            
            timeSlots.push({
              id: `${tutor.id}-${slotTime.toISOString()}`,
              tutorId: tutor.id,
              tutorName: `${tutor.firstName} ${tutor.lastName}`,
              tutorRating: tutor.rating || 5.0,
              tutorExperience: tutor.experience || "2+ lat",
              scheduledAt: slotTime.toISOString(),
              duration: topicDetails.estimatedDuration || 60,
              price: "100.00",
              topicId: topicId,
              topicName: topicDetails.name
            });
          }
        }
      }
      
      // Shuffle and limit results
      const shuffledSlots = timeSlots.sort(() => Math.random() - 0.5).slice(0, 20);
      
      res.json({
        topic: topicDetails,
        availableSlots: shuffledSlots
      });
      
    } catch (error) {
      console.error("Error fetching topic lesson slots:", error);
      res.status(500).json({ message: "Failed to fetch available lesson slots" });
    }
  });

  // Topic materials management (admin only)
  app.get('/api/topic-materials/:topicId', isAdminAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const materials = await storage.getTopicMaterials(topicId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching topic materials:", error);
      res.status(500).json({ message: "Failed to fetch topic materials" });
    }
  });

  app.post('/api/topic-materials/:topicId', isAdminAuthenticated, async (req, res) => {
    try {
      const { topicId } = req.params;
      const materialData = req.body;
      const material = await storage.createTopicMaterial(topicId, materialData);
      res.json(material);
    } catch (error) {
      console.error("Error creating topic material:", error);
      res.status(500).json({ message: "Failed to create topic material" });
    }
  });

  app.delete('/api/topic-materials/:materialId', isAdminAuthenticated, async (req, res) => {
    try {
      const { materialId } = req.params;
      await storage.deleteTopicMaterial(materialId);
      res.json({ message: "Material deleted successfully" });
    } catch (error) {
      console.error("Error deleting topic material:", error);
      res.status(500).json({ message: "Failed to delete topic material" });
    }
  });

  app.put('/api/topic-materials/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertTopicMaterialSchema.partial().parse(req.body);
      const material = await storage.updateTopicMaterial(id, updates);
      res.json(material);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid material data", errors: error.errors });
      }
      console.error("Error updating topic material:", error);
      res.status(500).json({ message: "Failed to update topic material" });
    }
  });

  // Math topics management (admin only)
  app.post('/api/math-topics', isAdminAuthenticated, async (req, res) => {
    try {
      const topicData = insertMathTopicSchema.parse(req.body);
      const topic = await storage.createMathTopic(topicData);
      res.json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      console.error("Error creating math topic:", error);
      res.status(500).json({ message: "Failed to create math topic" });
    }
  });

  app.put('/api/math-topics/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertMathTopicSchema.partial().parse(req.body);
      const topic = await storage.updateMathTopic(id, updates);
      res.json(topic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topic data", errors: error.errors });
      }
      console.error("Error updating math topic:", error);
      res.status(500).json({ message: "Failed to update math topic" });
    }
  });

  app.delete('/api/math-topics/:id', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMathTopic(id);
      res.json({ message: "Topic deleted successfully" });
    } catch (error) {
      console.error("Error deleting math topic:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete math topic";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/tutors', async (req, res) => {
    try {
      const tutors = await storage.getTutors();
      res.json(tutors);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).json({ message: "Failed to fetch tutors" });
    }
  });

  // Payout management routes
  app.get('/api/admin/payouts', isAdminAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string;
      let payouts;
      
      if (period) {
        payouts = await storage.getPayoutsByPeriod(period);
      } else {
        payouts = await storage.getAllPayouts();
      }
      
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.get('/api/admin/tutors', isAdminAuthenticated, async (req, res) => {
    try {
      const tutors = await storage.getAllTutors();
      res.json({ tutors });
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).json({ message: "Failed to fetch tutors" });
    }
  });

  app.get('/api/admin/payout-stats', isAdminAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string;
      const stats = await storage.getPayoutStats(period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payout stats:", error);
      res.status(500).json({ message: "Failed to fetch payout stats" });
    }
  });

  app.post('/api/admin/payouts/generate', isAdminAuthenticated, async (req, res) => {
    try {
      console.log("Payout generation request:", req.body);
      const { tutorId, period, amount, notes } = req.body;
      
      if (!tutorId || !period) {
        console.log("Missing required fields - tutorId:", tutorId, "period:", period);
        return res.status(400).json({ message: "Tutor ID and period are required" });
      }

      console.log("Generating payout for tutor:", tutorId, "period:", period, "amount:", amount);
      const payout = await storage.generatePayout(tutorId, period, notes, amount);
      console.log("Payout generated successfully:", payout.id);
      res.json(payout);
    } catch (error: any) {
      console.error("Error generating payout:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        message: error.message || "Failed to generate payout",
        details: error.stack 
      });
    }
  });

  app.post('/api/admin/payouts/:id/process', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const payout = await storage.processPayout(id);
      res.json(payout);
    } catch (error: any) {
      console.error("Error processing payout:", error);
      res.status(500).json({ message: "Failed to process payout" });
    }
  });

  app.post('/api/admin/payouts/:id/mark-paid', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const payout = await storage.markPayoutAsPaid(id);
      res.json(payout);
    } catch (error: any) {
      console.error("Error marking payout as paid:", error);
      res.status(500).json({ message: "Failed to mark payout as paid" });
    }
  });

  // Admin payout routes
  app.get('/api/admin/payouts/:period', isAdminAuthenticated, async (req, res) => {
    try {
      const { period } = req.params;
      const payouts = await storage.getPayoutsByPeriod(period);
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts by period:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.get('/api/admin/payouts', isAdminAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string;
      const payouts = period 
        ? await storage.getPayoutsByPeriod(period)
        : await storage.getAllPayouts();
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.get('/api/admin/payout-stats/:period', isAdminAuthenticated, async (req, res) => {
    try {
      const { period } = req.params;
      const stats = await storage.getPayoutStats(period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payout stats by period:", error);
      res.status(500).json({ message: "Failed to fetch payout stats" });
    }
  });

  app.get('/api/admin/payouts/stats', isAdminAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || "2025-01";
      const stats = await storage.getPayoutStats(period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching payout stats:", error);
      res.status(500).json({ message: "Failed to fetch payout stats" });
    }
  });

  app.get('/api/admin/lessons', isAdminAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string;
      const lessons = period 
        ? await storage.getLessonsByPeriod(period)
        : await storage.getAllLessons();
      res.json(lessons);
    } catch (error: any) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // Tutor routes
  app.patch('/api/tutor/lessons/:id', async (req, res) => {
    try {
      const lessonId = req.params.id;
      const updates = req.body;
      await storage.updateLesson(lessonId, updates);
      res.json({ message: "Lesson updated successfully" });
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.patch('/api/tutor/homework/:id/grade', async (req, res) => {
    try {
      const homeworkId = req.params.id;
      const { grade, feedback, xpAwarded } = req.body;
      
      // Grade the homework
      await storage.gradeHomework(homeworkId, grade, feedback);
      
      // Award XP to student (this would need the studentId from homework record)
      // For demo purposes, we'll use a mock student ID
      if (xpAwarded > 0) {
        await storage.awardXP("student1", xpAwarded);
      }
      
      res.json({ message: "Homework graded and XP awarded successfully" });
    } catch (error: any) {
      console.error("Error grading homework:", error);
      res.status(500).json({ message: "Failed to grade homework" });
    }
  });

  // Student homework routes
  app.get('/api/student/homework', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const homework = await storage.getHomeworkAssignments(userId);
      res.json(homework);
    } catch (error) {
      console.error("Error fetching homework assignments:", error);
      res.status(500).json({ message: "Failed to fetch homework assignments" });
    }
  });

  app.post('/api/homework', isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId, title, description, dueDate, totalTasks } = req.body;
      
      const homework = await storage.createHomeworkAssignment({
        lessonId,
        title,
        description,
        dueDate: new Date(dueDate),
        totalTasks,
        status: "assigned",
      });
      
      res.json(homework);
    } catch (error) {
      console.error("Error creating homework assignment:", error);
      res.status(500).json({ message: "Failed to create homework assignment" });
    }
  });



  // User management routes
  app.get('/api/admin/students', isAdminAuthenticated, async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/admin/tutors-detailed', isAdminAuthenticated, async (req, res) => {
    try {
      const tutors = await storage.getAllTutorsDetailed();
      res.json(tutors);
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).json({ message: "Failed to fetch tutors" });
    }
  });

  app.patch('/api/admin/users/:id/activate', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.toggleUserStatus(id, true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  app.patch('/api/admin/users/:id/deactivate', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.toggleUserStatus(id, false);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  app.patch('/api/admin/tutors/:id/verify', isAdminAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.verifyTutor(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying tutor:", error);
      res.status(500).json({ message: "Failed to verify tutor" });
    }
  });

  // Calendar API routes
  app.get('/api/calendar/events/:userId/:month', async (req: any, res) => {
    try {
      const { userId, month } = req.params;
      
      console.log(`Calendar endpoint called: userId=${userId}, month=${month}`);
      
      if (!month) {
        return res.status(400).json({ message: "Month parameter is required" });
      }

      const [year, monthNum] = month.toString().split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // If userId is "all", fetch events for all students
      let events;
      if (userId === "all") {
        events = await storage.getAllCalendarEventsByMonth(startDate.toISOString(), endDate.toISOString());
      } else {
        events = await storage.getCalendarEvents(
          userId,
          startDate.toISOString(),
          endDate.toISOString()
        );
      }
      
      console.log(`Returning ${events.length} events`);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  // Endpoint for all calendar events (admin summary view)
  app.get('/api/calendar/events/all/:month', async (req, res) => {
    try {
      const { month } = req.params;
      
      console.log(`All calendar events endpoint called: month=${month}`);
      
      if (!month) {
        return res.status(400).json({ message: "Month parameter is required" });
      }

      const [year, monthNum] = month.toString().split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      
      console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const events = await storage.getAllCalendarEventsByMonth(startDate.toISOString(), endDate.toISOString());
      
      console.log(`Returning ${events.length} all calendar events`);
      res.json(events);
    } catch (error) {
      console.error("Error fetching all calendar events:", error);
      res.status(500).json({ message: "Failed to fetch all calendar events" });
    }
  });

  // Legacy endpoint for backwards compatibility  
  app.get('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { month } = req.query;
      
      if (!month) {
        return res.status(400).json({ message: "Month parameter is required" });
      }

      const [year, monthNum] = month.toString().split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
      
      const events = await storage.getCalendarEvents(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post('/api/calendar/events', async (req: any, res) => {
    try {
      const userId = req.body.userId || "demo-user";
      let eventBody = { ...req.body, userId };
      
      // Generate Google Meet link if requested
      if (req.body.generateMeetLink && !req.body.meetingUrl) {
        try {
          const { googleMeetService } = await import('./googleMeetService');
          
          const startTime = new Date(req.body.startTime);
          const endTime = new Date(req.body.endTime);
          
          const meetDetails = await googleMeetService.createMeetLink(
            req.body.title || 'Wydarzenie kalendarza',
            startTime,
            endTime,
            [] // No attendees for calendar events
          );
          
          eventBody.meetingUrl = meetDetails.meetLink;
        } catch (error) {
          console.error('Error generating Google Meet link for calendar event:', error);
          // Don't create event if Meet link generation fails
          return res.status(500).json({ message: "Failed to generate Google Meet link" });
        }
      }
      
      // Skip schema validation for now and create event directly
      const eventData = {
        userId: eventBody.userId,
        title: eventBody.title,
        description: eventBody.description || null,
        startTime: new Date(eventBody.startTime),
        endTime: new Date(eventBody.endTime),
        type: eventBody.type || "custom",
        lessonId: eventBody.lessonId || null,
        color: eventBody.color || "#3b82f6",
        meetingUrl: eventBody.meetingUrl || null,
        isRecurring: eventBody.isRecurring || false,
        recurrenceRule: eventBody.recurrenceRule || null,
        googleCalendarEventId: eventBody.googleCalendarEventId || null,
        icalUid: eventBody.icalUid || null
      };
      
      // If this is a lesson type event, create an actual lesson
      if (eventBody.type === "lesson") {
        const currentUser = await storage.getUser(eventBody.userId);
        
        // Calculate duration in minutes
        const startTime = new Date(eventBody.startTime);
        const endTime = new Date(eventBody.endTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        if (currentUser?.role === "student") {
          // Student creating lesson - use first available tutor from database
          const lessonData = {
            topicId: "1", // Default topic
            studentId: eventBody.userId,
            tutorId: "tutor1", // Use tutor1 which exists in the database
            title: eventBody.title,
            description: eventBody.description || "Lekcja matematyki",
            scheduledAt: startTime,
            duration: duration,
            price: "60.00", // Default price
            status: "scheduled" as const
          };
          
          try {
            const lesson = await storage.createLessonFromCalendar(lessonData);
            eventData.lessonId = lesson.id;
            // Keep user's selected color
          } catch (error) {
            console.error("Failed to create lesson, creating event only:", error);
            // If lesson creation fails, still create the calendar event
            eventData.type = "custom";
          }
        } else if (currentUser?.role === "tutor") {
          // Tutor creating lesson - use the current logged in user (student) as default
          const lessonData = {
            topicId: "1", // Default topic
            studentId: "45702223", // Current logged user ID
            tutorId: eventBody.userId,
            title: eventBody.title,
            description: eventBody.description || "Lekcja matematyki",
            scheduledAt: startTime,
            duration: duration,
            price: "60.00", // Default price
            status: "scheduled" as const
          };
          
          try {
            const lesson = await storage.createLessonFromCalendar(lessonData);
            eventData.lessonId = lesson.id;
            // Keep user's selected color
          } catch (error) {
            console.error("Failed to create lesson, creating event only:", error);
            // If lesson creation fails, still create the calendar event
            eventData.type = "custom";
          }
        }
      }
      
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ message: "Failed to create calendar event", error: error.message });
    }
  });

  app.patch('/api/calendar/events/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Only allow updating events owned by the user
      const updates = req.body;
      await storage.updateCalendarEvent(id, updates);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete('/api/calendar/events/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCalendarEvent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Google Meet integration
  app.post('/api/lessons/:id/generate-meet', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.generateMeetLink(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error generating Google Meet link:", error);
      res.status(500).json({ message: "Failed to generate Google Meet link" });
    }
  });

  // Calendar export routes
  app.get('/api/calendar/export/google', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const events = await storage.getCalendarEvents(userId, start.toString(), end.toString());
      
      // Generate Google Calendar URL
      const googleCalUrl = events.map(event => {
        const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}`;
      });

      res.json({ urls: googleCalUrl });
    } catch (error) {
      console.error("Error exporting to Google Calendar:", error);
      res.status(500).json({ message: "Failed to export to Google Calendar" });
    }
  });

  app.get('/api/calendar/export/ical', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }

      const events = await storage.getCalendarEvents(userId, start.toString(), end.toString());
      
      // Generate iCal format
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MateMaster//Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      events.forEach(event => {
        const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        
        icalContent.push(
          'BEGIN:VEVENT',
          `UID:${event.id}@matemaster.pl`,
          `DTSTART:${startDate}Z`,
          `DTEND:${endDate}Z`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description || ''}`,
          `STATUS:CONFIRMED`,
          'END:VEVENT'
        );
      });

      icalContent.push('END:VCALENDAR');

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="matemaster-calendar.ics"');
      res.send(icalContent.join('\r\n'));
    } catch (error) {
      console.error("Error exporting to iCal:", error);
      res.status(500).json({ message: "Failed to export to iCal" });
    }
  });

  // Users endpoint for messaging (restricted access)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      let allowedUsers: any[] = [];

      if (currentUser.role === 'student') {
        // Students can message admins and all tutors
        const admins = await storage.getAllAdmins();
        const allTutors = await storage.getAllTutors();
        
        allowedUsers = [
          ...admins.map((admin: any) => ({ ...admin, type: 'admin' })),
          ...allTutors.map((tutor: any) => ({ ...tutor, type: 'tutor' }))
        ];
      } else if (currentUser.role === 'tutor') {
        // Tutors can message admins and their assigned students
        const admins = await storage.getAllAdmins();
        const assignedStudents = await storage.getTutorAssignedStudents(userId);
        
        allowedUsers = [
          ...admins.map((admin: any) => ({ ...admin, type: 'admin' })),
          ...assignedStudents.map((student: any) => ({ ...student, type: 'student' }))
        ];
      } else if (currentUser.role === 'admin') {
        // Admins can message everyone
        const students = await storage.getAllStudents();
        const tutors = await storage.getTutors();
        
        allowedUsers = [
          ...students.map((s: any) => ({ ...s, type: 'student' })),
          ...tutors.map((t: any) => ({ ...t, type: 'tutor' }))
        ];
      }
      
      res.json(allowedUsers);
    } catch (error) {
      console.error("Error fetching allowed users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Messages routes
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Nie udało się pobrać rozmów" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.body;
      
      if (!otherUserId) {
        return res.status(400).json({ message: "ID drugiego użytkownika jest wymagane" });
      }

      // Check if conversation is allowed based on user roles
      const isAllowed = await storage.isConversationAllowed(userId, otherUserId);
      if (!isAllowed) {
        return res.status(403).json({ message: "Nie masz uprawnień do rozpoczęcia tej rozmowy" });
      }
      
      const conversation = await storage.getOrCreateConversation(userId, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Nie udało się utworzyć rozmowy" });
    }
  });

  app.get("/api/conversations/:conversationId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await storage.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Nie udało się pobrać wiadomości" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      const { content, messageType } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Treść wiadomości jest wymagana" });
      }
      
      // Filter profanity from message content
      const filteredContent = filterProfanity(content.trim());
      const profanitySeverity = getProfanitySeverity(content.trim());
      
      // Log if severe profanity was detected (for potential moderation)
      if (profanitySeverity >= 2) {
        console.log(`Profanity detected in message from user ${userId}, severity: ${profanitySeverity}`);
      }
      
      const message = await storage.sendMessage({
        conversationId,
        senderId: userId,
        content: filteredContent,
        messageType: messageType || "text",
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Nie udało się wysłać wiadomości" });
    }
  });

  app.patch("/api/conversations/:conversationId/read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      
      await storage.markConversationAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Nie udało się oznaczyć rozmowy jako przeczytanej" });
    }
  });

  // Subject management routes for multi-subject platform
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjectsWithEnrollmentData();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Quiz management endpoints (Admin only)
  app.post('/api/admin/questions', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Validate request body
      const validatedData = insertQuestionSchema.parse(req.body);
      
      const question = await storage.createQuestion(validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.get('/api/admin/questions', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { moduleCode } = req.query;
      const questions = moduleCode 
        ? await storage.getQuestionsByModule(moduleCode as string)
        : await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.patch('/api/admin/questions/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Validate request body (partial for PATCH)
      const validatedData = insertQuestionSchema.partial().parse(req.body);
      
      const question = await storage.updateQuestion(req.params.id, validatedData);
      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete('/api/admin/questions/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  app.post('/api/admin/quizzes', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Validate request body
      const validatedData = insertQuizSchema.parse(req.body);
      
      const quiz = await storage.createQuiz(validatedData);
      res.json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  app.get('/api/admin/quizzes', isAdminAuthenticated, async (req: any, res) => {
    try {
      const quizzes = await storage.getAllQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.patch('/api/admin/quizzes/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Validate request body (partial for PATCH)
      const validatedData = insertQuizSchema.partial().parse(req.body);
      
      const quiz = await storage.updateQuiz(req.params.id, validatedData);
      res.json(quiz);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete('/api/admin/quizzes/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  app.post('/api/admin/quizzes/:quizId/questions', isAdminAuthenticated, async (req: any, res) => {
    try {
      // Validate request body
      const validatedData = addQuestionToQuizSchema.parse(req.body);
      
      const quizQuestion = await storage.addQuestionToQuiz(
        req.params.quizId, 
        validatedData.questionId, 
        validatedData.order
      );
      res.json(quizQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error adding question to quiz:", error);
      res.status(500).json({ message: "Failed to add question to quiz" });
    }
  });

  app.delete('/api/admin/quizzes/:quizId/questions/:questionId', isAdminAuthenticated, async (req: any, res) => {
    try {
      await storage.removeQuestionFromQuiz(req.params.quizId, req.params.questionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing question from quiz:", error);
      res.status(500).json({ message: "Failed to remove question from quiz" });
    }
  });

  // Mailing list endpoints
  app.post('/api/mailing-list/subscribe', async (req, res) => {
    try {
      const { email, subjectId } = req.body;
      
      if (!email || !subjectId) {
        return res.status(400).json({ message: "Email and subject ID are required" });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const subscription = await storage.subscribeToMailingList(email, subjectId);
      res.status(201).json({ message: "Successfully subscribed to mailing list", subscription });
    } catch (error) {
      console.error("Error subscribing to mailing list:", error);
      res.status(500).json({ message: "Failed to subscribe to mailing list" });
    }
  });

  app.post('/api/mailing-list/unsubscribe', async (req, res) => {
    try {
      const { email, subjectId } = req.body;
      
      if (!email || !subjectId) {
        return res.status(400).json({ message: "Email and subject ID are required" });
      }

      await storage.unsubscribeFromMailingList(email, subjectId);
      res.json({ message: "Successfully unsubscribed from mailing list" });
    } catch (error) {
      console.error("Error unsubscribing from mailing list:", error);
      res.status(500).json({ message: "Failed to unsubscribe from mailing list" });
    }
  });

  app.get('/api/admin/mailing-list/:subjectId', isAdminAuthenticated, async (req, res) => {
    try {
      const { subjectId } = req.params;
      const subscriptions = await storage.getMailingListSubscriptions(subjectId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching mailing list subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch mailing list subscriptions" });
    }
  });

  app.get('/api/student-subjects/:studentId', isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      
      // Security check: users can only access their own subjects
      if (req.user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const enrollments = await storage.getStudentSubjects(studentId);
      
      // Transform to include subject details
      const subjects = await storage.getSubjects();
      const enrolledSubjects = enrollments.map(enrollment => {
        const subject = subjects.find(s => s.id === enrollment.subjectId);
        return {
          id: subject?.id || enrollment.subjectId,
          name: subject?.name || enrollment.subjectId,
          status: enrollment.status,
          available: subject?.available || false
        };
      }).filter(subject => subject.status === 'active' && subject.available);
      
      res.json(enrolledSubjects);
    } catch (error) {
      console.error("Error fetching student subjects:", error);
      res.status(500).json({ message: "Failed to fetch student subjects" });
    }
  });

  app.post('/api/enroll-subject', isAuthenticated, async (req, res) => {
    try {
      const { studentId, subjectId } = req.body;
      const enrollment = await storage.enrollInSubject(studentId, subjectId);
      res.json(enrollment);
    } catch (error) {
      console.error("Error enrolling in subject:", error);
      res.status(500).json({ message: "Failed to enroll in subject" });
    }
  });

  // Student availability endpoints
  app.get('/api/student/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Access denied - students only" });
      }

      // For now, students will use the same availability structure as tutors
      // This allows for consistent UI and future expansion
      const availability = await storage.getTutorHourlyAvailabilityForTutor(userId);
      console.log(`Returning ${availability.length} availability slots for student ${userId}`);
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching student availability:", error);
      res.status(500).json({ message: error.message || "Failed to fetch availability" });
    }
  });

  app.post('/api/student/availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "student") {
        return res.status(403).json({ message: "Access denied - students only" });
      }

      const { availability } = req.body;
      
      // Convert student availability format to the format that updateTutorHourlyAvailabilityFromSlots expects
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const slots = availability.map((slot: any) => ({
        day: dayNames[slot.dayOfWeek], // Convert numeric dayOfWeek to day name
        hour: parseInt(slot.hour.split(':')[0]), // Convert "10:00" to 10
        isSelected: slot.isAvailable // Map isAvailable to isSelected
      }));

      console.log(`Converting ${availability.length} slots for student ${userId}:`, slots.slice(0, 3));
      await storage.updateTutorHourlyAvailabilityFromSlots(userId, slots);
      console.log(`Updated availability for student ${userId}: ${slots.filter((s: any) => s.isAvailable).length} available slots`);
      
      res.json({ message: "Availability updated successfully" });
    } catch (error: any) {
      console.error("Error updating student availability:", error);
      res.status(500).json({ message: error.message || "Failed to update availability" });
    }
  });

  // Featured tutor subscription endpoints
  app.post('/api/tutor/featured/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "tutor") {
        return res.status(403).json({ message: "Access denied - tutors only" });
      }
      const stripeClient = getStripeClient(res);
      if (!stripeClient) return;

      // Check if tutor already has active featured subscription
      const tutorProfile = await storage.getTutorProfile(userId);
      if (tutorProfile?.isFeatured && tutorProfile.featuredExpiresAt && new Date(tutorProfile.featuredExpiresAt) > new Date()) {
        return res.status(400).json({ message: "You already have an active featured subscription" });
      }

      // Create Stripe customer if doesn't exist
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeClient.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: userId,
            type: "tutor_featured"
          }
        });
        stripeCustomerId = customer.id;
        await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
      }

      // Create subscription for 50 PLN monthly
      const subscription = await stripeClient.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency: 'pln',
            product_data: {
              name: 'SchoolMaster - Status Polecany',
              description: 'Miesięczna subskrypcja statusu "Polecany" dla korepetytorów'
            },
            unit_amount: 5000, // 50 PLN in grosze
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          type: "tutor_featured"
        }
      });

      // Update tutor profile with subscription info
      await storage.updateTutorProfile(userId, {
        featuredSubscriptionId: subscription.id,
      });

      const latestInvoice = subscription.latest_invoice as any;
      const clientSecret = latestInvoice?.payment_intent?.client_secret;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        amount: 50
      });
    } catch (error: any) {
      console.error("Error creating featured subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create featured subscription" });
    }
  });

  app.post('/api/tutor/featured/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "tutor") {
        return res.status(403).json({ message: "Access denied - tutors only" });
      }
      const stripeClient = getStripeClient(res);
      if (!stripeClient) return;

      const tutorProfile = await storage.getTutorProfile(userId);
      if (!tutorProfile?.featuredSubscriptionId) {
        return res.status(400).json({ message: "No active featured subscription found" });
      }

      // Cancel the Stripe subscription
      await stripeClient.subscriptions.cancel(tutorProfile.featuredSubscriptionId);

      // Update tutor profile
      await storage.updateTutorProfile(userId, {
        isFeatured: false,
        featuredExpiresAt: null,
        featuredSubscriptionId: null,
      });

      res.json({ message: "Featured subscription cancelled successfully" });
    } catch (error: any) {
      console.error("Error cancelling featured subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel featured subscription" });
    }
  });

  // Buy featured status with tutor balance (prepaid)
  app.post('/api/tutor/featured/buy-with-balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "tutor") {
        return res.status(403).json({ message: "Access denied - tutors only" });
      }

      // Check if tutor already has active featured subscription
      const tutorProfile = await storage.getTutorProfile(userId);
      if (tutorProfile?.isFeatured && tutorProfile.featuredExpiresAt && new Date(tutorProfile.featuredExpiresAt) > new Date()) {
        return res.status(400).json({ message: "You already have an active featured subscription" });
      }

      // Check tutor balance (55 PLN required)
      const balance = await storage.getUserBalance(userId);
      const requiredAmount = 55.00;
      
      if (parseFloat(balance.toString()) < requiredAmount) {
        return res.status(400).json({ 
          message: "Insufficient balance", 
          required: requiredAmount,
          current: parseFloat(balance.toString())
        });
      }

      // Deduct from balance
      await storage.updateUserBalance(userId, -requiredAmount, "featured_status_purchase", "Zakup statusu Polecany (1 miesiąc)");

      // Activate featured status for 1 month
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await storage.updateTutorProfile(userId, {
        isFeatured: true,
        featuredExpiresAt: expiresAt,
        lastFeaturedPayment: new Date(),
        featuredSubscriptionId: null // No Stripe subscription for balance payments
      });

      res.json({
        message: "Featured status activated successfully",
        expiresAt,
        newBalance: parseFloat(balance.toString()) - requiredAmount
      });
    } catch (error: any) {
      console.error("Error buying featured status with balance:", error);
      res.status(500).json({ message: error.message || "Failed to purchase featured status" });
    }
  });

  app.get('/api/tutor/featured/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "tutor") {
        return res.status(403).json({ message: "Access denied - tutors only" });
      }

      const tutorProfile = await storage.getTutorProfile(userId);
      const now = new Date();
      
      let isActive = false;
      let expiresAt = null;
      let subscriptionId = null;
      
      if (tutorProfile?.isFeatured && tutorProfile.featuredExpiresAt) {
        isActive = new Date(tutorProfile.featuredExpiresAt) > now;
        expiresAt = tutorProfile.featuredExpiresAt;
        subscriptionId = tutorProfile.featuredSubscriptionId;
      }

      res.json({
        isFeatured: isActive,
        expiresAt,
        subscriptionId,
        monthlyPrice: 50
      });
    } catch (error: any) {
      console.error("Error fetching featured status:", error);
      res.status(500).json({ message: error.message || "Failed to fetch featured status" });
    }
  });

  // Stripe webhook for handling subscription events
  app.post('/api/stripe/webhook', async (req, res) => {
    try {
      const stripeClient = getStripeClient(res);
      const webhookSecret = getStripeWebhookSecret(res);
      if (!stripeClient || !webhookSecret) return;
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripeClient.webhooks.constructEvent(req.body, sig!, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any;
          const subscriptionData = invoice.subscription_details || invoice.lines?.data?.[0];
          if (invoice.subscription && subscriptionData?.metadata?.type === 'tutor_featured') {
            const userId = subscriptionData.metadata.userId;
            const expiresAt = new Date();
            expiresAt.setMonth(expiresAt.getMonth() + 1); // Add 1 month

            await storage.updateTutorProfile(userId, {
              isFeatured: true,
              featuredExpiresAt: expiresAt,
              lastFeaturedPayment: new Date(),
            });
            
            console.log(`Featured subscription activated for tutor ${userId} until ${expiresAt}`);
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as any;
          const failedSubscriptionData = failedInvoice.subscription_details || failedInvoice.lines?.data?.[0];
          if (failedInvoice.subscription && failedSubscriptionData?.metadata?.type === 'tutor_featured') {
            const userId = failedSubscriptionData.metadata.userId;
            
            await storage.updateTutorProfile(userId, {
              isFeatured: false,
            });
            
            console.log(`Featured subscription payment failed for tutor ${userId}`);
          }
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as any;
          if (deletedSubscription.metadata?.type === 'tutor_featured') {
            const userId = deletedSubscription.metadata.userId;
            
            await storage.updateTutorProfile(userId, {
              isFeatured: false,
              featuredExpiresAt: null,
              featuredSubscriptionId: null,
            });
            
            console.log(`Featured subscription cancelled for tutor ${userId}`);
          }
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook error' });
    }
  });

  // Manual badge check endpoint (for testing)
  app.post('/api/student/check-badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const newBadges = await storage.checkAndAwardBadges(userId);
      res.json({ 
        message: `Checked badges for student ${userId}`,
        newBadges: newBadges,
        count: newBadges.length
      });
    } catch (error) {
      console.error("Error checking badges:", error);
      res.status(500).json({ message: "Failed to check badges" });
    }
  });

  // Payment System Routes
  
  // Get user balance
  app.get('/api/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const balance = await storage.getUserBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Get balance transactions history
  app.get('/api/balance/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getBalanceTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching balance transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get loyalty program status
  app.get('/api/loyalty/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const loyaltyStatus = await storage.getLoyaltyStatus(userId);
      
      if (!loyaltyStatus) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(loyaltyStatus);
    } catch (error) {
      console.error("Error fetching loyalty status:", error);
      res.status(500).json({ message: "Failed to fetch loyalty status" });
    }
  });

  // Create payment intent for balance top-up
  app.post('/api/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      const stripeClient = getStripeClient(res);
      if (!stripeClient) return;

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "pln",
        metadata: {
          userId: req.user.id,
          type: "balance_topup"
        }
      });

      console.log('Payment intent created:', paymentIntent.id, 'clientSecret:', paymentIntent.client_secret);
      
      if (!paymentIntent.client_secret) {
        console.error('Missing client_secret in payment intent:', paymentIntent);
        return res.status(500).json({ message: "Missing client secret from Stripe" });
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Process lesson payment
  app.post('/api/lessons/:lessonId/pay', isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const { method, stripePaymentIntentId } = req.body;
      const userId = req.user.id;

      // Validate method
      if (!['balance', 'stripe'].includes(method)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      if (method === 'stripe') {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) return;
      }

      // Check if lesson is already paid
      const existingPayment = await storage.getLessonPayment(lessonId);
      if (existingPayment && existingPayment.status === 'completed') {
        return res.status(400).json({ message: "Lesson is already paid" });
      }

      const payment = await storage.processLessonPayment(lessonId, userId, method, stripePaymentIntentId);
      res.json(payment);
    } catch (error: any) {
      console.error("Error processing lesson payment:", error);
      if (error.message === "Insufficient balance") {
        return res.status(400).json({ message: "Niewystarczające środki na koncie" });
      }
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Get lesson payment status
  app.get('/api/lessons/:lessonId/payment', isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const payment = await storage.getLessonPayment(lessonId);
      res.json(payment || { status: 'unpaid' });
    } catch (error) {
      console.error("Error fetching lesson payment:", error);
      res.status(500).json({ message: "Failed to fetch payment status" });
    }
  });



  // Create payment intent for direct lesson payment
  app.post('/api/lessons/:lessonId/create-payment-intent', isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;
      const stripeClient = getStripeClient(res);
      if (!stripeClient) return;
      
      // Get lesson details to calculate amount
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Get tutor's hourly rate
      const tutorProfile = await storage.getTutorProfile(lesson.tutorId);
      const hourlyRate = parseFloat(tutorProfile?.hourlyRate || "100.00");
      const duration = lesson.duration || 60;
      let amount = (hourlyRate * duration / 60);
      
      // Get user data for referral and loyalty calculations
      const user = await storage.getUser(userId);
      let referralDiscount = 0;
      let loyaltyDiscount = 0;
      let loyaltyBalanceUsed = 0;
      let referralBalanceUsed = 0;
      let appliedReferralCode = false;
      let appliedLoyaltyLevel = 0;
      
      // Check for referral discount (5% off first purchase) - using centralized eligibility check
      // NOTE: Loyalty discounts DO NOT stack with referral discounts (user gets one or the other)
      const isEligibleForDiscount = await storage.checkReferralDiscountEligibility(userId);
      if (isEligibleForDiscount) {
        // Apply 5% discount for first purchase (server-side validated)
        const discountSetting = await storage.getSystemSetting('referral_first_purchase_discount');
        const discountPercentage = discountSetting ? parseFloat(discountSetting.value) : 5;
        referralDiscount = amount * (discountPercentage / 100);
        amount = amount - referralDiscount;
        appliedReferralCode = true;
        console.log(`✓ Applied ${discountPercentage}% referral discount (${referralDiscount.toFixed(2)} PLN) for user ${userId} first purchase`);
      } else {
        // If not eligible for referral discount, check for loyalty discount
        const loyaltyStatus = await storage.getLoyaltyStatus(userId);
        if (loyaltyStatus && loyaltyStatus.discount > 0) {
          loyaltyDiscount = amount * (loyaltyStatus.discount / 100);
          amount = amount - loyaltyDiscount;
          appliedLoyaltyLevel = loyaltyStatus.level;
          console.log(`✓ Applied ${loyaltyStatus.discount}% loyalty discount (${loyaltyDiscount.toFixed(2)} PLN) for user ${userId} - Level ${loyaltyStatus.level}`);
        }
      }
      
      // Check for available loyalty balance and auto-deduct
      const loyaltyBalance = parseFloat(user?.loyaltyBalance || "0");
      if (loyaltyBalance > 0) {
        loyaltyBalanceUsed = Math.min(loyaltyBalance, amount);
        amount = amount - loyaltyBalanceUsed;
        console.log(`✓ Auto-applying ${loyaltyBalanceUsed.toFixed(2)} PLN from user ${userId} loyalty balance (available: ${loyaltyBalance.toFixed(2)} PLN)`);
      }
      
      // Check for available referral balance and auto-deduct
      const referralBalance = parseFloat(user?.referralBalance || "0");
      if (referralBalance > 0) {
        // Server-side validation: Auto-deduct available balance (up to the remaining amount)
        referralBalanceUsed = Math.min(referralBalance, amount);
        amount = amount - referralBalanceUsed;
        console.log(`✓ Auto-applying ${referralBalanceUsed.toFixed(2)} PLN from user ${userId} referral balance (available: ${referralBalance.toFixed(2)} PLN)`);
      }
      
      // Ensure amount is not negative
      amount = Math.max(0, amount);

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "pln",
        metadata: {
          userId,
          lessonId,
          type: "direct_lesson_payment",
          referralDiscount: referralDiscount.toFixed(2),
          loyaltyDiscount: loyaltyDiscount.toFixed(2),
          loyaltyBalanceUsed: loyaltyBalanceUsed.toFixed(2),
          referralBalanceUsed: referralBalanceUsed.toFixed(2),
          appliedReferralCode: appliedReferralCode.toString(),
          appliedLoyaltyLevel: appliedLoyaltyLevel.toString()
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        originalAmount: ((hourlyRate * duration / 60)).toFixed(2),
        referralDiscount: referralDiscount.toFixed(2),
        loyaltyDiscount: loyaltyDiscount.toFixed(2),
        loyaltyBalanceUsed: loyaltyBalanceUsed.toFixed(2),
        referralBalanceUsed: referralBalanceUsed.toFixed(2),
        finalAmount: amount.toFixed(2),
        appliedReferralCode,
        appliedLoyaltyLevel
      });
    } catch (error: any) {
      console.error("Error creating lesson payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Webhook to handle successful Stripe payments
  app.post('/api/stripe/webhook', async (req, res) => {
    const stripeClient = getStripeClient(res);
    const webhookSecret = getStripeWebhookSecret(res);
    if (!stripeClient || !webhookSecret) return;
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig!,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, type, lessonId } = paymentIntent.metadata;

      try {
        if (type === 'balance_topup') {
          // Add funds to user balance
          const amount = (paymentIntent.amount / 100).toFixed(2);
          const currentBalance = await storage.getUserBalance(userId);
          const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toFixed(2);
          
          await storage.addBalanceTransaction({
            userId,
            type: 'deposit',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            description: `Doładowanie konta kartą płatniczą`,
            relatedEntityId: paymentIntent.id,
            relatedEntityType: 'stripe_payment'
          });
        } else if (type === 'direct_lesson_payment' && lessonId) {
          // Process direct lesson payment
          await storage.processLessonPayment(lessonId, userId, 'stripe', paymentIntent.id);
          
          // Deduct loyalty balance if it was used
          const loyaltyBalanceUsed = parseFloat(paymentIntent.metadata.loyaltyBalanceUsed || '0');
          if (loyaltyBalanceUsed > 0) {
            const user = await storage.getUser(userId);
            const currentLoyaltyBalance = parseFloat(user?.loyaltyBalance || '0');
            const newLoyaltyBalance = Math.max(0, currentLoyaltyBalance - loyaltyBalanceUsed).toFixed(2);
            
            await db.update(users).set({ loyaltyBalance: newLoyaltyBalance }).where(eq(users.id, userId));
            console.log(`✓ Deducted ${loyaltyBalanceUsed} PLN loyalty balance from user ${userId}`);
          }
          
          // Deduct referral balance if it was used
          const referralBalanceUsed = parseFloat(paymentIntent.metadata.referralBalanceUsed || '0');
          if (referralBalanceUsed > 0) {
            await storage.debitReferralBalance(userId, referralBalanceUsed);
            console.log(`✓ Deducted ${referralBalanceUsed} PLN referral balance from user ${userId}`);
          }
        } else if (type === 'package_purchase') {
          // Process package purchase
          const { packageId } = paymentIntent.metadata;
          await storage.purchasePackage(userId, packageId, paymentIntent.id);
          console.log(`✓ Package purchased successfully for user ${userId}, package ${packageId}`);
        }
      } catch (error) {
        console.error("Error processing webhook:", error);
      }
    }

    res.json({ received: true });
  });

  // Lesson Packages Routes
  
  // Get all lesson packages (public - for students)
  app.get('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const packages = await storage.getLessonPackages(true); // Only active packages
      res.json(packages);
    } catch (error) {
      console.error("Error fetching lesson packages:", error);
      res.status(500).json({ message: "Failed to fetch lesson packages" });
    }
  });

  // Get all lesson packages (admin - including inactive)
  app.get('/api/admin/packages', isAdminAuthenticated, async (req: any, res) => {
    try {
      const packages = await storage.getLessonPackages(false); // All packages
      res.json(packages);
    } catch (error) {
      console.error("Error fetching lesson packages:", error);
      res.status(500).json({ message: "Failed to fetch lesson packages" });
    }
  });

  // Create lesson package (admin only)
  app.post('/api/admin/packages', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { name, description, lessonCount, discountPercent } = req.body;

      if (!name || !lessonCount || discountPercent === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Calculate prices
      const basePrice = (lessonCount * 100).toFixed(2); // 100 PLN per lesson
      const discount = parseFloat(discountPercent);
      const finalPrice = (parseFloat(basePrice) * (1 - discount / 100)).toFixed(2);

      const packageData = {
        name,
        description,
        lessonCount: parseInt(lessonCount),
        discountPercent: discount.toFixed(2),
        basePrice,
        finalPrice,
        isActive: true,
        sortOrder: 0
      };

      const createdPackage = await storage.createLessonPackage(packageData);
      res.json(createdPackage);
    } catch (error) {
      console.error("Error creating lesson package:", error);
      res.status(500).json({ message: "Failed to create lesson package" });
    }
  });

  // Update lesson package (admin only)
  app.put('/api/admin/packages/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, description, lessonCount, discountPercent, isActive, sortOrder } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (isActive !== undefined) updates.isActive = isActive;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;

      // Recalculate prices if lesson count or discount changed
      if (lessonCount !== undefined || discountPercent !== undefined) {
        const pkg = await storage.getLessonPackage(id);
        if (!pkg) {
          return res.status(404).json({ message: "Package not found" });
        }

        const newLessonCount = lessonCount !== undefined ? parseInt(lessonCount) : pkg.lessonCount;
        const newDiscount = discountPercent !== undefined ? parseFloat(discountPercent) : parseFloat(pkg.discountPercent);

        updates.lessonCount = newLessonCount;
        updates.discountPercent = newDiscount.toFixed(2);
        updates.basePrice = (newLessonCount * 100).toFixed(2);
        updates.finalPrice = (parseFloat(updates.basePrice) * (1 - newDiscount / 100)).toFixed(2);
      }

      const updated = await storage.updateLessonPackage(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating lesson package:", error);
      res.status(500).json({ message: "Failed to update lesson package" });
    }
  });

  // Delete lesson package (admin only)
  app.delete('/api/admin/packages/:id', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLessonPackage(id);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson package:", error);
      res.status(500).json({ message: "Failed to delete lesson package" });
    }
  });

  // Purchase lesson package (students)
  app.post('/api/packages/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { packageId } = req.body;
      const stripeClient = getStripeClient(res);
      if (!stripeClient) return;

      if (!packageId) {
        return res.status(400).json({ message: "Package ID is required" });
      }

      // Get package details
      const packageData = await storage.getLessonPackage(packageId);
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }

      if (!packageData.isActive) {
        return res.status(400).json({ message: "Package is not available" });
      }

      // Create payment intent for package purchase
      const amount = parseFloat(packageData.finalPrice);
      
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "pln",
        metadata: {
          userId,
          type: "package_purchase",
          packageId: packageData.id,
          packageName: packageData.name,
          lessonCount: packageData.lessonCount.toString()
        }
      });

      if (!paymentIntent.client_secret) {
        return res.status(500).json({ message: "Missing client secret from Stripe" });
      }

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        package: packageData
      });
    } catch (error: any) {
      console.error("Error creating package purchase:", error);
      res.status(500).json({ message: "Error creating package purchase: " + error.message });
    }
  });

  // Get user's purchased packages
  app.get('/api/packages/my-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packages = await storage.getUserPurchasedPackages(userId);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching user packages:", error);
      res.status(500).json({ message: "Failed to fetch user packages" });
    }
  });

  // Get user's remaining package lessons
  app.get('/api/packages/lessons-remaining', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const remaining = await storage.getUserPackageLessonsRemaining(userId);
      res.json({ lessonsRemaining: remaining });
    } catch (error) {
      console.error("Error fetching remaining lessons:", error);
      res.status(500).json({ message: "Failed to fetch remaining lessons" });
    }
  });

  // Get all purchased packages (admin)
  app.get('/api/admin/purchased-packages', isAdminAuthenticated, async (req: any, res) => {
    try {
      const purchases = await storage.getAllPurchasedPackages();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchased packages:", error);
      res.status(500).json({ message: "Failed to fetch purchased packages" });
    }
  });

  // Student-Tutor matching system endpoints
  app.post("/api/student/matching-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const preferences = await storage.setStudentMatchingPreferences({
        studentId,
        ...req.body
      });
      res.json(preferences);
    } catch (error: any) {
      console.error("Error setting student preferences:", error);
      res.status(500).json({ message: "Failed to set preferences" });
    }
  });

  app.get("/api/student/matching-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const preferences = await storage.getStudentMatchingPreferences(studentId);
      res.json(preferences);
    } catch (error: any) {
      console.error("Error getting student preferences:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  app.post("/api/student/find-matches", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const matches = await storage.findMatchingTutors(studentId);
      res.json(matches);
    } catch (error: any) {
      console.error("Error finding matches:", error);
      res.status(500).json({ message: "Failed to find matches" });
    }
  });

  app.get("/api/student/matches", isAuthenticated, async (req: any, res) => {
    try {
      const studentId = req.user.id;
      const matches = await storage.getStudentMatches(studentId);
      res.json(matches);
    } catch (error: any) {
      console.error("Error getting student matches:", error);
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  // Removed duplicate endpoint - using the unified one above

  // Removed duplicate endpoint - using the one above

  app.get("/api/tutor/matches", isAuthenticated, async (req: any, res) => {
    try {
      const tutorId = req.user.id;
      const matches = await storage.getTutorMatches(tutorId);
      res.json(matches);
    } catch (error: any) {
      console.error("Error getting tutor matches:", error);
      res.status(500).json({ message: "Failed to get matches" });
    }
  });

  app.patch("/api/match/:matchId/status", isAuthenticated, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { status } = req.body;
      await storage.updateMatchStatus(matchId, status, new Date());
      res.json({ message: "Match status updated successfully" });
    } catch (error: any) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // Get available tutors for student selection (sorted by compatibility)
  app.get("/api/tutors/available", isAuthenticated, async (req: any, res) => {
    try {
      console.log("GET /api/tutors/available called by user:", req.user?.id);
      const studentId = req.user.id;
      
      // Get all tutors first
      console.log("Fetching all tutors with availability...");
      const allTutors = await storage.getTutorsWithAvailability();
      console.log(`Found ${allTutors.length} tutors`);
      
      // Get student preferences if they exist
      const studentPreferences = await storage.getActiveStudentMatchingPreferences(studentId);
      console.log("Student preferences:", studentPreferences ? "found" : "not found");
      
      if (studentPreferences) {
        // Score tutors based on compatibility 
        console.log("Scoring tutors based on student preferences...");
        const scoredTutors = await storage.scoreAllTutorsForStudent(allTutors, studentPreferences);
        console.log(`Returning ${scoredTutors.length} scored tutors`);
        res.json(scoredTutors);
      } else {
        // No preferences - return all tutors sorted by basic criteria
        console.log("No preferences found, sorting by basic criteria...");
        const sortedTutors = allTutors
          .filter(tutor => tutor.hasAvailability) // Show only tutors with availability
          .sort((a, b) => {
            // Sort by rating first, then by total lessons
            const ratingDiff = (parseFloat(b.tutorProfile?.rating || '4.0') - parseFloat(a.tutorProfile?.rating || '4.0'));
            if (ratingDiff !== 0) return ratingDiff;
            return (b.tutorProfile?.totalLessons || 0) - (a.tutorProfile?.totalLessons || 0);
          });
        console.log(`Returning ${sortedTutors.length} sorted tutors with availability`);
        res.json(sortedTutors);
      }
    } catch (error: any) {
      console.error("Error fetching available tutors:", error);
      res.status(500).json({ message: "Failed to fetch available tutors" });
    }
  });

  // Alias endpoint for student-specific naming convention
  app.get("/api/student/available-tutors", isAuthenticated, async (req: any, res) => {
    try {
      console.log("GET /api/student/available-tutors called by user:", req.user?.id);
      const studentId = req.user.id;
      
      // Get all tutors - remove hasAvailability filter to show all tutors
      const allTutors = await storage.getTutorsWithAvailability();
      console.log(`Found ${allTutors.length} tutors for student selection`);
      
      // Return all tutors sorted by rating and experience
      const sortedTutors = allTutors.sort((a, b) => {
        // Featured tutors first
        const aFeatured = a.tutorProfile?.isFeatured || false;
        const bFeatured = b.tutorProfile?.isFeatured || false;
        if (aFeatured !== bFeatured) return bFeatured ? 1 : -1;
        
        // Then by rating
        const ratingDiff = (parseFloat(b.tutorProfile?.rating || '4.0') - parseFloat(a.tutorProfile?.rating || '4.0'));
        if (ratingDiff !== 0) return ratingDiff;
        
        // Finally by experience
        return (b.tutorProfile?.totalLessons || 0) - (a.tutorProfile?.totalLessons || 0);
      });
      
      console.log(`Returning ${sortedTutors.length} tutors for student selection`);
      res.json(sortedTutors);
    } catch (error: any) {
      console.error("Error fetching student available tutors:", error);
      res.status(500).json({ message: "Failed to fetch available tutors" });
    }
  });

  // Book lesson with selected tutor (from tutor selection modal)
  app.post('/api/lessons/book', isAuthenticated, async (req: any, res) => {
    console.log('=== /api/lessons/book endpoint hit ===');
    console.log('Headers:', req.headers);
    console.log('Session:', req.session);
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { tutorId, timeSlot, paymentMethod, specialNeeds } = req.body;
      
      // Auto-select next topic based on student's progression
      const nextAvailableTopic = await storage.getNextAvailableTopicForStudent(userId);
      const topicId = nextAvailableTopic?.topicId || 'MAT-L01'; // Fallback to first topic

      console.log('Extracted fields with auto-selected topic:', {
        tutorId,
        topicId, 
        timeSlot,
        paymentMethod,
        specialNeeds,
        autoSelectedTopic: nextAvailableTopic,
        hasAllRequired: !!(tutorId && topicId && timeSlot)
      });

      // Validate required fields
      if (!tutorId || !timeSlot) {
        console.log('Missing fields validation failed:', {
          tutorId: !!tutorId,
          timeSlot: !!timeSlot
        });
        return res.status(400).json({ message: "Brakujące wymagane pola" });
      }

      // Parse timeSlot
      const lessonDate = new Date(timeSlot);
      if (isNaN(lessonDate.getTime())) {
        return res.status(400).json({ message: "Nieprawidłowy format daty" });
      }

      // FLUID PROGRESSION: Allow booking multiple lessons for the same topic
      // This supports the requirement for students to book lessons in advance
      console.log('Fluid progression enabled - allowing multiple bookings for same topic');

      // Create payment authorization hold on card (not balance)
      let paymentIntentId = null;
      const lessonPrice = 100; // 100 zł standard price
      
      if (paymentMethod === 'card') {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) return;
        try {
          const paymentIntent = await stripeClient.paymentIntents.create({
            amount: lessonPrice * 100, // Convert to cents
            currency: 'pln',
            capture_method: 'manual', // Authorization only, capture when tutor accepts
            metadata: {
              type: 'lesson_booking',
              student_id: userId,
              tutor_id: tutorId,
              topic_id: topicId
            }
          });
          
          paymentIntentId = paymentIntent.id;
          console.log(`Created payment authorization for ${lessonPrice} PLN: ${paymentIntentId}`);
        } catch (error) {
          console.error('Error creating payment authorization:', error);
          return res.status(400).json({ 
            message: "Błąd autoryzacji płatności kartą. Sprawdź dane karty i spróbuj ponownie." 
          });
        }
      }

      // Create lesson invitation with payment authorization
      const invitation = await storage.createLessonInvitation({
        studentMatchingPreferenceId: null, // Direct booking, not through matching system
        studentId: userId,
        tutorId,
        subjectId: "math-8th",
        topicId: topicId,
        status: "pending",
        matchingHours: [timeSlot],
        matchingDays: [lessonDate.getDay()],
        expiresAt: (() => {
          const lessonTime = new Date(timeSlot);
          const now = new Date();
          const timeUntilLesson = lessonTime.getTime() - now.getTime();
          const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
          
          // If lesson is more than 48h away, give tutor 48h to respond
          // If lesson is less than 48h away, give tutor time until 2h before lesson
          if (timeUntilLesson > fortyEightHours) {
            return new Date(Date.now() + fortyEightHours);
          } else {
            // Leave 2h buffer before lesson starts
            const twoHours = 2 * 60 * 60 * 1000;
            const expirationTime = lessonTime.getTime() - twoHours;
            
            // Ensure at least 1h from now to respond
            const oneHour = 60 * 60 * 1000;
            const minimumExpiration = Date.now() + oneHour;
            
            return new Date(Math.max(expirationTime, minimumExpiration));
          }
        })(),
        tutorResponse: specialNeeds || null,
        amount: lessonPrice,
        paymentIntentId: paymentIntentId // Store payment intent for later capture
      });

      // Send email notification to tutor
      try {
        const tutor = await storage.getUser(tutorId);
        const student = await storage.getUser(userId);
        const topic = await storage.getTopicById(topicId);
        
        if (tutor && student && topic) {
          const { sendLessonInvitationEmail } = await import("./email-service");
          const preferredDate = new Date(timeSlot).toLocaleDateString("pl-PL", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          await sendLessonInvitationEmail(
            tutor.email,
            `${tutor.firstName} ${tutor.lastName}`,
            `${student.firstName} ${student.lastName}`,
            topic.name,
            preferredDate
          );
        }
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Don't fail the invitation creation if email fails
      }

      // Don't charge yet - charge only when tutor accepts
      
      res.json({ 
        message: "Zaproszenie zostało wysłane do korepetytora",
        invitation 
      });

    } catch (error: any) {
      console.error("Error booking lesson:", error);
      res.status(500).json({ message: "Błąd podczas rezerwacji lekcji" });
    }
  });

  // Lesson action endpoints
  app.post("/api/lessons/:lessonId/cancel", isAuthenticated, async (req: any, res) => {
    try {
      console.log("=== LESSON CANCELLATION DEBUG START ===");
      const { lessonId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      console.log(`Cancelling lesson ${lessonId} by user ${userId}, reason: ${reason}`);
      
      // Get lesson to verify permissions and calculate fees
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        console.log("Lesson not found!");
        return res.status(404).json({ message: "Lesson not found" });
      }
      console.log(`Found lesson: price=${lesson.price}, student=${lesson.studentId}, tutor=${lesson.tutorId}`);

      // Check if user has permission to cancel this lesson
      if (lesson.studentId !== userId && lesson.tutorId !== userId) {
        console.log("User not authorized to cancel this lesson");
        return res.status(403).json({ message: "Unauthorized to cancel this lesson" });
      }

      // Determine who initiated the cancellation
      const initiatedBy = lesson.studentId === userId ? "student" : "tutor";
      console.log(`Cancellation initiated by: ${initiatedBy}`);

      const now = new Date();
      const lessonTime = new Date(lesson.scheduledAt);
      const hoursUntilLesson = Math.round((lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      console.log(`Hours until lesson: ${hoursUntilLesson}`);
      
      let cancellationFee = 0;
      let payoutReduction = 0;
      
      // Opłaty za anulowanie w ostatniej chwili
      if (hoursUntilLesson <= 2) {
        cancellationFee = initiatedBy === "student" ? parseFloat(lesson.price) * 0.5 : 0; // 50% opłaty dla ucznia
        payoutReduction = initiatedBy === "tutor" ? parseFloat(lesson.price) * 0.3 : 0; // 30% redukcji dla korepetytora
      } else if (hoursUntilLesson <= 24) {
        cancellationFee = initiatedBy === "student" ? parseFloat(lesson.price) * 0.25 : 0;
        payoutReduction = initiatedBy === "tutor" ? parseFloat(lesson.price) * 0.15 : 0;
      }
      console.log(`Calculated fees: cancellationFee=${cancellationFee}, payoutReduction=${payoutReduction}`);

      console.log("Calling storage.cancelLesson...");
      await storage.cancelLesson(lessonId, {
        initiatedBy,
        reason,
        cancellationFee,
        payoutReduction,
      });
      console.log("✓ storage.cancelLesson completed");

      // Refund logic for student cancellations
      if (initiatedBy === "student") {
        console.log("Processing student refund...");
        const lessonPrice = parseFloat(lesson.price);
        const refundAmount = lessonPrice - cancellationFee;
        console.log(`Refund calculation: lessonPrice=${lessonPrice} - cancellationFee=${cancellationFee} = refundAmount=${refundAmount}`);
        
        if (refundAmount > 0) {
          console.log(`About to call addBalance with: studentId=${lesson.studentId}, amount=${refundAmount}`);
          try {
            await storage.addBalance(lesson.studentId, refundAmount, `Zwrot za anulowaną lekcję - ${lesson.title}`);
            console.log("✓ addBalance call completed successfully");
          } catch (addBalanceError) {
            console.error("❌ Error in addBalance:", addBalanceError);
            throw addBalanceError; // Re-throw to be caught by outer try-catch
          }
        } else {
          console.log("No refund needed (refundAmount <= 0)");
        }
        
        // Only deduct additional cancellation fee if there's any left after refund calculation
        // (This scenario shouldn't happen with current logic, but kept for safety)
        if (cancellationFee > lessonPrice) {
          console.log(`Deducting additional fee: ${cancellationFee - lessonPrice}`);
          await storage.deductBalance(lesson.studentId, cancellationFee - lessonPrice, "Dodatkowa opłata za odwołanie lekcji");
        }
      }

      const responseData = { 
        message: "Lesson cancelled successfully",
        cancellationFee,
        refundAmount: initiatedBy === "student" ? Math.max(0, parseFloat(lesson.price) - cancellationFee) : 0,
        payoutReduction 
      };
      console.log("Response data:", responseData);
      console.log("=== LESSON CANCELLATION DEBUG END ===");
      
      res.json(responseData);
    } catch (error: any) {
      console.error("Error cancelling lesson:", error);
      res.status(500).json({ message: error.message || "Failed to cancel lesson" });
    }
  });

  app.post("/api/lessons/:lessonId/reschedule", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const { newScheduledAt, reason, initiatedBy } = req.body;
      
      // Get lesson to calculate fees
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Check reschedule limit
      if ((lesson.rescheduleCount || 0) >= 2) {
        return res.status(400).json({ message: "Maximum reschedule limit reached (2)" });
      }

      const now = new Date();
      const lessonTime = new Date(lesson.scheduledAt);
      const hoursUntilLesson = Math.round((lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let rescheduleFee = 0;
      let payoutReduction = 0;
      
      if (hoursUntilLesson <= 2) {
        rescheduleFee = initiatedBy === "student" ? parseFloat(lesson.price) * 0.25 : 0;
        payoutReduction = initiatedBy === "tutor" ? parseFloat(lesson.price) * 0.15 : 0;
      }

      await storage.rescheduleLesson(lessonId, {
        newScheduledAt,
        initiatedBy,
        reason,
        rescheduleFee,
        payoutReduction,
      });

      // Apply reschedule fee to student balance if applicable
      if (rescheduleFee > 0 && initiatedBy === "student") {
        await storage.deductBalance(lesson.studentId, rescheduleFee, "Opłata za przełożenie lekcji");
      }

      res.json({ 
        message: "Lesson rescheduled successfully",
        rescheduleFee,
        payoutReduction 
      });
    } catch (error: any) {
      console.error("Error rescheduling lesson:", error);
      res.status(500).json({ message: error.message || "Failed to reschedule lesson" });
    }
  });

  // Confirm lesson (tutor confirms pending lesson)
  app.post("/api/lessons/:lessonId/confirm", isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "tutor") {
        return res.status(403).json({ message: "Access denied - tutors only" });
      }
      
      // Get lesson to verify permissions
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if this tutor is assigned to the lesson
      if (lesson.tutorId !== userId) {
        return res.status(403).json({ message: "Unauthorized - you are not assigned to this lesson" });
      }
      
      // Check if lesson is in pending status
      if (lesson.status !== "pending") {
        return res.status(400).json({ message: `Cannot confirm lesson in ${lesson.status} status` });
      }
      
      // Update lesson status to scheduled
      await storage.updateLessonStatus(lessonId, "scheduled");
      
      res.json({ 
        message: "Lesson confirmed successfully",
        lessonId: lessonId,
        status: "scheduled"
      });
      
    } catch (error: any) {
      console.error("Error confirming lesson:", error);
      res.status(500).json({ message: error.message || "Failed to confirm lesson" });
    }
  });

  // Recording endpoints
  app.get("/api/lessons/:lessonId/recording", isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const userId = req.user.id;
      
      console.log(`Recording access request for lesson ${lessonId} by user ${userId}`);
      
      // Get recording with access check
      const result = await storage.getLessonRecording(lessonId, userId);
      
      if (!result) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { recordingUrl, lesson } = result;
      
      // Return recording data
      res.json({
        recordingUrl,
        lesson: {
          id: lesson.id,
          title: lesson.title,
          status: lesson.status,
          scheduledAt: lesson.scheduledAt,
          recordingAddedAt: lesson.recordingAddedAt,
        }
      });
    } catch (error: any) {
      console.error("Error fetching recording:", error);
      res.status(500).json({ message: error.message || "Failed to fetch recording" });
    }
  });

  app.post("/api/lessons/:lessonId/recording", isAuthenticated, async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const { recordingUrl } = req.body;
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      console.log(`Adding recording to lesson ${lessonId} by user ${userId} (${user?.role})`);
      
      // Only tutors and admins can add recordings
      if (!user || (user.role !== "tutor" && user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied - tutors and admins only" });
      }
      
      // Get lesson to verify permissions
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Tutors can only add recordings to their own lessons
      if (user.role === "tutor" && lesson.tutorId !== userId) {
        return res.status(403).json({ message: "Unauthorized - you are not assigned to this lesson" });
      }
      
      // Validate recording URL
      if (!recordingUrl || !recordingUrl.startsWith('http')) {
        return res.status(400).json({ message: "Invalid recording URL" });
      }
      
      // Add recording to lesson
      await storage.addRecordingToLesson(lessonId, recordingUrl);
      
      res.json({ 
        message: "Recording added successfully",
        lessonId,
        recordingUrl
      });
    } catch (error: any) {
      console.error("Error adding recording:", error);
      res.status(500).json({ message: error.message || "Failed to add recording" });
    }
  });

  // Student unlock request endpoint
  app.post('/api/student/request-unlock', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subjectId } = req.body;

      if (!subjectId) {
        return res.status(400).json({ message: "Subject ID is required" });
      }

      // Log the unlock request (in real implementation, this would be saved to database)
      console.log(`Student ${userId} requested unlock for subject ${subjectId}`);
      
      // For now, just return success (admin would need to manually unlock)
      res.json({ 
        success: true, 
        message: "Unlock request sent to administrator"
      });
    } catch (error) {
      console.error("Error processing unlock request:", error);
      res.status(500).json({ message: "Failed to process unlock request" });
    }
  });

  // Student enrollment and automatic matching endpoints
  app.post("/api/student/enroll", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const {
        subjectId,
        preferredDays,
        preferredHours,
        tutorGenderPreference,
        teachingStylePreference,
        currentLevel,
        specificNeeds,
      } = req.body;

      // Create student matching preferences
      const preferences = await storage.createStudentMatchingPreferences({
        studentId: userId,
        subjectId,
        preferredDays,
        preferredStartTime: preferredHours[0] || "15:00", // Use first selected hour
        preferredEndTime: preferredHours[preferredHours.length - 1] || "16:00", // Use last selected hour
        tutorGenderPreference,
        teachingStylePreference,
        currentLevel,
        specificNeeds,
        maxHourlyRate: 100, // Fixed rate: 100zł total, 70zł for tutor, 30zł platform margin
        matchingStatus: "pending",
        isActive: true,
      });

      // Start automatic invitation process immediately
      setTimeout(async () => {
        try {
          await storage.sendTutorInvitations(preferences.id);
        } catch (error) {
          console.error("Error in automatic invitation sending:", error);
        }
      }, 2000); // Start invitations after 2 seconds

      res.json({
        message: "Enrollment successful, sending invitations to available tutors",
        preferencesId: preferences.id,
      });
    } catch (error: any) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: error.message || "Failed to enroll student" });
    }
  });

  app.get("/api/student/matching-status/:studentId?", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const studentId = req.params.studentId || userId;

      // Get latest matching preferences
      const preferences = await storage.getStudentMatchingPreferences(studentId);
      if (!preferences) {
        return res.json(null);
      }

      // Get subject name
      const subject = await storage.getSubjectById(preferences.subjectId);
      
      // Get assigned tutor info if available
      let assignedTutor = null;
      if (preferences.assignedTutorId) {
        assignedTutor = await storage.getTutorWithProfile(preferences.assignedTutorId);
      }

      res.json({
        ...preferences,
        subjectName: subject?.name || "Nieznany przedmiot",
        assignedTutor,
      });
    } catch (error: any) {
      console.error("Error fetching matching status:", error);
      res.status(500).json({ message: error.message || "Failed to fetch matching status" });
    }
  });

  // Tutor response to student assignment
  app.post("/api/tutor/respond-assignment", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { preferencesId, accept, reason } = req.body;

      await storage.respondToStudentAssignment(preferencesId, tutorId, accept, reason);

      res.json({
        message: accept ? "Assignment accepted successfully" : "Assignment declined",
      });
    } catch (error: any) {
      console.error("Error responding to assignment:", error);
      res.status(500).json({ message: error.message || "Failed to respond to assignment" });
    }
  });

  // Get tutor pending assignments
  app.get("/api/tutor/pending-assignments", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const assignments = await storage.getTutorPendingAssignments(tutorId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching pending assignments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch assignments" });
    }
  });

  // Tutor hourly availability management
  app.get("/api/tutor/hourly-availability", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(tutorId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const availability = await storage.getTutorHourlyAvailability(tutorId);
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching tutor availability:", error);
      res.status(500).json({ message: error.message || "Failed to fetch availability" });
    }
  });

  // GET endpoint for current user's availability (tutors only) - for loading their own schedule
  app.get("/api/tutor/availability", async (req, res) => {
    try {
      // For now, make this public to debug authentication issues
      console.log("GET /api/tutor/availability called");
      console.log("Request user:", req.user);
      console.log("Is authenticated:", req.isAuthenticated ? req.isAuthenticated() : false);
      
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        console.log("User not authenticated, returning empty array");
        return res.json([]);
      }

      const userId = req.user?.id;
      if (!userId) {
        console.log("No user ID found");
        return res.json([]);
      }
      
      const user = await storage.getUser(userId);
      if (!user || user.role !== "tutor") {
        console.log("User not found or not a tutor:", user?.role);
        return res.json([]);
      }

      const availability = await storage.getTutorHourlyAvailabilityForTutor(userId);
      console.log(`Returning ${availability.length} availability slots for tutor dashboard ${userId}`);
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching user availability:", error);
      res.status(500).json({ message: error.message || "Failed to fetch availability" });
    }
  });

  app.post("/api/tutor/hourly-availability", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(tutorId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { slots } = req.body;
      await storage.updateTutorHourlyAvailabilityFromSlots(tutorId, slots);
      
      res.json({ message: "Availability updated successfully" });
    } catch (error: any) {
      console.error("Error updating tutor availability:", error);
      res.status(500).json({ message: error.message || "Failed to update availability" });
    }
  });

  // Lesson invitations for tutors
  app.get("/api/tutor/lesson-invitations", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(tutorId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitations = await storage.getTutorLessonInvitations(tutorId);
      res.json(invitations);
    } catch (error: any) {
      console.error("Error fetching lesson invitations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invitations" });
    }
  });

  // Get student lesson invitation statuses
  app.get("/api/student/lesson-invitations", isAuthenticated, async (req, res) => {
    try {
      const studentId = req.user?.id;
      const user = req.user;
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitations = await storage.getStudentLessonInvitations(studentId!);
      res.json(invitations);
    } catch (error: any) {
      console.error("Error fetching student lesson invitations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch student invitations" });
    }
  });



  app.post("/api/tutor/respond-invitation", isAuthenticated, async (req, res) => {
    try {
      const tutorId = req.user?.id;
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(tutorId);
      
      if (user?.role !== "tutor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { invitationId, accept, response, forceAccept } = req.body;
      
      // If accepting, check tutor availability first (unless force accept)
      if (accept && !forceAccept) {
        const availabilityCheck = await storage.checkTutorAvailabilityForInvitation(invitationId, tutorId);
        if (!availabilityCheck.isAvailable) {
          return res.status(409).json({ 
            message: "AVAILABILITY_CONFLICT",
            details: availabilityCheck.conflictReason,
            suggestedTimes: availabilityCheck.suggestedTimes
          });
        }
      } else if (accept && forceAccept) {
        console.log("Force accept enabled - skipping availability check");
      }
      
      await storage.respondToLessonInvitation(invitationId, tutorId, accept, response);
      
      // After successful response, invalidate the dashboard cache to update badge count
      // This ensures the pending invitations count refreshes immediately
      
      res.json({ 
        message: accept ? "Invitation accepted successfully" : "Invitation rejected",
      });
    } catch (error: any) {
      console.error("Error responding to invitation:", error);
      res.status(500).json({ message: error.message || "Failed to respond to invitation" });
    }
  });

  // Student cancels their own lesson invitation
  app.post("/api/student/cancel-invitation", isAuthenticated, async (req, res) => {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = req.user;
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { invitationId } = req.body;
      
      if (!invitationId) {
        return res.status(400).json({ message: "Invitation ID is required" });
      }

      await storage.cancelStudentLessonInvitation(invitationId, studentId);
      
      res.json({ 
        message: "Invitation cancelled successfully",
      });
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      res.status(500).json({ message: error.message || "Failed to cancel invitation" });
    }
  });

  // Admin student balance management endpoints
  app.get("/api/admin/students-with-balance", isAdminAuthenticated, async (req: any, res) => {
    try {
      const students = await storage.getAllStudentsWithBalance();
      res.json(students);
    } catch (error: any) {
      console.error("Error fetching students with balance:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/admin/balance-transactions/:studentId", isAdminAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const transactions = await storage.getBalanceTransactions(studentId);
      res.json(transactions);
    } catch (error: any) {
      console.error("Error fetching balance transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/admin/update-student-balance", isAdminAuthenticated, async (req: any, res) => {
    try {
      const { studentId, amount, description, type } = req.body;
      
      if (!studentId || !amount || !description || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const currentBalance = await storage.getUserBalance(studentId);
      const newBalance = (parseFloat(currentBalance) + parseFloat(amount)).toFixed(2);
      
      // Add transaction record
      await storage.addBalanceTransaction({
        userId: studentId,
        type,
        amount: amount.toString(),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description,
        relatedEntityId: req.user.id, // Admin who made the change
        relatedEntityType: 'admin_adjustment'
      });

      res.json({ message: "Balance updated successfully", newBalance });
    } catch (error: any) {
      console.error("Error updating student balance:", error);
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Tutor profile bio update endpoint
  app.post("/api/tutor/update-bio", isAuthenticated, async (req: any, res) => {
    try {
      const { bio } = req.body;
      const tutorId = req.user.id;
      
      if (!bio || bio.trim().length === 0) {
        return res.status(400).json({ message: "Bio cannot be empty" });
      }

      await storage.updateTutorBio(tutorId, bio.trim());
      res.json({ message: "Bio updated successfully" });
    } catch (error: any) {
      console.error("Error updating tutor bio:", error);
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

  // Clean up expired lesson invitations (simplified)
  app.post('/api/student/cleanup-invitations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Simple cleanup - remove old pending invitations for MAT-L01
      const currentInvitations = await storage.getLessonInvitations(userId);
      let cleanedCount = 0;

      for (const invitation of currentInvitations) {
        if (invitation.status === 'pending' && invitation.topicId === 'MAT-L01') {
          // Cancel the invitation
          await storage.updateLessonInvitationStatus(invitation.id, 'cancelled');
          // Refund if payment was deducted
          await storage.addBalance(userId, 100, `Zwrot za anulowane zaproszenie - ${invitation.topicId}`);
          cleanedCount++;
        }
      }

      res.json({ 
        message: `Anulowano ${cleanedCount} zaproszeń do pierwszego tematu`,
        cleanedCount: cleanedCount 
      });
    } catch (error: any) {
      console.error("Error cleaning up invitations:", error);
      res.status(500).json({ message: "Failed to clean up invitations" });
    }
  });

  // Book lesson for specific topic
  app.post('/api/lessons/book-topic', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { tutorId, topicId, timeSlot, specialNeeds } = req.body;

      // Check if student can access this topic (either next available or reserve ahead)
      const nextTopic = await storage.getNextAvailableTopic(userId);
      const canReserveAhead = await storage.canStudentReserveAhead(userId, topicId);
      
      // Special case: Allow MAT-L01 for new students (first topic)
      const isFirstTopic = topicId === 'MAT-L01';
      const studentProgression = await storage.getStudentTopicProgression(userId);
      const hasCompletedAnyTopic = studentProgression.some((topic: any) => topic.status === 'completed');
      
      // Allow booking if:
      // 1. It's the first topic and student hasn't completed any topics, OR
      // 2. It's the next available topic, OR  
      // 3. Student can reserve ahead
      const canBook = (isFirstTopic && !hasCompletedAnyTopic) || 
                     (nextTopic && nextTopic.topicId === topicId) || 
                     canReserveAhead;
      
      if (!canBook) {
        return res.status(400).json({ 
          message: "Ten temat nie jest jeszcze dostępny do rezerwacji" 
        });
      }

      // Check if student already has a booked or pending lesson for this topic
      const existingProgression = await storage.getStudentTopicProgressionByTopic(userId, topicId);
      if (existingProgression && (existingProgression.status === "booked" || existingProgression.status === "in_progress")) {
        return res.status(400).json({ 
          message: "Masz już zabookowaną lekcję do tego tematu. Nie możesz zarezerwować kolejnej, dopóki obecna się nie zakończy.",
          existingStatus: existingProgression.status 
        });
      }

      // Check if there are pending lesson invitations for this topic
      const pendingInvitations = await storage.getPendingInvitationsForTopic(userId, topicId);
      if (pendingInvitations.length > 0) {
        return res.status(400).json({ 
          message: "Masz już wysłane zaproszenia korepetytorów do tego tematu. Poczekaj na odpowiedź przed wysłaniem kolejnych.",
          pendingCount: pendingInvitations.length 
        });
      }

      // Return success to open tutor selection modal on frontend
      res.json({ 
        message: "Temat dostępny do rezerwacji",
        status: "available_for_booking",
        topicId: topicId,
        nextTopic: nextTopic
      });
    } catch (error) {
      console.error("Error booking topic lesson:", error);
      res.status(500).json({ message: "Failed to book topic lesson" });
    }
  });



  // Process expired lesson invitations and refund payments
  app.post('/api/admin/process-expired-invitations', async (req, res) => {
    try {
      const expiredInvitations = await storage.getExpiredLessonInvitations();
      let processedCount = 0;

      for (const invitation of expiredInvitations) {
        // Refund the payment to student (fixed amount for now since column doesn't exist yet)
        const refundAmount = 100; // Standard lesson price
        await storage.addBalance(
          invitation.studentId, 
          refundAmount, 
          `Zwrot za nieodpowiedziane zaproszenie - ${invitation.subjectId}`
        );

        // Mark invitation as expired
        await storage.markInvitationAsExpired(invitation.id);
        processedCount++;
      }

      res.json({ 
        message: `Processed ${processedCount} expired invitations`,
        processedCount 
      });
    } catch (error) {
      console.error("Error processing expired invitations:", error);
      res.status(500).json({ message: "Failed to process expired invitations" });
    }
  });

  // Get tutor's students (those with whom tutor has had lessons)
  app.get("/api/tutor/students", async (req, res) => {
    try {
      const tutorId = req.query.tutorId as string || (req.user as any)?.id;
      
      if (!tutorId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const students = await storage.getTutorStudents(tutorId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching tutor students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get specific tutor's availability and booked slots for visual booking calendar (public for students)
  app.get("/api/tutor/availability/:tutorId", async (req: any, res) => {
    try {
      const tutorId = req.params.tutorId;
      const studentId = req.user?.id; // Get student ID if authenticated
      
      if (!tutorId) {
        return res.status(400).json({ message: "Tutor ID is required" });
      }

      console.log(`Fetching availability for tutor: ${tutorId}`);
      const availability = await storage.getTutorHourlyAvailabilityForBooking(tutorId);
      const bookedSlots = await storage.getTutorBookedSlots(tutorId);

      // If student is authenticated, check if they already have lessons for topics
      let studentTopicLessons: string[] = [];
      if (studentId) {
        const existingLessons = await storage.getLessons(studentId, 'student');
        studentTopicLessons = existingLessons
          .filter(lesson => lesson.topicId && (lesson.status === 'scheduled' || lesson.status === 'completed'))
          .map(lesson => lesson.topicId!)
          .filter(Boolean);
        console.log(`Student ${studentId} already has lessons for topics:`, studentTopicLessons);
      }

      console.log(`Found ${availability.length} availability slots and ${bookedSlots.length} booked slots`);
      
      res.json({ 
        availability,
        bookedSlots,
        studentTopicLessons: studentTopicLessons // Send topic lessons to frontend
      });
    } catch (error) {
      console.error("Error fetching tutor availability:", error);
      res.status(500).json({ message: "Failed to fetch tutor availability" });
    }
  });

  // Manual endpoint to send unread message notifications
  app.post("/api/admin/send-unread-notifications", async (req, res) => {
    try {
      console.log("🔔 Starting notification process...");
      const usersWithUnread = await storage.getUsersWithUnreadMessages();
      console.log(`📊 Found ${usersWithUnread.length} users with unread messages:`, usersWithUnread);
      let notificationsSent = 0;

      for (const user of usersWithUnread) {
        console.log(`📧 Sending notification to ${user.email} (${user.unreadCount} unread)`);
        const success = await sendUnreadMessageNotification(
          user.email,
          user.firstName,
          user.unreadCount,
          user.senderName,
          user.lastMessagePreview
        );

        if (success) {
          await storage.updateLastEmailNotification(user.userId);
          notificationsSent++;
          console.log(`✅ Notification sent successfully to ${user.email}`);
        } else {
          console.log(`❌ Failed to send notification to ${user.email}`);
        }
      }

      console.log(`🎯 Process complete: ${notificationsSent}/${usersWithUnread.length} notifications sent`);
      res.json({
        message: `Wysłano ${notificationsSent} powiadomień o nieodczytanych wiadomościach`,
        totalUsers: usersWithUnread.length,
        notificationsSent
      });
    } catch (error) {
      console.error("Error sending unread message notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // ========================================
  // EXERCISE/PRACTICE ROUTES
  // ========================================

  // Student routes
  // GET /api/exercises/:moduleCode - Get exercises for a module
  app.get("/api/exercises/:moduleCode", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Nie jesteś zalogowany" });
      }

      const { moduleCode } = req.params;
      const exercises = await storage.getExercisesByModule(moduleCode);
      
      res.json(exercises);
    } catch (error: any) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/exercises/detail/:exerciseId - Get single exercise
  app.get("/api/exercises/detail/:exerciseId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Nie jesteś zalogowany" });
      }

      const { exerciseId } = req.params;
      const exercise = await storage.getExerciseById(exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ error: "Ćwiczenie nie znalezione" });
      }
      
      res.json(exercise);
    } catch (error: any) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/exercise-attempts - Submit exercise attempt
  app.post("/api/exercise-attempts", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ error: "Dostęp tylko dla studentów" });
      }

      // Validate request body
      const attemptSchema = insertExerciseAttemptSchema.extend({
        exerciseId: z.string(),
        answer: z.any(), // Flexible answer type
        timeTaken: z.number().min(1),
        hintsUsed: z.number().min(0).default(0),
      });

      const validatedData = attemptSchema.parse(req.body);

      // Submit attempt (server-side grading happens here)
      const result = await storage.submitExerciseAttempt({
        ...validatedData,
        studentId: req.user!.id,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error submitting exercise attempt:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Nieprawidłowe dane", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/exercise-attempts/my - Get my attempts (optionally filtered by exerciseId)
  app.get("/api/exercise-attempts/my", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ error: "Dostęp tylko dla studentów" });
      }

      const { exerciseId } = req.query;
      const attempts = await storage.getStudentExerciseAttempts(
        req.user!.id,
        exerciseId as string | undefined
      );
      
      res.json(attempts);
    } catch (error: any) {
      console.error("Error fetching attempts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/exercise-attempts/:exerciseId/best - Get best attempt for exercise
  app.get("/api/exercise-attempts/:exerciseId/best", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ error: "Dostęp tylko dla studentów" });
      }

      const { exerciseId } = req.params;
      const bestAttempt = await storage.getBestExerciseAttempt(exerciseId, req.user!.id);
      
      res.json(bestAttempt || null);
    } catch (error: any) {
      console.error("Error fetching best attempt:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/exercises/stats/:moduleCode - Get stats for module
  app.get("/api/exercises/stats/:moduleCode", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ error: "Dostęp tylko dla studentów" });
      }

      const { moduleCode } = req.params;
      const stats = await storage.getExerciseStatsByModule(req.user!.id, moduleCode);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching exercise stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/exercises/stats-all - Get stats for all modules
  app.get("/api/exercises/stats-all", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ error: "Dostęp tylko dla studentów" });
      }

      const stats = await storage.getAllExerciseStatsByStudent(req.user!.id);
      
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching all exercise stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  // GET /api/admin/exercises - Get all exercises
  app.get("/api/admin/exercises", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ error: "Dostęp tylko dla administratorów" });
      }

      const exercises = await storage.getAllExercises();
      res.json(exercises);
    } catch (error: any) {
      console.error("Error fetching all exercises:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/admin/exercises - Create exercise
  app.post("/api/admin/exercises", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ error: "Dostęp tylko dla administratorów" });
      }

      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      
      res.status(201).json(exercise);
    } catch (error: any) {
      console.error("Error creating exercise:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Nieprawidłowe dane", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/admin/exercises/:id - Update exercise
  app.patch("/api/admin/exercises/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ error: "Dostęp tylko dla administratorów" });
      }

      const { id } = req.params;
      const updates = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(id, updates);
      
      res.json(exercise);
    } catch (error: any) {
      console.error("Error updating exercise:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Nieprawidłowe dane", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE /api/admin/exercises/:id - Delete exercise
  app.delete("/api/admin/exercises/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ error: "Dostęp tylko dla administratorów" });
      }

      const { id } = req.params;
      await storage.deleteExercise(id);
      
      res.json({ message: "Ćwiczenie usunięte" });
    } catch (error: any) {
      console.error("Error deleting exercise:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rate limiting for exercise generation (3 per user per hour)
  const exerciseGenerationLimits = new Map<string, number[]>();
  const GENERATION_LIMIT = 3;
  const GENERATION_WINDOW = 60 * 60 * 1000; // 1 hour

  // POST /api/exercises/generate/:moduleCode - Generate exercises with GPT-4
  app.post("/api/exercises/generate/:moduleCode", isAuthenticated, async (req: any, res) => {
    try {
      const { moduleCode } = req.params;
      const { count = 5 } = req.body;

      // Only allow students or admins
      const user = await storage.getUser(req.user.id);
      if (!user || (user.role !== "student" && user.role !== "admin")) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Rate limiting check
      const now = Date.now();
      const userKey = req.user.id;
      const userAttempts = exerciseGenerationLimits.get(userKey) || [];
      
      // Filter out attempts older than the window
      const recentAttempts = userAttempts.filter(timestamp => now - timestamp < GENERATION_WINDOW);
      
      if (recentAttempts.length >= GENERATION_LIMIT) {
        const oldestAttempt = Math.min(...recentAttempts);
        const timeUntilReset = Math.ceil((oldestAttempt + GENERATION_WINDOW - now) / 60000); // minutes
        return res.status(429).json({ 
          message: `Limit generowania ćwiczeń osiągnięty. Spróbuj ponownie za ${timeUntilReset} min.` 
        });
      }

      console.log(`Generating ${count} exercises for module ${moduleCode} (user: ${userKey})...`);
      const exercises = await storage.generateExercisesWithGPT(moduleCode, count);
      
      // Update rate limit tracking
      recentAttempts.push(now);
      exerciseGenerationLimits.set(userKey, recentAttempts);
      
      res.json({ 
        message: `Successfully generated ${exercises.length} exercises`,
        exercises 
      });
    } catch (error: any) {
      console.error("Error generating exercises:", error);
      res.status(500).json({ message: error.message || "Failed to generate exercises" });
    }
  });

  // Auto-process expired invitations every hour
  setInterval(async () => {
    try {
      console.log("Auto-processing expired lesson invitations...");
      const expiredInvitations = await storage.getExpiredLessonInvitations();
      
      for (const invitation of expiredInvitations) {
        const refundAmount = 100; // Standard lesson price
        await storage.addBalance(
          invitation.studentId, 
          refundAmount, 
          `Zwrot za nieodpowiedziane zaproszenie - ${invitation.subjectId}`
        );
        await storage.markInvitationAsExpired(invitation.id);
        console.log(`Refunded ${refundAmount} to student ${invitation.studentId} for expired invitation ${invitation.id}`);
      }
      
      if (expiredInvitations.length > 0) {
        console.log(`Auto-processed ${expiredInvitations.length} expired invitations`);
      }
    } catch (error) {
      console.error("Error in auto-processing expired invitations:", error);
    }
  }, 60 * 60 * 1000); // Run every hour

  // Auto-send unread message notifications every 2 hours
  setInterval(async () => {
    try {
      console.log("Auto-checking for users with unread messages...");
      const usersWithUnread = await storage.getUsersWithUnreadMessages();
      
      if (usersWithUnread.length === 0) {
        console.log("No users with unread messages found");
        return;
      }

      console.log(`Found ${usersWithUnread.length} users with unread messages`);
      let notificationsSent = 0;

      for (const user of usersWithUnread) {
        const success = await sendUnreadMessageNotification(
          user.email,
          user.firstName,
          user.unreadCount,
          user.senderName,
          user.lastMessagePreview
        );

        if (success) {
          await storage.updateLastEmailNotification(user.userId);
          notificationsSent++;
        }
      }

      console.log(`Sent ${notificationsSent} unread message notifications`);
    } catch (error) {
      console.error("Error in auto-sending unread message notifications:", error);
    }
  }, 2 * 60 * 60 * 1000); // Run every 2 hours

  const httpServer = createServer(app);
  return httpServer;
}
