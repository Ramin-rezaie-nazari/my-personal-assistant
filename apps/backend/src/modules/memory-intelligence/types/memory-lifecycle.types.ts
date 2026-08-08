import { Memory } from '../models/memory.model';

export type MemoryLifecycleResult = {
  input: Memory;
  classification: Record<string, unknown>;
  score: Record<string, unknown>;
  consolidated: Record<string, unknown>;
};
