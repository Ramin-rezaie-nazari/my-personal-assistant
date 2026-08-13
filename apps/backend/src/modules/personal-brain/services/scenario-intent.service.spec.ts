import { ScenarioIntentService } from './scenario-intent.service';

describe('ScenarioIntentService', () => {
  const service = new ScenarioIntentService();

  it('detects Persian what-if questions', () => {
    expect(service.detect('اگه امروز ورزش کنم بهتره یا فردا؟').enabled).toBe(true);
  });

  it('detects English comparison questions', () => {
    expect(service.detect('Which is better for my goal?').enabled).toBe(true);
  });

  it('does not route normal requests to scenario planning', () => {
    expect(service.detect('امروز چقدر آب خوردم؟').enabled).toBe(false);
  });
});
