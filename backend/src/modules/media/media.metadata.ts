import { execFile } from "child_process";
import { promisify } from "util";

import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

export interface MediaMetadata {
  width: number | null;
  height: number | null;
  duration: number | null;
}

function parseVideoStreamDimensions(
  output: string,
): {
  width: number | null;
  height: number | null;
} {
  const match = output.match(
    /Video:.*?(\d{2,6})x(\d{2,6})/,
  );

  if (!match) {
    return {
      width: null,
      height: null,
    };
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function parseDuration(
  output: string,
): number | null {
  const match = output.match(
    /Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/,
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  const duration =
    hours * 60 * 60 +
    minutes * 60 +
    seconds;

  return Number.isFinite(duration)
    ? duration
    : null;
}

async function extractFfmpegMetadata(
  sourcePath: string,
): Promise<MediaMetadata> {
  if (!ffmpegPath) {
    throw new Error(
      "FFmpeg binary is not available",
    );
  }

  const ffmpegBinary =
    ffmpegPath as unknown as string;

  let output = "";

  try {
    const result =
      await execFileAsync(
        ffmpegBinary,
        [
          "-hide_banner",
          "-i",
          sourcePath,
        ],
      );

    output = [
      result.stdout,
      result.stderr,
    ].join("\n");
  } catch (error: unknown) {
    /*
     * FFmpeg normally exits with a non-zero
     * status when it is only being used to
     * inspect a file without producing output.
     *
     * The metadata is still available in stderr.
     */
    if (
      typeof error === "object" &&
      error !== null &&
      "stderr" in error
    ) {
      const ffmpegError =
        error as {
          stderr?: unknown;
          stdout?: unknown;
        };

      output = [
        typeof ffmpegError.stdout ===
        "string"
          ? ffmpegError.stdout
          : "",
        typeof ffmpegError.stderr ===
        "string"
          ? ffmpegError.stderr
          : "",
      ].join("\n");
    } else {
      throw error;
    }
  }

  const {
    width,
    height,
  } =
    parseVideoStreamDimensions(
      output,
    );

  return {
    width,
    height,
    duration:
      parseDuration(output),
  };
}

export async function extractImageMetadata(
  sourcePath: string,
): Promise<MediaMetadata> {
  const metadata =
    await sharp(sourcePath).metadata();

  return {
    width:
      typeof metadata.width ===
      "number"
        ? metadata.width
        : null,

    height:
      typeof metadata.height ===
      "number"
        ? metadata.height
        : null,

    duration: null,
  };
}

export async function extractVideoMetadata(
  sourcePath: string,
): Promise<MediaMetadata> {
  return extractFfmpegMetadata(
    sourcePath,
  );
}

export async function extractAudioMetadata(
  sourcePath: string,
): Promise<MediaMetadata> {
  const metadata =
    await extractFfmpegMetadata(
      sourcePath,
    );

  return {
    width: null,
    height: null,
    duration:
      metadata.duration,
  };
}

export async function extractMediaMetadata(
  sourcePath: string,
  mediaType:
    | "IMAGE"
    | "VIDEO"
    | "AUDIO",
): Promise<MediaMetadata> {
  switch (mediaType) {
    case "IMAGE":
      return extractImageMetadata(
        sourcePath,
      );

    case "VIDEO":
      return extractVideoMetadata(
        sourcePath,
      );

    case "AUDIO":
      return extractAudioMetadata(
        sourcePath,
      );

    default:
      throw new Error(
        `Unsupported media type: ${mediaType}`,
      );
  }
}