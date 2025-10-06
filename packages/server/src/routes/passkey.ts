import { type Request, type Response, Router } from "express";
import { pool } from "../index.js";
import { SessionStore } from "../utils/session.js";

const router = Router();

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function stringToBase64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function getRpIdFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "localhost";
    }

    return hostname;
  } catch {
    return "localhost";
  }
}

/**
 * @openapi
 * /passkey/register:
 *   post:
 *     summary: Start passkey registration
 *     description: Initiate WebAuthn passkey registration for a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's display name
 *     responses:
 *       200:
 *         description: Registration challenge created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: object
 *                   description: PublicKeyCredentialCreationOptions
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const rpId = getRpIdFromOrigin(origin);

    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }

    const userId = crypto.randomUUID();
    const challenge = generateChallenge();

    const options = {
      challenge,
      rp: {
        name: process.env.RP_NAME || "PLM",
        id: rpId,
      },
      user: {
        id: stringToBase64url(userId),
        name: name.trim(),
        displayName: name.trim(),
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 300000,
      attestation: "none",
    };

    await SessionStore.put(
      `reg:${userId}`,
      JSON.stringify({ challenge, name: name.trim() }),
      300,
    );

    res.json({ options, userId });
  } catch (error) {
    console.error("Registration start error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /passkey/register:
 *   put:
 *     summary: Complete passkey registration
 *     description: Complete WebAuthn passkey registration and create user account
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - name
 *               - credential
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               credential:
 *                 type: object
 *                 description: WebAuthn credential response
 *               localData:
 *                 $ref: '#/components/schemas/UserData'
 *     responses:
 *       200:
 *         description: Registration completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                   format: uuid
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/register", async (req: Request, res: Response) => {
  try {
    const { userId, name, credential, localData } = req.body;

    if (!userId || !name?.trim() || !credential) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sessionData = await SessionStore.get(`reg:${userId}`);
    if (!sessionData) {
      return res.status(400).json({ error: "Invalid or expired registration" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create user
      await client.query(
        `INSERT INTO users (id, name, created_at) VALUES ($1, $2, NOW())`,
        [userId, name.trim()],
      );

      // Store credential
      const credentialId = crypto.randomUUID();
      const publicKey = JSON.stringify(credential);
      await client.query(
        `INSERT INTO user_credentials (id, user_id, credential_id, public_key, counter, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [credentialId, userId, credential.id, publicKey, 0],
      );

      // Store initial data if provided
      if (localData) {
        await client.query(
          `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2, NOW())`,
          [userId, JSON.stringify(localData)],
        );
      }

      await client.query("COMMIT");

      // Clean up registration session
      await SessionStore.delete(`reg:${userId}`);

      res.json({ success: true, userId });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Registration completion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /passkey/login:
 *   post:
 *     summary: Start passkey login
 *     description: Initiate WebAuthn passkey login
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Login challenge created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 options:
 *                   type: object
 *                   description: PublicKeyCredentialRequestOptions
 *                 sessionId:
 *                   type: string
 *                   format: uuid
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
    const rpId = getRpIdFromOrigin(origin);

    const challenge = generateChallenge();
    const sessionId = crypto.randomUUID();

    const credentials = await pool.query(
      `SELECT credential_id FROM user_credentials`,
    );

    const allowCredentials =
      credentials.rows.length > 0
        ? credentials.rows.map((cred: { credential_id: string }) => ({
            id: cred.credential_id,
            type: "public-key" as const,
            transports: ["internal" as const, "hybrid" as const],
          }))
        : [];

    const options = {
      challenge,
      timeout: 300000,
      rpId,
      allowCredentials,
      userVerification: "required" as const,
    };

    await SessionStore.put(`login:${sessionId}`, challenge, 300);

    res.json({ options, sessionId });
  } catch (error) {
    console.error("Login start error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @openapi
 * /passkey/login:
 *   put:
 *     summary: Complete passkey login
 *     description: Complete WebAuthn passkey login and retrieve user data
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *               - sessionId
 *             properties:
 *               credential:
 *                 type: object
 *                 description: WebAuthn assertion response
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 userData:
 *                   $ref: '#/components/schemas/UserData'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/login", async (req: Request, res: Response) => {
  try {
    const { credential, sessionId } = req.body;

    if (!credential || !sessionId) {
      return res
        .status(400)
        .json({ error: "Credential and session ID are required" });
    }

    const expectedChallenge = await SessionStore.get(`login:${sessionId}`);
    if (!expectedChallenge) {
      return res
        .status(400)
        .json({ error: "Invalid or expired login session" });
    }

    // Find user by credential ID
    const credentialRecord = await pool.query(
      `SELECT uc.user_id, uc.public_key, uc.counter, u.name 
       FROM user_credentials uc 
       JOIN users u ON uc.user_id = u.id 
       WHERE uc.credential_id = $1`,
      [credential.id],
    );

    if (credentialRecord.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credential" });
    }

    const { user_id, name } = credentialRecord.rows[0];

    // Get user data
    const userDataResult = await pool.query(
      `SELECT data FROM user_data WHERE user_id = $1`,
      [user_id],
    );

    // Clean up session
    await SessionStore.delete(`login:${sessionId}`);

    const userData =
      userDataResult.rows.length > 0 ? userDataResult.rows[0].data : {};

    res.json({
      success: true,
      userId: user_id,
      name,
      userData,
    });
  } catch (error) {
    console.error("Login completion error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as registerRoutes };
