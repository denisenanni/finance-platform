import express, { Request, Response } from "express";
import { authenticateToken, requireEmailVerification } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

const router = express.Router();

// ============================================================================
// PROFILE ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /profile/detail:
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
router.get(
  "/detail",
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
 * /profile/detail:
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
router.put(
  "/detail",
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

export default router;
