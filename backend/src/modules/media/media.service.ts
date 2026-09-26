import { prisma } from "../../config/prisma.js";

export async function getProjectMedia(projectId: string) {
  return prisma.mediaAsset.findMany({
    where: {
      projectId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getMediaById(id: string) {
  return prisma.mediaAsset.findUnique({
    where: {
      id
    }
  });
}

export async function createMedia(data: {
  projectId: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  sizeBytes: bigint;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
}) {
  return prisma.mediaAsset.create({
    data
  });
}

export async function deleteMedia(id: string) {
  return prisma.mediaAsset.delete({
    where: {
      id
    }
  });
}