import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
  }) {
    return this.prisma.session.create({
      data,
    });
  }

  async findByRefreshToken(refreshToken: string, now = new Date()) {
    return this.prisma.session.findFirst({
      where: {
        refreshToken,
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
          refreshToken: currentRefreshToken,
          userId: data.userId,
        },
      });

      if (deleted.count !== 1) {
        return null;
      }

      return tx.session.create({ data });
    });
  }

  async deleteByRefreshToken(refreshToken: string) {
    return this.prisma.session.deleteMany({
      where: {
        refreshToken,
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
        refreshToken,
      },
    });
  }
}
