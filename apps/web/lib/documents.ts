const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** URL del PDF local servido por la API (`GET /api/documents/:filename`). */
export function getDocumentUrl(sourceFile: string, page?: number): string {
  const base = `${API_URL}/api/documents/${encodeURIComponent(sourceFile)}`;
  if (page != null && page > 0) return `${base}#page=${page}`;
  return base;
}
