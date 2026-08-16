import { FitnessEquipment, FitnessGoal, FitnessRecommendationContext, FitnessProfile, BodyTarget } from '../models/fitness.model';

export class FitnessProfileService {
  private readonly profiles = new Map<string, FitnessProfile>();

  get(userId: string): FitnessProfile {
    return this.profiles.get(userId) ?? {
      disciplines: [],
      goals: [],
      equipment: [],
      constraints: [],
      preferredSessionMinutes: [20, 30, 45, 60],
    };
  }

  save(userId: string, profile: FitnessProfile): FitnessProfile {
    this.profiles.set(userId, profile);
    return profile;
  }

  addEquipment(userId: string, item: FitnessProfile['equipment'][number]) {
    const profile = this.get(userId);
    const next = { ...profile, equipment: [...profile.equipment.filter((x) => x.id !== item.id), item] };
    return this.save(userId, next);
  }

  removeEquipment(userId: string, equipmentId: string) {
    const profile = this.get(userId);
    return this.save(userId, { ...profile, equipment: profile.equipment.filter((x) => x.id !== equipmentId) });
  }

  addGoal(userId: string, goal: FitnessGoal) {
    const profile = this.get(userId);
    const next = { ...profile, goals: [...profile.goals.filter((x) => x.id !== goal.id), goal] };
    return this.save(userId, next);
  }

  buildRecommendationContext(userId: string): FitnessRecommendationContext {
    const profile = this.get(userId);
    const primaryGoal = [...profile.goals].filter((goal) => goal.active).sort((a, b) => b.priority - a.priority)[0] ?? null;
    const targetAreas: BodyTarget[] = primaryGoal?.targetAreas ?? ['full_body'];
    const equipment: FitnessEquipment[] = profile.equipment.filter((item) => item.active).map((item) => item.type);
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
    const normalized = text.toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/‌/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const targetAreas: BodyTarget[] = [];
    const pushTarget = (value: BodyTarget, ...keywords: string[]) => { if (keywords.some((keyword) => normalized.includes(keyword))) targetAreas.push(value); };
    pushTarget('thighs', 'ران', 'thigh');
    pushTarget('glutes', 'باسن', 'glute');
    pushTarget('shoulders', 'سرشانه', 'شانه', 'shoulder');
    pushTarget('waist', 'کمر', 'waist');
    pushTarget('core', 'شکم', 'core', 'abs');
    pushTarget('back', 'پشت', 'back');
    const avoidBulk = normalized.includes('حجم') && /(?:نمی\s*خوام|نمی\s*گیرم|نگیرم|بدون|نه|نخوام)/.test(normalized);
    const fatLoss = normalized.includes('لاغر') || normalized.includes('چربی') || normalized.includes('fat loss');
    const bodySculpt = normalized.includes('خوش فرم') || normalized.includes('خوش‌فرم') || normalized.includes('tone') || normalized.includes('sculpt');
    const strength = normalized.includes('قوی') || normalized.includes('قدرت') || normalized.includes('strength');
    const kind = fatLoss ? 'fat_loss' : bodySculpt ? 'body_sculpt' : strength ? 'strength' : 'general_fitness';
    return {
      id: `parsed-${Date.now()}`,
      kind,
      title: text.trim(),
      targetAreas: targetAreas.length ? [...new Set(targetAreas)] : ['full_body'],
      desiredOutcome: text.trim(),
      priority: 80,
      avoidBulk,
      active: true,
    };
  }
}
