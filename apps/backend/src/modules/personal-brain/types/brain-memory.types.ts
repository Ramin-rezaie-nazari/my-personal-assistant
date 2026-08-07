export type BrainMemory = {
  content: string;
  score: number;
};

export type BrainMemoryContext = {
  memories: BrainMemory[];
};
