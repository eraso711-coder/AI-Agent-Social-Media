import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

import {
  getThumbnailDirectory,
} from './media.storage.js';

const execFileAsync =
  promisify(execFile);

const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;

function getThumbnailFilename(
  filename: string,
): string {
  const extension =
    path.extname(filename);

  const basename =
    path.basename(
      filename,
      extension,
    );

  return `${basename}.jpg`;
}

export async function generateImageThumbnail(
  sourcePath: string,
  projectId: string,
  filename: string,
): Promise<string> {
  const thumbnailDirectory =
    getThumbnailDirectory(
      projectId,
    );

  const thumbnailFilename =
    getThumbnailFilename(
      filename,
    );

  const thumbnailAbsolutePath =
    path.join(
      thumbnailDirectory,
      thumbnailFilename,
    );

  await sharp(sourcePath)
    .resize(
      THUMBNAIL_WIDTH,
      THUMBNAIL_HEIGHT,
      {
        fit: 'cover',
        position: 'centre',
      },
    )
    .jpeg({
      quality: 85,
    })
    .toFile(
      thumbnailAbsolutePath,
    );

  return `thumbnails/${projectId}/${thumbnailFilename}`;
}

export async function generateVideoThumbnail(
  sourcePath: string,
  projectId: string,
  filename: string,
): Promise<string> {
  if (!ffmpegPath) {
    throw new Error(
      'FFmpeg binary is not available',
    );
  }

  const ffmpegBinary =
    ffmpegPath as unknown as string;

  const thumbnailDirectory =
    getThumbnailDirectory(
      projectId,
    );

  const thumbnailFilename =
    getThumbnailFilename(
      filename,
    );

  const thumbnailAbsolutePath =
    path.join(
      thumbnailDirectory,
      thumbnailFilename,
    );

  await execFileAsync(
    ffmpegBinary,
    [
      '-y',

      '-ss',
      '00:00:01',

      '-i',
      sourcePath,

      '-frames:v',
      '1',

      '-vf',
      `scale=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}:force_original_aspect_ratio=increase,crop=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}`,

      '-q:v',
      '3',

      thumbnailAbsolutePath,
    ],
  );

  if (
    !fs.existsSync(
      thumbnailAbsolutePath,
    )
  ) {
    throw new Error(
      'Video thumbnail was not generated',
    );
  }

  return `thumbnails/${projectId}/${thumbnailFilename}`;
}

export async function generateThumbnail(
  sourcePath: string,
  projectId: string,
  filename: string,
  mediaType:
    | 'IMAGE'
    | 'VIDEO'
    | 'AUDIO',
): Promise<string | null> {
  if (
    mediaType === 'IMAGE'
  ) {
    return generateImageThumbnail(
      sourcePath,
      projectId,
      filename,
    );
  }

  if (
    mediaType === 'VIDEO'
  ) {
    return generateVideoThumbnail(
      sourcePath,
      projectId,
      filename,
    );
  }

  return null;
}