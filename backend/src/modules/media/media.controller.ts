import type { Request, Response } from "express";

import * as mediaService from "./media.service.js";

function serializeMedia(media: any) {
  return {
    ...media,
    sizeBytes: media.sizeBytes.toString()
  };
}

export async function getProjectMedia(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = String(req.params.projectId);

    const media = await mediaService.getProjectMedia(projectId);

    res.json({
      success: true,
      data: media.map(serializeMedia)
    });
  } catch (error) {
    console.error("Error getting project media:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve project media"
    });
  }
}

export async function getMediaById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);

    const media = await mediaService.getMediaById(id);

    if (!media) {
      res.status(404).json({
        success: false,
        message: "Media asset not found"
      });
      return;
    }

    res.json({
      success: true,
      data: serializeMedia(media)
    });
  } catch (error) {
    console.error("Error getting media asset:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve media asset"
    });
  }
}

export async function createMedia(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const projectId = String(req.params.projectId);

    const {
      originalName,
      storagePath,
      mimeType,
      mediaType,
      sizeBytes,
      duration,
      width,
      height
    } = req.body;

    if (!originalName) {
      res.status(400).json({
        success: false,
        message: "Original name is required"
      });
      return;
    }

    if (!storagePath) {
      res.status(400).json({
        success: false,
        message: "Storage path is required"
      });
      return;
    }

    if (!mimeType) {
      res.status(400).json({
        success: false,
        message: "MIME type is required"
      });
      return;
    }

    if (!mediaType) {
      res.status(400).json({
        success: false,
        message: "Media type is required"
      });
      return;
    }

    if (sizeBytes === undefined || sizeBytes === null) {
      res.status(400).json({
        success: false,
        message: "Size is required"
      });
      return;
    }

    if (!["IMAGE", "VIDEO", "AUDIO"].includes(mediaType)) {
      res.status(400).json({
        success: false,
        message: "Invalid media type"
      });
      return;
    }

    const media = await mediaService.createMedia({
      projectId,
      originalName,
      storagePath,
      mimeType,
      mediaType,
      sizeBytes: BigInt(sizeBytes),
      duration: duration ?? null,
      width: width ?? null,
      height: height ?? null
    });

    res.status(201).json({
      success: true,
      data: serializeMedia(media)
    });
  } catch (error) {
    console.error("Error creating media asset:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create media asset"
    });
  }
}

export async function deleteMedia(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = String(req.params.id);

    const existingMedia = await mediaService.getMediaById(id);

    if (!existingMedia) {
      res.status(404).json({
        success: false,
        message: "Media asset not found"
      });
      return;
    }

    await mediaService.deleteMedia(id);

    res.json({
      success: true,
      message: "Media asset deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting media asset:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete media asset"
    });
  }
}