import { Router } from "express";

import * as mediaController from "./media.controller.js";
import { uploadMedia } from "./media.upload.js";

const router = Router();

router.get("/projects/:projectId/media", mediaController.getProjectMedia);
router.post("/projects/:projectId/media", uploadMedia.single("file"), mediaController.createMedia);
router.get("/media/:id", mediaController.getMediaById);
router.delete("/media/:id", mediaController.deleteMedia);

export default router;