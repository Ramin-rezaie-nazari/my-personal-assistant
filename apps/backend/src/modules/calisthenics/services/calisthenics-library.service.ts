import { Injectable } from '@nestjs/common';
import { CalisthenicsExercise, CalisthenicsFocus, CalisthenicsLevel, Equipment } from '../models/calisthenics.model';

@Injectable()
export class CalisthenicsLibraryService {
  private readonly exercises: CalisthenicsExercise[] = [
    { id: 'bodyweight_squat', name: 'Bodyweight Squat', aliases: ['squat'], levels: ['beginner','foundation','intermediate'], focuses: ['lower_body','conditioning','full_body'], equipment: ['none'], difficulty: 1, repsMin: 8, repsMax: 20, holdSec: null, progressionId: 'split_squat', safetyNotes: [], cues: ['Chest tall', 'Knees track with toes'] },
    { id: 'incline_push_up', name: 'Incline Push-up', aliases: ['elevated push up'], levels: ['beginner','foundation'], focuses: ['upper_body','strength'], equipment: ['bench','none'], difficulty: 1, repsMin: 6, repsMax: 15, holdSec: null, progressionId: 'push_up', safetyNotes: [], cues: ['Keep body in one line', 'Control the descent'] },
    { id: 'push_up', name: 'Push-up', aliases: ['press up'], levels: ['foundation','intermediate','advanced'], focuses: ['upper_body','strength','hypertrophy'], equipment: ['none'], difficulty: 3, repsMin: 5, repsMax: 20, holdSec: null, regressionId: 'incline_push_up', progressionId: 'decline_push_up', safetyNotes: [], cues: ['Brace your core', 'Elbows about 30–45 degrees'] },
    { id: 'split_squat', name: 'Split Squat', aliases: ['stationary lunge'], levels: ['foundation','intermediate','advanced'], focuses: ['lower_body','strength'], equipment: ['none','bench'], difficulty: 3, repsMin: 6, repsMax: 15, holdSec: null, regressionId: 'bodyweight_squat', progressionId: 'pistol_squat', safetyNotes: [], cues: ['Stay tall', 'Drive through the front foot'] },
    { id: 'plank', name: 'Plank', aliases: ['front plank'], levels: ['beginner','foundation','intermediate'], focuses: ['core','conditioning'], equipment: ['none'], difficulty: 2, repsMin: null, repsMax: null, holdSec: 20, safetyNotes: [], cues: ['Brace abs', 'Keep hips level'] },
    { id: 'pike_push_up', name: 'Pike Push-up', aliases: ['pike press'], levels: ['intermediate','advanced'], focuses: ['upper_body','strength','skills'], equipment: ['none'], difficulty: 5, repsMin: 4, repsMax: 12, holdSec: null, regressionId: 'push_up', progressionId: 'handstand_push_up', safetyNotes: [], cues: ['Hips high', 'Head travels forward and down'] },
    { id: 'pull_up', name: 'Pull-up', aliases: ['strict pullup'], levels: ['intermediate','advanced'], focuses: ['upper_body','strength'], equipment: ['pull_up_bar'], difficulty: 6, repsMin: 2, repsMax: 10, holdSec: null, progressionId: 'chest_to_bar_pull_up', safetyNotes: ['Use a stable bar'], cues: ['Start from active shoulders', 'Pull chest toward bar'] },
    { id: 'hollow_body_hold', name: 'Hollow Body Hold', aliases: ['hollow hold'], levels: ['foundation','intermediate','advanced'], focuses: ['core','skills'], equipment: ['none'], difficulty: 4, repsMin: null, repsMax: null, holdSec: 20, regressionId: 'plank', progressionId: 'hollow_rock', safetyNotes: [], cues: ['Lower ribs down', 'Keep lower back controlled'] },
    { id: 'pistol_squat', name: 'Pistol Squat', aliases: ['single leg squat'], levels: ['advanced','expert'], focuses: ['lower_body','balance','skills','strength'], equipment: ['none'], difficulty: 8, repsMin: 2, repsMax: 8, holdSec: null, regressionId: 'split_squat', safetyNotes: ['Use support if balance is limited'], cues: ['Control the descent', 'Keep heel grounded'] },
    { id: 'handstand', name: 'Handstand', aliases: ['freestanding handstand'], levels: ['advanced','expert','elite'], focuses: ['skills','balance'], equipment: ['none','wall'], difficulty: 9, repsMin: null, repsMax: null, holdSec: 20, regressionId: 'pike_push_up', safetyNotes: ['Use a safe open area'], cues: ['Push tall through shoulders', 'Keep body stacked'] },
    { id: 'handstand_push_up', name: 'Handstand Push-up', aliases: ['HSPU'], levels: ['expert','elite'], focuses: ['skills','strength','upper_body'], equipment: ['none','wall'], difficulty: 10, repsMin: 1, repsMax: 8, holdSec: null, regressionId: 'pike_push_up', safetyNotes: ['Advanced skill; use a safe setup'], cues: ['Brace hard', 'Control both directions'] },
    { id: 'l_sit', name: 'L-sit', aliases: ['L sit hold'], levels: ['advanced','expert','elite'], focuses: ['core','skills','upper_body'], equipment: ['parallel_bars','rings','none'], difficulty: 8, repsMin: null, repsMax: null, holdSec: 10, regressionId: 'hollow_body_hold', safetyNotes: [], cues: ['Depress shoulders', 'Keep legs active'] },
    { id: 'muscle_up', name: 'Muscle-up', aliases: ['strict muscle up'], levels: ['expert','elite'], focuses: ['skills','strength','upper_body'], equipment: ['pull_up_bar','rings'], difficulty: 10, repsMin: 1, repsMax: 5, holdSec: null, regressionId: 'pull_up', safetyNotes: ['Advanced movement; prioritize controlled reps'], cues: ['Explosive pull', 'Turn over smoothly'] },
    { id: 'front_lever_tuck', name: 'Tuck Front Lever', aliases: ['tuck front lever hold'], levels: ['advanced','expert'], focuses: ['skills','core','upper_body'], equipment: ['pull_up_bar','rings'], difficulty: 8, repsMin: null, repsMax: null, holdSec: 8, regressionId: 'hollow_body_hold', safetyNotes: [], cues: ['Posterior pelvic tilt', 'Keep shoulders packed'] },
  ];

  list(level?: CalisthenicsLevel, focus?: CalisthenicsFocus, equipment: Equipment[] = ['none']): CalisthenicsExercise[] {
    return this.exercises.filter((exercise) => {
      const levelOk = !level || exercise.levels.includes(level);
      const focusOk = !focus || exercise.focuses.includes(focus);
      const equipmentOk = exercise.equipment.some((item) => item === 'none' || equipment.includes(item));
      return levelOk && focusOk && equipmentOk;
    });
  }

  get(id: string) {
    return this.exercises.find((exercise) => exercise.id === id) ?? null;
  }
}
