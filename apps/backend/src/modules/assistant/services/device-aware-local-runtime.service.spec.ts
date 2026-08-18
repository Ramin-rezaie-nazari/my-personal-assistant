import { DeviceAwareLocalRuntimeService } from './device-aware-local-runtime.service';

describe('DeviceAwareLocalRuntimeService', () => {
  const service = new DeviceAwareLocalRuntimeService();

  it('keeps very weak devices deterministic and memory-light', () => {
    expect(
      service.profile({ totalMemoryMb: 2048, cpuCores: 2 }),
    ).toEqual({
      tier: 'tiny',
      maxContextTokens: 768,
      preferredModelClass: 'deterministic',
      allowVision: false,
      allowVoice: false,
    });
  });

  it('uses a tiny local model tier for light devices', () => {
    expect(
      service.profile({ totalMemoryMb: 4096, cpuCores: 4 }),
    ).toMatchObject({
      tier: 'light',
      preferredModelClass: 'tiny-local',
      allowVision: false,
    });
  });

  it('uses small local models and enables richer modalities on standard devices', () => {
    expect(
      service.profile({ totalMemoryMb: 6144, cpuCores: 6 }),
    ).toMatchObject({
      tier: 'standard',
      preferredModelClass: 'small-local',
      allowVision: true,
      allowVoice: true,
    });
  });

  it('backs off under thermal or battery pressure', () => {
    expect(
      service.profile({ totalMemoryMb: 8192, cpuCores: 8, thermalState: 'critical' }),
    ).toMatchObject({ tier: 'tiny' });
    expect(
      service.profile({ totalMemoryMb: 6144, cpuCores: 8, batterySaver: true }),
    ).toMatchObject({ tier: 'light' });
  });

  it('supports a full local tier on capable devices', () => {
    expect(
      service.profile({ totalMemoryMb: 12288, cpuCores: 8 }),
    ).toMatchObject({
      tier: 'full',
      maxContextTokens: 6144,
      preferredModelClass: 'medium-local',
      allowVision: true,
      allowVoice: true,
    });
  });
});
