import { readFile } from 'node:fs/promises';
// pdf-parse exporta una funcion CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedPdf {
  text: string;
  numPages: number;
}

/** Extrae el texto crudo y el numero de paginas de un PDF. */
export async function parsePdf(path: string): Promise<ParsedPdf> {
  const buffer = await readFile(path);
  const data = await pdfParse(buffer);
  return { text: data.text ?? '', numPages: data.numpages ?? 0 };
}
