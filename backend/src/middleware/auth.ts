// src/middleware/auth.ts - Enhanced Authentication Middleware with Security
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "generated/prisma";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!JWT_SECRET) {
  throw new Error("🚨 CRITICAL: JWT_SECRET environment variable must be set!");
}

// ============================================================================
// SECURITY TRACKING
// ============================================================================

// In-memory store for tracking suspicious activity (use Redis in production)
const suspiciousActivity = new Map<
  string,
  {
    attempts: number;
    lastAttempt: Date;
    blocked: boolean;
    blockUntil?: Date;
  }
>();

// Track failed authentication attempts
const trackFailedAttempt = (identifier: string) => {
  const now = new Date();
  const activity = suspiciousActivity.get(identifier) || {
    attempts: 0,
    lastAttempt: now,
    blocked: false,
  };

  // Reset counter if last attempt was more than 15 minutes ago
  if (now.getTime() - activity.lastAttempt.getTime() > 15 * 60 * 1000) {
    activity.attempts = 0;
  }

  activity.attempts++;
  activity.lastAttempt = now;

  // Block after 5 failed attempts TODO REVERT
  if (activity.attempts >= (isProduction ? 5 : 100)) {
    activity.blocked = true;
    activity.blockUntil = new Date(now.getTime() + 30 * 60 * 1000); // Block for 30 minutes
  }

  suspiciousActivity.set(identifier, activity);
};

// Check if IP/user is blocked
const isBlocked = (identifier: string): boolean => {
  const activity = suspiciousActivity.get(identifier);
  if (!activity || !activity.blocked) return false;

  if (activity.blockUntil && new Date() > activity.blockUntil) {
    // Unblock after timeout
    activity.blocked = false;
    activity.attempts = 0;
    suspiciousActivity.set(identifier, activity);
    return false;
  }

  return activity.blocked;
};

// Clear successful authentication
const clearFailedAttempts = (identifier: string) => {
  suspiciousActivity.delete(identifier);
};

// ============================================================================
// TOKEN SECURITY VALIDATIONS
// ============================================================================

// Validate token format and structure
const validateTokenStructure = (token: string): boolean => {
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    // Validate base64 encoding of header and payload
    const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // Basic structure validation
    if (!header.alg || !header.typ) return false;
    if (!payload.userId || !payload.iat) return false;

    return true;
  } catch {
    return false;
  }
};

// Check if token is in blacklist (implement token blacklisting)
const blacklistedTokens = new Set<string>();

const isTokenBlacklisted = (token: string): boolean => {
  return blacklistedTokens.has(token);
};

// Add token to blacklist (call this on logout)
export const blacklistToken = (token: string): void => {
  blacklistedTokens.add(token);

  // Clean up expired tokens periodically
  if (blacklistedTokens.size > 10000) {
    // In production, implement proper cleanup based on token expiration
    blacklistedTokens.clear();
  }
};

// ============================================================================
// ENHANCED TYPE DEFINITIONS
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      securityContext?: {
        ipAddress: string;
        userAgent: string;
        timestamp: Date;
        tokenAge: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    virtualBalance: number;
    emailVerified: boolean;
    lastLoginAt?: Date;
    loginAttempts?: number;
    createdAt: Date;
  };
  securityContext: {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    tokenAge: number;
  };
}

// ============================================================================
// SECURITY RATE LIMITERS
// ============================================================================

// Rate limiter for authentication attempts
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 5 : 50,
  message: {
    error: "Too many authentication attempts from this IP",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + User-Agent combination
    return `${req.ip}-${req.get("User-Agent") || "unknown"}`;
  },
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests
    return req.method === "OPTIONS";
  },
});

