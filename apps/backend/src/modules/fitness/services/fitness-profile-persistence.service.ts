import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';
import {
  FitnessEquipment,
  FitnessGoal,
  FitnessProfile,
  FitnessRecommendationContext,
  BodyTarget,
} from '../models/fitness.model';

@Injectable()
export class FitnessProfilePersistenceService {
  constructor(private readonly prisma: PrismaService) {}

  private defaults(): FitnessProfile {
    return {
      disciplines: [],
      goals: [],
      equipment: [],
      constraints: [],
      preferredSessionMinutes: [20, 30, 45, 60],
    };
  }

  private normalize(value: unknown): FitnessProfile {
    if (!value || typeof value !== 'object') return this.defaults();
    const p = value as Partial<FitnessProfile>;
    return {
      disciplines: Array.isArray(p.disciplines) ? p.disciplines : [],
      goals: Array.isArray(p.goals) ? p.goals : [],
      equipment: Array.isArray(p.equipment) ? p.equipment : [],
      constraints: Array.isArray(p.constraints) ? p.constraints : [],
      preferredSessionMinutes: Array.isArray(p.preferredSessionMinutes)
        ? p.preferredSessionMinutes
        : [20, 30, 45, 60],
    };
  }

  async get(userId: string): Promise<FitnessProfile> {
    const row = await this.prisma.fitnessProfileState.findUnique({
      where: { userId },
    });
    return this.normalize(row?.profile);
  }

  async save(userId: string, profile: FitnessProfile): Promise<FitnessProfile> {
    const normalized = this.normalize(profile);
    await this.prisma.fitnessProfileState.upsert({
      where: { userId },
      create: { userId, profile: normalized },
      update: { profile: normalized },
    });
    return normalized;
  }

  async addEquipment(
    userId: string,
    item: FitnessProfile['equipment'][number],
  ) {
    const profile = await this.get(userId);
    return this.save(userId, {
      ...profile,
      equipment: [...profile.equipment.filter((x) => x.id !== item.id), item],
    });
  }

  async removeEquipment(userId: string, equipmentId: string) {
    const profile = await this.get(userId);
    return this.save(userId, {
      ...profile,
      equipment: profile.equipment.filter((item) => item.id !== equipmentId),
    });
  }

  async addGoal(userId: string, goal: FitnessGoal) {
    const profile = await this.get(userId);
    return this.save(userId, {
      ...profile,
      goals: [...profile.goals.filter((x) => x.id !== goal.id), goal],
    });
  }

  async buildRecommendationContext(
    userId: string,
  ): Promise<FitnessRecommendationContext> {
    const profile = await this.get(userId);
    const primaryGoal =
      [...profile.goals]
        .filter((goal) => goal.active)
        .sort((a, b) => b.priority - a.priority)[0] ?? null;
    const targetAreas: BodyTarget[] = primaryGoal?.targetAreas ?? ['full_body'];
    const equipment: FitnessEquipment[] = profile.equipment
      .filter((item) => item.active)
      .map((item) => item.type);
    if (equipment.length === 0) equipment.push('none');
    return {
      disciplines: profile.disciplines,
      primaryGoal,
      equipment: [...new Set(equipment)],
      constraints: profile.constraints,
      targetAreas,
    };
  }

  parseNaturalGoal(text: string): FitnessGoal {
    const normalized = text.toLowerCase();
    const targets: BodyTarget[] = [];
    const push = (target: BodyTarget, ...words: string[]) => {
      if (words.some((word) => normalized.includes(word))) targets.push(target);
    };
    push('thighs', 'ران', 'thigh');
    push('glutes', 'باسن', 'glute');
    push('shoulders', 'سرشانه', 'شانه', 'shoulder');
    push('waist', 'کمر', 'waist');
    push('core', 'شکم', 'core', 'abs');
    push('back', 'پشت', 'back');
    const avoidBulk =
      normalized.includes('حجم') &&
      (normalized.includes('نمی') || normalized.includes('نه'));
    const fatLoss =
      normalized.includes('لاغر') ||
      normalized.includes('چربی') ||
      normalized.includes('fat loss');
    const sculpt =
      normalized.includes('خوش فرم') ||
      normalized.includes('خوش‌فرم') ||
      normalized.includes('tone') ||
      normalized.includes('sculpt');
    const strength =
      normalized.includes('قوی') ||
      normalized.includes('قدرت') ||
      normalized.includes('strength');
    const kind = fatLoss
      ? 'fat_loss'
      : sculpt
        ? 'body_sculpt'
        : strength
          ? 'strength'
          : 'general_fitness';
    return {
      id: `parsed-${Date.now()}`,
      kind,
      title: text.trim(),
      targetAreas: targets.length ? [...new Set(targets)] : ['full_body'],
      desiredOutcome: text.trim(),
      priority: 80,
      avoidBulk,
      active: true,
    };
  }
}
