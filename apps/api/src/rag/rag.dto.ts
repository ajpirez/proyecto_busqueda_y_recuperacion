import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchFiltersDto } from '../search/search.dto';

export class RagRequestDto {
  @ApiProperty({
    example: '¿Cuál es la autoridad ante la que debe presentarse un extranjero para solicitar refugio?',
    description: 'Pregunta del usuario',
  })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ type: SearchFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @ApiPropertyOptional({
    example: 6,
    minimum: 1,
    maximum: 12,
    description: 'Fragmentos de contexto a recuperar',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  topK?: number;
}
