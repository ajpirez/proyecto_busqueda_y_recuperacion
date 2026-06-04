/**
 * Tipos compartidos entre el backend (NestJS) y el frontend (Next.js).
 * Describe el contrato de la API de busqueda y RAG.
 */

/** Metadata de un documento judicial (sentencia / resolucion). */
export interface DocumentMeta {
  /** Id del documento fuente, ej: "CS_104901-2023". */
  docId: string;
  /** Codigo del tribunal, ej: "CS". */
  tribunalCode: string;
  /** Nombre legible del tribunal, ej: "Corte Suprema". */
  tribunal: string;
  /** Numero de causa / rol. */
  caseNumber: string;
  /** Anio de la causa. */
  year: number;
  /** Fecha de la resolucion en ISO (YYYY-MM-DD) si se pudo extraer. */
  date?: string;
  /** Tipo de recurso detectado, ej: "Recurso de proteccion". */
  tipoRecurso?: string;
  /** Materias / etiquetas detectadas. */
  materias?: string[];
  /** Nombre del archivo fuente. */
  sourceFile: string;
  /** Numero total de paginas del documento. */
  totalPages?: number;
}

/** Un fragmento (chunk) indexado en Elasticsearch. */
export interface Chunk extends DocumentMeta {
  chunkId: string;
  chunkIndex: number;
  /** Considerando al que pertenece el fragmento, ej: "Quinto". */
  considerando?: string;
  /** Numero de pagina aproximado. */
  page?: number;
  /** Texto del fragmento. */
  content: string;
}

/** Resultado individual de busqueda. */
export interface SearchHit {
  chunkId: string;
  docId: string;
  score: number;
  tribunal: string;
  tribunalCode: string;
  caseNumber: string;
  year: number;
  date?: string;
  tipoRecurso?: string;
  considerando?: string;
  page?: number;
  sourceFile: string;
  /** Texto del fragmento (sin resaltar). */
  content: string;
  /** Fragmentos resaltados (snippets con <em>) devueltos por el highlight de ES. */
  highlights: string[];
}

export interface FacetValue {
  value: string;
  count: number;
  /** Etiqueta legible para mostrar en la UI. */
  label?: string;
}

export interface Facet {
  /** Campo facetado, ej: "tribunal", "year", "tipoRecurso". */
  field: string;
  /** Titulo legible para la UI. */
  label: string;
  values: FacetValue[];
}

/** Filtros facetados que el cliente envia. */
export interface SearchFilters {
  tribunal?: string[];
  year?: number[];
  tipoRecurso?: string[];
}

export type SearchMode = 'hybrid' | 'lexical' | 'semantic';

export interface SearchRequest {
  q: string;
  filters?: SearchFilters;
  page?: number;
  size?: number;
  mode?: SearchMode;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  size: number;
  tookMs: number;
  mode: SearchMode;
  hits: SearchHit[];
  facets: Facet[];
}

/** Cita usada por la respuesta generada (RAG). */
export interface Citation {
  /** Numero de referencia mostrado en el texto, ej: 1. */
  ref: number;
  chunkId: string;
  docId: string;
  tribunal: string;
  caseNumber: string;
  year: number;
  considerando?: string;
  page?: number;
  snippet: string;
}

export interface RagRequest {
  q: string;
  filters?: SearchFilters;
  /** Cuantos fragmentos recuperar como contexto. */
  topK?: number;
}

export interface RagResponse {
  query: string;
  answer: string;
  citations: Citation[];
  model: string;
  tookMs: number;
}
