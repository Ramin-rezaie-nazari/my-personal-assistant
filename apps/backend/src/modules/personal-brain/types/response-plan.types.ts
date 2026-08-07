export type ResponseTone = 'friendly' | 'professional' | 'casual';

export type ResponseLanguage = 'fa' | 'en';

export type ResponsePlan = {
  tone: ResponseTone;

  language: ResponseLanguage;

  message: string;

  metadata?: Record<string, unknown>;
};
