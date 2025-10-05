import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { specs, swaggerConfig, swaggerUi } from "@/swagger";
import authRoutes from "./src/routes/auth";
import {
  authenticateToken,
  blockIP,
  clearSecurityData,
  getSecurityStats,
  requireEmailVerification,
} from "@/middleware/auth";
import { prisma } from "@/lib/prisma";
import passport from "passport";
import "./src/lib/passport";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

// ============================================================================
// SECURITY CONFIGURATION
// ============================================================================

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000,
  message: {
    error: "Too many requests from this IP",
    code: "RATE_LIMIT_EXCEEDED",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ============================================================================
// CORS CONFIGURATION WITH SECURITY
// ============================================================================

const getAllowedOrigins = (): string[] => {
  const origins = new Set<string>([
    // Default origins for local development
    "http://localhost:3000",
    "http://localhost:4000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ]);

  const fromEnv = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.ADDITIONAL_ORIGINS,
  ]
    .filter(Boolean) // Remove undefined/null/empty strings
    .join(","); // Join them all into a single string

  fromEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));

  return Array.from(origins);
};

const allowedOrigins = getAllowedOrigins();

// Log allowed origins for easier debugging
console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ============================================================================
// BODY PARSING WITH LIMITS
// ============================================================================
app.use(passport.initialize());

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      // Validate JSON payload
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        const expressReq = req as express.Request;
        console.warn(`🚫 Invalid JSON from IP: ${expressReq.ip || "unknown"}`);
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Additional security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove server header
  res.removeHeader("X-Powered-By");

  next();
});

// Security logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? "WARN" : "INFO";

    console.log(
      `[${logLevel}] ${req.method} ${req.path} - ${
        res.statusCode
      } - ${duration}ms - IP: ${req.ip} - UA: ${req
        .get("User-Agent")
        ?.substring(0, 50)}`
    );

    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(
        `🚨 Security Event - ${res.statusCode} ${req.method} ${req.path} from ${req.ip}`
      );
    }
  });

  next();
});

// ============================================================================
// SWAGGER DOCUMENTATION
// ============================================================================

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerConfig));

// Redirect root to API docs
app.get("/", (req: Request, res: Response) => {
  res.redirect("/api-docs");
});

// ============================================================================
// HEALTH AND MONITORING ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "FinanceSkills Hub API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

/**
 * Security stats endpoint (admin only in production)
 */
const securityStats = (req: Request, res: Response): void => {
  // In production, you should protect this with admin authentication
  if (isProduction) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(getSecurityStats());
};

app.get("/security/stats", securityStats);

// ============================================================================
// API ROUTER
// ============================================================================

const apiRouter = express.Router();

// Authentication routes
apiRouter.use("/auth", authRoutes);

// Protected routes
/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 */
apiRouter.get(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  async (req: Request, res: Response) => {
    try {
      // Get user's portfolios with security context logging
      console.log(`📊 Profile accessed - User: ${req.user!.id}, IP: ${req.ip}`);

      const portfolios = await prisma.portfolio.findMany({
        where: { userId: req.user!.id },
        select: {
          id: true,
          name: true,
          description: true,
          totalValue: true,
          totalCost: true,
          totalReturn: true,
          returnPercentage: true,
          isDefault: true,
          createdAt: true,
        },
      });

      // Calculate total stats
      const totalValue = portfolios.reduce(
        (sum: number, p: any) => sum + Number(p.totalValue),
        0
      );
      const totalCost = portfolios.reduce(
        (sum: number, p: any) => sum + Number(p.totalCost),
        0
      );
      const totalReturn = totalValue - totalCost;
      const returnPercentage =
        totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      res.json({
        user: req.user,
        portfolios,
        stats: {
          totalValue,
          totalReturn,
          returnPercentage: Math.round(returnPercentage * 100) / 100,
        },
        securityContext: {
          lastAccess: req.securityContext?.timestamp,
          tokenAge: req.securityContext?.tokenAge,
        },
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({
        error: "Failed to get profile",
        code: "PROFILE_ERROR",
      });
    }
  }
);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 */
apiRouter.put(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, avatarUrl } = req.body;

      // Input validation
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

      if (
        avatarUrl &&
        (typeof avatarUrl !== "string" || !avatarUrl.startsWith("http"))
      ) {
        res.status(400).json({
          error: "Invalid avatarUrl",
          code: "INVALID_INPUT",
        });
        return;
      }

      console.log(`✏️ Profile update - User: ${req.user!.id}, IP: ${req.ip}`);

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(avatarUrl && { avatarUrl }),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          virtualBalance: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        error: "Failed to update profile",
        code: "PROFILE_UPDATE_ERROR",
      });
    }
  }
);

// Public API routes
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  message: {
    error: "Too many requests to public API",
    code: "PUBLIC_API_RATE_LIMIT",
  },
});

/**
 * @swagger
 * /assets:
 *   get:
 *     summary: Get all assets
 */
