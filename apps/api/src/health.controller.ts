import { Controller, Get } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch/elasticsearch.service';

@Controller('health')
export class HealthController {
  constructor(private readonly es: ElasticsearchService) {}

  @Get()
  async health() {
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
