import { ExecutionContext } from '@nestjs/common';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  it('allows requests below the threshold', () => {
    const guard = new AuthRateLimitGuard();
    const context = createContext('10.0.0.1', '/auth/login');
    for (let i = 0; i < 10; i += 1) expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks the request after the threshold', () => {
    const guard = new AuthRateLimitGuard();
    const context = createContext('10.0.0.2', '/auth/login');
    for (let i = 0; i < 10; i += 1) guard.canActivate(context);
    expect(() => guard.canActivate(context)).toThrow('Too many authentication requests');
  });

  it('keeps different routes independently bucketed', () => {
    const guard = new AuthRateLimitGuard();
    const login = createContext('10.0.0.3', '/auth/login');
    const refresh = createContext('10.0.0.3', '/auth/refresh');
    for (let i = 0; i < 10; i += 1) guard.canActivate(login);
    expect(guard.canActivate(refresh)).toBe(true);
  });
});

function createContext(ip: string, path: string) {
  const request = { method: 'POST', baseUrl: '', path, ip, headers: {}, socket: {} };
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}
