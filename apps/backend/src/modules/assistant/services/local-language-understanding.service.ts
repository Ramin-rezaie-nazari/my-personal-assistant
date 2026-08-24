import { Injectable } from '@nestjs/common';

export type LocalIntent =
  | 'ADD_TO_BASKET'
  | 'REMOVE_FROM_BASKET'
  | 'RECOMMEND_MEAL'
  | 'GET_NUTRITION_SUMMARY'
  | 'CREATE_REMINDER'
  | 'UPDATE_REQUEST'
  | 'CANCEL_REQUEST'
  | 'UNKNOWN';

export type SupportedLocalLanguage =
  | 'fa-IR'
  | 'en-US'
  | 'en-GB'
  | 'es-ES'
  | 'es-MX'
  | 'fr-FR'
  | 'de-DE'
  | 'it-IT'
  | 'pt-BR'
  | 'pt-PT'
  | 'ru-RU'
  | 'uk-UA'
  | 'pl-PL'
  | 'nl-NL'
  | 'tr-TR'
  | 'ar-SA'
  | 'he-IL'
  | 'hi-IN'
  | 'bn-IN'
  | 'ur-PK'
  | 'pa-IN'
  | 'gu-IN'
  | 'mr-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'ja-JP'
  | 'ko-KR'
  | 'zh-CN'
  | 'zh-TW'
  | 'vi-VN'
  | 'th-TH'
  | 'id-ID'
  | 'ms-MY'
  | 'fil-PH'
  | 'sv-SE'
  | 'no-NO'
  | 'da-DK'
  | 'fi-FI'
  | 'cs-CZ'
  | 'sk-SK'
  | 'hu-HU'
  | 'ro-RO'
  | 'bg-BG'
  | 'el-GR'
  | 'sr-RS'
  | 'hr-HR'
  | 'sl-SI'
  | 'sw-KE'
  | 'am-ET'
  | 'fa-AF'
  | 'fa-TJ';

export type LocalUnderstanding = {
  intent: LocalIntent;
  entities: Record<string, string | number | boolean | string[]>;
  confidence: number;
  normalizedText: string;
  language: SupportedLocalLanguage;
  languageConfidence: number;
};

type IntentLexicon = Partial<Record<LocalIntent, readonly string[]>>;

type LanguageProfile = {
  markers: readonly string[];
  lexicon: IntentLexicon;
};

const COMMON_ENGLISH: IntentLexicon = {
  ADD_TO_BASKET: ['add', 'add to cart', 'add to basket', 'put in cart', 'buy'],
  REMOVE_FROM_BASKET: ['remove', 'remove from cart', 'remove from basket', 'delete from cart'],
  RECOMMEND_MEAL: ['what should i eat', 'recommend a meal', 'dinner', 'lunch', 'breakfast', 'meal'],
  GET_NUTRITION_SUMMARY: ['calories', 'protein', 'nutrition', 'macros', 'nutrients'],
  CREATE_REMINDER: ['remind me', 'reminder', 'remember to', 'set a reminder'],
  UPDATE_REQUEST: ['change', 'update', 'edit', 'instead'],
  CANCEL_REQUEST: ['cancel', 'stop', 'never mind', 'forget it'],
};

