# MYPA Backend

NestJS + Prisma backend for **My Personal Assistant**.

## Setup

From the repository root:

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
```

Set a real `DATABASE_URL` and unique development JWT secrets in `apps/backend/.env`.

Generate Prisma Client and apply the migration history:

```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate deploy
```

## Development

```bash
pnpm start:dev
```

Production start:

```bash
pnpm build
pnpm start:prod
```

## Validation

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
```

The project uses the committed Prisma migration history as the database contract. Do not replace migration validation with `prisma db push` for release verification.

## Operational scripts

Recipe/image/intelligence operations are exposed through the scripts in `apps/backend/package.json`, including recipe content import/audit, recipe image import/reprocessing and recipe intelligence stages. Review the corresponding script source before running destructive or large-batch operations.

## Project Brain

The repository-level engineering record is under `docs/project-brain/`. The root `docs/05_CURRENT_STATE.md` is the canonical current-state record for audit work. The Audit Findings Appendix is `docs/project-brain/15_AUDIT_FINDINGS_APPENDIX.md`.
