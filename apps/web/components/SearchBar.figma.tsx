import figma from '@figma/code-connect';
import { SEARCH_MODES } from '@/lib/search-modes';
import { SearchBar } from './SearchBar';

/**
 * Code Connect: mapea el componente "SearchBar" de Figma al componente React.
 *
 * IMPORTANTE: reemplaza FIGMA_URL por la URL del componente publicado en Figma
 * (debe incluir ?node-id=...). Luego publica con:  bun run figma:connect
 *
 * Requiere plan Organization/Enterprise de Figma para que aparezca en Dev Mode.
 */
const FIGMA_URL = 'https://www.figma.com/design/REEMPLAZAR_FILE_KEY/Busqueda-Juridica?node-id=0-0';

figma.connect(SearchBar, FIGMA_URL, {
  props: {
    value: figma.string('Placeholder'),
    mode: figma.enum(
      'Modo',
      Object.fromEntries(SEARCH_MODES.map((m) => [m.label, m.id])),
    ),
    loading: figma.boolean('Cargando'),
  },
  example: (props) => (
    <SearchBar
      value={props.value}
      mode={props.mode}
      loading={props.loading}
      onChange={() => {}}
      onSubmit={() => {}}
      onModeChange={() => {}}
    />
  ),
});
