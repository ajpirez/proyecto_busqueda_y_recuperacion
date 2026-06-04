import { resolve } from 'node:path';

export interface AppConfig {
  port: number;
  elasticsearch: {
    node: string;
    index: string;
  };
  ollama: {
    baseUrl: string;
    embedModel: string;
    chatModel: string;
    embeddingDims: number;
  };
  ingestion: {
    docsDir: string;
    chunkMaxChars: number;
    chunkOverlapChars: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE ?? 'http://localhost:9200',
    index: process.env.ELASTICSEARCH_INDEX ?? 'judicial_docs',
  },
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    embedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
    chatModel: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2',
    embeddingDims: parseInt(process.env.EMBEDDING_DIMS ?? '768', 10),
  },
  ingestion: {
    docsDir: resolve(
      process.cwd(),
      process.env.DOCS_DIR ?? '../../poder_judicial_files',
    ),
    chunkMaxChars: parseInt(process.env.CHUNK_MAX_CHARS ?? '1100', 10),
    chunkOverlapChars: parseInt(process.env.CHUNK_OVERLAP_CHARS ?? '150', 10),
  },
});
