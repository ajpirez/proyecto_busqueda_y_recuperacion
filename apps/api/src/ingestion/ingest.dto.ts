import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class IngestRequestDto {
  @ApiPropertyOptional({
    description: 'Si es true, elimina y recrea el índice antes de ingestar',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  reset?: boolean;
}
