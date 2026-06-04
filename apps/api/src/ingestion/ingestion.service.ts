import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Chunk } from '@rag/shared';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { OllamaService } from '../ollama/ollama.service';
import { parsePdf } from './pdf.util';
import { extractMetadata } from './metadata.util';
import { chunkText } from './chunker';

export interface IngestResult {
  docId: string;
  sourceFile: string;
  chunks: number;
  skipped?: boolean;
  error?: string;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly es: ElasticsearchService,
    private readonly ollama: OllamaService,
  ) {}

  /** Procesa todos los PDFs de la carpeta de base de conocimiento. */
  async ingestAll(options: { reset?: boolean } = {}): Promise<IngestResult[]> {
    if (options.reset) {
      await this.es.deleteIndex();
    }
    await this.es.ensureIndex();

    const dir = this.config.get<string>('ingestion.docsDir')!;
    const entries = await readdir(dir);
    const pdfs = entries.filter((f) => f.toLowerCase().endsWith('.pdf'));
    this.logger.log(`Encontrados ${pdfs.length} PDFs en ${dir}`);

    const results: IngestResult[] = [];
    for (const file of pdfs) {
      results.push(await this.ingestFile(join(dir, file)));
    }
    await this.es.refresh();
    return results;
  }

  /** Procesa un unico PDF: parsea, segmenta, vectoriza e indexa. */
  async ingestFile(filePath: string): Promise<IngestResult> {
    const maxChars = this.config.get<number>('ingestion.chunkMaxChars')!;
    const overlapChars = this.config.get<number>('ingestion.chunkOverlapChars')!;

    try {
      const { text, numPages } = await parsePdf(filePath);
      const meta = extractMetadata(filePath, text);
      const { chunks, totalPages } = chunkText(text, { maxChars, overlapChars });
      const pages = numPages || totalPages;

      if (chunks.length === 0) {
        return {
          docId: meta.docId,
          sourceFile: meta.sourceFile,
          chunks: 0,
          skipped: true,
        };
      }

      // Borra fragmentos previos del mismo documento (reingesta idempotente).
      await this.es.client.deleteByQuery({
        index: this.es.index,
        query: { term: { docId: meta.docId } },
        refresh: true,
        conflicts: 'proceed',
      }).catch(() => undefined);

      // Genera embeddings de cada fragmento.
      const vectors = await this.ollama.embedBatch(
        chunks.map((c) => c.content),
        'document',
      );

      const operations: unknown[] = [];
      chunks.forEach((c, i) => {
        const chunkId = `${meta.docId}#${c.chunkIndex}`;
        const doc: Chunk & { contentVector: number[] } = {
          ...meta,
          totalPages: pages,
          chunkId,
          chunkIndex: c.chunkIndex,
          considerando: c.considerando,
          page: c.page,
          content: c.content,
          contentVector: vectors[i],
        };
        operations.push({ index: { _index: this.es.index, _id: chunkId } });
        operations.push(doc);
      });

      const bulk = await this.es.client.bulk({ operations, refresh: false });
      if (bulk.errors) {
        const firstError = bulk.items.find((it) => it.index?.error)?.index
          ?.error;
        throw new Error(
          `Bulk con errores: ${JSON.stringify(firstError ?? {})}`,
        );
      }

      this.logger.log(
        `Indexado ${meta.docId}: ${chunks.length} fragmentos (${pages} pags).`,
      );
      return {
        docId: meta.docId,
        sourceFile: meta.sourceFile,
        chunks: chunks.length,
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Error procesando ${filePath}: ${message}`);
      return {
        docId: filePath,
        sourceFile: filePath,
        chunks: 0,
        error: message,
      };
    }
  }
}
