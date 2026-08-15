# Price Intelligence

## هدف
قیمت اقلام غذایی از چند منبع ایرانی به‌صورت روزانه جمع‌آوری می‌شود، همه قیمت‌ها به تومان استاندارد می‌شوند، تاریخچه حذف نمی‌شود و اپ می‌تواند کمترین/بیشترین/میانگین و روند قیمت را نمایش دهد.

## زمان‌بندی
- پیش‌فرض: هر روز ساعت 03:30 به وقت `Asia/Tehran`.
- `PRICE_SCHEDULER_ENABLED=false` برای خاموش کردن job.
- `PRICE_SCHEDULER_TIMEZONE`، `PRICE_SCHEDULER_HOUR` و `PRICE_SCHEDULER_MINUTE` قابل تنظیم‌اند.
- اجرای همزمان چند instance با unique key روی `PriceCollectionRun` کنترل می‌شود.
- اجرای ناموفق با retry و ثبت وضعیت sourceها همراه است.

## منابع اولیه
- اُکالا
- اسنپ‌مارکت
- دیجی‌کالا
- دیجی‌شهروند
- دیجی‌کالا جت
- پینکت
- فی‌نما
- ترب و ایمالز به‌عنوان منابع تکمیلی

URL جستجوی هر منبع با متغیر محیطی `PRICE_<SOURCE>_SEARCH_URL` قابل override است. این موضوع مهم است چون مسیر جستجو یا ساختار HTML فروشگاه‌ها ممکن است تغییر کند.

## استاندارد پول
تمام مقادیر داخلی `PriceSnapshot` با `currency=IRT` و واحد تومان ذخیره می‌شوند. اگر منبع مقدار را با `IRR` اعلام کند، قبل از ذخیره بر 10 تقسیم می‌شود؛ در ایران 1 تومان برابر 10 ریال است.

## تاریخچه و تحلیل
هر snapshot شامل منبع، محصول، قیمت، موجودی، URL و زمان مشاهده است. تاریخچه برای 7/30/90/365 روز از API قابل خواندن است و تحلیل شامل current، average، min/max، تغییر درصدی، trend و buy score است.

## API
- `GET /price-intelligence`
- `GET /price-intelligence/sources`
- `GET /price-intelligence/products/:productKey/history`
- `GET /price-intelligence/products/:productKey/analysis`
- `POST /price-intelligence/nightly/run`
- `POST /price-intelligence/nightly/preview`

## نکته عملیاتی
Adapter عمومی ابتدا JSON-LD و سپس الگوهای HTML قیمت را بررسی می‌کند. برای سایت‌هایی که rendering اختصاصی یا API اختصاصی دارند، adapter اختصاصی همان منبع باید جایگزین شود؛ هسته Price Intelligence نیازی به تغییر ندارد.
