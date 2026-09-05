# MYPA local development stack

This project is developed and validated locally first. Supabase is not a development or release prerequisite.

## Local PostgreSQL

From the repository root:

```bash
docker compose -f infra/local/docker-compose.yml up -d
```

The local database is persisted in a Docker volume named `mypa-postgres-data`.

Use this development connection string in `apps/backend/.env`:

```env
DATABASE_URL=postgresql://mypa:mypa-local-only@localhost:5432/mypa
```

Do not commit real production credentials.

## Apply Prisma migrations

```bash
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma generate
```

For a disposable development database where migration history is being actively edited, use `pnpm prisma migrate dev` instead.

## Run the backend

```bash
cd apps/backend
pnpm start:dev
```

## Fitness corpus

The fitness importer writes directly through Prisma to the database configured by `DATABASE_URL`.

```bash
cd apps/backend
pnpm fitness:content:import
pnpm fitness:content:audit
pnpm fitness:content:verify-media
```

The production-quality content gate is not considered complete until all three commands pass against the local database:

- 500 published movements per discipline.
- 10 usable difficulty levels.
- 4 distinct approved WebP assets per published movement.
- Provenance/license/attribution metadata present.

## Important boundary

The local database is the source of truth for current development. A production VPS/database will be selected later as part of release deployment. Supabase-specific runtime work must not be introduced merely to unblock local development.
