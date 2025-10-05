import { verifyJWT } from "./_utils/jwt";

type ProxyRequest = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: { username: string; password: string };
};

export const onRequestPost: PagesFunction<{
  JWT_SECRET: string;
}> = async ({ env, request }) => {
  const cookie = request.headers.get("cookie") || "";
  const jwt = parseCookie(cookie, "plm_s");
  if (!jwt) return new Response("unauthorized", { status: 401 });
  const payload = await verifyJWT(jwt, env.JWT_SECRET);
  if (!payload?.sub) return new Response("unauthorized", { status: 401 });

  let body: ProxyRequest;
  try {
    body = (await request.json()) as ProxyRequest;
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  if (!body?.url || !body?.method) {
    return new Response("missing url or method", { status: 400 });
  }

  const headers = new Headers(body.headers || {});
  // Never allow the client to set Authorization header directly
  headers.delete("authorization");

  if (body.auth?.username || body.auth?.password) {
    const basic = btoa(`${body.auth?.username ?? ""}:${body.auth?.password ?? ""}`);
    headers.set("Authorization", `Basic ${basic}`);
  }

  // Default depth for REPORT/PROPFIND if not provided
  if ((/^(REPORT|PROPFIND)$/i).test(body.method) && !headers.has("Depth")) {
    headers.set("Depth", "1");
  }

  const method = body.method.toUpperCase();
  const upstream = await fetch(body.url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body.body,
  });

  const text = await upstream.text();
  // Return upstream status and selected headers for client parsing
  const resHeaders = new Headers();
  const forwardHeaders = [
    "content-type",
    "etag",
    "location",
    "content-location",
    "dav",
    "www-authenticate",
  ];
  for (const h of forwardHeaders) {
    const v = upstream.headers.get(h);
    if (v) resHeaders.set(h, v);
  }
  return new Response(text, { status: upstream.status, headers: resHeaders });
};

function parseCookie(cookie: string, key: string): string | null {
  const parts = cookie.split(";").map((s) => s.trim());
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === key) return v ?? null;
  }
  return null;
}


