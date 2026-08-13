import { Injectable } from '@nestjs/common';
import { CalisthenicsSession } from '../models/calisthenics.model';

export type CalisthenicsCoachState = {
  sessionId: string;
  stepIndex: number;
  setIndex: number;
  phase: 'idle' | 'work' | 'rest' | 'completed';
  remainingSec: number;
  completedSteps: number[];
  currentExerciseId: string | null;
  nextExerciseId: string | null;
};

@Injectable()
export class CalisthenicsCoachService {
  start(session: CalisthenicsSession): CalisthenicsCoachState {
    const step = session.steps[0];
    return { sessionId: session.id, stepIndex: 0, setIndex: 1, phase: step ? 'work' : 'completed', remainingSec: this.workSeconds(session, 0), completedSteps: [], currentExerciseId: step?.exerciseId ?? null, nextExerciseId: session.steps[1]?.exerciseId ?? null };
  }

  tick(session: CalisthenicsSession, state: CalisthenicsCoachState, elapsedSec = 1): CalisthenicsCoachState {
    if (state.phase === 'completed') return state;
    const next = { ...state, remainingSec: Math.max(0, state.remainingSec - elapsedSec) };
    if (next.remainingSec > 0) return next;
    const step = session.steps[state.stepIndex];
    if (!step) return { ...next, phase: 'completed', currentExerciseId: null, nextExerciseId: null };
    if (state.phase === 'work' && state.setIndex < step.sets) {
      return { ...next, phase: 'rest', remainingSec: step.restSec };
    }
    if (state.phase === 'rest') {
      return { ...next, phase: 'work', setIndex: state.setIndex + 1, remainingSec: this.workSeconds(session, state.stepIndex) };
    }
    const completed = [...state.completedSteps, state.stepIndex];
    const nextIndex = state.stepIndex + 1;
    const nextStep = session.steps[nextIndex];
    return nextStep
      ? { ...next, stepIndex: nextIndex, setIndex: 1, phase: 'work', remainingSec: this.workSeconds(session, nextIndex), completedSteps: completed, currentExerciseId: nextStep.exerciseId, nextExerciseId: session.steps[nextIndex + 1]?.exerciseId ?? null }
      : { ...next, phase: 'completed', completedSteps: completed, currentExerciseId: null, nextExerciseId: null };
  }

  private workSeconds(session: CalisthenicsSession, index: number) {
    const step = session.steps[index];
    return step?.holdSec ?? Math.max(15, Math.min(60, (step?.reps ?? 8) * 4));
  }
}
