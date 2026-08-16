import { MemoryForgettingService } from './memory-forgetting.service';
import { MemoryGoverned } from '../models/memory-governance.model';

describe('MemoryForgettingService', () => {
  const service = new MemoryForgettingService();
  const memories: MemoryGoverned[] = [
    {
      memoryId: 'a',
      userId: 'u1',
      layer: 'explicit',
      source: 'explicit_user',
      visibility: 'user_visible',
      confidence: 0.9,
      importance: 0.9,
      retention: 'unlimited',
      createdAt: new Date('2026-08-12T10:00:00Z'),
      relatedMemoryIds: [],
      topicKeys: ['fitness'],
    },
    {
      memoryId: 'b',
      userId: 'u1',
      layer: 'derived',
      source: 'behavior',
      visibility: 'internal',
      confidence: 0.8,
      importance: 0.7,
      retention: '3_months',
      createdAt: new Date('2026-08-12T11:00:00Z'),
      relatedMemoryIds: [],
      topicKeys: ['nutrition'],
    },
    {
      memoryId: 'c',
      userId: 'u2',
      layer: 'derived',
      source: 'behavior',
      visibility: 'internal',
      confidence: 0.7,
      importance: 0.6,
      retention: '3_months',
      createdAt: new Date('2026-08-12T12:00:00Z'),
      relatedMemoryIds: [],
      topicKeys: ['fitness'],
    },
  ];

  it('forgets only the requested topic for the requested user', () => {
    const result = service.forgetForUser(
      'u1',
      { kind: 'topic', topicKey: 'fitness' },
      memories,
    );
    expect(result.map((m) => m.memoryId)).toEqual(['b', 'c']);
  });

  it('forgets a precise time range without touching other users', () => {
    const result = service.forgetForUser(
      'u1',
      {
        kind: 'range',
        from: new Date('2026-08-12T10:30:00Z'),
        to: new Date('2026-08-12T11:30:00Z'),
      },
      memories,
    );
    expect(result.map((m) => m.memoryId)).toEqual(['a', 'c']);
  });
});
