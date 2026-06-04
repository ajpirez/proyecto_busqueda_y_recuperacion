import type { SearchFilters } from '@rag/shared';
import type { SelectedFacets } from '@/components/FacetSidebar';

export const PAGE_SIZE = 10;

export const EMPTY_FACETS: SelectedFacets = {
  tribunal: [],
  year: [],
  tipoRecurso: [],
};

export function toFilters(selected: SelectedFacets): SearchFilters {
  return {
    tribunal: selected.tribunal.length ? selected.tribunal : undefined,
    year: selected.year.length ? selected.year : undefined,
    tipoRecurso: selected.tipoRecurso.length ? selected.tipoRecurso : undefined,
  };
}
