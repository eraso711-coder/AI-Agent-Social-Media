const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://127.0.0.1:5000";

export interface HealthResponse {
  status: "OK" | "ERROR";
  message: string;
  database: "connected" | "disconnected";
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "API request failed");
  }

  return data as HealthResponse;
}