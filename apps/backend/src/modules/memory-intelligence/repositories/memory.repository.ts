import { Memory } from '../models/memory.model';

export const MEMORY_REPOSITORY = Symbol('MEMORY_REPOSITORY');

export interface MemoryRepository {
  save(memory: Memory): Promise<void>;

  update(memory: Memory): Promise<void>;

  findById(id: string): Promise<Memory | null>;

  findByKey(key: string): Promise<Memory | null>;

  getAll(): Promise<Memory[]>;

  delete(id: string): Promise<void>;
}
