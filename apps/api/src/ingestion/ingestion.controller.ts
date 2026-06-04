import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestRequestDto } from './ingest.dto';

@ApiTags('ingest')
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Post()
  @ApiOperation({
    summary: 'Ingestar PDFs',
    description:
      'Procesa todos los PDFs de la carpeta configurada (DOCS_DIR): parseo, chunking, embeddings e indexación en Elasticsearch.',
  })
  @ApiBody({ type: IngestRequestDto })
  @ApiOkResponse({
    description: 'Resumen de la ingesta',
    schema: {
      example: {
        documents: 2,
        totalChunks: 38,
        results: [
          { docId: 'CS_84261-2023', sourceFile: 'CS_84261-2023.pdf', chunks: 26 },
        ],
      },
    },
  })
  async ingest(@Body() body: IngestRequestDto) {
    const results = await this.ingestion.ingestAll({ reset: body?.reset });
    const totalChunks = results.reduce((acc, r) => acc + r.chunks, 0);
    return {
      documents: results.length,
      totalChunks,
      results,
    };
  }
}
