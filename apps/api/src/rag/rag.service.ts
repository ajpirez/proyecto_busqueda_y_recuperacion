import { Injectable } from '@nestjs/common';
import type { Citation, RagResponse, SearchFilters } from '@rag/shared';
import { SearchService } from '../search/search.service';
import { OllamaService } from '../ollama/ollama.service';

const SYSTEM_PROMPT = `Eres un asistente jurídico que responde preguntas sobre sentencias y resoluciones del Poder Judicial de Chile.
Reglas:
- Responde SIEMPRE en español, de forma clara y precisa.
- Usa EXCLUSIVAMENTE la informacion del CONTEXTO entregado. No inventes hechos ni normas.
- Cita las fuentes que utilices con la notacion [n], donde n es el numero del fragmento del contexto.
- Si el contexto no contiene la respuesta, indica explicitamente que no hay informacion suficiente en los documentos.
- Se conciso: 1 a 3 parrafos.`;

@Injectable()
export class RagService {
  constructor(
    private readonly search: SearchService,
    private readonly ollama: OllamaService,
  ) {}

  async answer(args: {
    q: string;
    filters?: SearchFilters;
    topK?: number;
  }): Promise<RagResponse> {
    const started = Date.now();
    const topK = args.topK ?? 6;

    const result = await this.search.search({
      q: args.q,
      filters: args.filters,
      page: 1,
      size: topK,
      mode: 'hybrid',
    });

    const citations: Citation[] = result.hits.map((h, i) => ({
      ref: i + 1,
      chunkId: h.chunkId,
      docId: h.docId,
      tribunal: h.tribunal,
      caseNumber: h.caseNumber,
      year: h.year,
      considerando: h.considerando,
      page: h.page,
      snippet:
        h.highlights[0]?.replace(/<\/?em>/g, '') ??
        h.content.slice(0, 220),
    }));

    if (citations.length === 0) {
      return {
        query: args.q,
        answer:
          'No se encontraron documentos relevantes para responder a la consulta.',
        citations: [],
        model: this.ollama.chatModelName,
        tookMs: Date.now() - started,
      };
    }

    const context = result.hits
      .map((h, i) => {
        const header = `[${i + 1}] ${h.tribunal} · Causa ${h.caseNumber}-${h.year}${
          h.considerando ? ` · Considerando ${h.considerando}` : ''
        }`;
        return `${header}\n${h.content}`;
      })
      .join('\n\n');

    const userPrompt = `Pregunta del usuario:\n${args.q}\n\nCONTEXTO:\n${context}\n\nResponde citando las fuentes con [n].`;

    const answer = await this.ollama.chat(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.1,
    });

    return {
      query: args.q,
      answer: answer.trim(),
      citations,
      model: this.ollama.chatModelName,
      tookMs: Date.now() - started,
    };
  }
}
