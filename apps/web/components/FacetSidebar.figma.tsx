import figma from '@figma/code-connect';
import { FacetSidebar } from './FacetSidebar';

/** Code Connect para el panel de filtros facetados. */
const FIGMA_URL = 'https://www.figma.com/design/REEMPLAZAR_FILE_KEY/Busqueda-Juridica?node-id=0-0';

figma.connect(FacetSidebar, FIGMA_URL, {
  example: () => (
    <FacetSidebar
      facets={[
        {
          field: 'tribunal',
          label: 'Tribunal',
          values: [{ value: 'Corte Suprema', label: 'Corte Suprema', count: 11 }],
        },
        {
          field: 'year',
          label: 'Año',
          values: [{ value: '2023', label: '2023', count: 11 }],
        },
      ]}
      selected={{ tribunal: [], year: [], tipoRecurso: [] }}
      onToggle={() => {}}
      onClear={() => {}}
    />
  ),
});
