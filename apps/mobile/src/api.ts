import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

let apiBaseUrl = (
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8787" : "http://localhost:8787")
).replace(/\/$/, "");

const serverUrlFile = `${FileSystem.documentDirectory ?? ""}openmuse-server-url.txt`;

export function getApiUrl() {
  return apiBaseUrl;
}

export function setApiUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed) apiBaseUrl = trimmed;
}

export async function loadSavedApiUrl() {
  try {
    const saved = await FileSystem.readAsStringAsync(serverUrlFile);
    setApiUrl(saved);
  } catch {
    // No saved server URL yet; keep the default.
  }
}

export async function saveApiUrl(url: string) {
  setApiUrl(url);
  try {
    await FileSystem.writeAsStringAsync(serverUrlFile, apiBaseUrl);
  } catch {
    // Saving is best effort; the URL still applies for this session.
  }
}

export class MuseApi {
  constructor(readonly token: string) {}
  async request<T>(path: string, body?: unknown, method?: string): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body === undefined || body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(
        typeof payload.error === "string" ? payload.error : `Request failed (${response.status})`,
      );
    return payload;
  }
  url(path: string) {
    return path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  }
}

export async function createSession(
  accessKey?: string,
): Promise<{ token: string; mode: "sample" | "live" }> {
  const response = await fetch(`${apiBaseUrl}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessKey }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Could not open your workspace.");
  return payload;
}
