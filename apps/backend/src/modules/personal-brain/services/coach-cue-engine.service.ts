import { Injectable } from '@nestjs/common';

export type CoachCueKind =
  | 'instruction'
  | 'countdown'
  | 'transition'
  | 'encouragement'
  | 'safety'
  | 'explanation';
export type CoachCueLanguage = 'fa' | 'en';

export type CoachCue = {
  id: string;
  kind: CoachCueKind;
  text: string;
  priority: 'low' | 'normal' | 'high';
  speakImmediately: boolean;
  interruptible: boolean;
};

@Injectable()
export class CoachCueEngineService {
  buildExerciseStart(
    name: string,
    durationSeconds: number,
    language: CoachCueLanguage = 'fa',
  ): CoachCue {
    return this.cue(
      'instruction',
      language === 'fa'
        ? `${name} رو شروع کن. آروم و کنترل‌شده حرکت کن.`
        : `Start ${name}. Keep the movement slow and controlled.`,
      'normal',
      true,
      true,
    );
  }

  buildCountdown(seconds: number, language: CoachCueLanguage = 'fa'): CoachCue {
    const text =
      language === 'fa' ? `${seconds} ثانیه.` : `${seconds} seconds.`;
    return this.cue('countdown', text, 'high', true, true);
  }

  buildTransition(
    nextExercise: string,
    language: CoachCueLanguage = 'fa',
  ): CoachCue {
    return this.cue(
      'transition',
      language === 'fa'
        ? `عالی. حالا بریم سراغ ${nextExercise}.`
        : `Good. Now let's move to ${nextExercise}.`,
      'normal',
      true,
      false,
    );
  }

  buildSafety(message: string, language: CoachCueLanguage = 'fa'): CoachCue {
    return this.cue(
      'safety',
      language === 'fa' ? `یه لحظه. ${message}` : `Pause. ${message}`,
      'high',
      true,
      false,
    );
  }

  buildExplanation(
    message: string,
    language: CoachCueLanguage = 'fa',
  ): CoachCue {
    return this.cue(
      'explanation',
      language === 'fa' ? message : message,
      'low',
      false,
      true,
    );
  }

  private cue(
    kind: CoachCueKind,
    text: string,
    priority: CoachCue['priority'],
    speakImmediately: boolean,
    interruptible: boolean,
  ): CoachCue {
    return {
      id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      text,
      priority,
      speakImmediately,
      interruptible,
    };
  }
}
