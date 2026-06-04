'use client';

import { useMemo, useState } from 'react';
import type { SearchMode } from '@rag/shared';
import { useRagMutation } from '@/hooks/use-rag-mutation';
import { useSearchQuery } from '@/hooks/use-search-query';
import { EMPTY_FACETS, toFilters } from '@/lib/search-params';
import { SearchBar } from '@/components/SearchBar';
import {
  FacetSidebar,
  type SelectedFacets,
} from '@/components/FacetSidebar';
import { ResultCard } from '@/components/ResultCard';
import { RagAnswerPanel } from '@/components/RagAnswerPanel';
import { Pagination } from '@/components/Pagination';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [selected, setSelected] = useState<SelectedFacets>(EMPTY_FACETS);
  const [page, setPage] = useState(1);

  const searchParams = useMemo(() => {
    if (!submittedQuery.trim()) return null;
    return { q: submittedQuery, mode, page, selected };
  }, [submittedQuery, mode, page, selected]);

  const {
    data: results,
    isLoading,
    isFetching,
    isError,
    error,
  } = useSearchQuery(searchParams);

  const ragMutation = useRagMutation();

  /** Solo la primera carga (sin datos); refetch con keepPreviousData no bloquea el botón. */
  const searchLoading = isLoading;
  const isRefetching = isFetching && Boolean(results);
  const hasSubmitted = Boolean(submittedQuery.trim());

  const onSubmit = () => {
    if (!query.trim()) return;
    setSubmittedQuery(query);
    setSelected(EMPTY_FACETS);
    setPage(1);
    ragMutation.reset();
  };

  const onModeChange = (m: SearchMode) => {
    setMode(m);
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
    ragMutation.reset();
  };

  const onClearFacets = () => {
    setSelected(EMPTY_FACETS);
    setPage(1);
    ragMutation.reset();
  };

  const onPageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onGenerateRag = () => {
    if (!submittedQuery.trim()) return;
    ragMutation.mutate({
      q: submittedQuery,
      filters: toFilters(selected),
      topK: 6,
    });
  };

  const ragAnswer = ragMutation.isError
    ? {
        query: submittedQuery,
        answer: `Error al generar la respuesta: ${ragMutation.error.message}`,
        citations: [],
        model: '-',
        tookMs: 0,
      }
    : ragMutation.data ?? null;

  const showEmpty = !hasSubmitted && !searchLoading;
  const showResults = hasSubmitted && (results || searchLoading);

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
          loading={searchLoading}
          mode={mode}
          onModeChange={onModeChange}
        />
      </div>

      {isError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {showEmpty && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500">
            Escribe una consulta para buscar en la base de conocimiento.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Ej: «requisitos para reconocer la condición de refugiado»
          </p>
        </div>
      )}

      {showResults && results && (
        <div className="flex flex-col gap-6 lg:flex-row">
          <FacetSidebar
            facets={results.facets}
            selected={selected}
            onToggle={onToggleFacet}
            onClear={onClearFacets}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <RagAnswerPanel
              loading={ragMutation.isPending}
              answer={ragAnswer}
              onGenerate={onGenerateRag}
              hasQuery={hasSubmitted}
            />

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {results.total} resultado{results.total === 1 ? '' : 's'} ·{' '}
                {results.tookMs} ms · modo {results.mode}
                {isRefetching ? ' · actualizando…' : ''}
              </span>
            </div>

            {results.hits.map((hit, i) => (
              <ResultCard
                key={hit.chunkId}
                hit={hit}
                rank={(results.page - 1) * results.size + i + 1}
              />
            ))}

            {results.hits.length === 0 && !searchLoading && (
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

      {showResults && !results && searchLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Buscando…
        </div>
      )}
    </main>
  );
}
