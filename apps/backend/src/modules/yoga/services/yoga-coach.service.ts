import { Injectable } from '@nestjs/common';
import { YogaSession } from '../models/yoga.model';
import { YogaLibraryService } from './yoga-library.service';

export type YogaCoachPhase = 'idle' | 'enter' | 'hold' | 'exit' | 'rest' | 'completed';
export type YogaCoachState = { sessionId: string; stepIndex: number; phase: YogaCoachPhase; remainingSec: number; completedSteps: number[]; currentPoseId: string | null; nextPoseId: string | null };

@Injectable()
export class YogaCoachService {
  constructor(private readonly library: YogaLibraryService) {}

  start(session: YogaSession): YogaCoachState {
    const first = session.steps[0];
    return { sessionId: session.id, stepIndex: 0, phase: first ? 'enter' : 'completed', remainingSec: first?.holdSec ?? 0, completedSteps: [], currentPoseId: first?.poseId ?? null, nextPoseId: session.steps[1]?.poseId ?? null };
  }

  tick(session: YogaSession, state: YogaCoachState, elapsedSec = 1): YogaCoachState {
    if (state.phase === 'completed') return state;
    const safeElapsed = Math.max(0, Math.round(elapsedSec));
    let remaining = Math.max(0, state.remainingSec - safeElapsed);
    let phase = state.phase;
    if (phase === 'idle') phase = 'enter';
    if (phase === 'enter' && remaining <= 0) phase = 'hold';
    if (phase === 'hold' && remaining <= 0) phase = 'exit';
    if (phase === 'exit' && remaining <= 0) {
      const step = session.steps[state.stepIndex];
      const completedSteps = state.completedSteps.includes(state.stepIndex) ? state.completedSteps : [...state.completedSteps, state.stepIndex];
      const nextIndex = state.stepIndex + 1;
      if (!session.steps[nextIndex]) return { ...state, stepIndex: nextIndex, phase: 'completed', remainingSec: 0, completedSteps, currentPoseId: null, nextPoseId: null };
      const next = session.steps[nextIndex];
      const nextDuration = next.restSec > 0 ? next.restSec : next.holdSec;
      return { ...state, stepIndex: nextIndex, phase: next.restSec > 0 ? 'rest' : 'enter', remainingSec: nextDuration, completedSteps, currentPoseId: next.poseId, nextPoseId: session.steps[nextIndex + 1]?.poseId ?? null };
    }
    if (phase === 'rest' && remaining <= 0) {
      const next = session.steps[state.stepIndex];
      return { ...state, phase: 'enter', remainingSec: next.holdSec, currentPoseId: next.poseId };
    }
    return { ...state, phase, remainingSec: remaining };
  }

  cue(state: YogaCoachState): { poseId: string | null; phase: YogaCoachPhase; text: string } | null {
    if (!state.currentPoseId || state.phase === 'completed') return null;
    const pose = this.library.get(state.currentPoseId);
    if (!pose) return null;
    const cue = pose.cues.find((item) => item.phase === state.phase) ?? pose.cues[0];
    return { poseId: pose.id, phase: state.phase, text: cue?.text ?? pose.breathing };
  }
}
