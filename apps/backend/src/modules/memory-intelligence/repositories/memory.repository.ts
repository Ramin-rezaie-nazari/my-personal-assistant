import { Memory } from '../models/memory.model';

export const MEMORY_REPOSITORY = Symbol('MEMORY_REPOSITORY');
export const PERSISTENT_MEMORY_REPOSITORY = Symbol(
  'PERSISTENT_MEMORY_REPOSITORY',
);

export interface MemoryRepository {
  save(memory: Memory): Promise<void>;

  update(memory: Memory): Promise<void>;

  findById(id: string, userId?: string): Promise<Memory | null>;

  findByKey(key: string, userId?: string): Promise<Memory | null>;

  getAll(userId?: string): Promise<Memory[]>;

  delete(id: string, userId?: string): Promise<void>;
}
