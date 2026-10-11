// Small HTTP helpers for the TypeScript half of the server.

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Max-Age": "86400",
};

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

/** A copy of `response` that browsers on other origins may read. */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, headers });
}

/** The request's JSON body (null when it is not JSON or larger than `limit` bytes). */
export async function readJson<T>(request: Request, limit = 1_000_000): Promise<T | null> {
  const text = await request.text();
  if (text.length > limit) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** POST `body` as JSON to a Durable Object stub at `path`. */
export function callObject(stub: DurableObjectStub, path: string, body: unknown): Promise<Response> {
  return stub.fetch(`https://object${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
