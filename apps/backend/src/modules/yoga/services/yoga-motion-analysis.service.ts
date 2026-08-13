import { Injectable } from '@nestjs/common';
import { BodyLandmark, PoseAssessment, PoseFrame } from '../models/pose-provider.model';
export type MotionMetric = { name: string; value: number; idealMin?: number; idealMax?: number; error: number };
export type MotionAnalysis = PoseAssessment & { metrics: MotionMetric[]; analyzedAt: number };
@Injectable()
export class YogaMotionAnalysisService {
  analyze(poseId: string, frame: PoseFrame): MotionAnalysis {
    const definition = this.definitions[poseId] ?? [];
    const metrics = definition.map((rule) => { const value = rule.measure(frame.landmarks); const error = rule.error(value); return { name: rule.name, value, idealMin: rule.min, idealMax: rule.max, error }; });
    const averageError = metrics.length ? metrics.reduce((sum, metric) => sum + metric.error, 0) / metrics.length : 1;
    const score = this.clamp(1 - averageError) * this.clamp(frame.overallConfidence);
    const issues = definition.map((rule) => { const metric = metrics.find((item) => item.name === rule.name)!; if (metric.error < 0.08) return null; return { key: rule.name, severity: metric.error >= 0.35 ? ('critical' as const) : metric.error >= 0.18 ? ('warning' as const) : ('info' as const), cue: rule.cue(metric.value) }; }).filter((value): value is NonNullable<typeof value> => Boolean(value)).sort((a,b)=>{const rank=(s:string)=>s==='critical'?0:s==='warning'?1:2;return rank(a.severity)-rank(b.severity);});
    return { poseId, score: Number(score.toFixed(3)), confidence: Number(this.clamp(frame.overallConfidence).toFixed(3)), issues: issues.slice(0, 3), stable: metrics.length > 0 && metrics.every((metric) => metric.error < 0.15), metrics, analyzedAt: Date.now() };
  }
  private readonly definitions: Record<string, Array<{ name: string; min?: number; max?: number; measure: (landmarks: Record<string, BodyLandmark>) => number; error: (value: number) => number; cue: (value: number) => string }>> = {
    mountain: [this.rangeRule('shoulder_level', 0.03, 0.18, (p) => Math.abs((p.leftShoulder?.y ?? 0) - (p.rightShoulder?.y ?? 0)), () => 'Keep both shoulders level.')],
    warrior_ii: [this.rangeRule('front_knee_angle', 75, 115, (p) => this.angle(p.hip, p.knee, p.ankle), (v) => v > 115 ? 'Bend the front knee a little more.' : 'Straighten the front knee slightly.')],
    plank: [this.rangeRule('body_line', 160, 175, (p) => this.angle(p.shoulder, p.hip, p.ankle), (v) => v < 160 ? 'Lift the hips slightly.' : 'Lower the hips slightly.')],
    downward_dog: [this.rangeRule('hip_angle', 70, 125, (p) => this.angle(p.shoulder, p.hip, p.knee), (v) => v < 70 ? 'Lift the hips and lengthen the spine.' : 'Soften the bend and lengthen your back.')],
  };
  private rangeRule(name: string, min: number, max: number, measure: (landmarks: Record<string, BodyLandmark>) => number, cue: (value: number) => string) { return { name, min, max, measure, error: (value: number) => value < min ? (min - value) / Math.max(Math.abs(min), 1) : value > max ? (value - max) / Math.max(Math.abs(max), 1) : 0, cue }; }
  private angle(a?: BodyLandmark, b?: BodyLandmark, c?: BodyLandmark): number { if (!a || !b || !c) return 180; const abx = a.x - b.x; const aby = a.y - b.y; const cbx = c.x - b.x; const cby = c.y - b.y; const dot = abx * cbx + aby * cby; const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby); if (!mag) return 180; return (Math.acos(this.clamp(dot / mag, -1, 1)) * 180) / Math.PI; }
  private clamp(value: number, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
}
