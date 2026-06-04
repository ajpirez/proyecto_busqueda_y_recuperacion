import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ElasticsearchService } from './elasticsearch/elasticsearch.service';

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'up', enum: ['up', 'down'] })
  elasticsearch!: string;

  @ApiProperty({ example: 38 })
  indexedChunks!: number;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly es: ElasticsearchService) {}

  @Get()
  @ApiOperation({ summary: 'Estado del API y de Elasticsearch' })
  @ApiOkResponse({
    description: 'Servicio operativo',
    type: HealthResponseDto,
  })
  async health(): Promise<HealthResponseDto> {
    let elasticsearch = 'down';
    let count = 0;
    try {
      const ping = await this.es.client.ping();
      elasticsearch = ping ? 'up' : 'down';
      const c = await this.es.client.count({ index: this.es.index });
      count = c.count;
    } catch {
      /* ES no disponible */
    }
    return { status: 'ok', elasticsearch, indexedChunks: count };
  }
}
