import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url),
);

export const PROJECT_ROOT = path.resolve(
  currentDirectory,
  "../../../../",
);

export const STORAGE_DIRECTORY =
  path.join(
    PROJECT_ROOT,
    "storage",
  );

export const AUDIO_DIRECTORY =
  path.join(
    STORAGE_DIRECTORY,
    "audio",
  );

export const IMAGES_DIRECTORY =
  path.join(
    STORAGE_DIRECTORY,
    "images",
  );

export const VIDEOS_DIRECTORY =
  path.join(
    STORAGE_DIRECTORY,
    "videos",
  );

export const THUMBNAILS_DIRECTORY =
  path.join(
    STORAGE_DIRECTORY,
    "thumbnails",
  );

export const UPLOADS_DIRECTORY =
  STORAGE_DIRECTORY;

export function ensureStorageDirectories(): void {
  fs.mkdirSync(
    AUDIO_DIRECTORY,
    {
      recursive: true,
    },
  );

  fs.mkdirSync(
    IMAGES_DIRECTORY,
    {
      recursive: true,
    },
  );

  fs.mkdirSync(
    VIDEOS_DIRECTORY,
    {
      recursive: true,
    },
  );

  fs.mkdirSync(
    THUMBNAILS_DIRECTORY,
    {
      recursive: true,
    },
  );
}

export function getMediaDirectory(
  mediaType: string,
): string {
  switch (mediaType) {
    case "IMAGE":
      return IMAGES_DIRECTORY;

    case "VIDEO":
      return VIDEOS_DIRECTORY;

    case "AUDIO":
      return AUDIO_DIRECTORY;

    default:
      throw new Error(
        `Unsupported media type: ${mediaType}`,
      );
  }
}

export function getProjectMediaDirectory(
  mediaType: string,
  projectId: string,
): string {
  const mediaDirectory =
    getMediaDirectory(mediaType);

  const projectDirectory =
    path.join(
      mediaDirectory,
      projectId,
    );

  fs.mkdirSync(
    projectDirectory,
    {
      recursive: true,
    },
  );

  return projectDirectory;
}

export function getThumbnailDirectory(
  projectId: string,
): string {
  const projectDirectory =
    path.join(
      THUMBNAILS_DIRECTORY,
      projectId,
    );

  fs.mkdirSync(
    projectDirectory,
    {
      recursive: true,
    },
  );

  return projectDirectory;
}

export function getAbsoluteStoragePath(
  storagePath: string,
): string {
  const absolutePath =
    path.resolve(
      STORAGE_DIRECTORY,
      storagePath,
    );

  const storageRoot =
    path.resolve(
      STORAGE_DIRECTORY,
    );

  if (
    absolutePath !== storageRoot &&
    !absolutePath.startsWith(
      `${storageRoot}${path.sep}`,
    )
  ) {
    throw new Error(
      "Invalid storage path",
    );
  }

  return absolutePath;
}

export function deletePhysicalFile(
  storagePath: string,
): void {
  const absolutePath =
    getAbsoluteStoragePath(
      storagePath,
    );

  if (
    fs.existsSync(
      absolutePath,
    )
  ) {
    fs.unlinkSync(
      absolutePath,
    );
  }
}

ensureStorageDirectories();