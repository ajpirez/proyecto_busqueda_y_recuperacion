import { Body, Controller, Post } from '@nestjs/common';
import type { SearchResponse } from '@rag/shared';
import { SearchService } from './search.service';
import { SearchRequestDto } from './search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Post()
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
