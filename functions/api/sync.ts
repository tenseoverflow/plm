export interface Env {
  PLM_DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RP_NAME: string;
  RP_ID: string;
  ORIGIN: string;
}

// Store user data (sync from client)
export const onRequestPost: PagesFunction<Env> = async (context) => {
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

    const { data, userId } = body as { data: any; userId?: string };

    if (!data) {
      return new Response(JSON.stringify({ error: "Data is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get userId from request body if provided, or try to get from session
    const targetUserId = userId;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "User ID is required. Please log in first." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update or insert user data
    await env.PLM_DB.prepare(
      `INSERT INTO user_data (user_id, data, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(user_id) DO UPDATE SET 
       data = excluded.data, 
       updated_at = excluded.updated_at`,
    )
      .bind(targetUserId, JSON.stringify(data), new Date().toISOString())
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Load user data (sync to client)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user data
    const userData = await env.PLM_DB.prepare(
      "SELECT data FROM user_data WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
    )
      .bind(userId)
      .first();

    if (!userData) {
      return new Response(JSON.stringify({ success: false, data: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: JSON.parse(userData.data as string),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Load data error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
