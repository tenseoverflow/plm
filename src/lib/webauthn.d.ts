export declare function bufferToBase64url(buf: ArrayBuffer): string;
export declare function base64urlToBuffer(base64url: string): ArrayBuffer;
export declare function startServerRegistration(email: string): Promise<{
    userId: string;
    options: PublicKeyCredentialCreationOptions;
}>;
export declare function finishServerRegistration(userId: string, email: string, cred: PublicKeyCredential): Promise<void>;
export declare function startServerLogin(email: string): Promise<{
    userId: string;
    options: PublicKeyCredentialRequestOptions;
}>;
export declare function finishServerLogin(userId: string, email: string, cred: PublicKeyCredential): Promise<void>;
