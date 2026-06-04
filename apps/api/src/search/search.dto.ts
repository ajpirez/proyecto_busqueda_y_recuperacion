import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { SearchMode } from '@rag/shared';

export class SearchFiltersDto {
  @ApiPropertyOptional({
    example: ['Corte Suprema'],
    description: 'Filtrar por tribunal',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tribunal?: string[];

  @ApiPropertyOptional({ example: [2023], description: 'Filtrar por año' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  year?: number[];

  @ApiPropertyOptional({
    example: ['Recurso de protección'],
    description: 'Filtrar por tipo de recurso',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tipoRecurso?: string[];
}

export class SearchRequestDto {
  @ApiProperty({
    example: 'requisitos para reconocer la condición de refugiado',
    description: 'Texto de búsqueda',
  })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ type: SearchFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  size?: number;

  @ApiPropertyOptional({
    enum: ['hybrid', 'lexical', 'semantic'],
    example: 'hybrid',
    default: 'hybrid',
  })
  @IsOptional()
  @IsIn(['hybrid', 'lexical', 'semantic'])
  mode?: SearchMode;
}
