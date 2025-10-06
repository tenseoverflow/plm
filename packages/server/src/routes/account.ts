import { type Request, type Response, Router } from "express";
import { pool } from "../index.js";

const router = Router();

/**
 * @openapi
 * /account/delete:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently delete user account and all associated data
 *     tags:
 *       - Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete("/delete", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete user (cascade will delete credentials and data)
      const result = await client.query(`DELETE FROM users WHERE id = $1`, [
        userId,
      ]);

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
      }

      await client.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as accountRoutes };
