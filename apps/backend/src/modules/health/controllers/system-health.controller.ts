import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SystemHealthService } from '../services/system-health.service';

@Controller('health')
export class SystemHealthController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Get()
  async check() {
    const result = await this.systemHealthService.check();

    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
