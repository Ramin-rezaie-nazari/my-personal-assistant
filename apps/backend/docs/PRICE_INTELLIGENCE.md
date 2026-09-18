# Price Intelligence

## هدف

MYPA قیمت‌های غذایی را به‌صورت source-native جمع‌آوری می‌کند، برای هر مشاهده کشور و ارز منبع را نگه می‌دارد، تاریخچه را حفظ می‌کند و تحلیل را فقط در یک market/currency context انجام می‌دهد.

## منابع

### منابع عمومی جهانی

- Open Prices (Open Food Facts) — API عمومی read-only برای داده‌های crowdsourced قیمت محصولات؛ پوشش کشورها و محصولات متغیر است.
- FAO FPMA — API عمومی قیمت‌های داخلی مواد غذایی پایه و سری‌های market/commodity؛ عمدتاً داده‌های روزانه/هفتگی/ماهانه بسته به سری و انتشار رسمی FAO.

این دو منبع به‌صورت global در registry هستند و در جمع‌آوری روزانه قابل استفاده‌اند. برای هر مشاهده، countryCode، currency، sourceId و زمان مشاهده ذخیره می‌شود.

### منابع کشور-محور فعلی

منابع retailer/marketplace ایران شامل اُکالا، اسنپ‌مارکت، دیجی‌کالا، دیجی‌شهروند، دیجی‌کالا جت، پینکت، فی‌نما، ترب و ایمالز هستند.

## زمان‌بندی

- اجرای خودکار پیش‌فرض: هر روز ساعت 03:30 به وقت Asia/Tehran.
- PRICE_SCHEDULER_ENABLED=false برای خاموش کردن job.
- PRICE_SCHEDULER_TIMEZONE، PRICE_SCHEDULER_HOUR و PRICE_SCHEDULER_MINUTE قابل تنظیم‌اند.
- یک sweep خودکار به همه sourceهای فعال انجام می‌شود؛ sourceهای global همه بازارهای قابل‌دریافت را می‌خوانند و sourceهای country-scoped فقط بازارهای تعریف‌شده خودشان را پوشش می‌دهند.
- اجرای همزمان چند instance با unique key روی PriceCollectionRun کنترل می‌شود.
- خطاها با retry و ثبت failed sourceها مدیریت می‌شوند.

## استاندارد پول

قیمت خام به ارز منبع ذخیره می‌شود. برای ایران، IRR در adapter فعلی به IRT تبدیل می‌شود چون تجربه کاربری ایران با تومان نمایش داده می‌شود؛ برای سایر کشورها ارز منبع دست‌نخورده می‌ماند.

تبدیل ارز برای مقایسه باید در لایه FX انجام شود و نباید مقدار خام source را overwrite کند.

## تشخیص محصول

برای sourceهای retailer/marketplace، parser عمومی JSON-LD/HTML را امتحان می‌کند. Sourceهای global شناسه خارجی خود (sourceRecordId) را حفظ می‌کنند تا ingest تکراری کنترل شود.

## محدودیت پوشش

«195 کشور» در MYPA به معنی پشتیبانی از country/currency context است، نه تضمین اینکه برای هر 195 کشور در هر روز و برای تک‌تک SKUهای فروشگاهی، قیمت واقعی و تازه وجود داشته باشد. داده‌های public sourceها بر اساس آنچه منبع واقعاً منتشر می‌کند وارد می‌شوند؛ کشور یا محصول بدون داده باید به‌صورت no data / stale / partial گزارش شود و نباید قیمت تخمینی به‌عنوان قیمت واقعی ثبت شود.

## API

- GET /price-intelligence
- GET /price-intelligence/sources
- GET /price-intelligence/schedule
- GET /price-intelligence/products/:productKey/history
- GET /price-intelligence/products/:productKey/analysis
- POST /price-intelligence/nightly/run
- POST /price-intelligence/nightly/preview
- GET /price-intelligence/registry

برای endpointهای price می‌توان countryCode را به‌عنوان فیلتر market ارسال کرد.

## عملیات

برای sourceهای جهانی تنظیم‌های محیطی زیر در دسترس‌اند:

- OPEN_PRICES_API_URL
- OPEN_PRICES_MAX_PAGES
- OPEN_PRICES_MAX_AGE_DAYS
- OPEN_PRICES_TIMEOUT_MS
- FPMA_SERIES_PAGE_SIZE
- FPMA_TIMEOUT_MS

قبل از ادعای پوشش کامل global، باید fresh live-source validation و coverage reporting اجرا شود. اجرای موفق تست‌های کد به‌تنهایی ثابت نمی‌کند که هر کشور داده تازه دارد.