import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { authenticateToken, blacklistToken } from "../middleware/auth";
import passport from "../lib/passport";

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const isProduction = process.env.NODE_ENV === "production";

if (
  !JWT_SECRET ||
  JWT_SECRET === "your-super-secret-jwt-key-change-this-in-production"
) {
  console.warn(
    "WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!"
  );
}

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Strict rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 3 : 10, // Very strict for registration
  message: {
    error: "Too many registration attempts from this IP",
    code: "REGISTRATION_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 5 : 20,
  message: {
    error: "Too many login attempts from this IP",
    code: "LOGIN_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN as string,
  });
  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    JWT_SECRET as string,
    { expiresIn: JWT_REFRESH_EXPIRES_IN as string }
  );

  return { accessToken, refreshToken };
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validatePassword = (
  password: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return { valid: errors.length === 0, errors };
};

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post(
  "/register",
  registerLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const clientIP = req.ip || "unknown";

      // Input validation
      if (!email || !password) {
        res.status(400).json({
          error: "Email and password are required",
          code: "MISSING_REQUIRED_FIELDS",
        });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        });
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          error: "Password does not meet requirements",
          code: "INVALID_PASSWORD",
          details: passwordValidation.errors,
        });
        return;
      }

      // Optional field validation
      if (
        firstName &&
        (typeof firstName !== "string" || firstName.length > 50)
      ) {
        res.status(400).json({
          error: "Invalid firstName",
          code: "INVALID_INPUT",
        });
        return;
      }

      if (lastName && (typeof lastName !== "string" || lastName.length > 50)) {
        res.status(400).json({
          error: "Invalid lastName",
          code: "INVALID_INPUT",
        });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        console.warn(
          `🚫 Registration attempt with existing email: ${email} from IP: ${clientIP}`
        );
        res.status(409).json({
          error: "User with this email already exists",
          code: "USER_EXISTS",
        });
        return;
      }

      // Hash password
      const saltRounds = isProduction ? 12 : 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          virtualBalance: 100000, // Starting virtual balance
          emailVerified: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          virtualBalance: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      console.log(
        `✅ User registered successfully: ${user.email} from IP: ${clientIP}`
      );

      res.status(201).json({
        message: "User registered successfully",
        user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Registration failed",
        code: "REGISTRATION_ERROR",
      });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post(
  "/login",
  loginLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const clientIP = req.ip || "unknown";

      // Input validation
      if (!email || !password) {
        res.status(400).json({
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        });
        return;
      }

      if (!validateEmail(email)) {
        res.status(400).json({
          error: "Invalid email format",
          code: "INVALID_EMAIL",
        });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          virtualBalance: true,
          emailVerified: true,
          isActive: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        console.warn(
          `🚫 Login attempt with non-existent email: ${email} from IP: ${clientIP}`
        );
        res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        console.warn(
          `🚫 Login attempt on inactive account: ${email} from IP: ${clientIP}`
        );
        res.status(401).json({
          error: "Account is deactivated",
          code: "ACCOUNT_DEACTIVATED",
        });
        return;
      }

      // Check if account is locked
      if (user.lockedUntil && new Date() < user.lockedUntil) {
        console.warn(
          `🚫 Login attempt on locked account: ${email} from IP: ${clientIP}`
        );
        res.status(423).json({
          error:
            "Account is temporarily locked due to too many failed attempts",
          code: "ACCOUNT_LOCKED",
          lockedUntil: user.lockedUntil,
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash!
      );

      if (!isPasswordValid) {
        // Increment failed login attempts
        const loginAttempts = (user.loginAttempts || 0) + 1;
        const shouldLock = loginAttempts >= 5;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts,
            ...(shouldLock && {
              lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Lock for 30 minutes
            }),
          },
        });

        console.warn(
          `🚫 Invalid password for ${email} from IP: ${clientIP} (Attempt ${loginAttempts})`
        );

        res.status(401).json({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
          ...(shouldLock && {
            message: "Account locked due to too many failed attempts",
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          }),
        });
        return;
      }

      // Successful login - reset login attempts and update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastSeenAt: new Date(),
          lastSeenIP: clientIP,
        },
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      console.log(
        `✅ User logged in successfully: ${user.email} from IP: ${clientIP}`
      );

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          virtualBalance: Number(user.virtualBalance),
          emailVerified: user.emailVerified,
          lastLoginAt: user.lastLoginAt,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: JWT_EXPIRES_IN,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Login failed",
        code: "LOGIN_ERROR",
      });
    }
  }
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const clientIP = req.ip || "unknown";

    if (!refreshToken) {
      res.status(400).json({
        error: "Refresh token is required",
        code: "MISSING_REFRESH_TOKEN",
      });
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: string;
        type: string;
        iat: number;
        exp: number;
      };

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }
    } catch (error) {
      console.warn(`🚫 Invalid refresh token from IP: ${clientIP}`);
      res.status(401).json({
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
      return;
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        virtualBalance: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      console.warn(
        `🚫 Refresh token for inactive/non-existent user from IP: ${clientIP}`
      );
      res.status(401).json({
        error: "User not found or inactive",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id
    );

    console.log(
      `🔄 Token refreshed for user: ${user.email} from IP: ${clientIP}`
    );

    res.json({
      message: "Token refreshed successfully",
      user,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_EXPIRES_IN,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Token refresh failed",
      code: "REFRESH_ERROR",
    });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        provider: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found", code: "USER_NOT_FOUND" });
    }

    res.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    res
      .status(500)
      .json({ error: "Internal server error", code: "SERVER_ERROR" });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and blacklist token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/logout",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clientIP = req.ip || "unknown";

      // Extract token from header and blacklist it
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        blacklistToken(token);
      }

      console.log(
        `👋 User logged out: ${req.user!.email} from IP: ${clientIP}`
      );

      res.json({
        message: "Logout successful",
        code: "LOGOUT_SUCCESS",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        error: "Logout failed",
        code: "LOGOUT_ERROR",
      });
    }
  }
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid current password
 */
