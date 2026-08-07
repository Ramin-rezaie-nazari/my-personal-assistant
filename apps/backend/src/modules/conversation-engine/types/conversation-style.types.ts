export type ConversationTone = 'friendly' | 'professional' | 'casual';

export type ConversationLanguage = 'fa' | 'en';

export type ConversationFormality = 'formal' | 'informal';

export type ConversationStyle = {
  tone: ConversationTone;

  language: ConversationLanguage;

  formality: ConversationFormality;
};
