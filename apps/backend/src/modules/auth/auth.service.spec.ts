import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh token rotation', () => {
  function createService(overrides: Partial<Record<string, any>> = {}) {
    const usersService = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
      }),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const sessionService = {
      consumeRefreshToken: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue({}),
      revokeSession: jest.fn(),
      ...overrides,
    };
    const jwtService = {
      verify: jest.fn().mockReturnValue({ sub: 'user-1', type: 'refresh' }),
      sign: jest.fn().mockReturnValue('token'),
    };
    const appConfigService = {
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessSecret: 'test-access-secret',
    };
    const service = new AuthService(usersService as any, sessionService as any, jwtService as any, appConfigService as any);
    return { service, usersService, sessionService, jwtService };
  }

  it('consumes the existing refresh session before issuing a new token pair', async () => {
    const { service, sessionService, usersService } = createService();
    const result = await service.refreshToken({ refreshToken: 'old-refresh-token' });

    expect(sessionService.consumeRefreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(sessionService.create).toHaveBeenCalledTimes(1);
    expect(result.user.id).toBe('user-1');
  });

  it('rejects a refresh token that cannot consume exactly one live session', async () => {
    const { service, usersService } = createService({ consumeRefreshToken: jest.fn().mockResolvedValue(0) });

    await expect(service.refreshToken({ refreshToken: 'expired-or-reused' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });
});
