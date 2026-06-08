import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const SAFE_PDF = /^[A-Za-z0-9_.-]+\.pdf$/i;

@Injectable()
export class DocumentsService {
  private readonly docsDir: string;

  constructor(config: ConfigService) {
    this.docsDir = config.get<string>('ingestion.docsDir')!;
  }

  /** Ruta absoluta del PDF si el nombre es válido y el archivo existe. */
  async resolvePdfPath(filename: string): Promise<string> {
    const name = basename(filename);
    if (!SAFE_PDF.test(name)) {
      throw new NotFoundException('Documento no encontrado');
    }

    const filePath = resolve(join(this.docsDir, name));
    if (!filePath.startsWith(resolve(this.docsDir))) {
      throw new NotFoundException('Documento no encontrado');
    }

    try {
      await access(filePath);
    } catch {
      throw new NotFoundException(`PDF no encontrado: ${name}`);
    }

    return filePath;
  }
}
