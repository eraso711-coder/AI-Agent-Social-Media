import { prisma } from "../../config/prisma.js";

export async function getProjectMedia(
  projectId: string,
) {
  return prisma.mediaAsset.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMediaById(
  id: string,
) {
  return prisma.mediaAsset.findUnique({
    where: {
      id,
    },
  });
}

export async function createMedia(data: {
  projectId: string;

  originalName: string;

  filename: string;

  storagePath: string;

  thumbnailPath?: string | null;

  mimeType: string;

  mediaType:
    | "IMAGE"
    | "VIDEO"
    | "AUDIO";

  sizeBytes: bigint;

  duration?: number | null;

  width?: number | null;

  height?: number | null;
}) {
  return prisma.mediaAsset.create({
    data: {
      projectId:
        data.projectId,

      originalName:
        data.originalName,

      filename:
        data.filename,

      storagePath:
        data.storagePath,

      thumbnailPath:
        data.thumbnailPath ??
        null,

      mimeType:
        data.mimeType,

      mediaType:
        data.mediaType,

      sizeBytes:
        data.sizeBytes,

      duration:
        data.duration ??
        null,

      width:
        data.width ??
        null,

      height:
        data.height ??
        null,
    },
  });
}

export async function deleteMedia(
  id: string,
) {
  return prisma.mediaAsset.delete({
    where: {
      id,
    },
  });
}