export type CalisthenicsLevel = 'beginner' | 'foundation' | 'intermediate' | 'advanced' | 'expert' | 'elite';
export type CalisthenicsFocus = 'strength' | 'hypertrophy' | 'conditioning' | 'mobility' | 'skills' | 'full_body' | 'upper_body' | 'lower_body' | 'core';
export type Equipment = 'none' | 'pull_up_bar' | 'parallel_bars' | 'rings' | 'bench' | 'resistance_band' | 'dip_belt';

export type CalisthenicsExercise = {
  id: string;
  name: string;
  aliases: string[];
  levels: CalisthenicsLevel[];
  focuses: CalisthenicsFocus[];
  equipment: Equipment[];
  difficulty: number;
  repsMin: number | null;
  repsMax: number | null;
  holdSec: number | null;
  regressionId?: string;
  progressionId?: string;
  safetyNotes: string[];
  cues: string[];
};

export type CalisthenicsStep = {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps: number | null;
  holdSec: number | null;
  restSec: number;
  coachCues: string[];
};

export type CalisthenicsSession = {
  id: string;
  level: CalisthenicsLevel;
  focus: CalisthenicsFocus[];
  durationMin: number;
  equipment: Equipment[];
  steps: CalisthenicsStep[];
  estimatedDifficulty: number;
};

export type CalisthenicsProgress = {
  sessionsCompleted: number;
  completionRate: number | null;
  formScoreAvg: number | null;
  recentDifficulty: number | null;
  currentLevel: CalisthenicsLevel;
};
