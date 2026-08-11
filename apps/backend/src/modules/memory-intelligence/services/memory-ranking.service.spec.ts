import { MemoryType, type Memory } from '../models/memory.model';
import { MemoryRankingService } from './memory-ranking.service';

describe('MemoryRankingService', () => {
  const service = new MemoryRankingService();

  const memory = (key: string, value: string, importance: number): Memory => ({
    id: key,
    type: MemoryType.PREFERENCE,
    key,
    value,
    importance,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('prioritizes query relevance over importance', () => {
    const result = service.rank(
      [
        memory('unrelated', 'likes classical music', 1),
        memory('food', 'prefers high protein breakfast', 0.2),
      ],
      'protein breakfast',
    );

    expect(result[0].content).toBe('prefers high protein breakfast');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('gives an exact phrase a relevance bonus', () => {
    const result = service.rank(
      [
        memory('breakfast', 'prefers high protein breakfast', 0.5),
        memory('protein', 'protein is useful', 0.5),
      ],
      'high protein breakfast',
    );

    expect(result[0].content).toBe('prefers high protein breakfast');
  });

  it('handles an empty query without throwing', () => {
    const result = service.rank([memory('test', 'some value', 0.5)], '');

    expect(result).toHaveLength(1);
    expect(result[0].score).toBeGreaterThan(0);
  });
});
