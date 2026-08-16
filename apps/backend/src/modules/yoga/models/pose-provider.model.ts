export type BodyLandmark = {
  x: number;
  y: number;
  z?: number;
  confidence: number;
};

export type PoseFrame = {
  capturedAt: number;
  landmarks: Record<string, BodyLandmark>;
  overallConfidence: number;
};

export type PoseAssessment = {
  poseId: string;
  score: number;
  confidence: number;
  issues: Array<{
    key: string;
    severity: 'info' | 'warning' | 'critical';
    cue: string;
  }>;
  stable: boolean;
};

export interface PoseProvider {
  detect(frame: unknown): Promise<PoseFrame | null>;
}
