import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('constructs the database client from DATABASE_URL', () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/personal_assistant?schema=public';

    const service = new PrismaService();

    expect(service).toBeDefined();
    expect(typeof service.$connect).toBe('function');
    expect(typeof service.$disconnect).toBe('function');

    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });
});
