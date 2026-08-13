export type YogaLevel = 'beginner' | 'foundation' | 'intermediate' | 'advanced' | 'expert';
export type YogaFocus = 'mobility' | 'flexibility' | 'balance' | 'strength' | 'recovery' | 'relaxation' | 'stress_relief' | 'morning' | 'evening' | 'breathing';
export type YogaPoseKind = 'warmup' | 'standing' | 'balance' | 'seated' | 'prone' | 'supine' | 'transition' | 'breathing' | 'relaxation';
export type YogaSafetyLevel = 'low' | 'moderate' | 'high';

export type YogaCue = {
  id: string;
  phase: 'enter' | 'hold' | 'exit';
  text: string;
  priority: number;
};

export type YogaPose = {
  id: string;
  name: string;
  aliases: string[];
  kind: YogaPoseKind;
  levels: YogaLevel[];
  focuses: YogaFocus[];
  defaultHoldSec: number;
  minHoldSec: number;
  maxHoldSec: number;
  difficulty: number;
  safetyLevel: YogaSafetyLevel;
  breathing: string;
  cues: YogaCue[];
  contraindications: string[];
  transitionsTo: string[];
};

export type YogaSessionStep = {
  id: string;
  poseId: string;
  order: number;
  phase: 'warmup' | 'flow' | 'cooldown';
  holdSec: number;
  restSec: number;
  coachCues: YogaCue[];
};

export type YogaSession = {
  id: string;
  level: YogaLevel;
  focus: YogaFocus[];
  durationMin: number;
  steps: YogaSessionStep[];
  estimatedDifficulty: number;
};

export type YogaProgress = {
  sessionsCompleted: number;
  totalMinutes: number;
  currentLevel: YogaLevel;
  formScoreAvg: number | null;
  completionRate: number | null;
  recentDifficulty: number | null;
};
