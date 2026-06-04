import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { IngestionService } from '../src/ingestion/ingestion.service';

/**
 * Script de ingesta CLI.
 * Uso:
 *   bun run scripts/ingest.ts          -> ingesta incremental
 *   bun run scripts/ingest.ts --reset  -> recrea el indice desde cero
 */
async function main() {
  const reset = process.argv.includes('--reset');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const ingestion = app.get(IngestionService);

  Logger.log(`Iniciando ingesta (reset=${reset})...`, 'Ingest');
  const results = await ingestion.ingestAll({ reset });

  const totalChunks = results.reduce((acc, r) => acc + r.chunks, 0);
  // eslint-disable-next-line no-console
  console.table(
    results.map((r) => ({
      doc: r.docId,
      fragmentos: r.chunks,
      error: r.error ?? '',
    })),
  );
  Logger.log(
    `Listo: ${results.length} documentos, ${totalChunks} fragmentos indexados.`,
    'Ingest',
  );
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
