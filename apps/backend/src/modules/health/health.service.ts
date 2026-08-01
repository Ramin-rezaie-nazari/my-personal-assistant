import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'My Personal Assistant API',
      timestamp: new Date().toISOString(),
    };
  }
}
