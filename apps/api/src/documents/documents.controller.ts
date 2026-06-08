import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get(':filename')
  @ApiOperation({ summary: 'Sirve un PDF de la carpeta local de documentos (DOCS_DIR)' })
  @ApiParam({ name: 'filename', example: 'CS_104901-2023.pdf' })
  @ApiOkResponse({ description: 'Archivo PDF', content: { 'application/pdf': {} } })
  @ApiNotFoundResponse({ description: 'PDF no encontrado' })
  async servePdf(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    let filePath: string;
    try {
      filePath = await this.documents.resolvePdfPath(filename);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new NotFoundException('Documento no encontrado');
    }

    const name = filePath.split(/[/\\]/).pop()!;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${name}"`);
    createReadStream(filePath).pipe(res);
  }
}
