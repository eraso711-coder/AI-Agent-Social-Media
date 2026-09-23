import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default("127.0.0.1"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development")
});

export const env = envSchema.parse(process.env);