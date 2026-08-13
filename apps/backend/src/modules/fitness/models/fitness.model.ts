export type FitnessDiscipline = 'gym' | 'calisthenics' | 'yoga' | 'cardio' | 'running' | 'mobility';
export type FitnessGoalKind = 'strength' | 'hypertrophy' | 'fat_loss' | 'body_sculpt' | 'mobility' | 'conditioning' | 'skill' | 'general_fitness';
export type BodyTarget = 'full_body' | 'shoulders' | 'arms' | 'chest' | 'back' | 'core' | 'waist' | 'hips' | 'glutes' | 'thighs' | 'legs' | 'calves';
export type TrainingConstraint = 'low_impact' | 'avoid_high_volume' | 'minimize_muscle_bulk' | 'no_jumps' | 'quiet_home' | 'short_sessions';
export type FitnessEquipment = 'none' | 'dumbbells' | 'barbell' | 'bench' | 'pull_up_bar' | 'parallel_bars' | 'rings' | 'resistance_band' | 'cable_machine' | 'treadmill' | 'bike' | 'dip_belt' | 'yoga_mat';

export type FitnessGoal = {
  id: string;
  kind: FitnessGoalKind;
  title: string;
  targetAreas: BodyTarget[];
  desiredOutcome: string;
  priority: number;
  avoidBulk: boolean;
  active: boolean;
};

export type EquipmentItem = {
  id: string;
  type: FitnessEquipment;
  name: string;
  quantity: number;
  metadata: Record<string, string | number | boolean>;
  active: boolean;
};

export type FitnessProfile = {
  disciplines: FitnessDiscipline[];
  goals: FitnessGoal[];
  equipment: EquipmentItem[];
  constraints: TrainingConstraint[];
  preferredSessionMinutes: number[];
};

export type FitnessRecommendationContext = {
  disciplines: FitnessDiscipline[];
  primaryGoal: FitnessGoal | null;
  equipment: FitnessEquipment[];
  constraints: TrainingConstraint[];
  targetAreas: BodyTarget[];
};
