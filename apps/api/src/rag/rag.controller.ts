import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { RagResponse } from '@rag/shared';
import { RagService } from './rag.service';
import { RagRequestDto } from './rag.dto';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(private readonly rag: RagService) {}

  @Post()
  @ApiOperation({
    summary: 'Respuesta RAG',
    description:
      'Recupera fragmentos relevantes y genera una respuesta en español con citas [n] usando Ollama.',
  })
  @ApiBody({ type: RagRequestDto })
  @ApiOkResponse({
    description: 'Respuesta generada con citas',
    schema: {
      example: {
        query: 'autoridad para solicitar refugio',
        answer: 'Según el contexto [1], el extranjero debe presentarse ante la autoridad migratoria...',
        citations: [
          {
            ref: 1,
            chunkId: 'CS_84261-2023#5',
            docId: 'CS_84261-2023',
            tribunal: 'Corte Suprema',
            caseNumber: '84261',
            year: 2023,
            considerando: 'Quinto',
            snippet: '...',
          },
        ],
        model: 'llama3.2',
        tookMs: 17541,
      },
    },
  })
  async answer(@Body() dto: RagRequestDto): Promise<RagResponse> {
    console.log('dto', dto);
    return this.rag.answer({
      q: dto.q,
      filters: dto.filters,
      topK: dto.topK,
    });
  }
}
