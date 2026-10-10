import { Router } from "express";

import * as controller from "./ai-analysis.controller.js";

const router = Router();

router.post("/media/:id/analyze", controller.analyzeMedia);
router.get("/media/:id/analysis", controller.getMediaAnalysis);
router.get("/projects/:projectId/analyses", controller.getProjectMediaAnalyses);

export default router;
