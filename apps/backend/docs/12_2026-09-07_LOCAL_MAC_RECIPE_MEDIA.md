# MYPA Local Mac Recipe Media Corpus

## هدف

تا قبل از Production، Recipe media باید روی دیسک محلی Mac آماده باشد و Supabase فقط به‌عنوان **منبع خواندنی** برای mirror اولیه استفاده شود. این pipeline هیچ داده‌ای در Supabase ایجاد، update یا delete نمی‌کند.

## خروجی

Root پیش‌فرض:

```text
data/mypa-recipe-media/
├── recipe-catalog.jsonl
├── images/
│   └── recipes/<recipeId>/hero.webp
├── manifests/recipe-hero-manifest.jsonl
├── manifests/summary.json
└── logs/failures.jsonl
```

هر Recipe دقیقاً یک مسیر canonical محلی دارد:

```text
images/recipes/<recipeId>/hero.webp
```

فایل نهایی WebP و حداکثر 60KB است. هر رکورد manifest شامل recipe id/name، منبع، URL، query، result position، اندازه، ابعاد و SHA-256 است تا provenance و retryability حفظ شود.

## رفتار pipeline

1. فهرست کامل Recipeها از جدول `recipes` فقط read می‌شود.
2. Hero relationهای موجود از `recipe_images` فقط read می‌شوند.
3. Heroهای موجود روی Supabase از URL فعلی به Mac mirror می‌شوند و در صورت نیاز با Sharp به WebP <=60KB تبدیل می‌شوند.
4. Recipeهای بدون Hero روی Google Images، جداگانه و با query به شکل `<recipe name> recipe` جست‌وجو می‌شوند.
5. Candidateها به‌ترتیب بررسی می‌شوند و **اولین تصویر قابل دانلود و معتبر** انتخاب می‌شود؛ تصاویر خراب، خیلی کوچک یا با نسبت غیرمنطقی رد می‌شوند.
6. خطاها در manifest و `logs/failures.jsonl` ثبت می‌شوند تا اجرای بعدی فقط موارد لازم را retry کند.
7. هیچ write به Supabase انجام نمی‌شود؛ حتی `recipe_images` و Storage هم دست‌نخورده می‌مانند.

## اجرای Mac

از ریشه repository:

```bash
cd apps/backend
pnpm install --frozen-lockfile
```

فایل `apps/backend/.env.local` را روی Mac بساز (این فایل در Git ignore است):

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_LOCAL_ONLY_SERVICE_ROLE_KEY
```

سپس اجرای کامل:

```bash
pnpm recipe-images:local-mac
```

برای شروع امن و آزمایشی:

```bash
RECIPE_LOCAL_CATALOG_ONLY=1 pnpm recipe-images:local-mac
RECIPE_LOCAL_LIMIT=20 pnpm recipe-images:local-mac
```

کنترل‌ها:

```text
RECIPE_LOCAL_LIMIT=0              # همه
RECIPE_LOCAL_START=0              # offset در catalog
RECIPE_LOCAL_CONCURRENCY=2        # 1..4
RECIPE_LOCAL_DELAY_MS=2500        # حداقل 500ms
RECIPE_LOCAL_RETRY_FAILED=1       # retry در اجراهای بعدی
RECIPE_LOCAL_FORCE=0              # overwrite محلی
RECIPE_LOCAL_MIRROR_EXISTING=1    # mirror heroهای موجود
RECIPE_LOCAL_GOOGLE_MISSING=1     # Google برای بدون hero
RECIPE_LOCAL_ROOT=./data/mypa-recipe-media
```

## معیار تکمیل

اجرای کامل فقط زمانی complete محسوب می‌شود که:

```text
totalRecipes == localHeroFiles == recipesWithSuccessfulManifest
failed == 0
```

در غیر این صورت `summary.json` و `failures.jsonl` باید بررسی و retry شوند. Pipeline عمداً exit code غیرصفر می‌دهد اگر شکست باقی مانده باشد.

## نکته مهم درباره Production

این corpus عمداً وارد Git، Supabase Storage یا Supabase tables نمی‌شود. بعد از آماده شدن محصول، همین layout می‌تواند به Storage/VPS production منتقل شود و manifest به‌عنوان کنترل migration و integrity استفاده شود.
