import type { Request, Response } from "express";

import {
  analyzeMediaAsset,
  getLatestMediaAnalysis,
  getProjectAnalyses,
} from "./ai-analysis.service.js";

function getParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function statusCodeFrom(error: unknown): number {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }

  return 500;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AI analysis failed.";
}

export async function analyzeMedia(req: Request, res: Response): Promise<void> {
  const mediaId = getParam(req.params.id);

  if (!mediaId) {
    res.status(400).json({ success: false, error: "Media ID is required." });
    return;
  }

  try {
    const analysis = await analyzeMediaAsset({ mediaAssetId: mediaId });
    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    const status = statusCodeFrom(error);
    console.error("AI media analysis failed:", error);
    res.status(status).json({
      success: false,
      error: errorMessage(error),
    });
  }
}

export async function getMediaAnalysis(
  req: Request,
  res: Response,
): Promise<void> {
  const mediaId = getParam(req.params.id);

  if (!mediaId) {
    res.status(400).json({ success: false, error: "Media ID is required." });
    return;
  }

  try {
    const analysis = await getLatestMediaAnalysis(mediaId);

    if (!analysis) {
      res.status(404).json({
        success: false,
        error: "No analysis exists for this media yet.",
      });
      return;
    }

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Unable to retrieve media analysis:", error);
    res.status(500).json({
      success: false,
      error: "Unable to retrieve media analysis.",
    });
  }
}

export async function getProjectMediaAnalyses(
  req: Request,
  res: Response,
): Promise<void> {
  const projectId = getParam(req.params.projectId);

  if (!projectId) {
    res.status(400).json({ success: false, error: "Project ID is required." });
    return;
  }

  try {
    const analyses = await getProjectAnalyses(projectId);
    res.json({ success: true, data: analyses });
  } catch (error) {
    console.error("Unable to retrieve project analyses:", error);
    res.status(500).json({
      success: false,
      error: "Unable to retrieve project analyses.",
    });
  }
}
