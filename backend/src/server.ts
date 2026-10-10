import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

import healthRoutes from "./routes/health.routes.js";
import projectsRoutes from "./modules/projects/projects.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import aiAnalysisRoutes from "./modules/ai-analysis/ai-analysis.routes.js";

import {
  STORAGE_DIRECTORY,
} from "./modules/media/media.storage.js";

const app =
  express();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin:
      env.FRONTEND_URL,
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  "/uploads",
  express.static(
    STORAGE_DIRECTORY,
    {
      setHeaders: (
        res,
      ) => {
        res.setHeader(
          "Access-Control-Allow-Origin",
          env.FRONTEND_URL,
        );
      },
    },
  ),
);

app.get(
  "/",
  (_req, res) => {
    res.json({
      name:
        "AI Agent for Social Media",
      version:
        "1.0.0",
      status:
        "running",
    });
  },
);

app.use(
  "/api/health",
  healthRoutes,
);

app.use(
  "/api/projects",
  projectsRoutes,
);

app.use(
  "/api",
  aiAnalysisRoutes,
);

app.use(
  "/api",
  mediaRoutes,
);

app.use(
  (_req, res) => {
    res.status(404).json({
      success: false,
      error:
        "Route not found",
    });
  },
);

const server =
  app.listen(
    env.PORT,
    env.HOST,
    () => {
      console.log(
        `Social Media API running at http://${env.HOST}:${env.PORT}`,
      );

      console.log(
        `Media files served from http://${env.HOST}:${env.PORT}/uploads`,
      );

      console.log(
        `Media storage directory: ${STORAGE_DIRECTORY}`,
      );
    },
  );

async function shutdown(): Promise<void> {
  console.log(
    "Shutting down API...",
  );

  server.close(
    async () => {
      await prisma.$disconnect();

      process.exit(0);
    },
  );
}

process.on(
  "SIGINT",
  shutdown,
);

process.on(
  "SIGTERM",
  shutdown,
);