const PROFILES: Record<SupportedLocalLanguage, LanguageProfile> = {
  'fa-IR': {
    markers: ['یادم', 'غذا', 'کالری', 'پروتئین', 'شام', 'ناهار', 'صبحانه', 'لغو', 'اضافه'],
    lexicon: {
      ADD_TO_BASKET: ['اضافه کن', 'اضافه', 'بذار تو سبد', 'بذار توی سبد', 'بخر'],
      REMOVE_FROM_BASKET: ['حذف کن', 'بردار', 'از سبد بردار', 'پاک کن'],
      RECOMMEND_MEAL: ['چی بخور', 'چه بخور', 'شام', 'ناهار', 'صبحانه', 'پیشنهاد غذا', 'غذا چی'],
      GET_NUTRITION_SUMMARY: ['کالری', 'پروتئین', 'تغذیه امروز', 'درشت مغذی', 'مواد مغذی'],
      CREATE_REMINDER: ['یادم بنداز', 'یادآوری', 'یادآوری کن', 'یادم نره'],
      UPDATE_REQUEST: ['تغییر بده', 'عوض کن', 'ویرایش کن', 'به جاش', 'بجاش'],
      CANCEL_REQUEST: ['لغو', 'کنسل', 'باطل', 'حذفش کن', 'بیخیال'],
    },
  },
  'fa-AF': { markers: ['یادم', 'غذا', 'کالری', 'پروتین', 'لغو'], lexicon: {
    ADD_TO_BASKET: ['اضافه کن', 'در سبد بگذار', 'بخر'], REMOVE_FROM_BASKET: ['حذف کن', 'از سبد بردار'], RECOMMEND_MEAL: ['چی بخور', 'غذا پیشنهاد', 'شام', 'ناهار'], GET_NUTRITION_SUMMARY: ['کالری', 'پروتین', 'تغذیه'], CREATE_REMINDER: ['یادم بنداز', 'یادآوری کن'], UPDATE_REQUEST: ['تغییر بده', 'عوض کن'], CANCEL_REQUEST: ['لغو', 'کنسل']
  }},
  'fa-TJ': { markers: ['ғизо', 'калория', 'протеин', 'лағв'], lexicon: {
    ADD_TO_BASKET: ['илова кун', 'ба сабад гузор', 'харид кун'], REMOVE_FROM_BASKET: ['нест кун', 'аз сабад гир'], RECOMMEND_MEAL: ['чи бихӯрам', 'таоми пешниҳод', 'шом', 'нисфирӯзӣ'], GET_NUTRITION_SUMMARY: ['калория', 'протеин', 'ғизо'], CREATE_REMINDER: ['ба ман хотиррасон кун'], UPDATE_REQUEST: ['тағйир деҳ', 'иваз кун'], CANCEL_REQUEST: ['лағв кун', 'бекор кун']
  }},
  'en-US': { markers: ['the', 'you', 'meal', 'calories', 'protein', 'remind'], lexicon: COMMON_ENGLISH },
  'en-GB': { markers: ['the', 'you', 'meal', 'calories', 'protein', 'remind'], lexicon: COMMON_ENGLISH },
  'es-ES': { markers: ['que', 'para', 'comida', 'calorías', 'proteína', 'recuérdame'], lexicon: {
    ADD_TO_BASKET: ['añade', 'agrega', 'añadir al carrito', 'pon en el carrito'], REMOVE_FROM_BASKET: ['quita', 'elimina del carrito', 'borra del carrito'], RECOMMEND_MEAL: ['qué como', 'qué debería comer', 'recomiéndame una comida', 'cena', 'almuerzo', 'desayuno'], GET_NUTRITION_SUMMARY: ['calorías', 'proteína', 'nutrición', 'macros'], CREATE_REMINDER: ['recuérdame', 'recordatorio', 'recuérdame que'], UPDATE_REQUEST: ['cambia', 'actualiza', 'edita', 'en su lugar'], CANCEL_REQUEST: ['cancela', 'cancelar', 'para', 'olvídalo']
  }},
  'es-MX': { markers: ['que', 'para', 'comida', 'calorías', 'proteína', 'recuérdame'], lexicon: {
    ADD_TO_BASKET: ['agrega', 'añade', 'pon en el carrito', 'mete al carrito'], REMOVE_FROM_BASKET: ['quita', 'saca del carrito', 'elimina'], RECOMMEND_MEAL: ['qué como', 'qué debería comer', 'recomiéndame algo', 'cena', 'comida'], GET_NUTRITION_SUMMARY: ['calorías', 'proteína', 'nutrición'], CREATE_REMINDER: ['recuérdame', 'ponme un recordatorio'], UPDATE_REQUEST: ['cambia', 'actualiza', 'edita', 'mejor esto'], CANCEL_REQUEST: ['cancela', 'ya no', 'olvídalo']
  }},
  'fr-FR': { markers: ['je', 'le', 'repas', 'calories', 'protéines', 'rappelle'], lexicon: {
    ADD_TO_BASKET: ['ajoute', 'ajoute au panier', 'mets dans le panier'], REMOVE_FROM_BASKET: ['retire', 'supprime du panier', 'enlève'], RECOMMEND_MEAL: ['que dois-je manger', 'qu est-ce que je mange', 'suggère un repas', 'dîner', 'déjeuner', 'petit-déjeuner'], GET_NUTRITION_SUMMARY: ['calories', 'protéines', 'nutrition', 'macros'], CREATE_REMINDER: ['rappelle-moi', 'rappel', 'rappelle moi'], UPDATE_REQUEST: ['change', 'mets à jour', 'modifie', 'à la place'], CANCEL_REQUEST: ['annule', 'annuler', 'arrête', 'laisse tomber']
  }},
  'de-DE': { markers: ['ich', 'der', 'essen', 'kalorien', 'protein', 'erinnere'], lexicon: {
    ADD_TO_BASKET: ['hinzufügen', 'in den warenkorb', 'in den einkaufswagen', 'kaufen'], REMOVE_FROM_BASKET: ['entfernen', 'aus dem warenkorb', 'löschen'], RECOMMEND_MEAL: ['was soll ich essen', 'empfiehl mir ein essen', 'abendessen', 'mittagessen', 'frühstück'], GET_NUTRITION_SUMMARY: ['kalorien', 'protein', 'ernährung', 'makros'], CREATE_REMINDER: ['erinnere mich', 'erinnerung', 'denk mich daran'], UPDATE_REQUEST: ['ändern', 'aktualisieren', 'bearbeiten', 'stattdessen'], CANCEL_REQUEST: ['abbrechen', 'stornieren', 'vergiss es']
  }},
  'it-IT': { markers: ['io', 'il', 'cibo', 'calorie', 'proteine', 'ricordami'], lexicon: {
    ADD_TO_BASKET: ['aggiungi', 'aggiungi al carrello', 'metti nel carrello'], REMOVE_FROM_BASKET: ['rimuovi', 'togli dal carrello', 'elimina'], RECOMMEND_MEAL: ['cosa mangio', 'cosa dovrei mangiare', 'consigliami un pasto', 'cena', 'pranzo', 'colazione'], GET_NUTRITION_SUMMARY: ['calorie', 'proteine', 'nutrizione', 'macro'], CREATE_REMINDER: ['ricordami', 'promemoria', 'ricordami di'], UPDATE_REQUEST: ['cambia', 'aggiorna', 'modifica', 'invece'], CANCEL_REQUEST: ['annulla', 'cancellalo', 'lascia perdere']
  }},
  'pt-BR': { markers: ['eu', 'comida', 'calorias', 'proteína', 'lembra'], lexicon: {
    ADD_TO_BASKET: ['adicione', 'adiciona ao carrinho', 'coloque no carrinho'], REMOVE_FROM_BASKET: ['remova', 'tire do carrinho', 'exclua'], RECOMMEND_MEAL: ['o que eu como', 'o que devo comer', 'recomende uma refeição', 'jantar', 'almoço', 'café da manhã'], GET_NUTRITION_SUMMARY: ['calorias', 'proteína', 'nutrição', 'macros'], CREATE_REMINDER: ['me lembre', 'lembrete', 'me lembra de'], UPDATE_REQUEST: ['mude', 'atualize', 'edite', 'em vez disso'], CANCEL_REQUEST: ['cancele', 'cancelar', 'deixa pra lá']
  }},
  'pt-PT': { markers: ['eu', 'comida', 'calorias', 'proteína', 'lembra'], lexicon: {
    ADD_TO_BASKET: ['adiciona', 'adiciona ao carrinho', 'coloca no carrinho'], REMOVE_FROM_BASKET: ['remove', 'tira do carrinho', 'apaga'], RECOMMEND_MEAL: ['o que como', 'o que devo comer', 'sugere uma refeição', 'jantar', 'almoço', 'pequeno-almoço'], GET_NUTRITION_SUMMARY: ['calorias', 'proteína', 'nutrição', 'macros'], CREATE_REMINDER: ['lembra-me', 'lembrete', 'lembra-me de'], UPDATE_REQUEST: ['muda', 'atualiza', 'edita', 'em vez disso'], CANCEL_REQUEST: ['cancela', 'anula', 'esquece']
  }},
  'ru-RU': { markers: ['я', 'еда', 'калории', 'белок', 'напомни'], lexicon: {
    ADD_TO_BASKET: ['добавь', 'добавь в корзину', 'положи в корзину'], REMOVE_FROM_BASKET: ['удали', 'убери из корзины'], RECOMMEND_MEAL: ['что поесть', 'что мне поесть', 'посоветуй блюдо', 'ужин', 'обед', 'завтрак'], GET_NUTRITION_SUMMARY: ['калории', 'белок', 'питание'], CREATE_REMINDER: ['напомни мне', 'напоминание'], UPDATE_REQUEST: ['измени', 'обнови', 'отредактируй', 'вместо этого'], CANCEL_REQUEST: ['отмени', 'отмена', 'забудь']
  }},
  'uk-UA': { markers: ['я', 'їжа', 'калорії', 'білок', 'нагадай'], lexicon: {
    ADD_TO_BASKET: ['додай', 'додай у кошик', 'поклади в кошик'], REMOVE_FROM_BASKET: ['видали', 'прибери з кошика'], RECOMMEND_MEAL: ['що поїсти', 'що мені з’їсти', 'порадь страву', 'вечеря', 'обід', 'сніданок'], GET_NUTRITION_SUMMARY: ['калорії', 'білок', 'харчування'], CREATE_REMINDER: ['нагадай мені', 'нагадування'], UPDATE_REQUEST: ['зміни', 'онови', 'відредагуй', 'замість цього'], CANCEL_REQUEST: ['скасуй', 'скасувати', 'забудь']
  }},
  'pl-PL': { markers: ['ja', 'jedzenie', 'kalorie', 'białko', 'przypomnij'], lexicon: {
    ADD_TO_BASKET: ['dodaj', 'dodaj do koszyka', 'włóż do koszyka'], REMOVE_FROM_BASKET: ['usuń', 'usuń z koszyka', 'wyrzuć z koszyka'], RECOMMEND_MEAL: ['co zjeść', 'co powinienem zjeść', 'poleć posiłek', 'kolacja', 'obiad', 'śniadanie'], GET_NUTRITION_SUMMARY: ['kalorie', 'białko', 'odżywianie'], CREATE_REMINDER: ['przypomnij mi', 'przypomnienie'], UPDATE_REQUEST: ['zmień', 'zaktualizuj', 'edytuj', 'zamiast tego'], CANCEL_REQUEST: ['anuluj', 'odwołaj', 'zapomnij']
  }},
  'nl-NL': { markers: ['ik', 'eten', 'calorieën', 'eiwit', 'herinner'], lexicon: {
    ADD_TO_BASKET: ['voeg toe', 'voeg toe aan winkelwagen', 'in winkelwagen'], REMOVE_FROM_BASKET: ['verwijder', 'haal uit winkelwagen'], RECOMMEND_MEAL: ['wat zal ik eten', 'wat moet ik eten', 'raad een maaltijd aan', 'avondeten', 'lunch', 'ontbijt'], GET_NUTRITION_SUMMARY: ['calorieën', 'eiwit', 'voeding'], CREATE_REMINDER: ['herinner me', 'herinnering'], UPDATE_REQUEST: ['verander', 'werk bij', 'bewerk', 'in plaats daarvan'], CANCEL_REQUEST: ['annuleer', 'stop', 'laat maar']
  }},
  'tr-TR': { markers: ['ben', 'yemek', 'kalori', 'protein', 'hatırlat'], lexicon: {
    ADD_TO_BASKET: ['ekle', 'sepete ekle', 'alışveriş sepetine ekle'], REMOVE_FROM_BASKET: ['çıkar', 'sepetten çıkar', 'sil'], RECOMMEND_MEAL: ['ne yesem', 'ne yemeliyim', 'bir yemek öner', 'akşam yemeği', 'öğle yemeği', 'kahvaltı'], GET_NUTRITION_SUMMARY: ['kalori', 'protein', 'beslenme'], CREATE_REMINDER: ['bana hatırlat', 'hatırlatıcı'], UPDATE_REQUEST: ['değiştir', 'güncelle', 'düzenle', 'yerine'], CANCEL_REQUEST: ['iptal et', 'iptal', 'boşver']
  }},
  'ar-SA': { markers: ['أنا', 'طعام', 'سعرات', 'بروتين', 'ذكرني'], lexicon: {
    ADD_TO_BASKET: ['أضف', 'أضف إلى السلة', 'ضع في السلة'], REMOVE_FROM_BASKET: ['احذف', 'أزل من السلة', 'حذف من السلة'], RECOMMEND_MEAL: ['ماذا آكل', 'ماذا ينبغي أن آكل', 'اقترح وجبة', 'عشاء', 'غداء', 'فطور'], GET_NUTRITION_SUMMARY: ['سعرات', 'بروتين', 'تغذية'], CREATE_REMINDER: ['ذكرني', 'تذكير', 'ذكرني أن'], UPDATE_REQUEST: ['غيّر', 'حدّث', 'عدّل', 'بدلًا من ذلك'], CANCEL_REQUEST: ['ألغِ', 'إلغاء', 'تراجع', 'انسَ الأمر']
  }},
  'he-IL': { markers: ['אני', 'אוכל', 'קלוריות', 'חלבון', 'תזכיר'], lexicon: {
    ADD_TO_BASKET: ['תוסיף', 'הוסף לסל', 'שים בסל'], REMOVE_FROM_BASKET: ['תסיר', 'הסר מהסל', 'מחק מהסל'], RECOMMEND_MEAL: ['מה לאכול', 'מה כדאי לי לאכול', 'תמליץ על ארוחה', 'ארוחת ערב', 'צהריים', 'בוקר'], GET_NUTRITION_SUMMARY: ['קלוריות', 'חלבון', 'תזונה'], CREATE_REMINDER: ['תזכיר לי', 'תזכורת'], UPDATE_REQUEST: ['שנה', 'עדכן', 'ערוך', 'במקום זה'], CANCEL_REQUEST: ['בטל', 'ביטול', 'עזוב']
  }},
  'hi-IN': { markers: ['मैं', 'खाना', 'कैलोरी', 'प्रोटीन', 'याद'], lexicon: {
    ADD_TO_BASKET: ['जोड़ो', 'कार्ट में जोड़ो', 'टोकरी में डालो'], REMOVE_FROM_BASKET: ['हटाओ', 'कार्ट से हटाओ', 'डिलीट'], RECOMMEND_MEAL: ['क्या खाऊँ', 'मुझे क्या खाना चाहिए', 'खाने की सलाह', 'रात का खाना', 'दोपहर का खाना', 'नाश्ता'], GET_NUTRITION_SUMMARY: ['कैलोरी', 'प्रोटीन', 'पोषण'], CREATE_REMINDER: ['मुझे याद दिलाओ', 'रिमाइंडर'], UPDATE_REQUEST: ['बदलो', 'अपडेट करो', 'एडिट करो'], CANCEL_REQUEST: ['रद्द करो', 'कैंसल', 'छोड़ो']
  }},
  'bn-IN': { markers: ['আমি', 'খাবার', 'ক্যালরি', 'প্রোটিন', 'মনে করিয়ে'], lexicon: {
    ADD_TO_BASKET: ['যোগ করো', 'কার্টে যোগ করো', 'ঝুড়িতে রাখো'], REMOVE_FROM_BASKET: ['সরিয়ে দাও', 'কার্ট থেকে সরাও', 'মুছে দাও'], RECOMMEND_MEAL: ['কি খাব', 'কি খাওয়া উচিত', 'একটি খাবার সাজেস্ট করো', 'রাতের খাবার', 'দুপুরের খাবার', 'নাশতা'], GET_NUTRITION_SUMMARY: ['ক্যালরি', 'প্রোটিন', 'পুষ্টি'], CREATE_REMINDER: ['মনে করিয়ে দাও', 'রিমাইন্ডার'], UPDATE_REQUEST: ['পরিবর্তন করো', 'আপডেট করো', 'এডিট করো'], CANCEL_REQUEST: ['বাতিল করো', 'ক্যানসেল', 'থাক']
  }},
  'ur-PK': { markers: ['میں', 'کھانا', 'کیلوریز', 'پروٹین', 'یاد'], lexicon: {
    ADD_TO_BASKET: ['شامل کرو', 'کارٹ میں ڈالو', 'ٹوکری میں ڈالو'], REMOVE_FROM_BASKET: ['ہٹا دو', 'کارٹ سے ہٹا دو', 'حذف کرو'], RECOMMEND_MEAL: ['کیا کھاؤں', 'مجھے کیا کھانا چاہیے', 'کھانے کی تجویز', 'رات کا کھانا', 'دوپہر کا کھانا', 'ناشتہ'], GET_NUTRITION_SUMMARY: ['کیلوریز', 'پروٹین', 'غذا'], CREATE_REMINDER: ['مجھے یاد دلاؤ', 'یاد دہانی'], UPDATE_REQUEST: ['تبدیل کرو', 'اپ ڈیٹ کرو', 'ترمیم کرو'], CANCEL_REQUEST: ['منسوخ کرو', 'کینسل', 'چھوڑ دو']
  }},
  'pa-IN': { markers: ['ਮੈਂ', 'ਖਾਣਾ', 'ਕੈਲੋਰੀ', 'ਪ੍ਰੋਟੀਨ', 'ਯਾਦ'], lexicon: {
    ADD_TO_BASKET: ['ਸ਼ਾਮਲ ਕਰੋ', 'ਕਾਰਟ ਵਿੱਚ ਪਾਓ'], REMOVE_FROM_BASKET: ['ਹਟਾਓ', 'ਕਾਰਟ ਤੋਂ ਹਟਾਓ'], RECOMMEND_MEAL: ['ਕੀ ਖਾਵਾਂ', 'ਕੀ ਖਾਣਾ ਚਾਹੀਦਾ', 'ਭੋਜਨ ਸੁਝਾਓ', 'ਰਾਤ ਦਾ ਖਾਣਾ', 'ਦੁਪਹਿਰ ਦਾ ਖਾਣਾ'], GET_NUTRITION_SUMMARY: ['ਕੈਲੋਰੀ', 'ਪ੍ਰੋਟੀਨ', 'ਪੋਸ਼ਣ'], CREATE_REMINDER: ['ਮੈਨੂੰ ਯਾਦ ਕਰਾਓ', 'ਰਿਮਾਈਂਡਰ'], UPDATE_REQUEST: ['ਬਦਲੋ', 'ਅਪਡੇਟ ਕਰੋ'], CANCEL_REQUEST: ['ਰੱਦ ਕਰੋ', 'ਕੈਂਸਲ']
  }},
  'gu-IN': { markers: ['હું', 'ખાવું', 'કેલરી', 'પ્રોટીન', 'યાદ'], lexicon: {
    ADD_TO_BASKET: ['ઉમેરો', 'કાર્ટમાં ઉમેરો'], REMOVE_FROM_BASKET: ['દૂર કરો', 'કાર્ટમાંથી કાઢો'], RECOMMEND_MEAL: ['શું ખાઉં', 'શું ખાવું જોઈએ', 'ભોજન સૂચવો', 'રાત્રિભોજન', 'બપોરનું ભોજન'], GET_NUTRITION_SUMMARY: ['કેલરી', 'પ્રોટીન', 'પોષણ'], CREATE_REMINDER: ['મને યાદ કરાવો', 'રિમાઇન્ડર'], UPDATE_REQUEST: ['બદલો', 'અપડેટ કરો'], CANCEL_REQUEST: ['રદ કરો', 'કૅન્સલ']
  }},
  'mr-IN': { markers: ['मी', 'जेवण', 'कॅलरी', 'प्रथिने', 'आठवण'], lexicon: {
    ADD_TO_BASKET: ['जोडा', 'कार्टमध्ये जोडा', 'टोपलीत ठेवा'], REMOVE_FROM_BASKET: ['काढा', 'कार्टमधून काढा', 'हटवा'], RECOMMEND_MEAL: ['काय खाऊ', 'काय खावे', 'जेवण सुचवा', 'रात्रीचे जेवण', 'दुपारचे जेवण'], GET_NUTRITION_SUMMARY: ['कॅलरी', 'प्रथिने', 'पोषण'], CREATE_REMINDER: ['मला आठवण करून दे', 'रिमाइंडर'], UPDATE_REQUEST: ['बदला', 'अपडेट करा', 'संपादित करा'], CANCEL_REQUEST: ['रद्द करा', 'कॅन्सल']
  }},
  'ta-IN': { markers: ['நான்', 'உணவு', 'கலோரி', 'புரதம்', 'நினைவூட்டு'], lexicon: {
    ADD_TO_BASKET: ['சேர்க்கவும்', 'கார்ட்டில் சேர்க்கவும்'], REMOVE_FROM_BASKET: ['அகற்று', 'கார்ட்டிலிருந்து அகற்று'], RECOMMEND_MEAL: ['என்ன சாப்பிடலாம்', 'எதை சாப்பிட வேண்டும்', 'உணவு பரிந்துரை', 'இரவு உணவு', 'மதிய உணவு'], GET_NUTRITION_SUMMARY: ['கலோரி', 'புரதம்', 'ஊட்டச்சத்து'], CREATE_REMINDER: ['எனக்கு நினைவூட்டு', 'நினைவூட்டல்'], UPDATE_REQUEST: ['மாற்று', 'புதுப்பி', 'திருத்து'], CANCEL_REQUEST: ['ரத்து செய்', 'கேன்சல்']
  }},
  'te-IN': { markers: ['నేను', 'ఆహారం', 'క్యాలరీ', 'ప్రోటీన్', 'గుర్తు'], lexicon: {
    ADD_TO_BASKET: ['జోడించు', 'కార్ట్‌లో జోడించు'], REMOVE_FROM_BASKET: ['తొలగించు', 'కార్ట్ నుండి తొలగించు'], RECOMMEND_MEAL: ['ఏం తినాలి', 'ఏమి తినాలి', 'భోజనం సూచించు', 'రాత్రి భోజనం', 'మధ్యాహ్న భోజనం'], GET_NUTRITION_SUMMARY: ['క్యాలరీ', 'ప్రోటీన్', 'పోషణ'], CREATE_REMINDER: ['నాకు గుర్తు చేయు', 'రిమైండర్'], UPDATE_REQUEST: ['మార్చు', 'అప్‌డేట్ చేయు', 'ఎడిట్ చేయు'], CANCEL_REQUEST: ['రద్దు చేయు', 'క్యాన్సెల్']
  }},
  'ja-JP': { markers: ['私', '食べ', 'カロリー', 'タンパク質', 'リマインド'], lexicon: {
    ADD_TO_BASKET: ['追加', 'カートに追加', '買い物かごに入れて'], REMOVE_FROM_BASKET: ['削除', 'カートから削除', '取り除いて'], RECOMMEND_MEAL: ['何を食べる', '何を食べればいい', '料理をおすすめして', '夕食', '昼食', '朝食'], GET_NUTRITION_SUMMARY: ['カロリー', 'タンパク質', '栄養'], CREATE_REMINDER: ['思い出させて', 'リマインダー'], UPDATE_REQUEST: ['変更', '更新', '編集', '代わりに'], CANCEL_REQUEST: ['キャンセル', '取り消し']
  }},
  'ko-KR': { markers: ['저', '음식', '칼로리', '단백질', '알림'], lexicon: {
    ADD_TO_BASKET: ['추가해', '장바구니에 추가', '카트에 넣어'], REMOVE_FROM_BASKET: ['삭제해', '장바구니에서 빼', '제거해'], RECOMMEND_MEAL: ['뭐 먹을까', '무엇을 먹어야', '식사를 추천해', '저녁', '점심', '아침'], GET_NUTRITION_SUMMARY: ['칼로리', '단백질', '영양'], CREATE_REMINDER: ['알려줘', '미리 알려줘', '알림 설정'], UPDATE_REQUEST: ['바꿔', '업데이트해', '수정해'], CANCEL_REQUEST: ['취소해', '그만', '잊어']
  }},
  'zh-CN': { markers: ['我', '吃', '卡路里', '蛋白质', '提醒'], lexicon: {
    ADD_TO_BASKET: ['添加', '加入购物车', '放进购物车'], REMOVE_FROM_BASKET: ['删除', '从购物车删除', '移除'], RECOMMEND_MEAL: ['吃什么', '我应该吃什么', '推荐一道菜', '晚饭', '午饭', '早餐'], GET_NUTRITION_SUMMARY: ['卡路里', '蛋白质', '营养'], CREATE_REMINDER: ['提醒我', '设置提醒'], UPDATE_REQUEST: ['修改', '更新', '编辑', '换成'], CANCEL_REQUEST: ['取消', '算了', '停止']
  }},
  'zh-TW': { markers: ['我', '吃', '卡路里', '蛋白質', '提醒'], lexicon: {
    ADD_TO_BASKET: ['加入', '加入購物車', '放進購物車'], REMOVE_FROM_BASKET: ['刪除', '從購物車刪除', '移除'], RECOMMEND_MEAL: ['吃什麼', '我應該吃什麼', '推薦一道菜', '晚餐', '午餐', '早餐'], GET_NUTRITION_SUMMARY: ['卡路里', '蛋白質', '營養'], CREATE_REMINDER: ['提醒我', '設定提醒'], UPDATE_REQUEST: ['修改', '更新', '編輯', '換成'], CANCEL_REQUEST: ['取消', '算了', '停止']
  }},
  'vi-VN': { markers: ['tôi', 'ăn', 'calo', 'protein', 'nhắc'], lexicon: {
    ADD_TO_BASKET: ['thêm', 'thêm vào giỏ', 'cho vào giỏ'], REMOVE_FROM_BASKET: ['xóa', 'bỏ khỏi giỏ', 'loại khỏi giỏ'], RECOMMEND_MEAL: ['ăn gì', 'tôi nên ăn gì', 'gợi ý món ăn', 'bữa tối', 'bữa trưa', 'bữa sáng'], GET_NUTRITION_SUMMARY: ['calo', 'protein', 'dinh dưỡng'], CREATE_REMINDER: ['nhắc tôi', 'lời nhắc'], UPDATE_REQUEST: ['đổi', 'cập nhật', 'chỉnh sửa', 'thay vào đó'], CANCEL_REQUEST: ['hủy', 'bỏ qua', 'dừng lại']
  }},
  'th-TH': { markers: ['ฉัน', 'กิน', 'แคลอรี', 'โปรตีน', 'เตือน'], lexicon: {
    ADD_TO_BASKET: ['เพิ่ม', 'เพิ่มลงตะกร้า'], REMOVE_FROM_BASKET: ['ลบ', 'ลบออกจากตะกร้า'], RECOMMEND_MEAL: ['กินอะไรดี', 'ควรกินอะไร', 'แนะนำอาหาร', 'อาหารเย็น', 'อาหารกลางวัน', 'อาหารเช้า'], GET_NUTRITION_SUMMARY: ['แคลอรี', 'โปรตีน', 'โภชนาการ'], CREATE_REMINDER: ['เตือนฉัน', 'ตั้งเตือน'], UPDATE_REQUEST: ['เปลี่ยน', 'อัปเดต', 'แก้ไข'], CANCEL_REQUEST: ['ยกเลิก', 'หยุด']
  }},
  'id-ID': { markers: ['saya', 'makan', 'kalori', 'protein', 'ingatkan'], lexicon: {
    ADD_TO_BASKET: ['tambah', 'tambahkan ke keranjang', 'masukkan ke keranjang'], REMOVE_FROM_BASKET: ['hapus', 'hapus dari keranjang', 'keluarkan dari keranjang'], RECOMMEND_MEAL: ['makan apa', 'saya harus makan apa', 'rekomendasikan makanan', 'makan malam', 'makan siang', 'sarapan'], GET_NUTRITION_SUMMARY: ['kalori', 'protein', 'nutrisi'], CREATE_REMINDER: ['ingatkan saya', 'pengingat'], UPDATE_REQUEST: ['ubah', 'perbarui', 'edit', 'sebagai gantinya'], CANCEL_REQUEST: ['batalkan', 'batal', 'lupakan']
  }},
  'ms-MY': { markers: ['saya', 'makan', 'kalori', 'protein', 'ingatkan'], lexicon: {
    ADD_TO_BASKET: ['tambah', 'tambah ke troli', 'masukkan ke troli'], REMOVE_FROM_BASKET: ['padam', 'buang dari troli', 'keluarkan dari troli'], RECOMMEND_MEAL: ['nak makan apa', 'apa yang patut saya makan', 'cadangkan hidangan', 'makan malam', 'makan tengah hari', 'sarapan'], GET_NUTRITION_SUMMARY: ['kalori', 'protein', 'pemakanan'], CREATE_REMINDER: ['ingatkan saya', 'peringatan'], UPDATE_REQUEST: ['ubah', 'kemas kini', 'edit', 'sebaliknya'], CANCEL_REQUEST: ['batal', 'batalkan', 'lupakan']
  }},
  'fil-PH': { markers: ['ako', 'pagkain', 'calories', 'protein', 'paalala'], lexicon: {
    ADD_TO_BASKET: ['idagdag', 'ilagay sa cart', 'ilagay sa basket'], REMOVE_FROM_BASKET: ['alisin', 'tanggalin sa cart'], RECOMMEND_MEAL: ['ano ang kakainin', 'ano ang dapat kong kainin', 'magrekomenda ng pagkain', 'hapunan', 'tanghalian', 'almusal'], GET_NUTRITION_SUMMARY: ['calories', 'protein', 'nutrisyon'], CREATE_REMINDER: ['paalalahanan ako', 'paalala'], UPDATE_REQUEST: ['baguhin', 'i-update', 'i-edit'], CANCEL_REQUEST: ['kanselahin', 'itigil', 'kalimutan']
  }},
  'sv-SE': { markers: ['jag', 'mat', 'kalorier', 'protein', 'påminn'], lexicon: {
    ADD_TO_BASKET: ['lägg till', 'lägg i kundvagnen'], REMOVE_FROM_BASKET: ['ta bort', 'ta bort från kundvagnen'], RECOMMEND_MEAL: ['vad ska jag äta', 'vad borde jag äta', 'rekommendera en måltid', 'middag', 'lunch', 'frukost'], GET_NUTRITION_SUMMARY: ['kalorier', 'protein', 'näring'], CREATE_REMINDER: ['påminn mig', 'påminnelse'], UPDATE_REQUEST: ['ändra', 'uppdatera', 'redigera'], CANCEL_REQUEST: ['avbryt', 'glöm det']
  }},
  'no-NO': { markers: ['jeg', 'mat', 'kalorier', 'protein', 'påminn'], lexicon: {
    ADD_TO_BASKET: ['legg til', 'legg i handlekurven'], REMOVE_FROM_BASKET: ['fjern', 'fjern fra handlekurven'], RECOMMEND_MEAL: ['hva skal jeg spise', 'hva bør jeg spise', 'anbefal et måltid', 'middag', 'lunsj', 'frokost'], GET_NUTRITION_SUMMARY: ['kalorier', 'protein', 'ernæring'], CREATE_REMINDER: ['minn meg på', 'påminnelse'], UPDATE_REQUEST: ['endre', 'oppdater', 'rediger'], CANCEL_REQUEST: ['avbryt', 'glem det']
  }},
  'da-DK': { markers: ['jeg', 'mad', 'kalorier', 'protein', 'mind'], lexicon: {
    ADD_TO_BASKET: ['tilføj', 'læg i kurven'], REMOVE_FROM_BASKET: ['fjern', 'fjern fra kurven'], RECOMMEND_MEAL: ['hvad skal jeg spise', 'hvad bør jeg spise', 'anbefal et måltid', 'aftensmad', 'frokost', 'morgenmad'], GET_NUTRITION_SUMMARY: ['kalorier', 'protein', 'ernæring'], CREATE_REMINDER: ['mind mig om', 'påmindelse'], UPDATE_REQUEST: ['ændre', 'opdater', 'rediger'], CANCEL_REQUEST: ['annuller', 'glem det']
  }},
  'fi-FI': { markers: ['minä', 'ruoka', 'kalorit', 'proteiini', 'muistuta'], lexicon: {
    ADD_TO_BASKET: ['lisää', 'lisää ostoskoriin'], REMOVE_FROM_BASKET: ['poista', 'poista ostoskorista'], RECOMMEND_MEAL: ['mitä syön', 'mitä minun pitäisi syödä', 'suosittele ateriaa', 'illallinen', 'lounas', 'aamiainen'], GET_NUTRITION_SUMMARY: ['kalorit', 'proteiini', 'ravinto'], CREATE_REMINDER: ['muistuta minua', 'muistutus'], UPDATE_REQUEST: ['muuta', 'päivitä', 'muokkaa'], CANCEL_REQUEST: ['peruuta', 'unohtaa']
  }},
  'cs-CZ': { markers: ['já', 'jídlo', 'kalorie', 'protein', 'připomeň'], lexicon: {
    ADD_TO_BASKET: ['přidej', 'přidej do košíku'], REMOVE_FROM_BASKET: ['odstraň', 'odeber z košíku'], RECOMMEND_MEAL: ['co jíst', 'co bych měl jíst', 'doporuč jídlo', 'večeře', 'oběd', 'snídaně'], GET_NUTRITION_SUMMARY: ['kalorie', 'protein', 'výživa'], CREATE_REMINDER: ['připomeň mi', 'připomínka'], UPDATE_REQUEST: ['změň', 'aktualizuj', 'uprav'], CANCEL_REQUEST: ['zruš', 'zapomeň']
  }},
  'sk-SK': { markers: ['ja', 'jedlo', 'kalórie', 'bielkoviny', 'pripomeň'], lexicon: {
    ADD_TO_BASKET: ['pridaj', 'pridaj do košíka'], REMOVE_FROM_BASKET: ['odstráň', 'vyber z košíka'], RECOMMEND_MEAL: ['čo jesť', 'čo mám jesť', 'odporuč jedlo', 'večera', 'obed', 'raňajky'], GET_NUTRITION_SUMMARY: ['kalórie', 'bielkoviny', 'výživa'], CREATE_REMINDER: ['pripomeň mi', 'pripomienka'], UPDATE_REQUEST: ['zmeň', 'aktualizuj', 'uprav'], CANCEL_REQUEST: ['zruš', 'zabudni']
  }},
  'hu-HU': { markers: ['én', 'étel', 'kalória', 'fehérje', 'emlékeztess'], lexicon: {
    ADD_TO_BASKET: ['add hozzá', 'tedd a kosárba'], REMOVE_FROM_BASKET: ['töröld', 'vedd ki a kosárból'], RECOMMEND_MEAL: ['mit egyek', 'mit kellene ennem', 'ajánlj ételt', 'vacsora', 'ebéd', 'reggeli'], GET_NUTRITION_SUMMARY: ['kalória', 'fehérje', 'táplálkozás'], CREATE_REMINDER: ['emlékeztess', 'emlékeztető'], UPDATE_REQUEST: ['változtasd', 'frissítsd', 'szerkeszd'], CANCEL_REQUEST: ['mégsem', 'mondd vissza', 'hagyd']
  }},
  'ro-RO': { markers: ['eu', 'mâncare', 'calorii', 'proteină', 'amintește'], lexicon: {
    ADD_TO_BASKET: ['adaugă', 'adaugă în coș'], REMOVE_FROM_BASKET: ['șterge', 'elimină din coș'], RECOMMEND_MEAL: ['ce să mănânc', 'ce ar trebui să mănânc', 'recomandă o masă', 'cină', 'prânz', 'mic dejun'], GET_NUTRITION_SUMMARY: ['calorii', 'proteină', 'nutriție'], CREATE_REMINDER: ['amintește-mi', 'memento'], UPDATE_REQUEST: ['schimbă', 'actualizează', 'editează'], CANCEL_REQUEST: ['anulează', 'lasă']
  }},
  'bg-BG': { markers: ['аз', 'храна', 'калории', 'протеин', 'напомни'], lexicon: {
    ADD_TO_BASKET: ['добави', 'добави в количката'], REMOVE_FROM_BASKET: ['премахни', 'махни от количката'], RECOMMEND_MEAL: ['какво да ям', 'какво трябва да ям', 'препоръчай ястие', 'вечеря', 'обяд', 'закуска'], GET_NUTRITION_SUMMARY: ['калории', 'протеин', 'хранене'], CREATE_REMINDER: ['напомни ми', 'напомняне'], UPDATE_REQUEST: ['промени', 'актуализирай', 'редактирай'], CANCEL_REQUEST: ['отмени', 'забрави']
  }},
  'el-GR': { markers: ['εγώ', 'φαγητό', 'θερμίδες', 'πρωτεΐνη', 'θύμισέ'], lexicon: {
    ADD_TO_BASKET: ['πρόσθεσε', 'πρόσθεσε στο καλάθι'], REMOVE_FROM_BASKET: ['αφαίρεσε', 'βγάλε από το καλάθι'], RECOMMEND_MEAL: ['τι να φάω', 'τι πρέπει να φάω', 'πρότεινε γεύμα', 'βραδινό', 'μεσημεριανό', 'πρωινό'], GET_NUTRITION_SUMMARY: ['θερμίδες', 'πρωτεΐνη', 'διατροφή'], CREATE_REMINDER: ['θύμισέ μου', 'υπενθύμιση'], UPDATE_REQUEST: ['άλλαξε', 'ενημέρωσε', 'επεξεργάσου'], CANCEL_REQUEST: ['ακύρωσε', 'άστο']
  }},
  'sr-RS': { markers: ['ја', 'храна', 'калорије', 'протеин', 'подсети'], lexicon: {
    ADD_TO_BASKET: ['додај', 'додај у корпу'], REMOVE_FROM_BASKET: ['уклони', 'обриши из корпе'], RECOMMEND_MEAL: ['шта да једем', 'шта треба да једем', 'предложи оброк', 'вечера', 'ручак', 'доручак'], GET_NUTRITION_SUMMARY: ['калорије', 'протеин', 'исхрана'], CREATE_REMINDER: ['подсети ме', 'подсетник'], UPDATE_REQUEST: ['промени', 'ажурирај', 'измени'], CANCEL_REQUEST: ['откажи', 'заборави']
  }},
  'hr-HR': { markers: ['ja', 'hrana', 'kalorije', 'protein', 'podsjeti'], lexicon: {
    ADD_TO_BASKET: ['dodaj', 'dodaj u košaricu'], REMOVE_FROM_BASKET: ['ukloni', 'izbaci iz košarice'], RECOMMEND_MEAL: ['što da jedem', 'što bih trebao jesti', 'preporuči obrok', 'večera', 'ručak', 'doručak'], GET_NUTRITION_SUMMARY: ['kalorije', 'protein', 'prehrana'], CREATE_REMINDER: ['podsjeti me', 'podsjetnik'], UPDATE_REQUEST: ['promijeni', 'ažuriraj', 'uredi'], CANCEL_REQUEST: ['otkaži', 'zaboravi']
  }},
  'sl-SI': { markers: ['jaz', 'hrana', 'kalorije', 'beljakovine', 'opomni'], lexicon: {
    ADD_TO_BASKET: ['dodaj', 'dodaj v košarico'], REMOVE_FROM_BASKET: ['odstrani', 'odstrani iz košarice'], RECOMMEND_MEAL: ['kaj naj jem', 'kaj bi moral jesti', 'priporoči obrok', 'večerja', 'kosilo', 'zajtrk'], GET_NUTRITION_SUMMARY: ['kalorije', 'beljakovine', 'prehrana'], CREATE_REMINDER: ['opomni me', 'opomnik'], UPDATE_REQUEST: ['spremeni', 'posodobi', 'uredi'], CANCEL_REQUEST: ['prekliči', 'pozabi']
  }},
  'sw-KE': { markers: ['mimi', 'chakula', 'kalori', 'protini', 'nikumbushe'], lexicon: {
    ADD_TO_BASKET: ['ongeza', 'ongeza kwenye kikapu', 'weka kwenye kikapu'], REMOVE_FROM_BASKET: ['ondoa', 'ondoa kwenye kikapu'], RECOMMEND_MEAL: ['nile nini', 'ninapaswa kula nini', 'pendekeza chakula', 'chakula cha jioni', 'chakula cha mchana', 'kifungua kinywa'], GET_NUTRITION_SUMMARY: ['kalori', 'protini', 'lishe'], CREATE_REMINDER: ['nikumbushe', 'ukumbusho'], UPDATE_REQUEST: ['badilisha', 'sasisha', 'hariri'], CANCEL_REQUEST: ['ghairi', 'acha']
  }},
  'am-ET': { markers: ['እኔ', 'ምግብ', 'ካሎሪ', 'ፕሮቲን', 'አስታውሰኝ'], lexicon: {
    ADD_TO_BASKET: ['ጨምር', 'ወደ ጋሪ ጨምር'], REMOVE_FROM_BASKET: ['አስወግድ', 'ከጋሪ አስወግድ'], RECOMMEND_MEAL: ['ምን ልብላ', 'ምን መብላት አለብኝ', 'ምግብ አስተካክል', 'እራት', 'ምሳ', 'ቁርስ'], GET_NUTRITION_SUMMARY: ['ካሎሪ', 'ፕሮቲን', 'አመጋገብ'], CREATE_REMINDER: ['አስታውሰኝ', 'ማስታወሻ'], UPDATE_REQUEST: ['ቀይር', 'አዘምን', 'አርም'], CANCEL_REQUEST: ['ሰርዝ', 'ተወው']
  }},
};

