import type {
  RagRequest,
  RagResponse,
  SearchRequest,
  SearchResponse,
} from '@rag/shared';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const SEARCH_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 60_000;

async function post<TReq, TRes>(
  path: string,
  body: TReq,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<TRes> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Error ${res.status}: ${detail}`);
    }
    return res.json() as Promise<TRes>;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        options.signal?.aborted
          ? 'Búsqueda cancelada'
          : `La solicitud tardó más de ${timeoutMs / 1000}s (¿API u Ollama activos?)`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

export function search(
  req: SearchRequest,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return post<SearchRequest, SearchResponse>('/search', req, {
    signal,
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
}

export function ragAnswer(req: RagRequest): Promise<RagResponse> {
  return post<RagRequest, RagResponse>('/rag', req, {
    timeoutMs: SEARCH_TIMEOUT_MS,
  });
}
