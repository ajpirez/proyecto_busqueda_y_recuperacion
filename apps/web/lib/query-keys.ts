import type { SearchMode } from '@rag/shared';
import type { SelectedFacets } from '@/components/FacetSidebar';

export interface SearchQueryParams {
  q: string;
  mode: SearchMode;
  page: number;
  selected: SelectedFacets;
}

/** Clave serializable (evita refetches por referencia de objeto). */
export function searchQueryKey(params: SearchQueryParams) {
  const { q, mode, page, selected } = params;
  return [
    'search',
    q,
    mode,
    page,
    [...selected.tribunal].sort().join(','),
    [...selected.year].sort((a, b) => a - b).join(','),
    [...selected.tipoRecurso].sort().join(','),
  ] as const;
}

export const searchKeys = {
  all: ['search'] as const,
};

export const ragKeys = {
  all: ['rag'] as const,
};
