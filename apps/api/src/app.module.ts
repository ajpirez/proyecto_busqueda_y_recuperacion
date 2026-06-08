import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { OllamaModule } from './ollama/ollama.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SearchModule } from './search/search.module';
import { RagModule } from './rag/rag.module';
import { DocumentsModule } from './documents/documents.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    ElasticsearchModule,
    OllamaModule,
    IngestionModule,
    SearchModule,
    RagModule,
    DocumentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
