"use client";

import type { SearchMode } from "@rag/shared";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const MODES: { id: SearchMode; label: string; hint: string }[] = [
  { id: "hybrid", label: "Híbrida", hint: "BM25 + vectores" },
  { id: "semantic", label: "Semántica", hint: "Solo embeddings" },
  { id: "lexical", label: "Léxica", hint: "Solo texto (BM25)" },
];

export function SearchBar({
  value,
  onChange,
  onSubmit,
  loading,
  mode,
  onModeChange,
}: SearchBarProps) {
  return (
    <div className="w-full">
      <form
        className="flex w-full items-stretch gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Busca por hechos, normas, considerandos…"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="h-12 rounded-xl bg-brand-600 px-6 font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Modo
        </span>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            title={m.hint}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              mode === m.id
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
