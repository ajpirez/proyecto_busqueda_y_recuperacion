'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { SearchMode } from '@rag/shared';
import { search } from '@/lib/api';
import { searchKeys, searchQueryKey, type SearchQueryParams } from '@/lib/query-keys';
import { PAGE_SIZE, toFilters } from '@/lib/search-params';

export function useSearchQuery(params: SearchQueryParams | null) {
  const enabled = Boolean(params?.q.trim());

  return useQuery({
    queryKey: params ? searchQueryKey(params) : searchKeys.all,
    queryFn: ({ signal }) => {
      if (!params?.q.trim()) {
        throw new Error('Consulta vacía');
      }
      return search(
        {
          q: params.q,
          filters: toFilters(params.selected),
          page: params.page,
          size: PAGE_SIZE,
          mode: params.mode,
        },
        signal,
      );
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export type { SearchQueryParams, SearchMode };
