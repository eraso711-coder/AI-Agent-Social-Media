/*
  Warnings:

  - Added the required column `filename` to the `media_assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `media_assets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "thumbnailPath" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