// ============================================================================
// ENHANCED AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Enhanced middleware to authenticate JWT tokens with security features
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    // Security context for logging
    const securityContext = {
      ipAddress: clientIP,
      userAgent: userAgent,
      timestamp: new Date(),
      tokenAge: 0,
    };

    // 1. Check if IP is blocked due to suspicious activity
    if (isBlocked(clientIP)) {
      console.warn(`🚫 Blocked IP attempted access: ${clientIP}`);
      res.status(429).json({
        error: "Access temporarily blocked due to suspicious activity",
        code: "IP_BLOCKED",
        retryAfter: "30 minutes",
      });
      return;
    }

    // 2. Validate Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // trackFailedAttempt(clientIP);
      res.status(401).json({
        error: "Access token required",
        code: "MISSING_TOKEN",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 3. Basic token structure validation
    if (!validateTokenStructure(token)) {
      trackFailedAttempt(clientIP);
      console.warn(`🚫 Invalid token structure from IP: ${clientIP}`);
      res.status(401).json({
        error: "Invalid token format",
        code: "MALFORMED_TOKEN",
      });
      return;
    }

    // 4. Check token blacklist
    if (isTokenBlacklisted(token)) {
      trackFailedAttempt(clientIP);
      console.warn(`🚫 Blacklisted token used from IP: ${clientIP}`);
      res.status(401).json({
        error: "Token has been revoked",
        code: "TOKEN_REVOKED",
      });
      return;
    }

    // 5. Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        iat: number;
        exp: number;
      };

      // Calculate token age
      securityContext.tokenAge = Date.now() - decoded.iat * 1000;

      // Check if token is too old (optional additional security)
      const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
      if (securityContext.tokenAge > maxTokenAge) {
        console.warn(
          `⚠️ Old token used (${securityContext.tokenAge}ms old) from IP: ${clientIP}`
        );
        res.status(401).json({
          error: "Token too old, please login again",
          code: "TOKEN_TOO_OLD",
        });
        return;
      }
    } catch (error) {
      // trackFailedAttempt(clientIP);
      console.warn(`🚫 JWT verification failed from IP: ${clientIP}`, error);

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: "Invalid token",
          code: "INVALID_TOKEN",
        });
      } else {
        res.status(401).json({
          error: "Token verification failed",
          code: "TOKEN_VERIFICATION_FAILED",
        });
      }
      return;
    }

    // 6. Get user from database with security checks
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        virtualBalance: true,
        emailVerified: true,
        isActive: true, // Add this field to your User model
        lastLoginAt: true,
        loginAttempts: true,
        createdAt: true,
        // Add these security fields to your User model if needed:
        // lockedUntil: true,
        // securityFlags: true,
      },
    });

    if (!user) {
      trackFailedAttempt(clientIP);
      console.warn(
        `🚫 User not found for token from IP: ${clientIP}, UserID: ${decoded.userId}`
      );
      res.status(401).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    // 7. Check if user account is active
    if ("isActive" in user && !user.isActive) {
      trackFailedAttempt(clientIP);
      console.warn(
        `🚫 Inactive user attempted access from IP: ${clientIP}, UserID: ${user.id}`
      );
      res.status(401).json({
        error: "Account deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
      return;
    }

    // 8. Success - clear failed attempts and attach user data
    clearFailedAttempts(clientIP);

    // Attach user and security context to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      virtualBalance: Number(user.virtualBalance),
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt || undefined,
      loginAttempts: user.loginAttempts || 0,
      createdAt: user.createdAt,
    };

    req.securityContext = securityContext;

    // 9. Optional: Update last seen timestamp
    if (isProduction) {
      // Update user's last seen time (do this asynchronously)
      prisma.user
        .update({
          where: { id: user.id },
          data: {
            lastSeenAt: new Date(),
            lastSeenIP: clientIP,
          },
        })
        .catch((error) => {
          console.error("Failed to update last seen:", error);
        });
    }

    // 10. Security logging for audit trail
    const processingTime = Date.now() - startTime;
    console.log(
      `✅ Auth success - User: ${user.id}, IP: ${clientIP}, Time: ${processingTime}ms`
    );

    next();
  } catch (error) {
    const clientIP = req.ip || "unknown";
    trackFailedAttempt(clientIP);
    console.error("🚨 Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Optional authentication with enhanced security
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const clientIP = req.ip || "unknown";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    // If token is provided, validate it with same security as authenticateToken
    const token = authHeader.substring(7);

    // Quick validation checks
    if (!validateTokenStructure(token) || isTokenBlacklisted(token)) {
      // Don't fail the request, just continue without user
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

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
          createdAt: true,
        },
      });

      if (user && ("isActive" in user ? user.isActive : true)) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          virtualBalance: Number(user.virtualBalance),
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        };

        console.log(
          `ℹ️ Optional auth success - User: ${user.id}, IP: ${clientIP}`
        );
      }
    } catch (error) {
      // Token invalid, but continue without user (optional auth)
      console.log(`ℹ️ Optional auth failed (continuing) - IP: ${clientIP}`);
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next(); // Continue even on error for optional auth
  }
};

/**
 * Enhanced email verification middleware
 */
export const requireEmailVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  if (!req.user.emailVerified) {
    console.warn(
      `🚫 Unverified email access attempt - User: ${req.user.id}, IP: ${req.ip}`
    );
    res.status(403).json({
      error: "Email verification required",
      code: "EMAIL_NOT_VERIFIED",
      details: {
        message: "Please verify your email address to access this resource",
        resendEndpoint: "/api/auth/resend-verification",
      },
    });
    return;
  }

  next();
};

/**
 * Admin role middleware (add if you have role-based access)
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: "Authentication required",
      code: "AUTH_REQUIRED",
    });
    return;
  }

  // Add role checking logic here when you implement roles
  // Example: if (req.user.role !== 'ADMIN') { ... }

  next();
};

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Get security statistics for monitoring
 */
export const getSecurityStats = () => {
  const blocked = Array.from(suspiciousActivity.entries()).filter(
    ([_, activity]) => activity.blocked
  ).length;

  return {
    totalTrackedIPs: suspiciousActivity.size,
    blockedIPs: blocked,
    blacklistedTokens: blacklistedTokens.size,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Clear security tracking (for admin use)
 */
export const clearSecurityData = () => {
  suspiciousActivity.clear();
  blacklistedTokens.clear();
  console.log("🧹 Security tracking data cleared");
};

/**
 * Manually block an IP address
 */
export const blockIP = (ip: string, durationMinutes: number = 30) => {
  const blockUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  suspiciousActivity.set(ip, {
    attempts: 999,
    lastAttempt: new Date(),
    blocked: true,
    blockUntil,
  });
  console.log(`🚫 Manually blocked IP: ${ip} until ${blockUntil}`);
};
