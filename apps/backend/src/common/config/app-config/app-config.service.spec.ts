import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  it('allows development defaults for local/test convenience', () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'NODE_ENV') return 'development';
        return fallback;
      }),
    };
    const service = new AppConfigService(config as any);

    expect(service.jwtAccessSecret).toBe('development-access-secret');
    expect(service.jwtRefreshSecret).toBe('development-refresh-secret');
  });

  it('never falls back to development JWT secrets in production', () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'NODE_ENV') return 'production';
        return fallback;
      }),
    };
    const service = new AppConfigService(config as any);

    expect(() => service.jwtAccessSecret).toThrow('JWT_ACCESS_SECRET must be configured');
    expect(() => service.jwtRefreshSecret).toThrow('JWT_REFRESH_SECRET must be configured');
  });

  it('uses explicitly configured production secrets', () => {
    const config = {
      get: jest.fn((key: string, fallback?: unknown) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret-from-env';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-from-env';
        return fallback;
      }),
    };
    const service = new AppConfigService(config as any);

    expect(service.jwtAccessSecret).toBe('access-secret-from-env');
    expect(service.jwtRefreshSecret).toBe('refresh-secret-from-env');
  });
});
