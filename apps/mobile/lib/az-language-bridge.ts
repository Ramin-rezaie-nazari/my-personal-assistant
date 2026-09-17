const TR_TO_AZ: Array<[RegExp, string]> = [
  [/\bbenim\b/giu, 'mənim'], [/\bsenin\b/giu, 'sənin'], [/\bsiz\b/giu, 'siz'], [/\bsen\b/giu, 'sən'], [/\bben\b/giu, 'mən'],
  [/\bve\b/giu, 'və'], [/\biçin\b/giu, 'üçün'], [/\bgibi\b/giu, 'kimi'], [/\bşimdi\b/giu, 'indi'], [/\bşimdi\b/giu, 'indi'],
  [/\bbügün\b/giu, 'bu gün'], [/\byarın\b/giu, 'sabah'], [/\bönce\b/giu, 'əvvəl'], [/\bsonra\b/giu, 'sonra'],
  [/\bsabah kahvaltısı\b/giu, 'səhər yeməyi'], [/\bkahvaltı\b/giu, 'səhər yeməyi'], [/\böğle yemeği\b/giu, 'günorta yeməyi'], [/\böğle\b/giu, 'günorta'], [/\bakşam yemeği\b/giu, 'axşam yeməyi'],
  [/\btavuk göğsü\b/giu, 'toyuq döşü'], [/\btavuk\b/giu, 'toyuq'], [/\bsüt\b/giu, 'süd'], [/\byoğurt\b/giu, 'qatıq'], [/\byumurta\b/giu, 'yumurta'],
  [/\bekmek\b/giu, 'çörək'], [/\bpirinç\b/giu, 'düyü'], [/\bpeynir\b/giu, 'pendir'], [/\belma\b/giu, 'alma'], [/\bmuz\b/giu, 'banan'],
  [/\bkalori\b/giu, 'kalori'], [/\bprotein\b/giu, 'zülal'], [/\bhatırlatıcılar?\b/giu, 'xatırlatmalar'], [/\bhatırlat\b/giu, 'xatırlat'],
  [/\bekle\b/giu, 'əlavə et'], [/\bekleyeceğim\b/giu, 'əlavə edəcəyəm'], [/\bçıkar\b/giu, 'sil'], [/\bsil\b/giu, 'sil'],
  [/\bsepet\b/giu, 'səbət'], [/\balışveriş\b/giu, 'alış-veriş'], [/\btakvim\b/giu, 'təqvim'], [/\bbildirimler\b/giu, 'bildirişlər'], [/\bbildirim\b/giu, 'bildiriş'],
  [/\böneriler\b/giu, 'tövsiyələr'], [/\böneri\b/giu, 'tövsiyə'], [/\bönemli\b/giu, 'vacib'], [/\buygun\b/giu, 'uyğun'], [/\bsağlık\b/giu, 'sağlamlıq'],
  [/\bantrenman\b/giu, 'məşq'], [/\begzersiz\b/giu, 'məşq'], [/\bspor\b/giu, 'idman'], [/\btakviyeler\b/giu, 'əlavələr'], [/\btakviye\b/giu, 'əlavə'],
  [/\bplanın\b/giu, 'planın'], [/\bplanı\b/giu, 'planı'], [/\bplan\b/giu, 'plan'], [/\byardımcı\b/giu, 'köməkçi'], [/\basistan\b/giu, 'köməkçi'],
  [/\bkontrol edeceğim\b/giu, 'yoxlayacağam'], [/\bkontrol et\b/giu, 'yoxla'], [/\bkontrol\b/giu, 'yoxlama'], [/\byapacağım\b/giu, 'edəcəyəm'], [/\byapıyorum\b/giu, 'edirəm'],
  [/\byap\b/giu, 'et'], [/\btamamlandı\b/giu, 'tamamlandı'], [/\btamam\b/giu, 'tamam'], [/\bşey\b/giu, 'şey'], [/\bşeyler\b/giu, 'şeylər'],
  [/\bçünkü\b/giu, 'çünki'], [/\bama\b/giu, 'amma'], [/\byalnızca\b/giu, 'yalnız'], [/\bhemen\b/giu, 'indi'],
  [/\bben\s+buradayım\b/giu, 'mən buradayam'], [/\bsize\b/giu, 'sizə'], [/\bsana\b/giu, 'sənə'], [/\bbenimle\b/giu, 'mənimlə'], [/\bseninle\b/giu, 'səninlə'],
];

const AZ_TO_TR: Array<[RegExp, string]> = [...TR_TO_AZ].reverse().map(([pattern, replacement]) => {
  const pairs: Record<string, string> = {
    'mənim': 'benim', 'sənin': 'senin', 'siz': 'siz', 'sən': 'sen', 'mən': 'ben', 'və': 've', 'üçün': 'için', 'kimi': 'gibi', 'indi': 'şimdi',
    'bu gün': 'bugün', 'sabah': 'yarın', 'əvvəl': 'önce', 'sonra': 'sonra', 'səhər yeməyi': 'kahvaltı', 'günorta yeməyi': 'öğle yemeği', 'günorta': 'öğle',
    'axşam yeməyi': 'akşam yemeği', 'toyuq döşü': 'tavuk göğsü', 'toyuq': 'tavuk', 'süd': 'süt', 'qatıq': 'yoğurt', 'yumurta': 'yumurta', 'çörək': 'ekmek',
    'düyü': 'pirinç', 'pendir': 'peynir', 'alma': 'elma', 'banan': 'muz', 'zülal': 'protein', 'xatırlatmalar': 'hatırlatmalar', 'xatırlat': 'hatırlat',
    'əlavə edəcəyəm': 'ekleyeceğim', 'əlavə et': 'ekle', 'sil': 'sil', 'səbət': 'sepet', 'alış-veriş': 'alışveriş', 'təqvim': 'takvim', 'bildirişlər': 'bildirimler',
    'bildiriş': 'bildirim', 'tövsiyələr': 'öneriler', 'tövsiyə': 'öneri', 'vacib': 'önemli', 'uyğun': 'uygun', 'sağlamlıq': 'sağlık', 'məşq': 'antrenman',
    'idman': 'spor', 'əlavələr': 'takviyeler', 'əlavə': 'takviye', 'köməkçi': 'asistan', 'yoxlayacağam': 'kontrol edeceğim', 'yoxla': 'kontrol et',
    'yoxlama': 'kontrol', 'edəcəyəm': 'yapacağım', 'edirəm': 'yapıyorum', 'et': 'yap', 'çünki': 'çünkü', 'amma': 'ama', 'yalnız': 'yalnız', 'sənə': 'sana', 'mənimlə': 'benimle', 'səninlə': 'seninle',
  };
  return [new RegExp(`(^|\\s)${replacement}(?=\\s|[,.!?;:]|$)`, 'giu'), pairs[replacement] ?? replacement];
});

function applyLexicon(text: string, rules: Array<[RegExp, string]>): string {
  let result = text;
  for (const [pattern, replacement] of rules) result = result.replace(pattern, replacement);
  return result.replace(/\s{2,}/g, ' ').trim();
}

export function turkishToIranianAzerbaijani(text: string): string {
  return applyLexicon(text, TR_TO_AZ);
}

export function iranianAzerbaijaniToTurkish(text: string): string {
  return applyLexicon(text, AZ_TO_TR);
}

export function looksLikeIranianAzerbaijani(text: string): boolean {
  return /[əğıöüşçİı]/iu.test(text) || /\b(mən|sən|və|üçün|indi|qatıq|toyuq|çörək|düyü|səbət|təqvim|bildiriş|tövsiyə|məşq)\b/iu.test(text);
}
