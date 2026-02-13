import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const getRootAppUrl = (locals?: App.Locals) => {
  const raw =
    locals?.rootAppUrl ||
    import.meta.env.PUBLIC_ROOT_APP_URL ||
    import.meta.env.PARENT_APP_URL ||
    (import.meta.env.DEV ? "http://localhost:2000" : "https://ansiversa.com");
  const normalized = raw.replace(/\/+$/, "");

  try {
    const parsed = new URL(normalized);
    if (!import.meta.env.DEV && parsed.hostname === "ansiversa.com") {
      parsed.hostname = "www.ansiversa.com";
      return parsed.toString().replace(/\/+$/, "");
    }
  } catch {
    // Keep original normalized URL if parsing fails.
  }

  return normalized;
};

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const cookieToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieToken) return json(401, { error: "Unauthorized.", code: "UNAUTHORIZED" });

  const rootAppUrl = getRootAppUrl(locals);
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!rootAppUrl || !cookieHeader) {
    return json(401, { error: "Unauthorized.", code: "UNAUTHORIZED" });
  }

  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    return json(400, { error: "Invalid request body.", code: "INVALID_BODY" });
  }

  try {
    const response = await fetch(`${rootAppUrl}/api/ai/suggest.json`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieHeader,
      },
      body: bodyText,
    });

    const responseText = await response.text();
    return new Response(responseText || "{}", {
      status: response.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return json(502, { error: "Gateway request failed.", code: "PARENT_REQUEST_FAILED" });
  }
};

export const GET: APIRoute = async () => json(405, { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" });
