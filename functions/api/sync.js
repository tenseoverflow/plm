// @ts-nocheck
import { verifyJWT } from "./_utils/jwt";
export const onRequestGet = async ({ env, request }) => {
    const cookie = request.headers.get("cookie") || "";
    const jwt = parseCookie(cookie, "plm_s");
    if (!jwt)
        return new Response("unauthorized", { status: 401 });
    const payload = await verifyJWT(jwt, env.JWT_SECRET);
    if (!payload?.sub)
        return new Response("unauthorized", { status: 401 });
    const row = await env.PLM_DB.prepare("SELECT data, updatedAt FROM user_data WHERE userId = ?")
        .bind(payload.sub)
        .first();
    return Response.json({
        data: row?.data ? JSON.parse(row.data) : null,
        updatedAt: row?.updatedAt ?? 0,
    });
};
export const onRequestPost = async ({ env, request }) => {
    const cookie = request.headers.get("cookie") || "";
    const jwt = parseCookie(cookie, "plm_s");
    if (!jwt)
        return new Response("unauthorized", { status: 401 });
    const payload = await verifyJWT(jwt, env.JWT_SECRET);
    if (!payload?.sub)
        return new Response("unauthorized", { status: 401 });
    const body = await request.json();
    const now = Date.now();
    await env.PLM_DB.prepare("INSERT INTO user_data (userId, data, updatedAt) VALUES (?, ?, ?) ON CONFLICT(userId) DO UPDATE SET data = excluded.data, updatedAt = excluded.updatedAt")
        .bind(payload.sub, JSON.stringify(body), now)
        .run();
    return Response.json({ ok: true, updatedAt: now });
};
function parseCookie(cookie, key) {
    const parts = cookie.split(";").map((s) => s.trim());
    for (const p of parts) {
        const [k, v] = p.split("=");
        if (k === key)
            return v ?? null;
    }
    return null;
}
