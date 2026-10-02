import crypto from "crypto";
import multer from "multer";
import path from "path";

import {
  getProjectMediaDirectory,
} from "./media.storage.js";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",

  "video/mp4",
  "video/quicktime",
  "video/webm",

  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/webm",
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const projectIdParam = req.params.projectId;

    const projectId = Array.isArray(projectIdParam)
      ? projectIdParam[0]
      : projectIdParam;

    if (!projectId) {
      callback(
        new Error("Project ID is required"),
        "",
      );
      return;
    }

    let mediaType:
      | "IMAGE"
      | "VIDEO"
      | "AUDIO";

    if (file.mimetype.startsWith("image/")) {
      mediaType = "IMAGE";
    } else if (
      file.mimetype.startsWith("video/")
    ) {
      mediaType = "VIDEO";
    } else if (
      file.mimetype.startsWith("audio/")
    ) {
      mediaType = "AUDIO";
    } else {
      callback(
        new Error(`Unsupported media type: ${file.mimetype}`,),
        "",
      );
      return;
    }

    const directory = getProjectMediaDirectory(mediaType, projectId,);

    callback(null, directory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(
      file.originalname,
    );

    const filename = `${crypto.randomUUID()}${extension}`;

    callback(null, filename);
  },
});

export const uploadMedia = multer({
  storage,

  limits: {
    fileSize: 100 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new Error(`Unsupported file type: ${file.mimetype}`,),
      );

      return;
    }

    callback(null, true);
  },
});