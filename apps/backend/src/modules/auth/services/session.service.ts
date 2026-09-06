import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

function fingerprintRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken, 'utf8').digest('hex');
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({
      data: {
        ...data,
        // Refresh tokens are bearer credentials. Keep only a one-way
        // fingerprint at rest; the raw token is returned to the client.
        refreshToken: fingerprintRefreshToken(data.refreshToken),
      },
    });
  }

  async findByRefreshToken(refreshToken: string) {
    const fingerprint = fingerprintRefreshToken(refreshToken);
    const sessions = await this.prisma.session.findMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: [
          { refreshToken: fingerprint },
          // Backward-compatible lookup for sessions created before token
          // fingerprinting was introduced. They are removed when consumed.
          { refreshToken },
        ],
      },
      take: 2,
    });

    return sessions[0] ?? null;
  }

  async consumeRefreshToken(refreshToken: string): Promise<number> {
    const fingerprint = fingerprintRefreshToken(refreshToken);
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: [
          { refreshToken: fingerprint },
          // Backward-compatible migration path for pre-hardening sessions.
          { refreshToken },
        ],
      },
    });
    return result.count;
  }

  async deleteByRefreshToken(refreshToken: string) {
    const fingerprint = fingerprintRefreshToken(refreshToken);
    return this.prisma.session.deleteMany({
      where: {
        OR: [{ refreshToken: fingerprint }, { refreshToken }],
      },
    });
  }

  async deleteAllForUser(userId: string) {
    return this.prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }

  async revokeSession(refreshToken: string) {
    const fingerprint = fingerprintRefreshToken(refreshToken);
    return this.prisma.session.deleteMany({
      where: {
        OR: [{ refreshToken: fingerprint }, { refreshToken }],
      },
    });
  }
}
