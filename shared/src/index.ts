
export type SupportedLanguage = "es" | "en";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "whatsapp";

export type ContentType = "video" | "image";

export type ProjectStatus =
  | "draft"
  | "active"
  | "archived";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthResponse {
  status: "OK";
  message: string;
  database: "connected" | "disconnected";
}