apiRouter.get(
  "/assets",
  publicApiLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, search } = req.query;

      // Input validation
      if (
        type &&
        !["STOCK", "CRYPTO", "ETF", "BOND"].includes(type as string)
      ) {
        res.status(400).json({
          error: "Invalid asset type",
          code: "INVALID_ASSET_TYPE",
        });
        return;
      }

      if (search && (typeof search !== "string" || search.length > 100)) {
        res.status(400).json({
          error: "Invalid search parameter",
          code: "INVALID_SEARCH",
        });
        return;
      }

      const whereClause: any = { isActive: true };

      if (type) {
        whereClause.assetType = type;
      }

      if (search) {
        const searchTerm = search as string;
        whereClause.OR = [
          { symbol: { contains: searchTerm, mode: "insensitive" } },
          { name: { contains: searchTerm, mode: "insensitive" } },
        ];
      }

      const assets = await prisma.asset.findMany({
        where: whereClause,
        select: {
          id: true,
          symbol: true,
          name: true,
          assetType: true,
          exchange: true,
          sector: true,
        },
        take: 50, // Limit results
      });

      res.json(assets);
    } catch (error) {
      console.error("Assets error:", error);
      res.status(500).json({
        error: "Failed to get assets",
        code: "ASSETS_ERROR",
      });
    }
  }
);

// Market data endpoint with enhanced validation
apiRouter.get(
  "/market-data/quote/:symbol",
  publicApiLimiter,
  (req: Request, res: Response) => {
    const { symbol } = req.params;

    // Input validation
    if (
      !symbol ||
      typeof symbol !== "string" ||
      symbol.length > 10 ||
      !/^[A-Za-z0-9]+$/.test(symbol)
    ) {
      res.status(400).json({
        error: "Invalid symbol format",
        code: "INVALID_SYMBOL",
        details: "Symbol must be alphanumeric and max 10 characters",
      });
      return;
    }

    // Mock market data - replace with real API call
    const marketData: { [key: string]: any } = {
      AAPL: {
        symbol: "AAPL",
        price: 175.43,
        change24h: 2.15,
        changePercent24h: 1.24,
        volume: 45231000,
        marketCap: 2750000000000,
        high24h: 178.9,
        low24h: 173.2,
        timestamp: new Date().toISOString(),
      },
      BTC: {
        symbol: "BTC",
        price: 67435.5,
        change24h: 1250.75,
        changePercent24h: 1.89,
        volume: 28500000000,
        marketCap: 1300000000000,
        high24h: 69500.0,
        low24h: 65200.0,
        timestamp: new Date().toISOString(),
      },
    };

    const data = marketData[symbol.toUpperCase()];

    if (!data) {
      res.status(404).json({
        error: "Asset not found",
        code: "ASSET_NOT_FOUND",
        details: { symbol },
      });
      return;
    }

    res.json(data);
  }
);

// Mount the master API router
app.use("/api", apiRouter);

// ============================================================================
// ADMIN ROUTES (Development/Testing Only)
// ============================================================================

if (!isProduction) {
  // Security management endpoints for development
  app.post("/dev/security/clear", (req: Request, res: Response) => {
    clearSecurityData();
    res.json({ message: "Security data cleared" });
  });

  app.post("/dev/security/block-ip", (req: Request, res: Response) => {
    const { ip, duration } = req.body;
    if (!ip) {
      res.status(400).json({ error: "IP address required" });
      return;
    }
    blockIP(ip, duration || 30);
    res.json({ message: `IP ${ip} blocked` });
  });
}

// ============================================================================
// API SPECIFICATION
// ============================================================================

// Serve OpenAPI spec as JSON
app.get("/api-spec", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler with security logging
app.use("*", (req: Request, res: Response) => {
  console.warn(`🚫 404 - ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
});

// Global error handler with security considerations
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = Date.now().toString(36); // Simple error ID for tracking

  // Log error with context
  console.error(`🚨 Error ${errorId}:`, {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
  });

  // Different error responses based on environment
  if (isProduction) {
    // Production: Don't leak error details
    res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      errorId: errorId, // For support tracking
    });
  } else {
    // Development: Include error details
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
      code: "INTERNAL_ERROR",
      errorId: errorId,
      stack: err.stack,
    });
  }
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  process.exit(0);
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 FinanceSkills Hub API running on port ${PORT}`);
  console.log(
    `🔒 Security Mode: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`
  );
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth Endpoints:`);
  console.log(`   • POST /api/auth/register`);
  console.log(`   • POST /api/auth/login`);
  console.log(`   • POST /api/auth/refresh`);
  console.log(`   • GET /api/auth/me`);
  console.log(`   • POST /api/auth/logout`);
  console.log(`   • POST /api/auth/change-password`);
  console.log(`👤 Profile Endpoints:`);
  console.log(`   • GET /api/profile (protected)`);
  console.log(`   • PUT /api/profile (protected)`);
  console.log(`📈 Market Data:`);
  console.log(`   • GET /api/assets`);
  console.log(`   • GET /api/market-data/quote/:symbol`);

  if (!isProduction) {
    console.log(`🛠️ Development Security Endpoints:`);
    console.log(`   • GET /api/security/stats`);
    console.log(`   • POST /api/dev/security/clear`);
    console.log(`   • POST /api/dev/security/block-ip`);
  }
});

export default app;
