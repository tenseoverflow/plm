export declare function createJWT(payload: Record<string, any>, secret: string, expSeconds?: number): Promise<string>;
export declare function verifyJWT(token: string, secret: string): Promise<Record<string, any> | null>;
export declare function createSessionCookie(jwt: string, origin: string): string;
export declare function clearSessionCookie(origin: string): string;
