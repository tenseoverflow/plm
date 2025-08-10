// @ts-nocheck
import { clearSessionCookie } from "./_utils/jwt";

export const onRequestPost: PagesFunction<{ ORIGIN: string }> = async ({
	env,
}) => {
	const cookie = clearSessionCookie(env.ORIGIN);
	return new Response(JSON.stringify({ ok: true }), {
		headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
	});
};
