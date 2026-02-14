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

export const GET: APIRoute = async ({ cookies, locals, request }) => {
  const cookieToken = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieToken) return json(200, { count: 0 });

  const rootAppUrl = resolveParentOrigin(locals);
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (!rootAppUrl || !cookieHeader) return json(200, { count: 0 });

  try {
    const response = await fetch(`${rootAppUrl}/api/notifications/unread-count`, {
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return json(200, { count: 0 });
    }

    const data = await response.json();
    return json(200, { count: Number(data?.count ?? 0) });
  } catch {
    return json(200, { count: 0 });
  }
};

export const POST: APIRoute = async () => json(405, { error: "Method Not Allowed" });
