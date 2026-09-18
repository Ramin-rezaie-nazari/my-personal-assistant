# MYPA Local Development

MYPA development and data storage are self-hosted/local-first.

## Error-only local validation

Run the complete local verification from the repository root:

```bash
pnpm local:verify-errors
```

Successful checks produce no command output. Only failed steps and matching error lines are printed; the process exits with code 1 if any step fails.

## Database

Start the local PostgreSQL container:

```bash
docker compose -f docker-compose.local.yml up -d postgres
```

The canonical local development connection is:

`postgresql://postgres:postgres@localhost:5432/my_personal_assistant`

Then:

```bash
cp apps/backend/.env.example apps/backend/.env
cd apps/backend
pnpm prisma generate
pnpm prisma migrate deploy
pnpm start:dev
```

## Daily global prices

The laptop, not Supabase or GitHub, owns the daily price refresh during development.

One-shot collection:

```bash
cd apps/backend
pnpm price-intelligence:global-daily
```

Continuous laptop-local scheduler:

```bash
cd apps/backend
pnpm price-intelligence:daily-daemon
```

Defaults:
- daily run at 03:30 in the laptop's local timezone;
- set `LOCAL_PRICE_DAILY_HOUR` and `LOCAL_PRICE_DAILY_MINUTE` to change it;
- set `LOCAL_PRICE_RUN_IMMEDIATELY=true` to collect once at process start before waiting for the next scheduled time.

The laptop must be running and the scheduler process must remain alive for scheduled collection. The scheduler is restart-safe: if it starts after the local scheduled window was missed, the catch-up policy can execute the missed daily run rather than waiting for the next calendar day. An OS-level Task Scheduler / launchd / cron can start the same one-shot command when the machine wakes or boots.

## Native Android development

Native Android verification is local-first. From the repository root, the canonical local path is:

```bash
cd apps/mobile
pnpm typecheck
pnpm exec expo prebuild --platform android
cd android
./gradlew assembleRelease --no-daemon
```

The release APK is produced under apps/mobile/android/app/build/outputs/apk/release/app-release.apk. Cloud EAS preview builds are not part of the current development architecture.

## Release architecture

VPS deployment is a later release-stage concern. The application database remains standard PostgreSQL and the application does not depend on Supabase-specific APIs or services.

CI may use ephemeral PostgreSQL supplied by the CI runner for automated validation. That is test infrastructure, not application infrastructure.
