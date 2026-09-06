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

  async findByRefreshToken(refreshToken: string) {
    return this.prisma.session.findFirst({
      where: {
        refreshToken,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async consumeRefreshToken(refreshToken: string): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        refreshToken,
        expiresAt: { gt: new Date() },
      },
    });
    return result.count;
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