import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from "@simplewebauthn/server";

export const onRequestGet: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_NAME: string;
	RP_ID: string;
	ORIGIN: string;
}> = async (context) => {
	try {
		const { env, request } = context;
		const url = new URL(request.url);
		const email = url.searchParams.get("email") ?? "";
		if (!email) return new Response("email required", { status: 400 });

		const db: D1Database = (env as any).PLM_DB ?? (env as any).DB;
		const kv: KVNamespace = env.SESSIONS;
		if (!db) throw new Error("D1 binding missing (PLM_DB/DB)");
		if (!kv) throw new Error("KV binding missing (SESSIONS)");
		if (!env.RP_ID || !env.ORIGIN) throw new Error("RP_ID/ORIGIN env missing");

		const userRow = (await db
			.prepare("SELECT id FROM users WHERE email = ?")
			.bind(email)
			.first()) as any;
		const userId = userRow?.id ?? crypto.randomUUID();

		const existingCreds = (await db
			.prepare("SELECT credentialId FROM credentials WHERE userId = ?")
			.bind(userId)
			.all()) as any;

		const genRpid = new URL(request.url).hostname;
		const options = await generateRegistrationOptions({
			rpName: env.RP_NAME,
			rpID: genRpid,
			userID: new TextEncoder().encode(userId),
			userName: email,
			attestationType: "none",
			authenticatorSelection: {
				userVerification: "preferred",
				residentKey: "preferred",
			},
			excludeCredentials:
				existingCreds.results?.map((c: any) => ({ id: c.credentialId })) ?? [],
		});

		await kv.put(
			`reg-${userId}`,
			JSON.stringify({ challenge: options.challenge, email }),
			{ expirationTtl: 600 }
		);
		return Response.json({ userId, options });
	} catch (err: any) {
		return new Response(
			JSON.stringify({ error: String(err?.message || err) }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};

export const onRequestPost: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_ID: string;
	ORIGIN: string;
}> = async (context) => {
	try {
		const { env, request } = context;
		const body = (await request.json()) as any;
		const db: D1Database = (env as any).PLM_DB ?? (env as any).DB;
		const kv: KVNamespace = env.SESSIONS;
		if (!db) throw new Error("D1 binding missing (PLM_DB/DB)");
		if (!kv) throw new Error("KV binding missing (SESSIONS)");

		const sessionRaw = await kv.get(`reg-${body.userId}`);
		if (!sessionRaw) return new Response("no session", { status: 400 });
		const session = JSON.parse(sessionRaw) as {
			challenge: string;
			email: string;
		};
		if (session.email !== body.email)
			return new Response("email mismatch", { status: 400 });

		const requestOrigin = (
			context.request.headers.get("Origin") || ""
		).toString();
		const origins = Array.from(
			new Set([env.ORIGIN, requestOrigin].filter(Boolean))
		);
		const rpid = new URL(context.request.url).hostname;
		const verification = await verifyRegistrationResponse({
			expectedChallenge: session.challenge,
			expectedOrigin:
				origins.length > 0
					? origins.length === 1
						? origins[0]
						: origins
					: env.ORIGIN,
			expectedRPID: rpid,
			response: body.response,
		} as any);
		if (!verification.verified || !verification.registrationInfo) {
			return new Response("verification failed", { status: 400 });
		}

		const { credentialPublicKey, credentialID, counter } =
			verification.registrationInfo as any;
		const credIdB64 = toBase64Url(credentialID);
		const pubKeyB64 = toBase64Url(credentialPublicKey);
		const safeCounter =
			typeof counter === "number" && Number.isFinite(counter) ? counter : 0;
		if (!credIdB64 || !pubKeyB64) {
			return new Response("invalid credential data", { status: 400 });
		}
		await db.batch([
			db
				.prepare("INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)")
				.bind(body.userId, body.email),
			db
				.prepare(
					"INSERT INTO credentials (userId, credentialId, publicKey, counter) VALUES (?, ?, ?, ?)"
				)
				.bind(body.userId, credIdB64, pubKeyB64, safeCounter),
		]);

		await kv.delete(`reg-${body.userId}`);
		return Response.json({ ok: true });
	} catch (err: any) {
		return new Response(
			JSON.stringify({ error: String(err?.message || err) }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
};

function toBase64Url(data: ArrayBuffer | Uint8Array): string {
	const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
	let bin = "";
	for (let i = 0; i < bytes.length; i += 1)
		bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
