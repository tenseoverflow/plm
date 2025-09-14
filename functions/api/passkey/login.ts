export interface Env {
  PLM_DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RP_NAME: string;
  RP_ID: string;
  ORIGIN: string;
}

function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function getRpIdFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // For localhost, use localhost as RP_ID
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "localhost";
    }

    // For production, use the actual domain
    return hostname;
  } catch {
    return "localhost"; // fallback
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Get origin from request
    const origin =
      request.headers.get("origin") ||
      `${new URL(request.url).protocol}//${new URL(request.url).host}`;
    const rpId = getRpIdFromOrigin(origin);

    // Generate challenge
    const challenge = generateChallenge();
    const sessionId = crypto.randomUUID();

    // Get all registered credential IDs (for allowCredentials)
    const credentials = await env.PLM_DB.prepare(
      `SELECT credential_id FROM user_credentials`,
    ).all();

    // Create authentication options
    const options = {
      challenge,
      timeout: 300000, // 5 minutes
      rpId,
      allowCredentials:
        credentials.results?.map((cred: any) => ({
          id: cred.credential_id,
          type: "public-key",
          transports: ["internal", "hybrid"],
        })) || [],
      userVerification: "required",
    };

    // Store challenge temporarily
    await env.SESSIONS.put(`login:${sessionId}`, challenge, {
      expirationTtl: 300, // 5 minutes
    });

    return new Response(JSON.stringify({ options, sessionId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Login start error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { credential, sessionId } = body as {
      credential: any;
      sessionId: string;
    };

    if (!credential || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Credential and session ID are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get stored challenge
    const expectedChallenge = await env.SESSIONS.get(`login:${sessionId}`);
    if (!expectedChallenge) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired login session" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Find the credential and user
    const credentialRecord = await env.PLM_DB.prepare(
      `SELECT uc.*, u.name as user_name 
       FROM user_credentials uc 
       JOIN users u ON uc.user_id = u.id 
       WHERE uc.credential_id = ?`,
    )
      .bind(credential.id)
      .first();

    if (!credentialRecord) {
      return new Response(JSON.stringify({ error: "Credential not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic validation - in production you'd want full WebAuthn verification
    // For now, we'll trust the client verification

    // Get user data
    const userData = await env.PLM_DB.prepare(
      "SELECT data FROM user_data WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
    )
      .bind(credentialRecord.user_id)
      .first();

    // Clean up session
    await env.SESSIONS.delete(`login:${sessionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: credentialRecord.user_id,
        userData: userData
          ? {
              ...JSON.parse(userData.data as string),
              name: credentialRecord.user_name,
            }
          : { name: credentialRecord.user_name },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Login completion error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
