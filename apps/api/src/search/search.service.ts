import { Injectable } from '@nestjs/common';
import type {
  Facet,
  SearchFilters,
  SearchHit,
  SearchMode,
  SearchResponse,
} from '@rag/shared';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { OllamaService } from '../ollama/ollama.service';

interface RunSearchArgs {
  q: string;
  filters?: SearchFilters;
  page: number;
  size: number;
  mode: SearchMode;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly es: ElasticsearchService,
    private readonly ollama: OllamaService,
  ) {}

  private buildFilters(filters?: SearchFilters): Record<string, unknown>[] {
    const must: Record<string, unknown>[] = [];
    if (filters?.tribunal?.length) {
      must.push({ terms: { tribunal: filters.tribunal } });
    }
    if (filters?.year?.length) {
      must.push({ terms: { year: filters.year } });
    }
    if (filters?.tipoRecurso?.length) {
      must.push({ terms: { tipoRecurso: filters.tipoRecurso } });
    }
    return must;
  }

  async search(args: RunSearchArgs): Promise<SearchResponse> {
    const { q, filters, page, size, mode } = args;
    const from = (page - 1) * size;
    const filterClauses = this.buildFilters(filters);

    const useLexical = mode === 'lexical' || mode === 'hybrid';
    const useSemantic = mode === 'semantic' || mode === 'hybrid';

    const boolQuery: Record<string, unknown> = {
      filter: filterClauses,
    };
    if (useLexical && q.trim()) {
      boolQuery.must = [
        {
          match: {
            content: {
              query: q,
              operator: 'or',
              minimum_should_match: '2<70%',
            },
          },
        },
      ];
    } else {
      boolQuery.must = [{ match_all: {} }];
    }

    const body: Record<string, unknown> = {
      from,
      size,
      query: { bool: boolQuery },
      highlight: {
        pre_tags: ['<em>'],
        post_tags: ['</em>'],
        fields: {
          content: { fragment_size: 180, number_of_fragments: 3 },
        },
      },
      aggs: {
        tribunal: { terms: { field: 'tribunal', size: 20 } },
        year: { terms: { field: 'year', size: 30, order: { _key: 'desc' } } },
        tipoRecurso: { terms: { field: 'tipoRecurso', size: 20 } },
      },
    };

    if (useSemantic && q.trim()) {
      const vector = await this.ollama.embed(q, 'query');
      body.knn = {
        field: 'contentVector',
        query_vector: vector,
        k: Math.max(size, from + size),
        num_candidates: Math.max(100, (from + size) * 5),
        filter: filterClauses.length
          ? { bool: { filter: filterClauses } }
          : undefined,
      };
    }

    const res = await this.es.client.search(body as never);

    const hits: SearchHit[] = (res.hits.hits as any[]).map((h) => {
      const src = h._source;
      return {
        chunkId: src.chunkId,
        docId: src.docId,
        score: h._score ?? 0,
        tribunal: src.tribunal,
        tribunalCode: src.tribunalCode,
        caseNumber: src.caseNumber,
        year: src.year,
        date: src.date,
        tipoRecurso: src.tipoRecurso,
        considerando: src.considerando,
        page: src.page,
        sourceFile: src.sourceFile,
        content: src.content,
        highlights: h.highlight?.content ?? [],
      };
    });

    const total =
      typeof res.hits.total === 'number'
        ? res.hits.total
        : (res.hits.total?.value ?? 0);

    const facets = this.buildFacets(res.aggregations);

    return {
      query: q,
      total,
      page,
      size,
      tookMs: res.took ?? 0,
      mode,
      hits,
      facets,
    };
  }

  private buildFacets(aggs: any): Facet[] {
    if (!aggs) return [];
    const mk = (
      field: string,
      label: string,
      formatter?: (k: any) => string,
    ): Facet => ({
      field,
      label,
      values: (aggs[field]?.buckets ?? []).map((b: any) => ({
        value: String(b.key),
        label: formatter ? formatter(b.key) : String(b.key),
        count: b.doc_count,
      })),
    });

    return [
      mk('tribunal', 'Tribunal'),
      mk('year', 'Año'),
      mk('tipoRecurso', 'Tipo de recurso'),
    ].filter((f) => f.values.length > 0);
  }
}
