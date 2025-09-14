export interface Env {
  PLM_DB: D1Database;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RP_NAME: string;
  RP_ID: string;
  ORIGIN: string;
}
