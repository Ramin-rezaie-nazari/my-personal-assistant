export enum MemoryType {
  PROFILE = 'profile',
  PREFERENCE = 'preference',
  GOAL = 'goal',
  HABIT = 'habit',
  HEALTH = 'health',
  NUTRITION = 'nutrition',
  FITNESS = 'fitness',
  SHOPPING = 'shopping',
  KNOWLEDGE = 'knowledge',
}

export interface Memory {
  id: string;
  type: MemoryType;
  key: string;
  value: unknown;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
}
