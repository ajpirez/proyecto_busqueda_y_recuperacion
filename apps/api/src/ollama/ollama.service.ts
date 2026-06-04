import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common/services';
import { ConfigService } from '@nestjs/config';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

interface OllamaChatResponse {
  message?: { role: string; content: string };
  done: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly embedModel: string;
  private readonly chatModel: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('ollama.baseUrl')!;
    this.embedModel = this.config.get<string>('ollama.embedModel')!;
    this.chatModel = this.config.get<string>('ollama.chatModel')!;
  }

  get chatModelName(): string {
    return this.chatModel;
  }

  /**
   * Genera el embedding de un texto.
   * nomic-embed-text recomienda prefijos de tarea: "search_document" / "search_query".
   */
  async embed(
    text: string,
    kind: 'document' | 'query' = 'document',
  ): Promise<number[]> {
    const prompt = `search_${kind}: ${text}`;
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.embedModel, prompt }),
    });
    if (!res.ok) {
      throw new Error(
        `Ollama embeddings fallo (${res.status}): ${await res.text()}`,
      );
    }
    const data = (await res.json()) as OllamaEmbeddingResponse;
    return data.embedding;
  }

  /** Embeddings en lote (secuencial; Ollama no expone batch nativo estable). */
  async embedBatch(
    texts: string[],
    kind: 'document' | 'query' = 'document',
  ): Promise<number[][]> {
    const out: number[][] = [];
    for (const t of texts) {
      out.push(await this.embed(t, kind));
    }
    return out;
  }

  /** Genera una respuesta de chat (no streaming). */
  async chat(
    system: string,
    user: string,
    options: { temperature?: number } = {},
  ): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.chatModel,
        stream: false,
        options: { temperature: options.temperature ?? 0.1 },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama chat fallo (${res.status}): ${await res.text()}`);
    }
    const data = (await res.json()) as OllamaChatResponse;
    return data.message?.content ?? '';
  }
}