router.post(
  "/change-password",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const clientIP = req.ip || "unknown";

      // Input validation
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          error: "Current password and new password are required",
          code: "MISSING_PASSWORDS",
        });
        return;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({
          error: "New password does not meet requirements",
          code: "INVALID_NEW_PASSWORD",
          details: passwordValidation.errors,
        });
        return;
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          passwordHash: true,
        },
      });

      if (!user) {
        res.status(401).json({
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash!
      );
      if (!isCurrentPasswordValid) {
        console.warn(
          `🚫 Invalid current password for password change: ${user.email} from IP: ${clientIP}`
        );
        res.status(401).json({
          error: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        });
        return;
      }

      // Hash new password
      const saltRounds = isProduction ? 12 : 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date(),
        },
      });

      console.log(
        `🔐 Password changed successfully: ${user.email} from IP: ${clientIP}`
      );

      res.json({
        message: "Password changed successfully",
        code: "PASSWORD_CHANGED",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        error: "Failed to change password",
        code: "CHANGE_PASSWORD_ERROR",
      });
    }
  }
);

// ============================================================================
// SOCIAL AUTHENTICATION ROUTES
// ============================================================================

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google social login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google for authentication
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google social login callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to the frontend with tokens
 *       500:
 *         description: Authentication failed
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=social-login-failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    // User is authenticated by passport, and the user object is attached to req.user
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=authentication-failed`);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    // Redirect to a dedicated callback page on the frontend
    res.redirect(
      `${FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Initiate Facebook social login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Facebook for authentication
 */
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false })
);

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Facebook social login callback
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to the frontend with tokens
 *       500:
 *         description: Authentication failed
 */
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${FRONTEND_URL}/login?error=social-login-failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=authentication-failed`);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.redirect(
      `${FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }
);

export default router;
