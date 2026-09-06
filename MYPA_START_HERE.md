# MYPA — START HERE

> **اولین فایل برای ادامه‌ی هر جلسه‌ی توسعه**
>
> این فایل عمداً کوتاه و operational است. برای جزئیات کامل، به Current State و Brain Book برو.

## 1. اول از همه این فایل‌ها را بخوان

```text
MYPA_START_HERE.md                         ← همین فایل؛ نقطه شروع هر جلسه
apps/backend/docs/05_CURRENT_STATE.md     ← وضعیت واقعی، درصد، blockers، آخرین کارها
apps/backend/docs/03_PROJECT_BRAIN_BOOK.md ← حافظه مهندسی و تصمیم‌های معماری/محصول
apps/backend/docs/04_ARCHITECTURE_ATLAS.md ← نقشه ارتباط فایل‌ها، ماژول‌ها و data flow
apps/backend/docs/06_VALIDATION_LEDGER.md ← فقط evidence واقعی تست/validation
apps/backend/docs/08_AUTONOMOUS_PROGRESS_LOG.md ← تاریخچه جلسه‌به‌جلسه پیشرفت
.agents/MYPA_AUTONOMOUS_TASK_QUEUE.md     ← صف کارهای بعدی
AGENTS.md                                  ← قوانین اجباری کار روی repo
```

## 2. قانون طلایی

**هیچ‌وقت از روی حافظه‌ی جلسه یا حدس ادامه نده.**

ترتیب بررسی:

```text
START_HERE
   ↓
CURRENT_STATE
   ↓
BRAIN_BOOK + ARCHITECTURE_ATLAS
   ↓
ACTUAL CODE / SCHEMA / MIGRATIONS
   ↓
TEST / CI / DEVICE EVIDENCE
   ↓
IMPLEMENT
   ↓
VALIDATE
   ↓
DOCUMENT
   ↓
NEXT ITEM
```

## 3. برای اینکه «یادمان نرود» کجا بنویسیم

هر milestone واقعی باید در این چهار لایه ثبت شود:

1. `05_CURRENT_STATE.md` → الان پروژه دقیقاً کجاست؟ چه چیزی green است و چه چیزی pending؟
2. `03_PROJECT_BRAIN_BOOK.md` → چه کاری انجام شد و چرا این تصمیم معماری گرفته شد؟
3. `04_ARCHITECTURE_ATLAS.md` → کدام فایل/ماژول/رابطه تغییر کرد و اتصال آن چیست؟
4. `06_VALIDATION_LEDGER.md` → دقیقاً چه چیزی واقعاً اجرا و validate شد؟

برای تاریخچه‌ی session-by-session نیز:

`08_AUTONOMOUS_PROGRESS_LOG.md`

## 4. قانون Evidence

```text
Code exists      ≠ feature complete
Test file exists ≠ test passed
CI started       ≠ CI green
Debug APK built  ≠ release ready
Architecture OK  ≠ device validated
```

هر وضعیت باید با evidence واقعی برچسب بخورد:

```text
GREEN   = واقعاً اجرا/بررسی و موفق شده
YELLOW  = پیاده‌سازی شده ولی validation کامل نیست
RED     = blocker/failure واقعی وجود دارد
PENDING = هنوز بررسی نشده
```

## 5. قوانین کار مستقل

- روی branch کاری `agent/mypa-autonomous-control-plane` ادامه بده، نه `main`.
- هیچ test یا assertion را برای سبز شدن حذف/ضعیف نکن.
- مشکل را تا حد ممکن تا root cause دنبال کن و وسط کار متوقف نشو.
- تغییرات architecture / database / security / native را قبل از implementation دو بار review کن.
- هیچ secret یا credential را در log یا documentation ننویس.
- کارهای device-only را تا زمان اجرای واقعی، unverified نگه دار.
- بعد از هر milestone، documentation را همان موقع update کن.

## 6. آخرین snapshot

برای آخرین وضعیت پروژه **به `apps/backend/docs/05_CURRENT_STATE.md` اعتماد کن، نه این فایل**.

این فایل فقط navigator است تا سریع بدانیم از کجا باید شروع کنیم.
