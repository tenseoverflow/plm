import { type Request, type Response, Router } from "express";

const router = Router();

// Placeholder for CalDAV routes
// TODO: Implement CalDAV functionality
router.all("*", async (req: Request, res: Response) => {
  res.status(501).json({ error: "CalDAV not yet implemented" });
});

export { router as caldavRoutes };