const FALLBACK_PROFILES: Record<SupportedLocalLanguage, LanguageProfile> = {
  ...PROFILES,
  'en-US': { markers: ['the', 'you', 'meal', 'calories', 'protein', 'remind'], lexicon: COMMON_ENGLISH },
  'en-GB': { markers: ['the', 'you', 'meal', 'calories', 'protein', 'remind'], lexicon: COMMON_ENGLISH },
  'bn-IN': PROFILES['bn-IN'],
  'pa-IN': PROFILES['pa-IN'],
  'gu-IN': PROFILES['gu-IN'],
  'mr-IN': PROFILES['mr-IN'],
  'ta-IN': PROFILES['ta-IN'],
  'te-IN': PROFILES['te-IN'],
  'ja-JP': PROFILES['ja-JP'],
  'ko-KR': PROFILES['ko-KR'],
  'zh-CN': PROFILES['zh-CN'],
  'zh-TW': PROFILES['zh-TW'],
  'vi-VN': PROFILES['vi-VN'],
  'th-TH': PROFILES['th-TH'],
  'id-ID': PROFILES['id-ID'],
  'ms-MY': PROFILES['ms-MY'],
  'fil-PH': PROFILES['fil-PH'],
  'sv-SE': PROFILES['sv-SE'],
  'no-NO': PROFILES['no-NO'],
  'da-DK': PROFILES['da-DK'],
  'fi-FI': PROFILES['fi-FI'],
  'cs-CZ': PROFILES['cs-CZ'],
  'sk-SK': PROFILES['sk-SK'],
  'hu-HU': PROFILES['hu-HU'],
  'ro-RO': PROFILES['ro-RO'],
  'bg-BG': PROFILES['bg-BG'],
  'el-GR': PROFILES['el-GR'],
  'sr-RS': PROFILES['sr-RS'],
  'hr-HR': PROFILES['hr-HR'],
  'sl-SI': PROFILES['sl-SI'],
  'sw-KE': PROFILES['sw-KE'],
  'am-ET': PROFILES['am-ET'],
  'fa-IR': PROFILES['fa-IR'],
  'fa-AF': PROFILES['fa-AF'],
  'fa-TJ': PROFILES['fa-TJ'],
  'es-ES': PROFILES['es-ES'],
  'es-MX': PROFILES['es-MX'],
  'fr-FR': PROFILES['fr-FR'],
  'de-DE': PROFILES['de-DE'],
  'it-IT': PROFILES['it-IT'],
  'pt-BR': PROFILES['pt-BR'],
  'pt-PT': PROFILES['pt-PT'],
  'ru-RU': PROFILES['ru-RU'],
  'uk-UA': PROFILES['uk-UA'],
  'pl-PL': PROFILES['pl-PL'],
  'nl-NL': PROFILES['nl-NL'],
  'tr-TR': PROFILES['tr-TR'],
  'ar-SA': PROFILES['ar-SA'],
  'he-IL': PROFILES['he-IL'],
  'hi-IN': PROFILES['hi-IN'],
  'ur-PK': PROFILES['ur-PK'],
};

