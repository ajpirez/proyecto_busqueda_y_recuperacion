'use client';

import type { RagResponse } from '@rag/shared';

export interface RagAnswerPanelProps {
  loading: boolean;
  answer: RagResponse | null;
  onGenerate: () => void;
  hasQuery: boolean;
}

export function RagAnswerPanel({
  loading,
  answer,
  onGenerate,
  hasQuery,
}: RagAnswerPanelProps) {
  return (
    <section className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" />
          </svg>
          Respuesta generada (RAG)
        </h2>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !hasQuery}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Generando…' : answer ? 'Regenerar' : 'Generar respuesta'}
        </button>
      </div>

      {!answer && !loading && (
        <p className="text-sm text-slate-500">
          Genera una respuesta sintetizada por IA a partir de los documentos
          recuperados. Cada afirmación incluye su cita [n].
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-brand-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-brand-100" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-brand-100" />
        </div>
      )}

      {answer && !loading && (
        <div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {answer.answer}
          </p>

          {answer.citations.length > 0 && (
            <div className="mt-4 border-t border-brand-100 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Fuentes
              </h3>
              <ol className="space-y-1.5">
                {answer.citations.map((c) => (
                  <li key={c.ref} className="flex gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-brand-700">
                      [{c.ref}]
                    </span>
                    <span>
                      {c.tribunal} · Causa {c.caseNumber}-{c.year}
                      {c.considerando ? ` · Considerando ${c.considerando}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="mt-3 text-[11px] text-slate-400">
            Modelo: {answer.model} · {answer.tookMs} ms
          </p>
        </div>
      )}
    </section>
  );
}
