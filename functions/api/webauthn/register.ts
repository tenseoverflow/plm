// @ts-nocheck
import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/typescript-types";

export const onRequestGet: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_NAME: string;
	RP_ID: string;
	ORIGIN: string;
}> = async (context) => {
	const { env, request } = context;
	const url = new URL(request.url);
	const email = url.searchParams.get("email") ?? "";
	if (!email) return new Response("email required", { status: 400 });

	const userRow = await env.PLM_DB.prepare(
		"SELECT id FROM users WHERE email = ?"
	)
		.bind(email)
		.first<{ id: string }>();
	const userId = userRow?.id ?? crypto.randomUUID();

	const existingCreds = await env.PLM_DB.prepare(
		"SELECT credentialId FROM credentials WHERE userId = ?"
	)
		.bind(userId)
		.all<{ credentialId: string }>();

	const options = await generateRegistrationOptions({
		rpName: env.RP_NAME,
		rpID: env.RP_ID,
		userID: userId,
		userName: email,
		attestationType: "none",
		authenticatorSelection: {
			userVerification: "preferred",
			residentKey: "preferred",
		},
		excludeCredentials:
			existingCreds.results?.map((c) => ({
				id: Buffer.from(c.credentialId, "base64url"),
				type: "public-key",
			})) ?? [],
	});

	await env.SESSIONS.put(
		`reg-${userId}`,
		JSON.stringify({ challenge: options.challenge, email }),
		{ expirationTtl: 600 }
	);
	return Response.json({ userId, options });
};

export const onRequestPost: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_ID: string;
	ORIGIN: string;
}> = async (context) => {
	const { env, request } = context;
	const body = (await request.json()) as {
		userId: string;
		email: string;
		response: RegistrationResponseJSON;
	};
	const sessionRaw = await env.SESSIONS.get(`reg-${body.userId}`);
	if (!sessionRaw) return new Response("no session", { status: 400 });
	const session = JSON.parse(sessionRaw) as {
		challenge: string;
		email: string;
	};
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

	const { credentialPublicKey, credentialID, counter } =
		verification.registrationInfo;
	await env.PLM_DB.batch([
		env.PLM_DB.prepare(
			"INSERT OR IGNORE INTO users (id, email) VALUES (?, ?)"
		).bind(body.userId, body.email),
		env.PLM_DB.prepare(
			"INSERT INTO credentials (userId, credentialId, publicKey, counter) VALUES (?, ?, ?, ?)"
		).bind(
			body.userId,
			Buffer.from(credentialID).toString("base64url"),
			Buffer.from(credentialPublicKey).toString("base64url"),
			counter
		),
	]);

	await env.SESSIONS.delete(`reg-${body.userId}`);
	return Response.json({ ok: true });
};
