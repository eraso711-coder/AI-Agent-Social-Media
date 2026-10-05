import type {
  Request,
  Response,
} from "express";

import { prisma } from "../../config/prisma.js";

import {
  deletePhysicalFile,
  getAbsoluteStoragePath,
} from "./media.storage.js";

import {
  generateThumbnail,
} from "./media.thumbnail.js";

function serializeMedia(media: {
  id: string;
  projectId: string;
  originalName: string;
  filename: string;
  storagePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  mediaType:
    | "IMAGE"
    | "VIDEO"
    | "AUDIO";
  sizeBytes: bigint;
  duration: number | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...media,
    sizeBytes:
      media.sizeBytes.toString(),
  };
}

function getMediaType(
  mimeType: string,
):
  | "IMAGE"
  | "VIDEO"
  | "AUDIO" {
  if (
    mimeType.startsWith(
      "image/",
    )
  ) {
    return "IMAGE";
  }

  if (
    mimeType.startsWith(
      "video/",
    )
  ) {
    return "VIDEO";
  }

  if (
    mimeType.startsWith(
      "audio/",
    )
  ) {
    return "AUDIO";
  }

  throw new Error(
    `Unsupported media type: ${mimeType}`,
  );
}

function getProjectId(
  req: Request,
): string | null {
  const projectIdParam =
    req.params.projectId;

  if (
    Array.isArray(
      projectIdParam,
    )
  ) {
    return (
      projectIdParam[0] ??
      null
    );
  }

  return (
    projectIdParam ??
    null
  );
}

function getMediaId(
  req: Request,
): string | null {
  const mediaIdParam =
    req.params.id;

  if (
    Array.isArray(
      mediaIdParam,
    )
  ) {
    return (
      mediaIdParam[0] ??
      null
    );
  }

  return (
    mediaIdParam ??
    null
  );
}

export async function getProjectMedia(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const projectId =
      getProjectId(req);

    if (!projectId) {
      res.status(400).json({
        success: false,
        error:
          "Project ID is required",
      });

      return;
    }

    const media =
      await prisma.mediaAsset.findMany({
        where: {
          projectId,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    res.json({
      success: true,
      data: media.map(
        serializeMedia,
      ),
    });
  } catch (error) {
    console.error(
      "Error getting project media:",
      error,
    );

    res.status(500).json({
      success: false,
      error:
        "Failed to get project media",
    });
  }
}

export async function getMediaById(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      getMediaId(req);

    if (!id) {
      res.status(400).json({
        success: false,
        error:
          "Media ID is required",
      });

      return;
    }

    const media =
      await prisma.mediaAsset.findUnique({
        where: {
          id,
        },
      });

    if (!media) {
      res.status(404).json({
        success: false,
        error:
          "Media not found",
      });

      return;
    }

    res.json({
      success: true,
      data:
        serializeMedia(media),
    });
  } catch (error) {
    console.error(
      "Error getting media:",
      error,
    );

    res.status(500).json({
      success: false,
      error:
        "Failed to get media",
    });
  }
}

export async function createMedia(
  req: Request,
  res: Response,
): Promise<void> {
  const uploadedFile =
    req.file;

  let storagePath:
    | string
    | null = null;

  let thumbnailPath:
    | string
    | null = null;

  try {
    const projectId =
      getProjectId(req);

    if (!projectId) {
      res.status(400).json({
        success: false,
        error:
          "Project ID is required",
      });

      return;
    }

    if (!uploadedFile) {
      res.status(400).json({
        success: false,
        error:
          "File is required",
      });

      return;
    }

    const detectedMediaType =
      getMediaType(
        uploadedFile.mimetype,
      );

    const storageDirectory =
      detectedMediaType === "IMAGE"
        ? "images"
        : detectedMediaType ===
            "VIDEO"
          ? "videos"
          : "audio";

    storagePath =
      `${storageDirectory}/${projectId}/${uploadedFile.filename}`;

    const absoluteSourcePath =
      getAbsoluteStoragePath(
        storagePath,
      );

    thumbnailPath =
      await generateThumbnail(
        absoluteSourcePath,
        projectId,
        uploadedFile.filename,
        detectedMediaType,
      );

    const media =
      await prisma.mediaAsset.create({
        data: {
          projectId,

          originalName:
            uploadedFile.originalname,

          filename:
            uploadedFile.filename,

          storagePath,

          thumbnailPath,

          mimeType:
            uploadedFile.mimetype,

          mediaType:
            detectedMediaType,

          sizeBytes:
            BigInt(
              uploadedFile.size,
            ),

          duration: null,
          width: null,
          height: null,
        },
      });

    res.status(201).json({
      success: true,
      data:
        serializeMedia(media),
    });
  } catch (error) {
    console.error(
      "Error creating media:",
      error,
    );

    if (thumbnailPath) {
      try {
        deletePhysicalFile(
          thumbnailPath,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Error deleting thumbnail:",
          cleanupError,
        );
      }
    }

    if (storagePath) {
      try {
        deletePhysicalFile(
          storagePath,
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Error deleting uploaded file:",
          cleanupError,
        );
      }
    }

    res.status(500).json({
      success: false,
      error:
        "Failed to create media",
    });
  }
}

export async function deleteMedia(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id =
      getMediaId(req);

    if (!id) {
      res.status(400).json({
        success: false,
        error:
          "Media ID is required",
      });

      return;
    }

    const media =
      await prisma.mediaAsset.findUnique({
        where: {
          id,
        },
      });

    if (!media) {
      res.status(404).json({
        success: false,
        error:
          "Media not found",
      });

      return;
    }

    await prisma.mediaAsset.delete({
      where: {
        id,
      },
    });

    try {
      deletePhysicalFile(
        media.storagePath,
      );
    } catch (fileError) {
      console.error(
        "Error deleting physical media file:",
        fileError,
      );
    }

    if (
      media.thumbnailPath
    ) {
      try {
        deletePhysicalFile(
          media.thumbnailPath,
        );
      } catch (
        thumbnailError
      ) {
        console.error(
          "Error deleting thumbnail:",
          thumbnailError,
        );
      }
    }

    res.json({
      success: true,
      message:
        "Media deleted successfully",
    });
  } catch (error) {
    console.error(
      "Error deleting media:",
      error,
    );

    res.status(500).json({
      success: false,
      error:
        "Failed to delete media",
    });
  }
}