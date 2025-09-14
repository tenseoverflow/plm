export interface Env {
  PLM_DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RP_NAME: string;
  RP_ID: string;
  ORIGIN: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Check database connection
    const tables = await env.PLM_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'",
    ).all();

    // Check KV connection
    const kvTest = await env.SESSIONS.put("test", "value", {
      expirationTtl: 10,
    });

    return new Response(
      JSON.stringify({
        status: "ok",
        database: {
          connected: true,
          tables: tables.results?.map((t: any) => t.name) || [],
        },
        kv: {
          connected: true,
        },
        env: {
          rpName: env.RP_NAME,
          rpId: env.RP_ID,
          origin: env.ORIGIN,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        error: String(error),
        database: { connected: false },
        kv: { connected: false },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
