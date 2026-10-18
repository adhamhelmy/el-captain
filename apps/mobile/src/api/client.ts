/** One way to call the El Captain API: base URL, bearer token, language, and errors as ApiError. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message = code ?? `HTTP ${status}`,
  ) {
    super(message);
  }
}

type Config = {
  baseUrl: string;
  getToken: () => string | null;
  getLocale: () => string;
  /** Called when a signed-in call gets 401: the token was revoked or expired. */
  onUnauthorized: () => void;
};

let config: Config = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  getToken: () => null,
  getLocale: () => 'en',
  onUnauthorized: () => {},
};

export function configureApi(next: Partial<Config>) {
  config = { ...config, ...next };
}

/** A phone off the Mac's network often gets no answer at all, not a refusal; give up after this long. */
const TIMEOUT_MS = 10_000;

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const token = config.getToken();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}${path}`, {
      ...rest,
      signal: abort.signal,
      ...(json !== undefined && { body: JSON.stringify(json) }),
      headers: {
        accept: 'application/json',
        'accept-language': config.getLocale(),
        ...(json !== undefined && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
        ...(headers as Record<string, string>),
      },
    });
  } catch {
    throw new ApiError(0, 'network');
  } finally {
    clearTimeout(timer);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) config.onUnauthorized();
    throw new ApiError(res.status, body.code, body.error);
  }
  return body as T;
}
