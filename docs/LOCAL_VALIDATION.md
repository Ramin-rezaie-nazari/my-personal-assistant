# MYPA Local Validation

این سند مسیر اجرای validation واقعی پروژه در VS Code است. نتیجه‌ی این فرمان‌ها باید در `apps/backend/docs/06_VALIDATION_LEDGER.md` به‌عنوان evidence ثبت شود؛ وجود test file به‌تنهایی green محسوب نمی‌شود.

## Prerequisites

از ریشه‌ی repository:

```bash
pnpm install --frozen-lockfile
```

برای backend باید PostgreSQL محلی پروژه طبق `infra/local/docker-compose.yml` بالا باشد و متغیرهای محیطی backend تنظیم شده باشند.

## Fast validation

```bash
pnpm validate
```

این فرمان به‌ترتیب backend typecheck، backend build، کل Jest backend، mobile typecheck، route audit و surface audit را اجرا می‌کند.

## Backend full validation

```bash
pnpm validate:backend:full
```

این مسیر علاوه بر typecheck/build/Jest، دیتابیس E2E را آماده می‌کند و suiteهای E2E را اجرا می‌کند.

## Focused security/auth validation

```bash
pnpm --filter backend test -- auth.service.spec.ts session.service.spec.ts users.service.spec.ts
```

این suiteها rotation/replay refresh token، fingerprint storage/legacy compatibility و persistence onboarding را بررسی می‌کنند.

## Recommendation validation

```bash
pnpm --filter backend test -- recommendation
pnpm --filter backend test:e2e -- recommendation
```

در صورت تغییر نام فایل‌های suite، از `jest --listTests` برای پیدا کردن نام دقیق استفاده کن.

## Mobile validation

```bash
pnpm validate:mobile
```

برای build/اجرای واقعی Android:

```bash
pnpm --filter @my-personal-assistant/mobile expo prebuild --platform android --clean
pnpm --filter @my-personal-assistant/mobile expo run:android
```

اجرای واقعی دستگاه و بررسی دوربین، میکروفون، Voice/TTS و Yoga pose analysis باید به‌عنوان device evidence جدا ثبت شود.

## Release evidence rule

- `PASS` فقط برای فرمانی که واقعاً اجرا و با exit code موفق تمام شده است.
- `PENDING` برای تست یا device gateای که اجرا نشده است.
- `RED` برای failure واقعی که هنوز رفع نشده است.
- شکست GitHub Actions به‌تنهایی اثبات شکست code نیست، اما موفقیت یک CI smoke test هم اثبات آمادگی release نیست.
