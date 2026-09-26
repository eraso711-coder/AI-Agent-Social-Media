import { Router } from "express";

import * as mediaController from "./media.controller.js";

const router = Router();

router.get("/projects/:projectId/media", mediaController.getProjectMedia);
router.post("/projects/:projectId/media", mediaController.createMedia);
router.get("/media/:id", mediaController.getMediaById);
router.delete("/media/:id", mediaController.deleteMedia);

export default router;