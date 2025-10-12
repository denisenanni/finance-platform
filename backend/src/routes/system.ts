import { getSecurityStats } from "@/middleware/auth";
import dotenv from "dotenv";
import express, { Request, Response } from "express";

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const router = express.Router();

// ============================================================================
// HEALTH AND MONITORING ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /system/health:
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
router.get("/health", (req: Request, res: Response) => {
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
 * /system/stats:
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

router.get("/stats", securityStats);

export default router;
