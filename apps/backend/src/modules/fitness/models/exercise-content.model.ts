export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type ExerciseContentStatus = 'draft' | 'published' | 'archived';
export type ExerciseMediaKind = 'video' | 'image' | 'animation';
export type ExerciseMediaStatus = 'pending' | 'approved' | 'rejected' | 'retired';
export type ExerciseRelationshipKind = 'alternative' | 'progression' | 'regression';

export type ExerciseRecord = {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  aliases: string[];
  discipline: string;
  movementPattern: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: ExerciseDifficulty;
  goals: string[];
  instructions: string | null;
  coachCues: string[];
  commonMistakes: string[];
  cautions: string[];
  contentStatus: ExerciseContentStatus;
  sourceProvider: string | null;
  sourceLicense: string | null;
  sourceAttribution: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExerciseMediaRecord = {
  id: string;
  exerciseId: string;
  kind: ExerciseMediaKind;
  url: string;
  sourceUrl: string | null;
  sourceProvider: string;
  license: string;
  attribution: string | null;
  mimeType: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  language: string | null;
  posterUrl: string | null;
  checksum: string | null;
  status: ExerciseMediaStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ExerciseRelationshipRecord = {
  id: string;
  fromExerciseId: string;
  toExerciseId: string;
  kind: ExerciseRelationshipKind;
  priority: number;
  notes: string | null;
};
