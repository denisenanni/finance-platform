import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

const router = express.Router();
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
 * /assets:
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
router.get(
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

export default router;
