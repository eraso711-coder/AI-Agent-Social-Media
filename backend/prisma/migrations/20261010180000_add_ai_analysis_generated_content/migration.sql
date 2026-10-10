CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "visualDescription" TEXT,
    "keywords" TEXT[] NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "generated_content" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mediaAssetId" TEXT,
    "aiAnalysisId" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'CAPTION',
    "platform" TEXT,
    "language" TEXT NOT NULL DEFAULT 'es',
    "title" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_analyses_mediaAssetId_createdAt_idx"
    ON "ai_analyses"("mediaAssetId", "createdAt");
CREATE INDEX "generated_content_projectId_createdAt_idx"
    ON "generated_content"("projectId", "createdAt");
CREATE INDEX "generated_content_mediaAssetId_idx"
    ON "generated_content"("mediaAssetId");
CREATE INDEX "generated_content_aiAnalysisId_idx"
    ON "generated_content"("aiAnalysisId");

ALTER TABLE "ai_analyses"
    ADD CONSTRAINT "ai_analyses_mediaAssetId_fkey"
    FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "generated_content"
    ADD CONSTRAINT "generated_content_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_content"
    ADD CONSTRAINT "generated_content_mediaAssetId_fkey"
    FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "generated_content"
    ADD CONSTRAINT "generated_content_aiAnalysisId_fkey"
    FOREIGN KEY ("aiAnalysisId") REFERENCES "ai_analyses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
