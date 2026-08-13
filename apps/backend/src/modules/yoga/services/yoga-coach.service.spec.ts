import { YogaCoachService } from './yoga-coach.service';
import { YogaLibraryService } from './yoga-library.service';
import { YogaSessionGeneratorService } from './yoga-session-generator.service';

describe('YogaCoachService', () => {
  const library = new YogaLibraryService();
  const generator = new YogaSessionGeneratorService(library);
  const service = new YogaCoachService(library);

  it('starts on the first pose and returns a cue', () => {
    const session = generator.generate({ durationMin: 10, level: 'beginner', focus: 'mobility' });
    const state = service.start(session);
    expect(state.stepIndex).toBe(0);
    expect(service.cue(state)?.text).toBeTruthy();
  });

  it('advances through steps and eventually completes', () => {
    const session = generator.generate({ durationMin: 10, level: 'beginner', focus: 'mobility' });
    let state = service.start(session);
    for (let i = 0; i < 1000 && state.phase !== 'completed'; i += 1) state = service.tick(session, state, 30);
    expect(state.phase).toBe('completed');
    expect(state.completedSteps.length).toBe(session.steps.length);
  });
});
