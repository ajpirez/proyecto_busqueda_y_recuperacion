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
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tribunal?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  year?: number[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tipoRecurso?: string[];
}

export class SearchRequestDto {
  @IsString()
  q!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  size?: number;

  @IsOptional()
  @IsIn(['hybrid', 'lexical', 'semantic'])
  mode?: SearchMode;
}
