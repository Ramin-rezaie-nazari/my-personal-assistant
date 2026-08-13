import { ProactiveDecisionQualityService } from './proactive-decision-quality.service';

describe('ProactiveDecisionQualityService', () => {
  const service = new ProactiveDecisionQualityService();

  it('allows high-value proactive interventions', () => {
    const result = service.evaluate({
      relevance: 0.95,
      urgency: 0.90,
      userBenefit: 0.95,
      interruptionCost: 0.15,
    });

    expect(result.shouldNotify).toBe(true);
    expect(result.score).toBeGreaterThan(0.8);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('suppresses low-value interruptions', () => {
    const result = service.evaluate({
      relevance: 0.30,
      urgency: 0.10,
      userBenefit: 0.25,
      interruptionCost: 0.90,
    });

    expect(result.shouldNotify).toBe(false);
  });

  it('penalizes duplicate and frequently snoozed signals', () => {
    const result = service.evaluate({
      relevance: 0.85,
      urgency: 0.70,
      userBenefit: 0.90,
      interruptionCost: 0.20,
      duplicatePenalty: 0.90,
      snoozeRate: 0.95,
    });

    expect(result.confidence).toBeLessThan(0.75);
  });
});
