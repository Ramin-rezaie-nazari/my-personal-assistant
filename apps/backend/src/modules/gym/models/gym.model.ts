export type GymLevel = 'beginner' | 'foundation' | 'intermediate' | 'advanced' | 'expert';
export type GymFocus = 'strength' | 'hypertrophy' | 'fat_loss' | 'body_sculpt' | 'upper_body' | 'lower_body' | 'full_body' | 'shoulders' | 'back' | 'chest' | 'arms' | 'legs' | 'glutes' | 'core';
export type GymEquipment = 'none' | 'dumbbells' | 'barbell' | 'bench' | 'cable_machine' | 'machine' | 'pull_up_bar' | 'smith_machine' | 'resistance_band' | 'kettlebell';
export type GymExercise = {
  id: string;
  name: string;
  focus: GymFocus[];
  equipment: GymEquipment[];
  level: GymLevel;
  compound: boolean;
  setsMin: number;
  setsMax: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  cues: string[];
};
export type GymProgress = {
  currentLevel: GymLevel;
  formScoreAvg: number;
  completionRate: number;
  recentDifficulty: number;
};
export type GymSessionStep = {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
  coachCues: string[];
};
export type GymSession = {
  id: string;
  level: GymLevel;
  focus: GymFocus[];
  durationMin: number;
  equipment: GymEquipment[];
  steps: GymSessionStep[];
  estimatedDifficulty: number;
};
