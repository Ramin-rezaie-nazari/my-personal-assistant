import { validate } from 'class-validator';
import { RecordFitnessProgressDto } from './fitness.dto';

describe('RecordFitnessProgressDto', () => {
  it('accepts a valid progress payload', async () => {
    const dto = Object.assign(new RecordFitnessProgressDto(), {
      discipline: 'gym',
      difficulty: 7,
      completed: true,
      formScore: 88,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an out-of-range difficulty', async () => {
    const dto = Object.assign(new RecordFitnessProgressDto(), {
      discipline: 'gym',
      difficulty: 11,
      completed: true,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('difficulty');
  });

  it('rejects unsupported disciplines', async () => {
    const dto = Object.assign(new RecordFitnessProgressDto(), {
      discipline: 'running',
      difficulty: 5,
      completed: false,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('discipline');
  });

  it('rejects a form score outside the declared range', async () => {
    const dto = Object.assign(new RecordFitnessProgressDto(), {
      discipline: 'yoga',
      difficulty: 4,
      completed: true,
      formScore: 101,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('formScore');
  });
});
