import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok' as const,
        service: 'My Personal Assistant API',
        database: 'ok' as const,
        timestamp,
      };
    } catch {
      return {
        status: 'degraded' as const,
        service: 'My Personal Assistant API',
        database: 'unavailable' as const,
        timestamp,
      };
    }
  }
}
