export type HttpResponse = {
  status: number;
  body: any;
  text: string;
};

export type HttpRequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

export async function httpRequest(
  baseUrl: string,
  method: string,
  path: string,
  options: HttpRequestOptions = {},
): Promise<HttpResponse> {
  const headers = new Headers(options.headers ?? {});
  if (options.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body: any = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // Non-JSON response; keep the raw text in body.
  }
  return { status: response.status, body, text };
}
