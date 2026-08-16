export type BrainHabitSnapshot = {
  id: string;
  name: string;
  targetPerWeek: number;
  completedThisWeek: number;
  streak: number;
};

export type BrainGoalSnapshot = {
  id: string;
  title: string;
  category: string;
  priority: number;
  progressPercent: number;
  targetDate: string | null;
  daysRemaining: number | null;
};

export type BrainFitnessPerformanceMemory = {
  windowDays: number;
  sessions: number;
  averageForm: number | null;
  averageCompletion: number | null;
  averageDifficulty: number | null;
  averageRecovery: number | null;
  formTrend: number | null;
  completionTrend: number | null;
  recoveryTrend: number | null;
  disciplineSummary: Record<string, { sessions: number; averageForm: number | null; averageDifficulty: number | null }>;
  exerciseTrends: Array<{
    exerciseId: string | null;
    exerciseName: string | null;
    sessions: number;
    firstScore: number | null;
    latestScore: number | null;
    scoreTrend: number | null;
    latestReps: number | null;
    latestLoadKg: number | null;
  }>;
};

export type BrainDecisionExplanationMemory = {
  windowDays: number;
  decisions: number;
  repeatedReasons: Array<{ reason: string; count: number }>;
  selectedFrequency: Array<{ id: string; count: number }>;
  changeSignal: 'stable' | 'changing' | 'insufficient-data';
};

export type BrainDecisionOutcomeMemory = {
  sampleSize: number;
  averageScore: number | null;
  positiveRate: number;
  negativeRate: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
  confidenceAdjustment: number;
};

export type BrainFitnessConstraint = string | { key: string; enabled: boolean };

export type BrainFitnessContext = {
  disciplines: string[];
  primaryGoal: {
    id: string;
    kind: string;
    title: string;
    targetAreas: string[];
    desiredOutcome: string;
    priority: number;
    avoidBulk: boolean;
    active: boolean;
  } | null;
  equipment: string[];
  constraints: BrainFitnessConstraint[];
  targetAreas: string[];
  performanceMemory?: BrainFitnessPerformanceMemory;
  decisionMemory?: BrainDecisionExplanationMemory;
};

export type BrainLifeContext = {
  habits: {
    active: number;
    completedThisWeek: number;
    completionPercent: number;
    currentStreak: number;
    items: BrainHabitSnapshot[];
  };
  reminders: {
    pending: number;
    next: { id: string; title: string; type: string; scheduledAt: string } | null;
  };
  supplements: {
    total: number;
    taken: number;
    remaining: number;
    completionPercent: number;
    next: { id: string; name: string; dosage: string | null; scheduledTime: string } | null;
  };
  goals: {
    active: number;
    dueSoon: number;
    averageProgress: number;
    next: BrainGoalSnapshot | null;
    items: BrainGoalSnapshot[];
  };
  fitness: BrainFitnessContext;
  decisionMemory?: BrainDecisionExplanationMemory;
  outcomeMemory?: BrainDecisionOutcomeMemory;
};
