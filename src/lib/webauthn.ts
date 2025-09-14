// WebAuthn/Passkey helpers for authentication and data synchronization

export function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i += 1)
    str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const pad =
    base64url.length % 4 === 0 ? "" : "=".repeat(4 - (base64url.length % 4));
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const str = atob(base64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

export async function startPasskeyRegistration(
  name: string,
): Promise<{ options: PublicKeyCredentialCreationOptions; userId: string }> {
  const res = await fetch("/api/passkey/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Registration start failed:", res.status, txt);
    throw new Error(`Failed to start registration (${res.status}): ${txt}`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (e) {
    const txt = await res.text().catch(() => "Unknown error");
    console.error("Failed to parse registration response as JSON:", txt);
    throw new Error(`Server returned invalid JSON response: ${txt}`);
  }

  const opts = json.options as any;

  // Convert base64url strings to ArrayBuffers
  opts.challenge = base64urlToBuffer(opts.challenge);
  if (opts.user && typeof opts.user.id === "string") {
    opts.user.id = base64urlToBuffer(opts.user.id);
  }

  return { options: opts, userId: json.userId };
}

export async function finishPasskeyRegistration(
  name: string,
  credential: PublicKeyCredential,
  localData?: any,
  userId?: string,
): Promise<{ success: boolean; userId: string }> {
  const response: any = {
    id: bufferToBase64url(credential.rawId),
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(
        (credential.response as AuthenticatorAttestationResponse)
          .clientDataJSON,
      ),
      attestationObject: bufferToBase64url(
        (credential.response as AuthenticatorAttestationResponse)
          .attestationObject!,
      ),
    },
    clientExtensionResults:
      (credential.getClientExtensionResults &&
        credential.getClientExtensionResults()) ||
      {},
  };

  const res = await fetch("/api/passkey/register", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      name,
      credential: response,
      localData, // Include any local data to sync
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Registration completion failed:", res.status, txt);
    throw new Error(`Registration failed (${res.status}): ${txt}`);
  }

  let result: any;
  try {
    result = await res.json();
  } catch (e) {
    const txt = await res.text().catch(() => "Unknown error");
    console.error(
      "Failed to parse registration completion response as JSON:",
      txt,
    );
    throw new Error(`Server returned invalid JSON response: ${txt}`);
  }

  return result;
}

export async function startPasskeyLogin(): Promise<{
  options: PublicKeyCredentialRequestOptions;
  sessionId: string;
}> {
  const res = await fetch("/api/passkey/login", {
    method: "POST",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Failed to start login (${res.status}): ${txt}`);
  }

  const json: any = await res.json();
  const opts = json.options as any;

  // Convert base64url strings to ArrayBuffers
  opts.challenge = base64urlToBuffer(opts.challenge);
  if (Array.isArray(opts.allowCredentials)) {
    opts.allowCredentials = opts.allowCredentials.map((d: any) => ({
      ...d,
      id: base64urlToBuffer(d.id),
    }));
  }

  return { options: opts, sessionId: json.sessionId };
}

export async function finishPasskeyLogin(
  credential: PublicKeyCredential,
  sessionId: string,
): Promise<{ success: boolean; userId: string; userData: any }> {
  const response: any = {
    id: bufferToBase64url(credential.rawId),
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64url(
        (credential.response as AuthenticatorAssertionResponse).clientDataJSON,
      ),
      authenticatorData: bufferToBase64url(
        (credential.response as AuthenticatorAssertionResponse)
          .authenticatorData,
      ),
      signature: bufferToBase64url(
        (credential.response as AuthenticatorAssertionResponse).signature,
      ),
      userHandle: (credential.response as AuthenticatorAssertionResponse)
        .userHandle
        ? bufferToBase64url(
            (credential.response as AuthenticatorAssertionResponse).userHandle!,
          )
        : undefined,
    },
    clientExtensionResults:
      (credential.getClientExtensionResults &&
        credential.getClientExtensionResults()) ||
      {},
  };

  const res = await fetch("/api/passkey/login", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: response, sessionId }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Login failed (${res.status}): ${txt}`);
  }

  const result = await res.json();
  return result;
}

export async function syncDataToServer(
  data: any,
  userId?: string,
): Promise<{ success: boolean }> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, userId }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Sync failed (${res.status}): ${txt}`);
  }

  return await res.json();
}

export async function loadDataFromServer(
  userId?: string,
): Promise<{ success: boolean; data?: any }> {
  const url = userId
    ? `/api/sync?userId=${encodeURIComponent(userId)}`
    : "/api/sync";
  const res = await fetch(url);

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Load failed (${res.status}): ${txt}`);
  }

  return await res.json();
}

export async function deleteAccount(
  userId: string,
): Promise<{ success: boolean }> {
  const res = await fetch("/api/account/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Account deletion failed (${res.status}): ${txt}`);
  }

  return await res.json();
}
