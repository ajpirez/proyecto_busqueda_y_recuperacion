import { Body, Controller, Post } from '@nestjs/common';
import { IngestionService } from './ingestion.service';

@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  /** Dispara la (re)ingesta de toda la carpeta de PDFs. */
  @Post()
  async ingest(@Body() body: { reset?: boolean }) {
    const results = await this.ingestion.ingestAll({ reset: body?.reset });
    const totalChunks = results.reduce((acc, r) => acc + r.chunks, 0);
    return {
      documents: results.length,
      totalChunks,
      results,
    };
  }
}
