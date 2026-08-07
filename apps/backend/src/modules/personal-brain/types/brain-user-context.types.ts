export type BrainUserContext = {
  userId?: string;

  profile: {
    age?: number;
    occupation?: string;
    location?: string;
  };

  lifeAreas: string[];

  preferences: Record<string, unknown>;

  constraints: string[];

  rawContext?: unknown;

  goals: unknown[];
};
