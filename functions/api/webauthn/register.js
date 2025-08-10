import { generateRegistrationOptions, verifyRegistrationResponse, } from "@simplewebauthn/server";
export const onRequestGet = async (context) => {
    try {
        const { env, request } = context;
        const url = new URL(request.url);
        const email = url.searchParams.get("email") ?? "";
        if (!email)
            return new Response("email required", { status: 400 });
        const db = env.PLM_DB ?? env.DB;
        const kv = env.SESSIONS;
        if (!db)
            throw new Error("D1 binding missing (PLM_DB/DB)");
        if (!kv)
            throw new Error("KV binding missing (SESSIONS)");
        if (!env.RP_ID || !env.ORIGIN)
            throw new Error("RP_ID/ORIGIN env missing");
        const userRow = await db
            .prepare("SELECT id FROM users WHERE email = ?")
            .bind(email)
            .first();
        const userId = userRow?.id ?? crypto.randomUUID();
        const existingCreds = await db
            .prepare("SELECT credentialId FROM credentials WHERE userId = ?")
            .bind(userId)
            .all();
        const options = await generateRegistrationOptions({
            rpName: env.RP_NAME,
            rpID: env.RP_ID,
            userID: new TextEncoder().encode(userId),
            userName: email,
            attestationType: "none",
            authenticatorSelection: {
                userVerification: "preferred",
                residentKey: "preferred",
            },
            excludeCredentials: existingCreds.results?.map((c) => ({ id: c.credentialId })) ?? [],
        });
        await kv.put(`reg-${userId}`, JSON.stringify({ challenge: options.challenge, email }), { expirationTtl: 600 });
        return Response.json({ userId, options });
    }
    catch (err) {
        return new Response(JSON.stringify({ error: String(err?.message || err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
export const onRequestPost = async (context) => {
    try {
        const { env, request } = context;
        const body = (await request.json());
        const db = env.PLM_DB ?? env.DB;
        const kv = env.SESSIONS;
        if (!db)
            throw new Error("D1 binding missing (PLM_DB/DB)");
        if (!kv)
            throw new Error("KV binding missing (SESSIONS)");
        const sessionRaw = await kv.get(`reg-${body.userId}`);
        if (!sessionRaw)
            return new Response("no session", { status: 400 });
        const session = JSON.parse(sessionRaw);
        if (session.email !== body.email)
            return new Response("email mismatch", { status: 400 });
        const verification = await verifyRegistrationResponse({
            expectedChallenge: session.challenge,
            expectedOrigin: env.ORIGIN,
            expectedRPID: env.RP_ID,
            response: body.response,
        });
        if (!verification.verified || !verification.registrationInfo) {
            return new Response("verification failed", { status: 400 });
        }
        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
        await db.batch([
            db
                .prepare("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)")
                .bind(body.userId, body.email),
            db
                .prepare("INSERT INTO credentials (userId, credentialId, publicKey, counter) VALUES (?, ?, ?, ?)")
                .bind(body.userId, Buffer.from(credentialID).toString("base64url"), Buffer.from(credentialPublicKey).toString("base64url"), counter),
        ]);
        await kv.delete(`reg-${body.userId}`);
        return Response.json({ ok: true });
    }
    catch (err) {
        return new Response(JSON.stringify({ error: String(err?.message || err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
