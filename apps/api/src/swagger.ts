import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('RAG Judicial API')
    .setDescription(
      'API de búsqueda híbrida (BM25 + vectores) y RAG sobre sentencias del Poder Judicial indexadas en Elasticsearch.',
    )
    .setVersion('0.1.0')
    .addTag('health', 'Estado del servicio e índice')
    .addTag('search', 'Búsqueda con facetas y snippets')
    .addTag('rag', 'Respuesta generada por LLM con citas')
    .addTag('ingest', 'Ingesta de PDFs a Elasticsearch')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
