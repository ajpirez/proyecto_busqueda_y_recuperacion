import { basename } from 'node:path';
import type { DocumentMeta } from '@rag/shared';

const TRIBUNAL_MAP: Record<string, string> = {
  CS: 'Corte Suprema',
  CA: 'Corte de Apelaciones',
  TC: 'Tribunal Constitucional',
  JL: 'Juzgado de Letras',
  JG: 'Juzgado de Garantia',
};

const TIPOS_RECURSO: { match: string; label: string }[] = [
  { match: 'recurso de proteccion', label: 'Recurso de protección' },
  { match: 'recurso de apelacion', label: 'Recurso de apelación' },
  { match: 'recurso de casacion', label: 'Recurso de casación' },
  { match: 'recurso de amparo', label: 'Recurso de amparo' },
  { match: 'recurso de nulidad', label: 'Recurso de nulidad' },
  { match: 'recurso de queja', label: 'Recurso de queja' },
  { match: 'recurso de reclamacion', label: 'Recurso de reclamación' },
  { match: 'recurso de unificacion', label: 'Recurso de unificación' },
];

const MATERIA_KEYWORDS: { match: string; label: string }[] = [
  { match: 'refugiado', label: 'Refugio / Migración' },
  { match: 'migracion', label: 'Refugio / Migración' },
  { match: 'extranjero', label: 'Refugio / Migración' },
  { match: 'isapre', label: 'Salud / Isapres' },
  { match: 'fonasa', label: 'Salud / Isapres' },
  { match: 'cotizacion de salud', label: 'Salud / Isapres' },
  { match: 'ambiental', label: 'Medio ambiente' },
  { match: 'pension', label: 'Previsional' },
  { match: 'laboral', label: 'Laboral' },
  { match: 'tributari', label: 'Tributario' },
];

/** Quita acentos y pasa a minusculas. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const UNIDADES: Record<string, number> = {
  cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18,
  diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29, treinta: 30, primero: 1,
};

const DECENAS: Record<string, number> = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
};

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

/** Convierte palabras en numero para el rango 0-99 (ej: "treinta y uno" -> 31). */
function palabrasANumero(words: string): number | undefined {
  const w = normalize(words).trim();
  if (w in UNIDADES) return UNIDADES[w];
  const parts = w.split(/\s+y\s+/);
  if (parts.length === 2 && parts[0] in DECENAS && parts[1] in UNIDADES) {
    return DECENAS[parts[0]] + UNIDADES[parts[1]];
  }
  if (w in DECENAS) return DECENAS[w];
  return undefined;
}

/** Convierte un anio en palabras "dos mil veintitres" -> 2023. */
function anioANumero(words: string): number | undefined {
  const w = normalize(words).trim();
  const m = w.match(/^dos\s+mil(?:\s+(.+))?$/);
  if (m) {
    if (!m[1]) return 2000;
    const resto = palabrasANumero(m[1]);
    return resto !== undefined ? 2000 + resto : undefined;
  }
  return undefined;
}

/** Intenta extraer la fecha de la resolucion desde el encabezado. */
export function extractDate(text: string): string | undefined {
  const firstChunk = text.slice(0, 400);
  const line = firstChunk.split('\n').find((l) => l.trim().length > 0) ?? '';
  const norm = normalize(line);
  // ej: "santiago, treinta y uno de mayo de dos mil veintitres."
  const re = /,\s*([a-z\s]+?)\s+de\s+([a-z]+)\s+de\s+([a-z\s]+?)\.?\s*$/;
  const m = norm.match(re);
  if (!m) return undefined;
  const day = palabrasANumero(m[1]);
  const month = MESES[m[2].trim()];
  const year = anioANumero(m[3]);
  if (!day || !month || !year) return undefined;
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function detectTipoRecurso(normText: string): string | undefined {
  let best: { label: string; count: number } | undefined;
  for (const { match, label } of TIPOS_RECURSO) {
    const count = normText.split(match).length - 1;
    if (count > 0 && (!best || count > best.count)) {
      best = { label, count };
    }
  }
  return best?.label;
}

function detectMaterias(normText: string): string[] {
  const found = new Set<string>();
  for (const { match, label } of MATERIA_KEYWORDS) {
    if (normText.includes(match)) found.add(label);
  }
  return [...found];
}

/** Extrae toda la metadata de un documento a partir del nombre de archivo y el texto. */
export function extractMetadata(filePath: string, text: string): DocumentMeta {
  const file = basename(filePath);
  const stem = file.replace(/\.pdf$/i, '');
  const normText = normalize(text);

  let tribunalCode = 'NA';
  let caseNumber = stem;
  let year = 0;

  const m = stem.match(/^([A-Za-z]+)[_-](\d+)[-_](\d{4})$/);
  if (m) {
    tribunalCode = m[1].toUpperCase();
    caseNumber = m[2];
    year = parseInt(m[3], 10);
  }

  const date = extractDate(text);
  if (!year && date) year = parseInt(date.slice(0, 4), 10);

  return {
    docId: stem,
    sourceFile: file,
    tribunalCode,
    tribunal: TRIBUNAL_MAP[tribunalCode] ?? tribunalCode,
    caseNumber,
    year,
    date,
    tipoRecurso: detectTipoRecurso(normText),
    materias: detectMaterias(normText),
  };
}
