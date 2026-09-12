import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './common/config/app-config/app-config.service';

const AUTH_RATE_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT = 10;
const authAttempts = new Map<string, { count: number; resetAt: number }>();

function securityAndRateLimitMiddleware(req: any, res: any, next: () => void) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const path = String(req.path ?? req.url ?? '');
  const authLimited = req.method === 'POST' && /^\/auth\/(login|register|refresh)$/.test(path);
  if (!authLimited) return next();
  const key = `${req.ip ?? req.headers?.['x-forwarded-for'] ?? 'unknown'}:${path}`;
  const now = Date.now();
  const existing = authAttempts.get(key);
  if (!existing || existing.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_RATE_WINDOW_MS });
    return next();
  }
  if (existing.count >= AUTH_RATE_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ statusCode: 429, message: 'Too many authentication attempts. Please retry later.' });
    return;
  }
  existing.count += 1;
  return next();
}

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.use(securityAndRateLimitMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  return app;
}

export async function bootstrap() {
  const app = await createApp();
  const configService = app.get(AppConfigService);
  await app.listen(configService.port);
  return app;
}
