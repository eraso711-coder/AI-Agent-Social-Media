import { Router } from "express";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  let database: "connected" | "disconnected" = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "disconnected";

    console.error("Database health check failed:", error);
  }

  const status = database === "connected" ? 200 : 503;

  res.status(status).json({
    status: database === "connected" ? "OK" : "ERROR",
    message:
      database === "connected"
        ? "Social Media API is running"
        : "API is running but database is unavailable",
    database
  });
});

export default router;