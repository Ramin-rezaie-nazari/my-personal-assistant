import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

function hashRefreshToken(refreshToken: string) {
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
        userId: data.userId,
        refreshTokenHash: hashRefreshToken(data.refreshToken),
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByRefreshToken(refreshToken: string, now = new Date()) {
    return this.prisma.session.findFirst({
      where: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: { gt: now },
      },
    });
  }

  async rotate(
    currentRefreshToken: string,
    data: {
      userId: string;
      refreshToken: string;
      expiresAt: Date;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.session.deleteMany({
        where: {
          refreshTokenHash: hashRefreshToken(currentRefreshToken),
          userId: data.userId,
        },
      });

      if (deleted.count !== 1) {
        return null;
      }

      return tx.session.create({
        data: {
          userId: data.userId,
          refreshTokenHash: hashRefreshToken(data.refreshToken),
          expiresAt: data.expiresAt,
        },
      });
    });
  }

  async deleteByRefreshToken(refreshToken: string) {
    return this.prisma.session.deleteMany({
      where: {
        refreshTokenHash: hashRefreshToken(refreshToken),
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
    return this.prisma.session.deleteMany({
      where: {
        refreshTokenHash: hashRefreshToken(refreshToken),
      },
    });
  }
}
