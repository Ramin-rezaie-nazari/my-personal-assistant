import { YogaMotionAnalysisService } from './yoga-motion-analysis.service';
import { PoseFrame } from '../models/pose-provider.model';

const frame = (landmarks: PoseFrame['landmarks'], overallConfidence = 0.95): PoseFrame => ({ capturedAt: Date.now(), landmarks, overallConfidence });

describe('YogaMotionAnalysisService', () => {
  const service = new YogaMotionAnalysisService();

  it('scores a plausible Warrior II front knee angle as stable', () => {
    const result = service.analyze('warrior_ii', frame({
      hip: { x: 0, y: 0, confidence: 1 },
      knee: { x: 1, y: 0, confidence: 1 },
      ankle: { x: 1.25, y: 0.7, confidence: 1 },
    }));
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.metrics[0].name).toBe('front_knee_angle');
  });

  it('returns a corrective cue for an out-of-range plank angle', () => {
    const result = service.analyze('plank', frame({
      shoulder: { x: 0, y: 0, confidence: 1 },
      hip: { x: 1, y: 1, confidence: 1 },
      ankle: { x: 2, y: 2, confidence: 1 },
    }));
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('keeps confidence low when the pose detector is uncertain', () => {
    const result = service.analyze('downward_dog', frame({
      shoulder: { x: 0, y: 0, confidence: 1 },
      hip: { x: 0.5, y: 0.5, confidence: 1 },
      knee: { x: 1, y: 1, confidence: 1 },
    }, 0.35));
    expect(result.confidence).toBeLessThan(0.55);
  });
});
