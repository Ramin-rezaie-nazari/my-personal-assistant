عنوان: feature(voice): تثبیت و ایمن‌سازی لایهٔ صوتی (TTS)

توضیح کوتاه:
این تغییرات برای جلوگیری از کرش اپ هنگام پخش بعضی فایل‌های صوتی و بهبود پایداری مدل محلی فارسی انجام شده‌اند. تغییرات کلیدی:

- افزودن timeout برای بررسی در دسترس بودن مدل محلی و محافظت در برابر race condition.
- کاهش تعداد thread مدل محلی برای کاهش فشار حافظه.
- بررسی اندازهٔ فایل صوتی تولیدی قبل از پخش (حد آستانه ۶ مگابایت).
- cleanup ایمن هنگام پخش (stop/unload) و جلوگیری از هم‌زمان اجرا شدن چند engine.
- fallback صریح به TTS سیستم یا speak ساده در صورت خطای مدل.

لیست تست‌های پیشنهادی (checklist):
- [ ] pnpm install از ریشه اجرا شده باشد
- [ ] در apps/mobile اپ با expo اجرا و صداهای خدیجه، kamtara، aava و chatter box تست شوند
- [ ] اگر خطای native یا کرش دیده شد، لاگ adb logcat یا Xcode ارسال شود

لینک ایجاد PR در گیت‌هاب (روی مرورگر کلیک کن تا صفحهٔ ایجاد PR باز شود):
https://github.com/Ramin-rezaie-nazari/my-personal-assistant/compare/main...feature/voice-stability-fix?expand=1

بعد از باز شدن PR من CI را مانیتور می‌کنم و در صورت خطا اصلاحات لازم را در شاخهٔ feature/voice-stability-fix اعمال می‌کنم و گزارش خیلی کوتاه می‌فرستم.
