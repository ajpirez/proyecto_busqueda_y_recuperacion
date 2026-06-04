import { normalize } from './metadata.util';

export interface RawChunk {
  content: string;
  considerando?: string;
  page?: number;
  chunkIndex: number;
}

export interface ChunkOptions {
  maxChars: number;
  overlapChars: number;
}

interface CleanLine {
  text: string;
  page: number;
}

const PAGE_MARKER = /^--\s*(\d+)\s+of\s+(\d+)\s*--$/;
// Codigos de marca de agua del Poder Judicial (token alfanumerico en mayusculas).
const WATERMARK = /^[A-Z0-9]{9,}$/;

// Ordinales usados como encabezado de "considerando".
const ORDINALES = new Set([
  'primero', 'segundo', 'tercero', 'cuarto', 'quinto', 'sexto', 'septimo',
  'octavo', 'noveno', 'decimo', 'undecimo', 'duodecimo', 'decimotercero',
  'decimocuarto', 'decimoquinto', 'decimosexto', 'decimoseptimo',
  'decimoctavo', 'decimonoveno', 'vigesimo', 'trigesimo', 'cuadragesimo',
]);

/** Limpia el texto y asigna numero de pagina a cada linea. */
function cleanAndPaginate(raw: string): { lines: CleanLine[]; totalPages: number } {
  const out: CleanLine[] = [];
  let page = 1;
  let totalPages = 1;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    const marker = line.match(PAGE_MARKER);
    if (marker) {
      // El marcador "-- k of M --" cierra la pagina k.
      page = parseInt(marker[1], 10) + 1;
      totalPages = parseInt(marker[2], 10);
      continue;
    }
    if (!line) continue;
    if (WATERMARK.test(line)) continue;
    out.push({ text: line, page });
  }
  return { lines: out, totalPages };
}

/** Detecta si una linea inicia un considerando y devuelve su etiqueta. */
function detectConsiderando(line: string): string | undefined {
  // ej: "Quinto: Que ..." o "Decimo primero: Que ..."
  const m = line.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]+)?)\s*:/);
  if (!m) return undefined;
  const candidate = m[1].trim();
  const words = normalize(candidate).split(/\s+/);
  if (words.length > 2) return undefined;
  if (ORDINALES.has(words[0])) return candidate;
  return undefined;
}

/** Divide un texto largo en ventanas con solapamiento, respetando frases. */
function windowSplit(text: string, opts: ChunkOptions): string[] {
  if (text.length <= opts.maxChars) return [text];
  const windows: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + opts.maxChars, text.length);
    if (end < text.length) {
      // Intenta cortar en el ultimo fin de frase dentro de la ventana.
      const slice = text.slice(start, end);
      const lastStop = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('.\n'),
        slice.lastIndexOf('; '),
      );
      if (lastStop > opts.maxChars * 0.5) {
        end = start + lastStop + 1;
      }
    }
    windows.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = Math.max(end - opts.overlapChars, start + 1);
  }
  return windows.filter((w) => w.length > 0);
}

/**
 * Convierte el texto crudo de un PDF en fragmentos (chunks).
 * Estrategia: segmenta por "considerando" y luego aplica ventanas con solapamiento.
 */
export function chunkText(
  raw: string,
  opts: ChunkOptions,
): { chunks: RawChunk[]; totalPages: number } {
  const { lines, totalPages } = cleanAndPaginate(raw);

  interface Section {
    considerando?: string;
    page: number;
    buffer: string[];
  }
  const sections: Section[] = [];
  let current: Section = { page: lines[0]?.page ?? 1, buffer: [] };

  for (const { text, page } of lines) {
    const considerando = detectConsiderando(text);
    if (considerando) {
      if (current.buffer.length > 0) sections.push(current);
      current = { considerando, page, buffer: [text] };
    } else {
      current.buffer.push(text);
    }
  }
  if (current.buffer.length > 0) sections.push(current);

  const chunks: RawChunk[] = [];
  let idx = 0;
  for (const section of sections) {
    const text = section.buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    for (const win of windowSplit(text, opts)) {
      chunks.push({
        content: win,
        considerando: section.considerando,
        page: section.page,
        chunkIndex: idx++,
      });
    }
  }
  return { chunks, totalPages };
}
