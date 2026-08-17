import { Injectable } from '@nestjs/common';

export type LocalRuntimeTier = 'tiny' | 'light' | 'standard' | 'full';

export type LocalRuntimeProfile = {
  tier: LocalRuntimeTier;
  maxContextTokens: number;
  preferredModelClass: 'deterministic' | 'tiny-local' | 'small-local' | 'medium-local';
  allowVision: boolean;
  allowVoice: boolean;
};

export type DeviceRuntimeSignals = {
  totalMemoryMb?: number;
  availableMemoryMb?: number;
  cpuCores?: number;
  cpuArchitecture?: 'arm64' | 'armv7' | 'x64' | 'unknown';
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  batterySaver?: boolean;
  networkAvailable?: boolean;
};

@Injectable()
export class DeviceAwareLocalRuntimeService {
  profile(signals: DeviceRuntimeSignals = {}): LocalRuntimeProfile {
    const memory = signals.totalMemoryMb ?? 4096;
    const cores = signals.cpuCores ?? 4;
    const thermal = signals.thermalState ?? 'nominal';
    const batterySaver = signals.batterySaver ?? false;

    if (
      memory <= 2048 ||
      cores <= 2 ||
      thermal === 'critical' ||
      (memory <= 3072 && batterySaver)
    ) {
      return {
        tier: 'tiny',
        maxContextTokens: 768,
        preferredModelClass: 'deterministic',
        allowVision: false,
        allowVoice: false,
      };
    }

    if (
      memory <= 4096 ||
      cores <= 4 ||
      thermal === 'serious' ||
      batterySaver
    ) {
      return {
        tier: 'light',
        maxContextTokens: 1536,
        preferredModelClass: 'tiny-local',
        allowVision: false,
        allowVoice: true,
      };
    }

    if (memory <= 6144 || cores <= 6 || thermal === 'fair') {
      return {
        tier: 'standard',
        maxContextTokens: 3072,
        preferredModelClass: 'small-local',
        allowVision: true,
        allowVoice: true,
      };
    }

    return {
      tier: 'full',
      maxContextTokens: 6144,
      preferredModelClass: 'medium-local',
      allowVision: true,
      allowVoice: true,
    };
  }
}
