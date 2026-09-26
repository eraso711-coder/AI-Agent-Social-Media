import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import healthRoutes from "./routes/health.routes.js";
import projectsRoutes from "./modules/projects/projects.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "AI Agent for Social Media",
    version: "1.0.0",
    status: "running"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api", mediaRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(
    `Social Media API running at http://${env.HOST}:${env.PORT}`
  );
});

async function shutdown() {
  console.log("Shutting down API...");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);