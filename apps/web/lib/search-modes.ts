import type { SearchMode } from '@rag/shared';

export interface SearchModeConfig {
  id: SearchMode;
  label: string;
  hint: string;
}

export const SEARCH_MODES: SearchModeConfig[] = [
  {
    id: 'hybrid',
    label: 'Recomendada',
    hint: 'Combina palabras exactas y significado. Suele dar los mejores resultados.',
  },
  {
    id: 'semantic',
    label: 'Por significado',
    hint: 'Encuentra documentos relacionados aunque no uses las mismas palabras.',
  },
  {
    id: 'lexical',
    label: 'Palabras exactas',
    hint: 'Solo documentos que contienen literalmente lo que escribes.',
  },
];

const SEARCH_MODE_BY_ID = Object.fromEntries(
  SEARCH_MODES.map((mode) => [mode.id, mode]),
) as Record<SearchMode, SearchModeConfig>;

export function getSearchModeConfig(mode: SearchMode): SearchModeConfig {
  return SEARCH_MODE_BY_ID[mode];
}

export function getSearchModeLabel(mode: SearchMode): string {
  return getSearchModeConfig(mode).label;
}
