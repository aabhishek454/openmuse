import * as FileSystem from "expo-file-system/legacy";

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_SETTINGS: ApiSettings = {
  baseUrl: "https://openrouter.ai/api/v1",
  apiKey: "",
  model: "openrouter/auto",
};

const settingsFile = `${FileSystem.documentDirectory ?? ""}openmuse-api-settings.json`;

export async function loadSettings(): Promise<ApiSettings> {
  try {
    const raw = await FileSystem.readAsStringAsync(settingsFile);
    const parsed: unknown = raw ? JSON.parse(raw) : undefined;
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_SETTINGS };
    const value = parsed as Partial<Record<keyof ApiSettings, unknown>>;
    return {
      baseUrl:
        typeof value.baseUrl === "string" && value.baseUrl ? value.baseUrl : DEFAULT_SETTINGS.baseUrl,
      apiKey: typeof value.apiKey === "string" ? value.apiKey : "",
      model: typeof value.model === "string" && value.model ? value.model : DEFAULT_SETTINGS.model,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: ApiSettings): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(settingsFile, JSON.stringify(settings));
  } catch {
    // Best effort; the settings still apply for this session.
  }
}
