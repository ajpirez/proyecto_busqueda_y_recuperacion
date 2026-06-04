import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { SearchResponse } from '@rag/shared';
import { SearchService } from './search.service';
import { SearchRequestDto } from './search.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Post()
  @ApiOperation({
    summary: 'Búsqueda híbrida',
    description:
      'Combina BM25 (léxica) y búsqueda vectorial (semántica). Devuelve facetas, snippets resaltados y paginación.',
  })
  @ApiBody({ type: SearchRequestDto })
  @ApiOkResponse({
    description: 'Resultados de búsqueda',
    schema: {
      example: {
        query: 'refugiado',
        total: 11,
        page: 1,
        size: 10,
        tookMs: 194,
        mode: 'hybrid',
        hits: [
          {
            chunkId: 'CS_84261-2023#5',
            docId: 'CS_84261-2023',
            score: 4.23,
            tribunal: 'Corte Suprema',
            tribunalCode: 'CS',
            caseNumber: '84261',
            year: 2023,
            considerando: 'Quinto',
            highlights: ['protección de <em>refugiados</em>'],
            content: '...',
            sourceFile: 'CS_84261-2023.pdf',
          },
        ],
        facets: [
          {
            field: 'tribunal',
            label: 'Tribunal',
            values: [{ value: 'Corte Suprema', count: 11 }],
          },
        ],
      },
    },
  })
  async run(@Body() dto: SearchRequestDto): Promise<SearchResponse> {
    return this.search.search({
      q: dto.q ?? '',
      filters: dto.filters,
      page: dto.page ?? 1,
      size: dto.size ?? 10,
      mode: dto.mode ?? 'hybrid',
    });
  }
}
