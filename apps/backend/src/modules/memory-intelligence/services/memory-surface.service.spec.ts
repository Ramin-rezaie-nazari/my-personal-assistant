import { MemorySurfaceService } from './memory-surface.service';
import { Memory } from '../models/memory.model';

describe('MemorySurfaceService', () => {
  const service = new MemorySurfaceService();
  const make = (
    id: string,
    visibility: 'internal' | 'user_visible',
    confidence: number,
    importance: number,
  ): Memory => ({
    id,
    userId: 'u1',
    type: 'preference' as any,
    key: id,
    value: id,
    importance,
    confidence,
    visibility,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('keeps low-confidence internal details away from the user UI', () => {
    const result = service.filterForUser([
      make('a', 'user_visible', 0.9, 0.9),
      make('b', 'internal', 0.99, 0.99),
      make('c', 'user_visible', 0.6, 1),
    ]);
    expect(result.map((item) => item.id)).toEqual(['a']);
  });

  it('lets the brain use stronger internal signals than the user sees', () => {
    const result = service.filterForBrain([
      make('a', 'internal', 0.6, 0.8),
      make('b', 'user_visible', 0.9, 0.7),
    ]);
    expect(result.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
