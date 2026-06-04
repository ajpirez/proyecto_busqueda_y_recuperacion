# RAG Judicial — Búsqueda y recuperación de información sobre sentencias del Poder Judicial

Sistema de **búsqueda y recuperación de información (RAG)** sobre documentos judiciales en PDF.
La base de conocimiento son los PDFs de la carpeta [`poder_judicial_files/`](./poder_judicial_files), que se
parsean, segmentan, vectorizan (embeddings) e indexan en **Elasticsearch** para permitir:

- **Búsqueda híbrida**: BM25 (léxica, analizador español) + kNN sobre vectores densos (semántica).
- **Filtros facetados**: tribunal, año, tipo de recurso (agregaciones de Elasticsearch).
- **Snippets resaltados** (highlighting) de las coincidencias.
- **Respuesta generada (RAG)** por un LLM local (Ollama) con **citas** a los considerandos usados.

## Arquitectura

```
proyecto final/
├─ apps/
│  ├─ api/        NestJS  (ingesta, búsqueda híbrida, RAG)
│  └─ web/        Next.js (interfaz de búsqueda + Code Connect de Figma)
├─ packages/
│  └─ shared/     Tipos TypeScript compartidos (contrato de la API)
├─ poder_judicial_files/   Base de conocimiento (PDFs)
└─ docker-compose.yml      Elasticsearch 8 (+ Kibana opcional)
```

| Pieza            | Tecnología                                   |
| ---------------- | -------------------------------------------- |
| Backend / RAG    | NestJS 10                                    |
| Índice / búsqueda| Elasticsearch 8 (`dense_vector` + BM25)      |
| Embeddings       | Ollama · `nomic-embed-text` (768 dims)       |
| Generación (LLM) | Ollama · `llama3.2`                          |
| Frontend         | Next.js 15 (App Router) + Tailwind           |
| Gestor paquetes  | bun (workspaces)                             |

### Flujo de datos

1. **Ingesta** (`apps/api/src/ingestion`): se lee cada PDF → se extrae texto y nº de páginas →
   se limpia (marcas de página y de agua) → se extrae metadata (tribunal, causa, año, fecha en
   palabras, tipo de recurso, materias) → se **segmenta por considerando** con ventanas y
   solapamiento → cada fragmento se vectoriza con Ollama → se indexa en Elasticsearch (`bulk`).
2. **Búsqueda** (`apps/api/src/search`): combina una `query` BM25 + un bloque `knn` (según el modo),
   aplica los filtros facetados, calcula agregaciones (facetas) y devuelve snippets resaltados.
3. **RAG** (`apps/api/src/rag`): recupera los `topK` fragmentos más relevantes, arma un prompt con
   el contexto numerado y pide a `llama3.2` una respuesta en español citando `[n]`.

## Requisitos

- [bun](https://bun.com) ≥ 1.3
- [Docker](https://www.docker.com/) (para Elasticsearch)
- [Ollama](https://ollama.com/) con los modelos:
  ```bash
  ollama pull nomic-embed-text
  ollama pull llama3.2
  ```

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Instalar dependencias (workspaces)
bun install

# 3. Levantar Elasticsearch
bun run infra:up          # docker compose up -d

# 4. Ingestar los PDFs (crea el índice y los embeddings)
bun run ingest            # incremental
#   bun --cwd apps/api run ingest -- --reset   # recrea el índice desde cero

# 5. Arrancar backend y frontend (en dos terminales)
bun run dev:api           # http://localhost:3001/api
bun run dev:web           # http://localhost:3000
```

Para añadir más documentos: copia nuevos PDFs en `poder_judicial_files/` y vuelve a ejecutar
`bun run ingest` (la reingesta es idempotente por documento).

## API

| Método | Ruta           | Descripción                                  |
| ------ | -------------- | -------------------------------------------- |
| POST   | `/api/search`  | Búsqueda híbrida con facetas y snippets      |
| POST   | `/api/rag`     | Respuesta generada (RAG) con citas           |
| POST   | `/api/ingest`  | Dispara la (re)ingesta (`{ "reset": true }`) |
| GET    | `/api/health`  | Estado de ES y nº de fragmentos indexados    |

Ejemplo:

```bash
curl -X POST http://localhost:3001/api/search -H "Content-Type: application/json" \
  -d '{"q":"requisitos para reconocer la condición de refugiado","mode":"hybrid","size":5}'
```

## Figma · Code Connect

La UI de `apps/web` está preparada para **Code Connect**:

- Configuración: [`apps/web/figma.config.json`](./apps/web/figma.config.json)
- Mapeos: `apps/web/components/*.figma.tsx` (`SearchBar`, `FacetSidebar`, `ResultCard`, `RagAnswerPanel`)

Para activarlo:

1. Maqueta/genera la pantalla en Figma (un componente por cada componente React).
2. Reemplaza `FIGMA_URL` en cada `*.figma.tsx` por la URL del componente publicado (con `?node-id=`).
3. Publica: `bun --cwd apps/web run figma:connect`.

> Nota: Code Connect requiere un plan **Organization/Enterprise** de Figma para aparecer en Dev Mode.

## Notas técnicas

- El cliente de Elasticsearch usa `HttpConnection` (módulo `http` nativo) en vez de `undici`,
  por compatibilidad con el runtime de bun en Windows.
- El caché de bun se fija en la unidad del proyecto (`bunfig.toml`) para evitar errores `EPERM`
  al instalar entre volúmenes distintos en Windows.
- `nomic-embed-text` usa prefijos de tarea (`search_document:` / `search_query:`) para mejorar
  la calidad del retrieval.
