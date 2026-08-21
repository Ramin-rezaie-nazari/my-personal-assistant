import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import { CreateDeviceSyncDto, HealthDataType } from '../dto/create-device-sync.dto';

@Injectable()
export class HealthSyncService {
  constructor(private readonly prisma: PrismaService) {}

  async syncHealthData(userId: string, input: CreateDeviceSyncDto) {
    if (!userId) throw new BadRequestException('userId is required');
    if (!input.provider?.trim()) throw new BadRequestException('provider is required');
    if (!input.deviceId?.trim()) throw new BadRequestException('deviceId is required');
    if (!Array.isArray(input.points)) throw new BadRequestException('points must be an array');

    let written = 0;
    for (const point of input.points) {
      const value = Number(point.value);
      const startAt = new Date(point.startAt);
      const endAt = new Date(point.endAt);
      if (!isFinite(value) || !Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()) || endAt < startAt) {
        throw new BadRequestException(`Invalid health datapoint: ${point.dataType}`);
      }
      if (!SUPPORTED_TYPES.has(point.dataType)) throw new BadRequestException(`Unsupported health data type: ${point.dataType}`);
      const sourceRecordId = point.sourceRecordId ?? `${point.dataType}:${startAt.toISOString()}:${endAt.toISOString()}:${value}`;
      await this.prisma.healthDataPoint.upsert({
        where: { userId_provider_dataType_sourceRecordId: { userId, provider: input.provider.trim(), dataType: point.dataType, sourceRecordId } },
        create: { userId, provider: input.provider.trim(), deviceId: input.deviceId.trim(), dataType: point.dataType, value, unit: point.unit, startAt, endAt, sourceRecordId, metadata: point.metadata ?? undefined },
        update: { deviceId: input.deviceId.trim(), value, unit: point.unit, startAt, endAt, metadata: point.metadata ?? undefined },
      });
      written += 1;
    }

    return { provider: input.provider.trim(), deviceId: input.deviceId.trim(), received: input.points.length, written };
  }
}

const SUPPORTED_TYPES = new Set<HealthDataType>([
  'steps', 'distance_walking_running', 'active_calories', 'total_calories',
  'sleep_duration', 'workout_duration', 'workout_calories', 'heart_rate',
  'resting_heart_rate', 'weight',
]);
