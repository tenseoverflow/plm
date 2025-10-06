import { pool } from "../index.js";

export class SessionStore {
  /**
   * Store a session value
   */
  static async put(
    key: string,
    value: string,
    expirationTtl?: number,
  ): Promise<void> {
    const expiresAt = new Date();
    if (expirationTtl) {
      expiresAt.setSeconds(expiresAt.getSeconds() + expirationTtl);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // Default 24 hours
    }

    await pool.query(
      `INSERT INTO sessions (id, data, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (id) DO UPDATE SET 
       data = EXCLUDED.data, 
       expires_at = EXCLUDED.expires_at`,
      [key, value, expiresAt],
    );
  }

  /**
   * Get a session value
   */
  static async get(key: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT data FROM sessions 
       WHERE id = $1 AND expires_at > NOW()`,
      [key],
    );

    return result.rows.length > 0 ? result.rows[0].data : null;
  }

  /**
   * Delete a session
   */
  static async delete(key: string): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE id = $1`, [key]);
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpired(): Promise<void> {
    await pool.query(`DELETE FROM sessions WHERE expires_at < NOW()`);
  }
}