const LANGUAGE_MARKERS: readonly [SupportedLocalLanguage, readonly string[]][] = Object.entries(FALLBACK_PROFILES).map(
  ([code, profile]) => [code as SupportedLocalLanguage, profile.markers],
);

@Injectable()
export class LocalLanguageUnderstandingService {
  understand(input: string, preferredLanguage?: string): LocalUnderstanding {
    const detected = this.detectLanguage(input, preferredLanguage);
    const normalizedText = this.normalize(input);
    const entities: Record<string, string | number | boolean | string[]> = {};
    const quantity = this.extractQuantity(normalizedText, detected);
    if (quantity !== undefined) entities.quantity = quantity;
    const time = this.extractTime(normalizedText, detected);
    if (time) entities.time = time;
    const duration = normalizedText.match(/\b(\d{1,3})\s*(?:دقیقه|min|mins|minute|minutes|minutes?|minutos?|minutos?|минут|分鐘|分)\b/i);
    if (duration) entities.durationMinutes = Number(duration[1]);
    const calories = normalizedText.match(/\b(\d{2,5})\s*(?:کالری|cal|calories|calorías|calories?|kalorien|calorie|калорий|卡路里|कैलोरी)\b/i);
    if (calories) entities.calories = Number(calories[1]);
    const mealType = this.findMealType(normalizedText, detected);
    if (mealType) entities.mealType = mealType;
    const food = this.findFood(normalizedText);
    if (food) entities.food = food;
    const referencesPrevious = this.hasReference(normalizedText);
    if (referencesPrevious) entities.referencesPrevious = true;
    const excludedFoods = this.findNegatedFoods(normalizedText, detected);
    if (excludedFoods.length) entities.excludedFoods = excludedFoods;
    if (this.matches(normalizedText, this.phrases(detected, ['خودت', 'اتوماتیک', 'هوشمند', 'خودکار', 'automatically', 'smartly']))) entities.wantsAutomation = true;

    for (const intent of [
      'CANCEL_REQUEST',
      'UPDATE_REQUEST',
      'ADD_TO_BASKET',
      'REMOVE_FROM_BASKET',
      'CREATE_REMINDER',
      'RECOMMEND_MEAL',
      'GET_NUTRITION_SUMMARY',
    ] as const) {
      const phrases = this.lexicon(detected)[intent] ?? [];
      if (this.matches(normalizedText, phrases)) {
        const confidence = this.intentConfidence(intent, detected, normalizedText, referencesPrevious);
        return this.result(intent, entities, confidence, normalizedText, detected);
      }
    }
    return this.result('UNKNOWN', entities, 0, normalizedText, detected);
  }

