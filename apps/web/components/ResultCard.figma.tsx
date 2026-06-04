import figma from '@figma/code-connect';
import { ResultCard } from './ResultCard';

/** Code Connect para la tarjeta de resultado (snippet con resaltado). */
const FIGMA_URL = 'https://www.figma.com/design/REEMPLAZAR_FILE_KEY/Busqueda-Juridica?node-id=0-0';

figma.connect(ResultCard, FIGMA_URL, {
  props: {
    tribunal: figma.string('Tribunal'),
    caseNumber: figma.string('Causa'),
    snippet: figma.string('Snippet'),
  },
  example: (props) => (
    <ResultCard
      rank={1}
      hit={{
        chunkId: 'demo#0',
        docId: 'CS_104901-2023',
        score: 4.23,
        tribunal: props.tribunal,
        tribunalCode: 'CS',
        caseNumber: props.caseNumber,
        year: 2023,
        tipoRecurso: 'Recurso de protección',
        considerando: 'Quinto',
        page: 3,
        sourceFile: 'CS_104901-2023.pdf',
        content: props.snippet,
        highlights: [props.snippet],
      }}
    />
  ),
});
