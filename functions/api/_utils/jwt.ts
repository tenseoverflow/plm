export async function createJWT(
	payload: Record<string, any>,
	secret: string,
	expSeconds = 60 * 60 * 24 * 7
): Promise<string> {
	const header = { alg: "HS256", typ: "JWT" };
	const now = Math.floor(Date.now() / 1000);
	const body = { ...payload, iat: now, exp: now + expSeconds };
	const enc = (obj: any) =>
		btoa(JSON.stringify(obj))
			.replace(/=/g, "")
			.replace(/\+/g, "-")
			.replace(/\//g, "_");
	const data = `${enc(header)}.${enc(body)}`;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data)
	);
	const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	return `${data}.${sigB64}`;
}

export async function verifyJWT(
	token: string,
	secret: string
): Promise<Record<string, any> | null> {
	const [h, p, s] = token.split(".");
	if (!h || !p || !s) return null;
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const data = `${h}.${p}`;
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data)
	);
	const expected = btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
	if (expected !== s) return null;
	const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
	if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
	return payload;
}

export function createSessionCookie(jwt: string, origin: string): string {
	const isSecure = origin.startsWith("https://");
	const attrs = [
		"Path=/",
		`Expires=${new Date(Date.now() + 7 * 86400000).toUTCString()}`,
		"HttpOnly",
		"SameSite=Lax",
		isSecure ? "Secure" : "",
	].filter(Boolean);
	return `plm_s=${jwt}; ${attrs.join("; ")}`;
}

export function clearSessionCookie(origin: string): string {
	const isSecure = origin.startsWith("https://");
	const attrs = [
		"Path=/",
		"Expires=Thu, 01 Jan 1970 00:00:00 GMT",
		"HttpOnly",
		"SameSite=Lax",
		isSecure ? "Secure" : "",
	].filter(Boolean);
	return `plm_s=; ${attrs.join("; ")}`;
}
