import {
	generateAuthenticationOptions,
	verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { createJWT, createSessionCookie } from "../_utils/jwt";

export const onRequestGet: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_ID: string;
}> = async (context) => {
	const { env, request } = context;
	const url = new URL(request.url);
	const email = url.searchParams.get("email") ?? "";
	if (!email) return new Response("email required", { status: 400 });
	const userRow = (await env.PLM_DB.prepare(
		"SELECT id FROM users WHERE email = ?"
	)
		.bind(email)
		.first()) as any;
	if (!userRow) return new Response("not found", { status: 404 });
	const creds = (await env.PLM_DB.prepare(
		"SELECT credentialId FROM credentials WHERE userId = ?"
	)
		.bind(userRow.id)
		.all()) as any;
	const genRpid = new URL(request.url).hostname;
	const options = await generateAuthenticationOptions({
		rpID: genRpid,
		allowCredentials:
			creds.results?.map((c: any) => ({ id: c.credentialId })) ?? [],
		userVerification: "preferred",
	});
	await env.SESSIONS.put(
		`auth-${userRow.id}`,
		JSON.stringify({ challenge: options.challenge, email }),
		{ expirationTtl: 600 }
	);
	return Response.json({ userId: userRow.id, options });
};

export const onRequestPost: PagesFunction<{
	PLM_DB: D1Database;
	SESSIONS: KVNamespace;
	RP_ID: string;
	ORIGIN: string;
	JWT_SECRET: string;
}> = async (context) => {
	const { env, request } = context;
	const body = (await request.json()) as any;
	const sessionRaw = await env.SESSIONS.get(`auth-${body.userId}`);
	if (!sessionRaw) return new Response("no session", { status: 400 });
	const session = JSON.parse(sessionRaw) as {
		challenge: string;
		email: string;
	};
	if (session.email !== body.email)
		return new Response("email mismatch", { status: 400 });

	const credRow = (await env.PLM_DB.prepare(
		"SELECT publicKey, counter FROM credentials WHERE credentialId = ?"
	)
		.bind(Buffer.from(body.response.id).toString("base64url"))
		.first()) as any;
	if (!credRow) return new Response("credential not found", { status: 400 });

	const requestOrigin = (
		context.request.headers.get("Origin") || ""
	).toString();
	const origins = Array.from(
		new Set([env.ORIGIN, requestOrigin].filter(Boolean))
	);
	const rpid = new URL(context.request.url).hostname;
	const verification = await verifyAuthenticationResponse({
		expectedChallenge: session.challenge,
		expectedOrigin:
			origins.length > 0
				? origins.length === 1
					? origins[0]
					: origins
				: env.ORIGIN,
		expectedRPID: rpid,
		response: body.response,
		authenticator: {
			credentialPublicKey: Buffer.from(credRow.publicKey, "base64url"),
			credentialID: Buffer.from(body.response.id, "base64url"),
			counter: credRow.counter,
			transports: ["internal"],
		},
	} as any);

	if (!verification.verified || !verification.authenticationInfo) {
		return new Response("verification failed", { status: 400 });
	}

	await env.PLM_DB.prepare(
		"UPDATE credentials SET counter = ? WHERE credentialId = ?"
	)
		.bind(
			verification.authenticationInfo.newCounter,
			Buffer.from(body.response.id).toString("base64url")
		)
		.run();
	await env.SESSIONS.delete(`auth-${body.userId}`);
	const jwt = await createJWT(
		{ sub: body.userId, email: body.email },
		env.JWT_SECRET
	);
	const cookie = createSessionCookie(jwt, env.ORIGIN);
	return new Response(JSON.stringify({ ok: true }), {
		headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
	});
};
