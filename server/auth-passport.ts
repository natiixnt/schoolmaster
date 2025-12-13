import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// Temporarily disable Apple strategy until types are available
// import { Strategy as AppleStrategy } from "passport-apple";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      tableName: 'sessions', // Use the table name from our Drizzle schema
      createTableIfMissing: false, // Table already exists from Drizzle schema
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Nieprawidłowe dane logowania" });
          }

          const isValidPassword = await comparePasswords(password, user.passwordHash);
          if (!isValidPassword) {
            return done(null, false, { message: "Nieprawidłowe dane logowania" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.NODE_ENV === 'production' 
            ? `https://schoolmaster.pl/api/auth/google/callback`
            : `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
            
            if (!user) {
              // Create new user from Google profile
              // Generate referral code for new user
              const { generateReferralCode } = await import('./utils');
              const referralCode = generateReferralCode();
              
              user = await storage.createUser({
                email: profile.emails?.[0]?.value || "",
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value || null,
                role: null, // Will be set in role selection
                roleSetupComplete: false,
                googleId: profile.id,
                referralCode,
              });
            } else if (!user.googleId) {
              // Link existing account with Google
              await storage.updateUser(user.id, { googleId: profile.id });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Apple OAuth strategy - temporarily disabled until types are available
  // Will be implemented once passport-apple types are properly configured

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(null, false); // Don't propagate error, just return false
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Użytkownik z tym emailem już istnieje" });
      }

      const passwordHash = await hashPassword(password);
      // Generate referral code for new user
      const { generateReferralCode } = await import('./utils');
      const referralCode = generateReferralCode();
      
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        passwordHash,
        role: null, // Will be set in role selection
        roleSetupComplete: false,
        referralCode,
      });

      res.status(201).json({ 
        message: "Konto utworzone pomyślnie",
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Błąd podczas tworzenia konta" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Błąd serwera" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Nieprawidłowe dane logowania" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Błąd logowania" });
        }
        res.json({ 
          message: "Zalogowano pomyślnie",
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Wylogowano pomyślnie" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      failureRedirect: "/auth?error=google_auth_failed" 
    }),
    (req, res) => {
      try {
        // Check if user needs role selection
        const user = req.user as any;
        if (!user || !user.id) {
          console.error("No user found after Google authentication");
          return res.redirect("/auth?error=no_user");
        }
        
        if (!user.roleSetupComplete) {
          res.redirect("/role-selection");
        } else {
          res.redirect("/");
        }
      } catch (error) {
        console.error("Error in Google OAuth callback:", error);
        res.redirect("/auth?error=callback_error");
      }
    }
  );

  // Apple OAuth routes - temporarily disabled
  app.get("/api/auth/apple", (req, res) => {
    res.status(501).json({ message: "Apple authentication coming soon" });
  });
  
  app.get("/api/auth/apple/callback", (req, res) => {
    res.status(501).json({ message: "Apple authentication coming soon" });
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};