# MYPA Backend

This directory contains the production backend for **My Personal Assistant (MYPA)**, built with NestJS, TypeScript and Prisma/PostgreSQL.

## Requirements

Use a Node.js version supported by the repository CI and install dependencies from the repository root with pnpm.

## Setup

From the repository root:

```bash
pnpm install
```

Create `apps/backend/.env` from `apps/backend/.env.example` and provide real local values for `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

Generate Prisma Client and apply migrations:

```bash
pnpm --dir apps/backend exec prisma generate
pnpm --dir apps/backend exec prisma migrate deploy
```

For local development, ensure PostgreSQL is running and `DATABASE_URL` points at the intended database.

## Run

```bash
pnpm --dir apps/backend start:dev
```

Production uses the compiled application:

```bash
pnpm --dir apps/backend build
pnpm --dir apps/backend start:prod
```

## Validation

Backend CI and local validation commands include:

```bash
pnpm --dir apps/backend typecheck
pnpm --dir apps/backend test:ci
pnpm --dir apps/backend test:e2e
pnpm --dir apps/backend lint
```

The repository's CI migration path is authoritative for database compatibility. Avoid replacing migrations with `prisma db push` for CI/production validation.

## Operational recipe/intelligence scripts

The backend package exposes the maintained operational entrypoints for recipe content, images, nutrition and intelligence. Run them only against an intentionally selected environment and review the script documentation before destructive/reset operations.

Examples:

```bash
pnpm --dir apps/backend recipe:content:import
pnpm --dir apps/backend recipe:content:audit
pnpm --dir apps/backend recipe-images:import
pnpm --dir apps/backend recipe-intelligence:country
pnpm --dir apps/backend recipe-intelligence:nutrition
pnpm --dir apps/backend recipe-intelligence:score
```

## Project documentation

The canonical architecture, database, API, testing and security contracts live under `docs/project-brain/`. Changes to backend architecture or data contracts should be reconciled there before release.
