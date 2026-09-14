import { BadRequestException } from '@nestjs/common';
import { ExerciseContentService } from './exercise-content.service';

describe('ExerciseContentService media gates', () => {
  const executeRaw = jest.fn();
  const queryRaw = jest.fn();
  const service = new ExerciseContentService({ executeRaw, queryRaw } as any);

  beforeEach(() => {
    executeRaw.mockReset();
    queryRaw.mockReset();
    queryRaw.mockResolvedValue([{ id: 'exercise-1' }]);
  });

  it('rejects approved media without provenance', async () => {
    await expect(service.addMedia('exercise-1', {
      kind: 'video',
      url: 'https://cdn.example.test/demo.mp4',
      sourceProvider: 'MYPA',
      license: 'owned',
      mimeType: 'video/mp4',
      acquisitionMode: undefined as never,
      sourceReference: undefined as never,
      rightsBasis: undefined as never,
      status: 'approved',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rejects non-owned approved media without canonical source URL', async () => {
    await expect(service.addMedia('exercise-1', {
      kind: 'video',
      url: 'https://cdn.example.test/demo.mp4',
      sourceProvider: 'Example Provider',
      license: 'CC-BY',
      mimeType: 'video/mp4',
      acquisitionMode: 'licensed',
      sourceReference: 'provider-page-1',
      rightsBasis: 'written-license-2026-09-14',
      status: 'approved',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('allows an approved owned video once its rights basis is explicit', async () => {
    executeRaw.mockResolvedValue(1);
    queryRaw.mockResolvedValueOnce([{ id: 'exercise-1' }]).mockResolvedValueOnce([{ id: 'media-1' }]);
    const result = await service.addMedia('exercise-1', {
      kind: 'video',
      url: 'https://cdn.example.test/demo.mp4',
      sourceProvider: 'MYPA',
      license: 'owned',
      mimeType: 'video/mp4',
      acquisitionMode: 'owned_upload',
      sourceReference: 'mystaudio-1',
      rightsBasis: 'MYPA-owned-recording',
      storageKey: 'fitness/exercise-1/demo.mp4',
      status: 'approved',
    });
    expect(result).toEqual({ id: 'media-1' });
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});
