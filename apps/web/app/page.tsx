'use client';

import { useCallback, useState } from 'react';
import type {
  RagResponse,
  SearchFilters,
  SearchMode,
  SearchResponse,
} from '@rag/shared';
import { ragAnswer, search } from '@/lib/api';
import { SearchBar } from '@/components/SearchBar';
import {
  FacetSidebar,
  type SelectedFacets,
} from '@/components/FacetSidebar';
import { ResultCard } from '@/components/ResultCard';
import { RagAnswerPanel } from '@/components/RagAnswerPanel';
import { Pagination } from '@/components/Pagination';

const PAGE_SIZE = 10;

const EMPTY_FACETS: SelectedFacets = {
  tribunal: [],
  year: [],
  tipoRecurso: [],
};

function toFilters(selected: SelectedFacets): SearchFilters {
  return {
    tribunal: selected.tribunal.length ? selected.tribunal : undefined,
    year: selected.year.length ? selected.year : undefined,
    tipoRecurso: selected.tipoRecurso.length ? selected.tipoRecurso : undefined,
  };
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [selected, setSelected] = useState<SelectedFacets>(EMPTY_FACETS);
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rag, setRag] = useState<RagResponse | null>(null);
  const [ragLoading, setRagLoading] = useState(false);

  const doSearch = useCallback(
    async (params: {
      q: string;
      selected: SelectedFacets;
      page: number;
      mode: SearchMode;
    }) => {
      if (!params.q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await search({
          q: params.q,
          filters: toFilters(params.selected),
          page: params.page,
          size: PAGE_SIZE,
          mode: params.mode,
        });
        setResults(res);
      } catch (err) {
        setError((err as Error).message);
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const onSubmit = () => {
    setSubmittedQuery(query);
    setSelected(EMPTY_FACETS);
    setPage(1);
    setRag(null);
    doSearch({ q: query, selected: EMPTY_FACETS, page: 1, mode });
  };

  const onModeChange = (m: SearchMode) => {
    setMode(m);
    if (submittedQuery) {
      doSearch({ q: submittedQuery, selected, page, mode: m });
    }
  };

  const onToggleFacet = (field: keyof SelectedFacets, value: string) => {
    const next: SelectedFacets = {
      tribunal: [...selected.tribunal],
      year: [...selected.year],
      tipoRecurso: [...selected.tipoRecurso],
    };
    if (field === 'year') {
      const v = Number(value);
      next.year = next.year.includes(v)
        ? next.year.filter((y) => y !== v)
        : [...next.year, v];
    } else {
      const arr = next[field] as string[];
      next[field] = arr.includes(value)
        ? (arr.filter((x) => x !== value) as never)
        : ([...arr, value] as never);
    }
    setSelected(next);
    setPage(1);
    doSearch({ q: submittedQuery, selected: next, page: 1, mode });
  };

  const onClearFacets = () => {
    setSelected(EMPTY_FACETS);
    setPage(1);
    doSearch({ q: submittedQuery, selected: EMPTY_FACETS, page: 1, mode });
  };

  const onPageChange = (p: number) => {
    setPage(p);
    doSearch({ q: submittedQuery, selected, page: p, mode });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onGenerateRag = async () => {
    if (!submittedQuery.trim()) return;
    setRagLoading(true);
    try {
      const res = await ragAnswer({
        q: submittedQuery,
        filters: toFilters(selected),
        topK: 6,
      });
      setRag(res);
    } catch (err) {
      setRag({
        query: submittedQuery,
        answer: `Error al generar la respuesta: ${(err as Error).message}`,
        citations: [],
        model: '-',
        tookMs: 0,
      });
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Búsqueda Jurídica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Recuperación de información sobre sentencias del Poder Judicial ·
          búsqueda híbrida (BM25 + embeddings) con respuestas asistidas por IA.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 mb-6 bg-slate-50/80 px-4 py-3 backdrop-blur">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={onSubmit}
          loading={loading}
          mode={mode}
          onModeChange={onModeChange}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!results && !loading && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">
            Escribe una consulta para buscar en la base de conocimiento.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Ej: «requisitos para reconocer la condición de refugiado»
          </p>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-6 lg:flex-row">
          <FacetSidebar
            facets={results.facets}
            selected={selected}
            onToggle={onToggleFacet}
            onClear={onClearFacets}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <RagAnswerPanel
              loading={ragLoading}
              answer={rag}
              onGenerate={onGenerateRag}
              hasQuery={Boolean(submittedQuery)}
            />

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {results.total} resultado{results.total === 1 ? '' : 's'} ·{' '}
                {results.tookMs} ms · modo {results.mode}
              </span>
            </div>

            {results.hits.map((hit, i) => (
              <ResultCard
                key={hit.chunkId}
                hit={hit}
                rank={(results.page - 1) * results.size + i + 1}
              />
            ))}

            {results.hits.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No se encontraron resultados para «{results.query}».
              </div>
            )}

            <Pagination
              page={results.page}
              size={results.size}
              total={results.total}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </main>
  );
}
