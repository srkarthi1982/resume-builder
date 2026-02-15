import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";
import { resolveParentOrigin } from "../../../server/resolveParentOrigin";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!cookieHeader) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json(400, { ok: false, error: "Invalid form-data payload." });
  }

  const parentWebOrigin = resolveParentOrigin(locals);
  if (!parentWebOrigin) {
    return json(500, { ok: false, error: "Parent web origin is not configured." });
  }

  try {
    const response = await fetch(`${parentWebOrigin}/api/media/upload.json`, {
      method: "POST",
      headers: {
        cookie: cookieHeader,
        origin: parentWebOrigin,
        referer: `${parentWebOrigin}/`,
      },
      body: formData,
    });

    const bodyText = await response.text();
    return new Response(bodyText, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch {
    return json(502, { ok: false, error: "Failed to reach parent upload API." });
  }
};
