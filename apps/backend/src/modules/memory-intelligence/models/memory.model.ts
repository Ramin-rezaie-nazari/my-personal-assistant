import { MemoryLayer, MemoryRetention, MemorySource, MemoryVisibility } from './memory-governance.model';

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
  userId?: string;
  type: MemoryType;
  key: string;
  value: unknown;
  importance: number;
  createdAt: Date;
  updatedAt: Date;
  layer?: MemoryLayer;
  source?: MemorySource;
  visibility?: MemoryVisibility;
  confidence?: number;
  retention?: MemoryRetention;
  relatedMemoryIds?: string[];
  topicKeys?: string[];
  lastConfirmedAt?: Date;
  expiresAt?: Date;
}
