export declare const onRequestGet: PagesFunction<{
    PLM_DB: D1Database;
    SESSIONS: KVNamespace;
    RP_NAME: string;
    RP_ID: string;
    ORIGIN: string;
}>;
export declare const onRequestPost: PagesFunction<{
    PLM_DB: D1Database;
    SESSIONS: KVNamespace;
    RP_ID: string;
    ORIGIN: string;
}>;
