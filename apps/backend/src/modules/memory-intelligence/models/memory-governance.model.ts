export type MemorySource =
  'explicit_user' | 'conversation' | 'behavior' | 'decision' | 'system';
export type MemoryLayer = 'raw' | 'derived' | 'explicit';
export type MemoryVisibility = 'internal' | 'user_visible';
export type MemoryRetention =
  'session' | '1_month' | '3_months' | '6_months' | '1_year' | 'unlimited';

export type MemoryGoverned = {
  memoryId: string;
  userId: string;
  layer: MemoryLayer;
  source: MemorySource;
  visibility: MemoryVisibility;
  confidence: number;
  importance: number;
  retention: MemoryRetention;
  createdAt: Date;
  lastConfirmedAt?: Date;
  expiresAt?: Date;
  supersededBy?: string;
  relatedMemoryIds: string[];
  topicKeys: string[];
};

export type ForgetRequest =
  | { kind: 'memory'; memoryIds: string[] }
  | { kind: 'topic'; topicKey: string }
  | { kind: 'range'; from: Date; to: Date }
  | { kind: 'all' };
