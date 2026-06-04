import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, HttpConnection } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  readonly client: Client;
  readonly index: string;
  private readonly dims: number;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({
      node: this.config.get<string>('elasticsearch.node'),
      // Usa el modulo http nativo en lugar de undici (compatible con bun).
      Connection: HttpConnection,
    });
    this.index = this.config.get<string>('elasticsearch.index')!;
    this.dims = this.config.get<number>('ollama.embeddingDims')!;
  }

  async onModuleInit() {
    try {
      await this.ensureIndex();
    } catch (err) {
      this.logger.warn(
        `No se pudo inicializar el indice (¿Elasticsearch arriba?): ${(err as Error).message}`,
      );
    }
  }

  /** Crea el indice con el mapping adecuado si no existe. */
  async ensureIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: this.index });
    if (exists) {
      this.logger.log(`Indice "${this.index}" ya existe.`);
      return;
    }

    await this.client.indices.create({
      index: this.index,
      settings: {
        analysis: {
          filter: {
            spanish_stop: { type: 'stop', stopwords: '_spanish_' },
            spanish_stemmer: { type: 'stemmer', language: 'light_spanish' },
          },
          analyzer: {
            es_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: [
                'lowercase',
                'asciifolding',
                'spanish_stop',
                'spanish_stemmer',
              ],
            },
          },
        },
      },
      mappings: {
        properties: {
          docId: { type: 'keyword' },
          chunkId: { type: 'keyword' },
          chunkIndex: { type: 'integer' },
          tribunalCode: { type: 'keyword' },
          tribunal: { type: 'keyword' },
          caseNumber: { type: 'keyword' },
          year: { type: 'integer' },
          date: { type: 'date', format: 'yyyy-MM-dd||strict_date_optional_time' },
          tipoRecurso: { type: 'keyword' },
          materias: { type: 'keyword' },
          considerando: { type: 'keyword' },
          page: { type: 'integer' },
          sourceFile: { type: 'keyword' },
          totalPages: { type: 'integer' },
          content: {
            type: 'text',
            analyzer: 'es_analyzer',
          },
          contentVector: {
            type: 'dense_vector',
            dims: this.dims,
            index: true,
            similarity: 'cosine',
          },
        },
      },
    });
    this.logger.log(`Indice "${this.index}" creado (dims=${this.dims}).`);
  }

  async deleteIndex(): Promise<void> {
    const exists = await this.client.indices.exists({ index: this.index });
    if (exists) {
      await this.client.indices.delete({ index: this.index });
      this.logger.log(`Indice "${this.index}" eliminado.`);
    }
  }

  async refresh(): Promise<void> {
    await this.client.indices.refresh({ index: this.index });
  }
}
