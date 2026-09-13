import { createAccessToken, createRefreshToken } from './token.utils';

function decodePayload(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Expected JWT payload segment');
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
}

describe('token.utils', () => {
  const appConfig = {
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
    jwtAccessExpiresIn: '15m',
    jwtRefreshExpiresIn: '30d',
  } as never;

  const jwtService = {
    sign: jest.fn((_payload: Record<string, unknown>, options: { secret: string; expiresIn: string }) => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ ..._payload, exp: options.expiresIn })).toString('base64url');
      return `${header}.${payload}.signature`;
    }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('adds a unique jti to refresh tokens even when issued back-to-back', () => {
    const first = createRefreshToken(jwtService as never, appConfig, 'user-1');
    const second = createRefreshToken(jwtService as never, appConfig, 'user-1');

    const firstPayload = decodePayload(first);
    const secondPayload = decodePayload(second);

    expect(firstPayload.sub).toBe('user-1');
    expect(firstPayload.type).toBe('refresh');
    expect(typeof firstPayload.jti).toBe('string');
    expect(typeof secondPayload.jti).toBe('string');
    expect(firstPayload.jti).not.toBe(secondPayload.jti);
  });

  it('does not add jti to access tokens', () => {
    const token = createAccessToken(jwtService as never, appConfig, 'user-1');
    const payload = decodePayload(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.jti).toBeUndefined();
  });
});
