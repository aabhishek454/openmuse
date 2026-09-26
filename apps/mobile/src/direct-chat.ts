import type { ApiSettings } from "./settings";

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT =
  "You are OpenMuse, a warm and capable personal assistant for one person on their phone. " +
  "Reply in clear, conversational plain text. Avoid heavy Markdown formatting.";

export async function chatComplete(settings: ApiSettings, history: ChatTurn[]): Promise<string> {
  const base = settings.baseUrl.trim().replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
      "HTTP-Referer": "https://github.com/CopilotKit/openmuse",
      "X-Title": "OpenMuse",
    },
    body: JSON.stringify({
      model: settings.model.trim() || "openrouter/auto",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    }),
  });
  const payload: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as { error?: { message?: string } | string }).error
        : undefined;
    throw new Error(
      (typeof detail === "string" ? detail : detail?.message) || `Request failed (${response.status})`,
    );
  }
  const content =
    typeof payload === "object" && payload !== null && "choices" in payload
      ? (payload as { choices?: { message?: { content?: unknown } }[] }).choices?.[0]?.message?.content
      : undefined;
  if (typeof content !== "string" || !content.trim())
    throw new Error("The model returned an empty response.");
  return content;
}
