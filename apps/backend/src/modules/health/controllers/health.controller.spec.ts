import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from '../services/health.service';
import { NutritionService } from '../services/nutrition.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthService, useValue: { getProfile: jest.fn(), updateProfile: jest.fn() } },
        { provide: NutritionService, useValue: { getProfile: jest.fn(), updateProfile: jest.fn() } },
      ],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns a public liveness response', () => {
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('My Personal Assistant API');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
