import type { SearchMode } from '@rag/shared';
import type { SelectedFacets } from '@/components/FacetSidebar';

export interface SearchQueryParams {
  q: string;
  mode: SearchMode;
  page: number;
  selected: SelectedFacets;
}

export const searchKeys = {
  all: ['search'] as const,
  list: (params: SearchQueryParams) =>
    [...searchKeys.all, params] as const,
};

export const ragKeys = {
  all: ['rag'] as const,
};
