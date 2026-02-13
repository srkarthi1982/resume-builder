export type AiSuggestResponse = {
  suggestions: string[];
};

export class AiSuggestError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "AiSuggestError";
    this.status = status;
    this.code = code;
  }
}

const jsonHeaders = {
  "content-type": "application/json",
} as const;

const toJsonSafe = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const resolveSuggestUrl = (parentOrigin?: string | null) => {
  if (!parentOrigin) return "/api/ai/suggest.json";
  return `${parentOrigin.replace(/\/+$/, "")}/api/ai/suggest.json`;
};

export const postAiSuggest = async (
  featureKey: string,
  userText: string,
  parentOrigin?: string | null,
): Promise<AiSuggestResponse> => {
  const response = await fetch(resolveSuggestUrl(parentOrigin), {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ featureKey, userText }),
  });

  const payload = await toJsonSafe(response);

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Request failed (${response.status}).`;
    const code = payload && typeof payload.code === "string" ? payload.code : null;
    throw new AiSuggestError(message, response.status, code);
  }

  const suggestions = Array.isArray(payload?.suggestions)
    ? payload.suggestions.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim()).filter(Boolean)
    : [];

  if (suggestions.length === 0) {
    throw new AiSuggestError("No suggestions returned.", 502, "SUGGESTIONS_EMPTY");
  }

  return { suggestions };
};
