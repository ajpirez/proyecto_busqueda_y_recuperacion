import { Body, Controller, Post } from '@nestjs/common';
import type { RagResponse } from '@rag/shared';
import { RagService } from './rag.service';
import { RagRequestDto } from './rag.dto';

@Controller('rag')
export class RagController {
  constructor(private readonly rag: RagService) {}

  @Post()
  async answer(@Body() dto: RagRequestDto): Promise<RagResponse> {
    return this.rag.answer({
      q: dto.q,
      filters: dto.filters,
      topK: dto.topK,
    });
  }
}