  private detectLanguage(input: string, preferredLanguage?: string): SupportedLocalLanguage {
    if (this.isSupportedLanguage(preferredLanguage)) return preferredLanguage;
    const normalized = this.normalize(input);
    let best: SupportedLocalLanguage = 'en-US';
    let bestScore = 0;
    for (const [language, markers] of LANGUAGE_MARKERS) {
      const score = markers.reduce((sum, marker) => sum + (normalized.includes(marker) ? 1 : 0), 0);
      if (score > bestScore) {
        best = language;
        bestScore = score;
      }
    }
    if (bestScore > 0) return best;
    if (/^[\p{Script=Arabic}\s\p{P}]+$/u.test(normalized)) return 'fa-IR';
    if (/^[\p{Script=Han}\s\p{P}]+$/u.test(normalized)) return 'zh-CN';
    if (/^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\s\p{P}]+$/u.test(normalized)) return 'ja-JP';
    if (/^[\p{Script=Hangul}\s\p{P}]+$/u.test(normalized)) return 'ko-KR';
    return best;
  }

  private isSupportedLanguage(value: string | undefined): value is SupportedLocalLanguage {
    return !!value && value in FALLBACK_PROFILES;
  }

  private lexicon(language: SupportedLocalLanguage): IntentLexicon {
    return FALLBACK_PROFILES[language].lexicon;
  }

  private phrases(language: SupportedLocalLanguage, fallback: string[]): readonly string[] {
    return [...fallback, ...(this.lexicon(language).UNKNOWN ?? [])];
  }

  private intentConfidence(intent: LocalIntent, language: SupportedLocalLanguage, text: string, referencesPrevious: boolean): number {
    const phraseCount = (this.lexicon(language)[intent] ?? []).filter((phrase) => text.includes(this.normalize(phrase))).length;
    const base = Math.min(0.98, 0.84 + phraseCount * 0.04);
    if ((intent === 'UPDATE_REQUEST' || intent === 'CANCEL_REQUEST') && referencesPrevious) return Math.min(0.99, base + 0.05);
    return base;
  }

  private normalize(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[ۀة]/g, 'ه')
      .replace(/‌/g, ' ')
      .replace(/[؟?!،؛,.]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private extractQuantity(text: string, language: SupportedLocalLanguage): number | undefined {
    const numeric = text.match(/\b(\d+(?:\.\d+)?)\b/);
    if (numeric) return Number(numeric[1]);
    const words: Record<string, number> = {
      یک: 1, یه: 1, یکی: 1, دو: 2, دوتا: 2, سه: 3, 'سه تا': 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10,
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      uno: 1, dos: 2, tres: 3, quatre: 4,
      onee: 1,
    };
    for (const [word, value] of Object.entries(words)) if (text.includes(` ${word} `) || text.startsWith(`${word} `) || text.endsWith(` ${word}`)) return value;
    if (language === 'de-DE' && text.includes('zwei')) return 2;
    if (language === 'fr-FR' && text.includes('deux')) return 2;
    return undefined;
  }

  private extractTime(text: string, language: SupportedLocalLanguage): string | undefined {
    const clock = text.match(/\b([01]?\d|2[0-3])\s*(?::|\.)([0-5]\d)\b/);
    if (clock) return `${clock[1].padStart(2, '0')}:${clock[2]}`;
    const hour = text.match(/(?:ساعت|at|à|um|a las|a la|um|om|kl|kello|час)\s*(\d{1,2})\b/);
    if (hour && Number(hour[1]) <= 23) return `${hour[1].padStart(2, '0')}:00`;
    if (language.startsWith('zh') && /[一二三四五六七八九十]点/.test(text)) return undefined;
    return undefined;
  }

  private findMealType(text: string, language: SupportedLocalLanguage): string | undefined {
    const map: Array<[string, string[]]> = [
      ['breakfast', ['صبحانه', 'صبح', 'breakfast', 'desayuno', 'petit-déjeuner', 'frühstück', 'colazione', 'café da manhã', 'завтрак', 'śniadanie', 'ontbijt', 'kahvaltı', 'فطور', 'नाश्ता', '朝食', '아침', '早餐', 'bữa sáng', 'sarapan', 'frukost', 'frokost', 'morgenmad', 'aamiainen', 'snídaně', 'raňajky', 'reggeli', 'mic dejun', 'закуска', 'πρωινό', 'доручак', 'doručak', 'zajtrk', 'kifungua kinywa', 'ቁርስ']],
      ['lunch', ['ناهار', 'ظهر', 'lunch', 'almuerzo', 'déjeuner', 'mittagessen', 'pranzo', 'almoço', 'обед', 'obiad', 'lunch', 'öğle yemeği', 'غداء', 'दोपहर का खाना', '昼食', '점심', '午饭', '午餐', 'bữa trưa', 'makan siang', 'lunsj', 'frokost', 'lounas', 'oběd', 'obed', 'ebéd', 'prânz', 'обяд', 'μεσημεριανό', 'ручак', 'ručak', 'kosilo', 'chakula cha mchana', 'ምሳ']],
      ['dinner', ['شام', 'شب', 'dinner', 'cena', 'dîner', 'abendessen', 'cena', 'jantar', 'ужин', 'kolacja', 'avondeten', 'akşam yemeği', 'عشاء', 'रात का खाना', '夕食', '저녁', '晚饭', '晚餐', 'bữa tối', 'makan malam', 'middag', 'aftensmad', 'illallinen', 'večeře', 'večera', 'vacsora', 'cină', 'вечеря', 'βραδινό', 'вечера', 'večera', 'večerja', 'chakula cha jioni', 'እራት']],
    ];
    return map.find(([, phrases]) => phrases.some((phrase) => text.includes(phrase)))?.[0];
  }

  private findFood(text: string): string | undefined {
    const foods: Record<string, string> = {
      'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', 'تخم‌مرغ': 'eggs', milk: 'milk', eggs: 'eggs', مرغ: 'chicken', chicken: 'chicken', برنج: 'rice', rice: 'rice', ماست: 'yogurt', yogurt: 'yogurt', نان: 'bread', bread: 'bread', موز: 'banana', banana: 'banana', سیب: 'apple', apple: 'apple', پنیر: 'cheese', cheese: 'cheese',
    };
    return Object.entries(foods).sort(([a], [b]) => b.length - a.length).find(([phrase]) => text.includes(phrase))?.[1];
  }

  private findNegatedFoods(text: string, language: SupportedLocalLanguage): string[] {
    const foods = this.findAllFoods(text);
    const excluded: string[] = [];
    const negations = ['نه', 'بدون', 'نذار', 'نمیخوام', 'no', 'without', 'sin', 'sans', 'ohne', 'senza', 'sem', 'без', 'sin', 'sans', 'без', 'sin', 'بدون'];
    for (const [phrase, value] of Object.entries(foods)) {
      const index = text.indexOf(phrase);
      if (index >= 0 && this.matches(text.slice(Math.max(0, index - 24), index), [...negations, ...(this.lexicon(language).REMOVE_FROM_BASKET ?? [])])) excluded.push(value);
    }
    return [...new Set(excluded)];
  }

  private findAllFoods(text: string): Record<string, string> {
    return {
      'سینه مرغ': 'chicken', 'ماست کم چرب': 'yogurt', 'تخم مرغ': 'eggs', شیر: 'milk', مرغ: 'chicken', برنج: 'rice', ماست: 'yogurt', نان: 'bread', موز: 'banana', سیب: 'apple', پنیر: 'cheese', chicken: 'chicken', milk: 'milk', eggs: 'eggs', rice: 'rice', yogurt: 'yogurt', bread: 'bread', banana: 'banana', apple: 'apple', cheese: 'cheese'
    };
  }

  private hasReference(text: string): boolean {
    return this.matches(text, [
      'همون', 'همین', 'اینو', 'اونو', 'این یکی', 'اون یکی', 'قبلی', 'دوباره', 'همونی که', 'همون که', 'به جاش', 'بجاش', 'the previous', 'that one', 'same',
      'el anterior', 'la anterior', 'le précédent', 'das vorherige', 'quello di prima', 'о том же', 'той самий', 'lo anterior', 'lo stesso', 'la même', 'même chose', 'dasselbe', 'la stessa cosa', 'o mesmo', 'той же', 'to samo', 'hetzelfde', 'aynısı', 'نفسه', '同じ', '같은 것', '一样', 'giống vậy'
    ]);
  }

  private matches(text: string, phrases: readonly string[]): boolean {
    return phrases.some((phrase) => text.includes(this.normalize(phrase)));
  }

  private result(intent: LocalIntent, entities: Record<string, string | number | boolean | string[]>, confidence: number, normalizedText: string, language: SupportedLocalLanguage): LocalUnderstanding {
    return { intent, entities, confidence, normalizedText, language, languageConfidence: language === 'en-US' ? 0.6 : 0.92 };
  }
}
