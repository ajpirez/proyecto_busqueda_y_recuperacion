'use client';

import type { SearchHit } from '@rag/shared';
import { getDocumentUrl } from '@/lib/documents';

export interface ResultCardProps {
  hit: SearchHit;
  rank: number;
}

export function ResultCard({ hit, rank }: ResultCardProps) {
  const snippets =
    hit.highlights.length > 0
      ? hit.highlights
      : [hit.content.slice(0, 280) + '…'];

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
          {hit.tribunal}
        </span>
        <a
          href={getDocumentUrl(hit.sourceFile, hit.page)}
          target="_blank"
          rel="noopener noreferrer"
          title={`Abrir ${hit.sourceFile}${hit.page ? ` (pág. ${hit.page})` : ''}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
        >
          Causa {hit.caseNumber}-{hit.year}
        </a>
        {hit.tipoRecurso && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {hit.tipoRecurso}
          </span>
        )}
        {hit.considerando && (
          <span className="text-xs text-slate-500">
            Considerando {hit.considerando}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          #{rank} · score {hit.score.toFixed(2)}
        </span>
      </div>

      <div className="space-y-1.5">
        {snippets.map((s, i) => (
          <p
            key={i}
            className="snippet text-sm leading-relaxed text-slate-600"
            dangerouslySetInnerHTML={{ __html: s }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        {hit.date && <span>Fecha: {hit.date}</span>}
        {hit.page && <span>Pág. {hit.page}</span>}
        <span className="truncate">{hit.sourceFile}</span>
      </div>
    </article>
  );
}
