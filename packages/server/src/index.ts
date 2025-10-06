import { apiReference } from "@scalar/express-api-reference";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";
import swaggerUi from "swagger-ui-express";
import { accountRoutes } from "./routes/account.js";
import { healthRoutes } from "./routes/health.js";
import { registerRoutes } from "./routes/passkey.js";
import { syncRoutes } from "./routes/sync.js";
import { swaggerSpec } from "./swagger.js";

dotenv.config();

const app = express();
const { Pool } = pg;

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully at:", res.rows[0].now);
  }
});

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// API Documentation
app.get("/api/docs/openapi.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Scalar API Documentation (Beautiful modern UI)
app.use(
  "/api/docs",
  apiReference({
    spec: {
      content: swaggerSpec,
    },
  }),
);

// Swagger UI (Traditional UI)
app.use("/api/docs/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use("/api/passkey", registerRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/health", healthRoutes);

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
