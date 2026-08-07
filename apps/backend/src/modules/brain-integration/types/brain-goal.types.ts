export type BrainGoalCategory =
  'health' | 'fitness' | 'family' | 'finance' | 'growth' | 'general';

export type BrainGoal = {
  id?: string;

  category: BrainGoalCategory;

  title: string;

  priority?: number;

  metadata?: Record<string, unknown>;
};
