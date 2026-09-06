import { ExecutionContext, TooManyRequestsException } from '@nestjs/common';
import { RequestRateLimitGuard } from './request-rate-limit.guard';

describe('RequestRateLimitGuard', () => {
  const contextFor = (method: string, path: string, ip = '10.0.0.1') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          path,
          ip,
          socket: { remoteAddress: ip },
          headers: {},
        }),
      }),
    }) as unknown as ExecutionContext;

  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  it('applies a tight login limit', () => {
    process.env.NODE_ENV = 'development';
    const guard = new RequestRateLimitGuard();

    for (let i = 0; i < 8; i += 1) {
      expect(guard.canActivate(contextFor('POST', '/auth/login'))).toBe(true);
    }

    expect(() => guard.canActivate(contextFor('POST', '/auth/login'))).toThrow(
      TooManyRequestsException,
    );
  });

  it('keeps different client IPs isolated', () => {
    process.env.NODE_ENV = 'development';
    const guard = new RequestRateLimitGuard();

    for (let i = 0; i < 8; i += 1) {
      expect(guard.canActivate(contextFor('POST', '/auth/login', '10.0.0.1'))).toBe(true);
    }

    expect(guard.canActivate(contextFor('POST', '/auth/login', '10.0.0.2'))).toBe(true);
  });

  it('does not throttle test runs', () => {
    process.env.NODE_ENV = 'test';
    const guard = new RequestRateLimitGuard();

    for (let i = 0; i < 20; i += 1) {
      expect(guard.canActivate(contextFor('POST', '/auth/login'))).toBe(true);
    }
  });
});
