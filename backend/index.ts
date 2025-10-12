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

// SECURITY CONFIGURATION
// ============================================================================

app.set("trust proxy", 1);

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

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
    .filter(Boolean)
    .join(",");

  fromEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));

  return Array.from(origins);
};

const allowedOrigins = getAllowedOrigins();

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
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

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
});

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
 *     description: Returns the current health status of the API service
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: FinanceSkills Hub API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
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
 * @swagger
 * /security/stats:
 *   get:
 *     summary: Get security statistics (Development only)
 *     description: Returns security statistics including rate limiting and blocked IPs. Only available in development mode.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Security statistics retrieved successfully
 *       404:
 *         description: Endpoint not available in production
 */
const securityStats = (req: Request, res: Response): void => {
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

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's complete profile including portfolios, stats, and security context
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 portfolios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       totalValue:
 *                         type: number
 *                       totalCost:
 *                         type: number
 *                       totalReturn:
 *                         type: number
 *                       returnPercentage:
 *                         type: number
 *                       isDefault:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalValue:
 *                       type: number
 *                       description: Combined value of all portfolios
 *                     totalReturn:
 *                       type: number
 *                       description: Total profit/loss across all portfolios
 *                     returnPercentage:
 *                       type: number
 *                       description: Overall return percentage
 *                 securityContext:
 *                   type: object
 *                   properties:
 *                     lastAccess:
 *                       type: string
 *                       format: date-time
 *                     tokenAge:
 *                       type: number
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Email verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
apiRouter.get(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  async (req: Request, res: Response) => {
    try {
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
        },
      });

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
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information (firstName and lastName)
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *                 description: User's first name
 *                 example: John
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *                 description: User's last name
 *                 example: Doe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 virtualBalance:
 *                   type: number
 *                 emailVerified:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid input - firstName or lastName exceeds maximum length or has invalid format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Email verification required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
apiRouter.put(
  "/profile",
  authenticateToken,
  requireEmailVerification,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName } = req.body;

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

      console.log(`✏️ Profile update - User: ${req.user!.id}, IP: ${req.ip}`);

      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
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

// ============================================================================
// ASSET & MARKET DATA ENDPOINTS
// ============================================================================

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
 * /api/assets:
 *   get:
 *     summary: Get all available assets
 *     description: Retrieve a list of active assets with optional filtering by type and search term. Limited to 50 results.
 *     tags: [Assets]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [STOCK, CRYPTO, ETF, BOND]
 *         description: Filter assets by type
 *         example: STOCK
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search assets by symbol or name (case-insensitive)
 *         example: Apple
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Unique asset identifier
 *                   symbol:
 *                     type: string
 *                     description: Asset ticker symbol
 *                     example: AAPL
 *                   name:
 *                     type: string
 *                     description: Full asset name
 *                     example: Apple Inc.
 *                   assetType:
 *                     type: string
 *                     enum: [STOCK, CRYPTO, ETF, BOND]
 *                     example: STOCK
 *                   exchange:
 *                     type: string
 *                     description: Exchange where asset is traded
 *                     example: NASDAQ
 *                   sector:
 *                     type: string
 *                     description: Industry sector
 *                     example: Technology
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
apiRouter.get(
  "/assets",
  publicApiLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, search } = req.query;

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
        take: 50,
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

/**
 * @swagger
 * /api/market-data/quote/{symbol}:
 *   get:
 *     summary: Get real-time market quote for an asset
 *     description: Retrieve current market data including price, volume, and 24h change for a specific asset symbol
 *     tags: [Market Data]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z0-9]+$'
 *           maxLength: 10
 *         description: Asset ticker symbol (alphanumeric, max 10 characters)
 *         example: AAPL
 *     responses:
 *       200:
 *         description: Market quote retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                   example: AAPL
 *                 price:
 *                   type: number
 *                   format: float
 *                   description: Current market price
 *                   example: 175.43
 *                 change24h:
 *                   type: number
 *                   format: float
 *                   description: 24-hour price change in dollars
 *                   example: 2.15
 *                 changePercent24h:
 *                   type: number
 *                   format: float
 *                   description: 24-hour price change percentage
 *                   example: 1.24
 *                 volume:
 *                   type: number
 *                   description: 24-hour trading volume
 *                   example: 45231000
 *                 marketCap:
 *                   type: number
 *                   description: Total market capitalization
 *                   example: 2750000000000
 *                 high24h:
 *                   type: number
 *                   format: float
 *                   description: 24-hour high price
 *                   example: 178.9
 *                 low24h:
 *                   type: number
 *                   format: float
 *                   description: 24-hour low price
 *                   example: 173.2
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of the quote
 *       400:
 *         description: Invalid symbol format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Invalid symbol format
 *               code: INVALID_SYMBOL
 *               details: Symbol must be alphanumeric and max 10 characters
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Asset not found
 *               code: ASSET_NOT_FOUND
 *               details:
 *                 symbol: XYZ
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
apiRouter.get(
  "/market-data/quote/:symbol",
  publicApiLimiter,
  (req: Request, res: Response) => {
    const { symbol } = req.params;

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

app.use("/api", apiRouter);

// ============================================================================
// ADMIN ROUTES (Development/Testing Only)
// ============================================================================

if (!isProduction) {
  /**
   * @swagger
   * /dev/security/clear:
   *   post:
   *     summary: Clear security data (Development only)
   *     description: Clears all security tracking data including rate limits and blocked IPs
   *     tags: [Development]
   *     responses:
   *       200:
   *         description: Security data cleared successfully
   */
  app.post("/dev/security/clear", (req: Request, res: Response) => {
    clearSecurityData();
    res.json({ message: "Security data cleared" });
  });

  /**
   * @swagger
   * /dev/security/block-ip:
   *   post:
   *     summary: Block an IP address (Development only)
   *     description: Manually block an IP address for testing purposes
   *     tags: [Development]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - ip
   *             properties:
   *               ip:
   *                 type: string
   *                 description: IP address to block
   *                 example: 192.168.1.1
   *               duration:
   *                 type: number
   *                 description: Block duration in minutes
   *                 default: 30
   *                 example: 60
   *     responses:
   *       200:
   *         description: IP blocked successfully
   *       400:
   *         description: IP address required
   */
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

/**
 * @swagger
 * /api-spec:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI specification in JSON format
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get("/api-spec", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use("*", (req: Request, res: Response) => {
  console.warn(`🚫 404 - ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = Date.now().toString(36);

  console.error(`🚨 Error ${errorId}:`, {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.user?.id || "anonymous",
  });

  if (isProduction) {
    res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      errorId: errorId,
    });
  } else {
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
    console.log(`   • GET /security/stats`);
    console.log(`   • POST /dev/security/clear`);
    console.log(`   • POST /dev/security/block-ip`);
  }
});

export default app;
