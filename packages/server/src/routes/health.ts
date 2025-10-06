import { type Request, type Response, Router } from "express";
import { pool } from "../index.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check API and database health status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     tables:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Test database connection
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );

    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        tables: tables.rows.map((t: { table_name: string }) => t.table_name),
      },
      env: {
        rpName: process.env.RP_NAME,
        rpId: process.env.RP_ID,
        origin: process.env.ORIGIN,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    res.json(health);
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export { router as healthRoutes };
