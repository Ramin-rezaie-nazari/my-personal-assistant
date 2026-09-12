import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type AppLocale = 'fa' | 'en';
export const DEFAULT_LOCALE: AppLocale = 'en';
export const LOCALE_STORAGE_KEY = '@my-personal-assistant/locale';

export const translations = {
  en: {
    languageTitle: 'Choose your language', languageSubtitle: 'Your assistant will use this language everywhere.', persian: 'فارسی', english: 'English', continue: 'Continue',
    welcome: 'Welcome 👋', signIn: 'Sign in', createAccount: 'Create account', email: 'Email', password: 'Password', firstName: 'First name', lastName: 'Last name',
    today: 'Today', quickActions: 'Quick actions', calories: 'Calories', protein: 'Protein', water: 'Water', training: 'Training', recentMeals: 'Recent meals', notifications: 'Notifications',
    goal: 'Goal', habits: 'Habits', reminders: 'Reminders', supplements: 'Supplements', workout: 'Workout', progress: 'Progress', settings: 'Settings', logOut: 'Log out', retry: 'Retry',
    back: 'Back', meals: 'Meals', mealDetails: 'MEAL DETAILS', mealUnavailable: 'Meal unavailable', mealNotFound: 'Meal not found', backToMeals: 'Back to meals', ingredients: 'Ingredients', serving: 'serving', servings: 'servings', logAnotherMeal: 'Log another meal',
    yogaCoach: 'YOGA COACH', calmSteady: 'Calm, steady, with your coach', trainingMode: 'TRAINING MODE', startCamera: 'Start camera training', stopCamera: 'Turn camera off', live: 'LIVE', onDeviceAnalysis: 'On-device analysis', noRecording: 'No recording or upload', keepInFrame: 'Keep your body in frame and follow the coach voice.', sessionComplete: 'Session complete', greatSession: 'Great work. The session is complete.', end: 'End', next: 'Next',
    backHome: 'Home', addHabit: 'Add habit', dailyHabit: 'Add a daily habit', buildRhythm: 'Build your rhythm', habitSubtitle: 'Small actions become easier when your assistant remembers the streak.', sevenDayCompletion: '7-DAY COMPLETION', completionsAcross: 'completions across', activeHabits: 'active habits', done: 'Done', deleting: 'Deleting…', removeHabit: 'Remove habit', noHabits: 'No habits yet', startOneHabit: 'Start with one small thing you can repeat every day.',
    household: 'HOUSEHOLD', inventory: 'Inventory', inventorySubtitle: 'Know what you have, what is running low, and what the assistant should buy next.', itemsTracked: 'Items tracked', needAttention: 'Need attention', critical: 'Critical', cookWithStock: 'Cook with what you have', matchRecipes: 'Match recipes against your real household stock.', smartBasket: 'Smart Basket', replenishList: 'Turn low-stock forecasts into your next shopping list.', stock: 'Stock', daysLeft: 'Days left', buy: 'Buy', enough: 'Enough', pantryEmpty: 'Your pantry is empty here', pantryHelp: 'Start adding foods to inventory and the assistant will forecast when they need replenishing.',
    personalBrain: 'PERSONAL BRAIN', insightsTitle: 'What I noticed ✨', learningRecent: 'I am learning from your recent activity.', insightsUnavailable: 'Insights unavailable', tryAgain: 'Try again', keepGoing: 'Keep going 🌱', moreActivity: 'A little more daily activity will give your assistant more signal and better recommendations.', generatedRecent: 'Generated from your recent activity · no external AI required',
    nutrition: 'NUTRITION', mealsTitle: 'Meals', mealsSubtitle: 'Everything you logged today, connected to your nutrition goals.', logMeal: 'Log meal', whatNext: 'What should you eat next?', suggestionSubtitle: "Get suggestions matched to today's remaining calories and protein.", suggest: 'Suggest →', todaysBalance: "Today's balance", mealsCount: 'Meals', searchMeals: 'Search meals or foods…', mealsUnavailable: 'Meals unavailable', nothingMatches: 'Nothing matches', noMeals: 'No meals logged yet', tryAnother: 'Try another food or meal name.', firstMeal: 'Start by logging your first meal.', logFirstMeal: 'Log your first meal', backToCommand: 'Back to Command Center', of: 'of', todaySmall: 'today', view: 'View →',
    logAMeal: 'LOG A MEAL', buildMeal: 'Build your meal', buildMealSubtitle: 'Pick foods and quantities. Nutrition totals come from your saved food data.', mealName: 'Meal name', mealType: 'Type', findFood: 'Find a food', searchFoods: 'Search foods…', add: '+ Add', selectedFoods: 'Selected foods', emptyMeal: 'Your meal is empty. Add a food above.', mealNutrition: 'Meal nutrition', saveMeal: 'Save meal', saving: 'Saving…', addMealError: 'Add a meal name and at least one food.',
    shopping: 'SHOPPING', basketTitle: 'Your basket', basketSubtitle: 'Everything you need, without the clutter.', inBasket: 'in basket', needSoon: 'need soon', somethingWrong: 'Something went wrong', toBuy: 'To buy', markBought: 'Mark as bought', fromRecipe: 'from a recipe', priceHistory: 'View price history →', basketClear: 'Basket is clear 🎉', nothingToBuy: 'Nothing is waiting for you to buy.', runningLow: 'Running low', suggestionsOnly: 'These are suggestions only. Add them when you need them.', findMealCook: 'Find a meal to cook',
    healthRoutine: 'HEALTH ROUTINE', supplementsTitle: 'Supplements', takenToday: 'taken today', complete: 'complete', addSupplement: 'Add a supplement', dosageOptional: 'Dosage (optional)', addSupplementButton: 'Add supplement', noDosage: 'No dosage', taken: 'Taken ✓', take: 'Take', delete: 'Delete', routineEmpty: 'Your routine is empty', supplementHelp: 'Add the supplements you want your assistant to track.',
    recipeIntelligence: 'RECIPE INTELLIGENCE', cookStockTitle: 'Cook with what you have', cookStockSubtitle: 'Recipes are ranked by how much of the ingredients you already have at home.', smartBasketButton: 'Smart Basket', addToBasket: 'Add to basket', readyToCook: 'Ready to cook — everything is in stock', addedBasket: '✓ Added to Smart Basket', adding: 'Adding…', noRecipes: 'No recipes yet', recipeHelp: 'Once recipes have ingredients, the assistant can match them against your household inventory.', openBasket: 'Open Smart Basket',
  },
  fa: {
    languageTitle: 'زبان خودت را انتخاب کن', languageSubtitle: 'دستیار تو همه‌جا با همین زبان با تو صحبت می‌کند.', persian: 'فارسی', english: 'English', continue: 'ادامه',
    welcome: 'خوش اومدی 👋', signIn: 'ورود', createAccount: 'ساخت حساب', email: 'ایمیل', password: 'رمز عبور', firstName: 'نام', lastName: 'نام خانوادگی',
    today: 'امروز', quickActions: 'دسترسی‌های سریع', calories: 'کالری', protein: 'پروتئین', water: 'آب', training: 'تمرین', recentMeals: 'غذاهای اخیر', notifications: 'اعلان‌ها',
    goal: 'هدف', habits: 'عادت‌ها', reminders: 'یادآوری‌ها', supplements: 'مکمل‌ها', workout: 'ورزش', progress: 'پیشرفت', settings: 'تنظیمات', logOut: 'خروج', retry: 'تلاش دوباره',
    back: 'برگشت', meals: 'غذاها', mealDetails: 'جزئیات غذا', mealUnavailable: 'غذا در دسترس نیست', mealNotFound: 'غذا پیدا نشد', backToMeals: 'بازگشت به غذاها', ingredients: 'مواد تشکیل‌دهنده', serving: 'سرو', servings: 'سرو', logAnotherMeal: 'ثبت یک غذای دیگر',
    yogaCoach: 'مربی یوگا', calmSteady: 'آرام، پیوسته، با مربی', trainingMode: 'حالت تمرین', startCamera: 'شروع تمرین با دوربین', stopCamera: 'خاموش کردن دوربین', live: 'زنده', onDeviceAnalysis: 'تحلیل روی دستگاه', noRecording: 'بدون ضبط و آپلود', keepInFrame: 'بدنت را در کادر نگه دار و با صدای مربی جلو برو.', sessionComplete: 'جلسه تمام شد', greatSession: 'عالی بود. جلسه تمام شد.', end: 'پایان', next: 'ادامه',
    backHome: 'خانه', addHabit: 'افزودن عادت', dailyHabit: 'افزودن عادت روزانه', buildRhythm: 'ریتم خودت را بساز', habitSubtitle: 'وقتی دستیار زنجیره عادت را به خاطر می‌سپارد، کارهای کوچک آسان‌تر می‌شوند.', sevenDayCompletion: 'تکمیل ۷ روزه', completionsAcross: 'تکمیل در', activeHabits: 'عادت فعال', done: 'انجام شد', deleting: 'در حال حذف…', removeHabit: 'حذف عادت', noHabits: 'هنوز عادتی نیست', startOneHabit: 'با یک کار کوچک که بتوانی هر روز تکرارش کنی شروع کن.',
    household: 'خانه', inventory: 'موجودی', inventorySubtitle: 'ببین چه چیزهایی داری، چه چیزهایی رو به اتمام‌اند و دستیار بعداً چه چیزی بخرد.', itemsTracked: 'اقلام ثبت‌شده', needAttention: 'نیازمند توجه', critical: 'بحرانی', cookWithStock: 'با موجودی خانه آشپزی کن', matchRecipes: 'رسپی‌ها را با موجودی واقعی خانه تطبیق بده.', smartBasket: 'سبد هوشمند', replenishList: 'پیش‌بینی کمبود را به لیست خرید بعدی تبدیل کن.', stock: 'موجودی', daysLeft: 'روز باقی‌مانده', buy: 'خرید', enough: 'کافی', pantryEmpty: 'هنوز چیزی در موجودی نیست', pantryHelp: 'غذاها را به موجودی اضافه کن تا دستیار زمان نیاز به تهیه دوباره را پیش‌بینی کند.',
    personalBrain: 'مغز شخصی', insightsTitle: 'چیزهایی که متوجه شدم ✨', learningRecent: 'دارم از فعالیت‌های اخیرت الگو یاد می‌گیرم.', insightsUnavailable: 'بینش‌ها در دسترس نیستند', tryAgain: 'تلاش دوباره', keepGoing: 'ادامه بده 🌱', moreActivity: 'کمی فعالیت روزانه بیشتر، سیگنال بهتری برای پیشنهادهای شخصی می‌سازد.', generatedRecent: 'بر اساس فعالیت اخیرت · بدون نیاز به هوش مصنوعی خارجی',
    nutrition: 'تغذیه', mealsTitle: 'غذاها', mealsSubtitle: 'هر چیزی که امروز ثبت کردی، به اهداف تغذیه‌ای تو وصل است.', logMeal: 'ثبت غذا', whatNext: 'بعدی چی بخورم؟', suggestionSubtitle: 'پیشنهادها بر اساس کالری و پروتئین باقی‌مانده امروز ساخته می‌شوند.', suggest: 'پیشنهاد بده ←', todaysBalance: 'تعادل امروز', mealsCount: 'غذاها', searchMeals: 'جستجوی غذا یا مواد…', mealsUnavailable: 'غذاها در دسترس نیستند', nothingMatches: 'موردی پیدا نشد', noMeals: 'هنوز غذایی ثبت نشده', tryAnother: 'نام یک غذا یا ماده دیگر را امتحان کن.', firstMeal: 'با ثبت اولین غذایت شروع کن.', logFirstMeal: 'اولین غذا را ثبت کن', backToCommand: 'بازگشت به مرکز فرمان', of: 'از', todaySmall: 'امروز', view: 'مشاهده ←',
    logAMeal: 'ثبت غذا', buildMeal: 'غذایت را بساز', buildMealSubtitle: 'غذاها و مقدارها را انتخاب کن. مجموع تغذیه از داده‌های ذخیره‌شده تو می‌آید.', mealName: 'نام غذا', mealType: 'نوع', findFood: 'پیدا کردن غذا', searchFoods: 'جستجوی غذا…', add: '+ افزودن', selectedFoods: 'غذاهای انتخاب‌شده', emptyMeal: 'غذایت خالی است. یک غذا از بالا اضافه کن.', mealNutrition: 'ارزش تغذیه‌ای غذا', saveMeal: 'ذخیره غذا', saving: 'در حال ذخیره…', addMealError: 'نام غذا و حداقل یک ماده را وارد کن.',
    shopping: 'خرید', basketTitle: 'سبد تو', basketSubtitle: 'هر چیزی که لازم داری، بدون شلوغی.', inBasket: 'در سبد', needSoon: 'به‌زودی لازم است', somethingWrong: 'مشکلی پیش آمد', toBuy: 'برای خرید', markBought: 'به‌عنوان خریدشده علامت بزن', fromRecipe: 'از یک رسپی', priceHistory: 'مشاهده تاریخچه قیمت ←', basketClear: 'سبد خالی است 🎉', nothingToBuy: 'فعلاً چیزی برای خرید منتظر تو نیست.', runningLow: 'رو به اتمام', suggestionsOnly: 'این‌ها فقط پیشنهاد هستند. هر زمان لازم داشتی اضافه‌شان کن.', findMealCook: 'غذایی برای پخت پیدا کن',
    healthRoutine: 'روتین سلامت', supplementsTitle: 'مکمل‌ها', takenToday: 'امروز مصرف شده', complete: 'کامل', addSupplement: 'افزودن مکمل', dosageOptional: 'مقدار مصرف (اختیاری)', addSupplementButton: 'افزودن مکمل', noDosage: 'مقدار مصرف ثبت نشده', taken: 'مصرف شد ✓', take: 'مصرف', delete: 'حذف', routineEmpty: 'روتین تو خالی است', supplementHelp: 'مکمل‌هایی را که می‌خواهی دستیار پیگیری کند اضافه کن.',
    recipeIntelligence: 'هوش رسپی', cookStockTitle: 'با موجودی خانه آشپزی کن', cookStockSubtitle: 'رسپی‌ها بر اساس مقدار موادی که واقعاً در خانه داری رتبه‌بندی می‌شوند.', smartBasketButton: 'سبد هوشمند', addToBasket: 'افزودن به سبد', readyToCook: 'آماده پخت — همه‌چیز موجود است', addedBasket: '✓ به سبد هوشمند اضافه شد', adding: 'در حال افزودن…', noRecipes: 'هنوز رسپی‌ای نیست', recipeHelp: 'وقتی رسپی‌ها مواد داشته باشند، دستیار می‌تواند آن‌ها را با موجودی خانه تطبیق دهد.', openBasket: 'باز کردن سبد هوشمند',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(locale: AppLocale, key: TranslationKey): string {
  return translations[locale][key];
}

export function tx(locale: AppLocale, en: string, fa: string): string {
  return locale === 'fa' ? fa : en;
}

export async function getStoredLocale(): Promise<AppLocale | null> {
  const value = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  return value === 'fa' || value === 'en' ? value : null;
}

export function useAppLocale(initial: AppLocale = DEFAULT_LOCALE) {
  const [locale, setLocale] = useState<AppLocale>(initial);
  useEffect(() => {
    let active = true;
    void getStoredLocale().then((stored) => { if (active && stored) setLocale(stored); });
    return () => { active = false; };
  }, []);
  return { locale, rtl: isRTL(locale) };
}

export async function setStoredLocale(locale: AppLocale): Promise<void> {
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function isRTL(locale: AppLocale): boolean {
  return locale === 'fa';
}
