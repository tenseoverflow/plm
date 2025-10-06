import { type Request, type Response, Router } from "express";
import { pool } from "../index.js";

const router = Router();

/**
 * @openapi
 * /sync:
 *   post:
 *     summary: Sync user data to server
 *     description: Upload and save user data to the server
 *     tags:
 *       - Sync
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               data:
 *                 $ref: '#/components/schemas/UserData'
 *     responses:
 *       200:
 *         description: Data synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { data, userId } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Data is required" });
    }

    if (!userId) {
      return res
        .status(401)
        .json({ error: "User ID is required. Please log in first." });
    }

    await pool.query(
      `INSERT INTO user_data (user_id, data, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT(user_id) DO UPDATE SET 
       data = EXCLUDED.data, 
       updated_at = NOW()`,
      [userId, JSON.stringify(data)],
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /sync:
 *   get:
 *     summary: Load user data from server
 *     description: Retrieve user data from the server
 *     tags:
 *       - Sync
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserData'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userData = await pool.query(
      `SELECT data FROM user_data WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [userId],
    );

    if (userData.rows.length === 0) {
      return res.json({ success: false, data: null });
    }

    res.json({
      success: true,
      data: JSON.parse(userData.rows[0].data),
    });
  } catch (error) {
    console.error("Load data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as syncRoutes };
