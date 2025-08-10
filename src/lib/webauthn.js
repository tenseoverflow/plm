// Minimal WebAuthn helpers for local-only passkey lock. No server verification.
export function bufferToBase64url(buf) {
    const bytes = new Uint8Array(buf);
    let str = "";
    for (let i = 0; i < bytes.byteLength; i += 1)
        str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export function base64urlToBuffer(base64url) {
    const pad = base64url.length % 4 === 0 ? "" : "=".repeat(4 - (base64url.length % 4));
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const str = atob(base64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1)
        bytes[i] = str.charCodeAt(i);
    return bytes.buffer;
}
// Retained for potential local flows; currently not used after server integration
// function randomBytes(size: number): Uint8Array {
//     const arr = new Uint8Array(size);
//     crypto.getRandomValues(arr);
//     return arr;
// }
export async function startServerRegistration(email) {
    const res = await fetch(`/api/webauthn/register?email=${encodeURIComponent(email)}`);
    if (!res.ok)
        throw new Error("Failed to start registration");
    const json = await res.json();
    const opts = json.options;
    opts.challenge = base64urlToBuffer(opts.challenge);
    if (Array.isArray(opts.excludeCredentials))
        opts.excludeCredentials = opts.excludeCredentials.map((d) => ({
            ...d,
            id: base64urlToBuffer(d.id),
        }));
    return { userId: json.userId, options: opts };
}
export async function finishServerRegistration(userId, email, cred) {
    const att = {
        id: bufferToBase64url(cred.rawId),
        rawId: bufferToBase64url(cred.rawId),
        type: cred.type,
        response: {
            clientDataJSON: bufferToBase64url(cred.response.clientDataJSON),
            attestationObject: bufferToBase64url(cred.response.attestationObject),
        },
        clientExtensionResults: (cred.getClientExtensionResults && cred.getClientExtensionResults()) ||
            {},
    };
    const res = await fetch("/api/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, response: att }),
    });
    if (!res.ok)
        throw new Error("Registration verify failed");
}
export async function startServerLogin(email) {
    const res = await fetch(`/api/webauthn/login?email=${encodeURIComponent(email)}`);
    if (!res.ok)
        throw new Error("Failed to start login");
    const json = await res.json();
    const opts = json.options;
    opts.challenge = base64urlToBuffer(opts.challenge);
    if (Array.isArray(opts.allowCredentials))
        opts.allowCredentials = opts.allowCredentials.map((d) => ({
            ...d,
            id: base64urlToBuffer(d.id),
        }));
    return { userId: json.userId, options: opts };
}
export async function finishServerLogin(userId, email, cred) {
    const resJson = {
        id: bufferToBase64url(cred.rawId),
        rawId: bufferToBase64url(cred.rawId),
        type: cred.type,
        response: {
            clientDataJSON: bufferToBase64url(cred.response.clientDataJSON),
            authenticatorData: bufferToBase64url(cred.response.authenticatorData),
            signature: bufferToBase64url(cred.response.signature),
            userHandle: cred.response.userHandle
                ? bufferToBase64url(cred.response.userHandle)
                : undefined,
        },
        clientExtensionResults: (cred.getClientExtensionResults && cred.getClientExtensionResults()) ||
            {},
    };
    const res = await fetch("/api/webauthn/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, response: resJson }),
    });
    if (!res.ok)
        throw new Error("Login verify failed");
}
