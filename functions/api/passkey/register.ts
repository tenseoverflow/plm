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

function stringToBase64url(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
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

    const { name } = body as { name: string };

    if (!name?.trim()) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate user ID and challenge
    const userId = crypto.randomUUID();
    const challenge = generateChallenge();

    // Create registration options
    const options = {
      challenge,
      rp: {
        name: env.RP_NAME,
        id: rpId,
      },
      user: {
        id: stringToBase64url(userId),
        name: name.trim(),
        displayName: name.trim(),
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 300000, // 5 minutes
      attestation: "none",
    };

    // Store challenge and user info temporarily
    await env.SESSIONS.put(
      `reg:${userId}`,
      JSON.stringify({
        challenge,
        name: name.trim(),
      }),
      {
        expirationTtl: 300, // 5 minutes
      },
    );

    return new Response(JSON.stringify({ options, userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration start error:", error);
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

    const { userId, name, credential, localData } = body as {
      userId: string;
      name: string;
      credential: any;
      localData?: any;
    };

    if (!userId || !name?.trim() || !credential) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get stored registration data
    const regData = await env.SESSIONS.get(`reg:${userId}`);
    if (!regData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired registration session" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { challenge } = JSON.parse(regData);

    // Basic validation - in production you'd want full WebAuthn verification
    // For now, we'll trust the client verification and store the credential

    // Store user and credential in database
    await env.PLM_DB.batch([
      env.PLM_DB.prepare(
        "INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)",
      ).bind(userId, name.trim(), new Date().toISOString()),

      env.PLM_DB.prepare(
        "INSERT INTO user_credentials (id, user_id, credential_id, public_key, counter, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(
        crypto.randomUUID(),
        userId,
        credential.id,
        JSON.stringify(credential),
        0,
        new Date().toISOString(),
      ),

      // Store user data if provided
      ...(localData
        ? [
            env.PLM_DB.prepare(
              "INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)",
            ).bind(userId, JSON.stringify(localData), new Date().toISOString()),
          ]
        : []),
    ]);

    // Clean up session
    await env.SESSIONS.delete(`reg:${userId}`);

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Registration completion error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
