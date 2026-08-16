import { Injectable } from '@nestjs/common';
import {
  GymEquipment,
  GymExercise,
  GymFocus,
  GymLevel,
} from '../models/gym.model';

const exercises: GymExercise[] = [
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    focus: ['legs', 'glutes', 'lower_body', 'full_body'],
    equipment: ['dumbbells', 'kettlebell'],
    level: 'beginner',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 75,
    cues: ['Keep chest tall', 'Drive through the whole foot'],
  },
  {
    id: 'db-bench-press',
    name: 'Dumbbell Bench Press',
    focus: ['chest', 'upper_body'],
    equipment: ['dumbbells', 'bench'],
    level: 'foundation',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 90,
    cues: ['Keep shoulder blades stable', 'Lower with control'],
  },
  {
    id: 'db-row',
    name: 'Dumbbell Row',
    focus: ['back', 'upper_body'],
    equipment: ['dumbbells', 'bench'],
    level: 'foundation',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 90,
    cues: ['Pull toward the hip', 'Avoid rotating the torso'],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    focus: ['back', 'upper_body'],
    equipment: ['cable_machine', 'machine'],
    level: 'foundation',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 90,
    cues: ['Pull elbows down', 'Keep ribs controlled'],
  },
  {
    id: 'lateral-raise',
    name: 'Dumbbell Lateral Raise',
    focus: ['shoulders', 'upper_body'],
    equipment: ['dumbbells'],
    level: 'beginner',
    compound: false,
    setsMin: 2,
    setsMax: 4,
    repsMin: 10,
    repsMax: 15,
    restSec: 60,
    cues: ['Raise smoothly', 'Do not shrug'],
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    focus: ['legs', 'glutes', 'back', 'lower_body'],
    equipment: ['dumbbells', 'barbell'],
    level: 'foundation',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 6,
    repsMax: 10,
    restSec: 105,
    cues: ['Hinge at the hips', 'Keep the load close'],
  },
  {
    id: 'split-squat',
    name: 'Split Squat',
    focus: ['legs', 'glutes', 'lower_body'],
    equipment: ['dumbbells', 'none'],
    level: 'beginner',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 75,
    cues: ['Stay balanced', 'Drive through the front foot'],
  },
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    focus: ['back', 'upper_body'],
    equipment: ['cable_machine'],
    level: 'foundation',
    compound: true,
    setsMin: 2,
    setsMax: 4,
    repsMin: 8,
    repsMax: 12,
    restSec: 90,
    cues: ['Stay tall', 'Finish with elbows behind the torso'],
  },
  {
    id: 'plank',
    name: 'Weighted Plank',
    focus: ['core'],
    equipment: ['none', 'dumbbells'],
    level: 'beginner',
    compound: false,
    setsMin: 2,
    setsMax: 3,
    repsMin: 20,
    repsMax: 45,
    restSec: 45,
    cues: ['Brace the core', 'Keep hips level'],
  },
];

@Injectable()
export class GymLibraryService {
  list(
    level: GymLevel,
    focus?: GymFocus,
    equipment: GymEquipment[] = ['none'],
  ): GymExercise[] {
    const available = new Set(equipment);
    const levelIndex: GymLevel[] = [
      'beginner',
      'foundation',
      'intermediate',
      'advanced',
      'expert',
    ];
    const allowed = levelIndex.slice(0, levelIndex.indexOf(level) + 1);
    return exercises.filter(
      (item) =>
        allowed.includes(item.level) &&
        (!focus || item.focus.includes(focus)) &&
        item.equipment.some((eq) => available.has(eq)),
    );
  }

  get(id: string): GymExercise | null {
    return exercises.find((item) => item.id === id) ?? null;
  }
}
