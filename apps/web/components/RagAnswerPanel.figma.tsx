import figma from '@figma/code-connect';
import { RagAnswerPanel } from './RagAnswerPanel';

/** Code Connect para el panel de respuesta generada (RAG) con citas. */
const FIGMA_URL = 'https://www.figma.com/design/REEMPLAZAR_FILE_KEY/Busqueda-Juridica?node-id=0-0';

figma.connect(RagAnswerPanel, FIGMA_URL, {
  props: {
    loading: figma.boolean('Cargando'),
  },
  example: (props) => (
    <RagAnswerPanel
      loading={props.loading}
      hasQuery
      onGenerate={() => {}}
      answer={{
        query: 'consulta',
        answer: 'Respuesta sintetizada por el modelo con citas [1].',
        citations: [
          {
            ref: 1,
            chunkId: 'CS_84261-2023#5',
            docId: 'CS_84261-2023',
            tribunal: 'Corte Suprema',
            caseNumber: '84261',
            year: 2023,
            considerando: 'Quinto',
            page: 2,
            snippet: 'fragmento citado',
          },
        ],
        model: 'llama3.2',
        tookMs: 17541,
      }}
    />
  ),
});
