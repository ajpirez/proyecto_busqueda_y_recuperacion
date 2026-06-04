import type {
  RagRequest,
  RagResponse,
  SearchRequest,
  SearchResponse,
} from '@rag/shared';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Error ${res.status}: ${detail}`);
  }
  return res.json() as Promise<TRes>;
}

export function search(req: SearchRequest): Promise<SearchResponse> {
  return post<SearchRequest, SearchResponse>('/search', req);
}

export function ragAnswer(req: RagRequest): Promise<RagResponse> {
  return post<RagRequest, RagResponse>('/rag', req);
}
