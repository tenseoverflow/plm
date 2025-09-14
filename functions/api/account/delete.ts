export interface Env {
  PLM_DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RP_NAME: string;
  RP_ID: string;
  ORIGIN: string;
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
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

    const { userId } = body as { userId: string };

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete all user data in a batch transaction
    const deleteQueries = [
      // Delete user data
      env.PLM_DB.prepare("DELETE FROM user_data WHERE user_id = ?").bind(
        userId,
      ),

      // Delete user credentials
      env.PLM_DB.prepare("DELETE FROM user_credentials WHERE user_id = ?").bind(
        userId,
      ),

      // Delete the user
      env.PLM_DB.prepare("DELETE FROM users WHERE id = ?").bind(userId),
    ];

    await env.PLM_DB.batch(deleteQueries);

    // Also clean up any session data for this user (best effort)
    // Note: We can't easily iterate through all KV keys, so this is just cleanup for known patterns
    try {
      await env.SESSIONS.delete(`reg:${userId}`);
      await env.SESSIONS.delete(`login:${userId}`);
    } catch (e) {
      // Ignore KV cleanup errors
      console.warn("KV cleanup failed:", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
