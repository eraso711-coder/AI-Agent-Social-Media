import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { getAbsoluteStoragePath } from "../media/media.storage.js";

const execFileAsync = promisify(execFile);

export interface MediaAnalysisResult {
  summary: string;
  visualDescription: string;
  keywords: string[];
}

interface AnalyzeMediaInput {
  mediaAssetId: string;
}

function getOpenAIErrorMessage(payload: any): string {
  return typeof payload?.error?.message === "string"
    ? payload.error.message
    : "OpenAI analysis request failed";
}

async function requestOpenAIAnalysis(
  content: Array<Record<string, unknown>>,
): Promise<MediaAnalysisResult> {
  if (!env.OPENAI_API_KEY) {
    const error = new Error(
      "OpenAI is not configured. Set OPENAI_API_KEY in backend/.env.",
    );
    Object.assign(error, { statusCode: 503 });
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Analyze the supplied social-media image or video frames. Return only a JSON object with summary (concise 1-3 sentence summary), visualDescription (specific visible people, objects, setting, actions, colors, and mood; do not guess identities), and keywords (array of 5-12 short useful keywords). Use the language most evident in the visible text, otherwise English. Be factual and do not claim details that are not visible.",
        },
        {
          role: "user",
          content,
        },
      ],
    }),
  });

  const payload: any = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(getOpenAIErrorMessage(payload));
    Object.assign(error, { statusCode: response.status === 429 ? 429 : 502 });
    throw error;
  }

  const text = payload?.choices?.[0]?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("OpenAI returned an empty analysis.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("OpenAI returned an invalid analysis format.");
  }

  if (
    typeof parsed.summary !== "string" ||
    typeof parsed.visualDescription !== "string" ||
    !Array.isArray(parsed.keywords)
  ) {
    throw new Error("OpenAI analysis is missing required fields.");
  }

  const keywords = parsed.keywords
    .filter((keyword: unknown): keyword is string =>
      typeof keyword === "string" && keyword.trim().length > 0,
    )
    .map((keyword: string) => keyword.trim())
    .slice(0, 20);

  return {
    summary: parsed.summary.trim(),
    visualDescription: parsed.visualDescription.trim(),
    keywords,
  };
}

async function analyzeImage(filePath: string): Promise<MediaAnalysisResult> {
  const image = await sharp(filePath)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  return requestOpenAIAnalysis([
    {
      type: "text",
      text: "Analyze this image for a social-media content library.",
    },
    {
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${image.toString("base64")}`,
        detail: "high",
      },
    },
  ]);
}

async function extractVideoFrames(
  filePath: string,
  duration: number | null,
): Promise<string[]> {
  if (!ffmpegPath) {
    throw new Error("FFmpeg is not available for video analysis.");
  }

  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "social-media-analysis-"),
  );

  try {
    const safeDuration =
      duration && Number.isFinite(duration) && duration > 0
        ? duration
        : 8;
    const timestamps = [
      Math.max(0, safeDuration * 0.1),
      Math.max(0, safeDuration * 0.35),
      Math.max(0, safeDuration * 0.6),
      Math.max(0, safeDuration * 0.85),
    ];
    const frames: string[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const outputPath = path.join(temporaryDirectory, `frame-${index}.jpg`);

      try {
        await execFileAsync(ffmpegPath as unknown as string, [
          "-hide_banner",
          "-loglevel", "error",
          "-ss", timestamps[index].toFixed(2),
          "-i", filePath,
          "-frames:v", "1",
          "-vf", "scale=1000:-2",
          "-q:v", "4",
          "-y",
          outputPath,
        ]);
        const frame = await readFile(outputPath);
        frames.push(frame.toString("base64"));
      } catch {
        // Some videos cannot decode a frame at a requested timestamp.
      }
    }

    if (frames.length === 0) {
      throw new Error("Could not extract frames from this video.");
    }

    return frames;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function analyzeVideo(
  filePath: string,
  duration: number | null,
): Promise<MediaAnalysisResult> {
  const frames = await extractVideoFrames(filePath, duration);
  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text:
        "Analyze these frames sampled in chronological order from one video. Infer the overall visual subject and actions only when supported by the frames. Return a concise video summary, visual description, and useful social-media keywords.",
    },
    ...frames.map((frame) => ({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${frame}`,
        detail: "high",
      },
    })),
  ];

  return requestOpenAIAnalysis(content);
}

export async function analyzeMediaAsset({
  mediaAssetId,
}: AnalyzeMediaInput) {
  const media = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
  });

  if (!media) {
    const error = new Error("Media not found.");
    Object.assign(error, { statusCode: 404 });
    throw error;
  }

  if (media.mediaType === "AUDIO") {
    const error = new Error(
      "AI analysis currently supports images and videos only.",
    );
    Object.assign(error, { statusCode: 415 });
    throw error;
  }

  const filePath = getAbsoluteStoragePath(media.storagePath);
  const result =
    media.mediaType === "IMAGE"
      ? await analyzeImage(filePath)
      : await analyzeVideo(filePath, media.duration);

  return prisma.aIAnalysis.create({
    data: {
      mediaAssetId: media.id,
      summary: result.summary,
      visualDescription: result.visualDescription,
      keywords: result.keywords,
      model: env.OPENAI_MODEL,
    },
  });
}

export async function getLatestMediaAnalysis(mediaAssetId: string) {
  return prisma.aIAnalysis.findFirst({
    where: { mediaAssetId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectAnalyses(projectId: string) {
  return prisma.aIAnalysis.findMany({
    where: {
      mediaAsset: {
        projectId,
      },
    },
    include: {
      mediaAsset: {
        select: {
          id: true,
          projectId: true,
          originalName: true,
          mediaType: true,
          thumbnailPath: true,
          storagePath: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
