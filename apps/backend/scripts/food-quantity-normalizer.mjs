const UNITS = new Map([
  ['ml','ml'],['milliliter','ml'],['milliliters','ml'],['میلی لیتر','ml'],
  ['l','l'],['liter','l'],['liters','l'],['لیتر','l'],
  ['g','g'],['gram','g'],['grams','g'],['گرم','g'],
  ['kg','kg'],['kilogram','kg'],['kilograms','kg'],['کیلو','kg'],['کیلوگرم','kg'],
  ['oz','oz'],['ounce','oz'],['ounces','oz'],
  ['lb','lb'],['lbs','lb'],['pound','lb'],['pounds','lb'],
  ['cup','cup'],['cups','cup'],['فنجان','cup'],['لیوان','cup'],
  ['tbsp','tbsp'],['tablespoon','tbsp'],['tablespoons','tbsp'],['قاشق غذاخوری','tbsp'],
  ['tsp','tsp'],['teaspoon','tsp'],['teaspoons','tsp'],['قاشق چایخوری','tsp'],
]);
const FRACTIONS = {'¼':.25,'½':.5,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875};
export function parseNumber(value){const s=String(value||'').trim();if(FRACTIONS[s]!=null)return FRACTIONS[s];if(/^\d+\/\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return b?a/b:null;}if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);const m=s.match(/^(\d+)\s+(\d+\/\d+)$/);if(m){const [a,b]=m[2].split('/').map(Number);return b?Number(m[1])+a/b:null;}return null;}
export function normalizeQuantity(input){const raw=String(input||'').trim();const m=raw.match(/^\s*(\d+(?:\.\d+)?|\d+\s+\d+\/\d+|\d+\/\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\s*([^\d\s][^\d]*|[A-Za-z]+)?\s*(.*)$/u);if(!m)return{raw,quantity:null,unit:null,remainder:raw,confidence:0};const quantity=parseNumber(m[1]);if(quantity==null)return{raw,quantity:null,unit:null,remainder:raw,confidence:0};const unit=UNITS.get(String(m[2]||'').trim().toLowerCase())||null;return{raw,quantity,unit,remainder:String(m[3]||'').trim(),confidence:unit?1:.7};}
export function convertToBase(quantity,unit){if(quantity==null||!unit)return null;const factors={ml:1,l:1000,g:1,kg:1000,oz:28.349523125,lb:453.59237};return factors[unit]!=null?{value:quantity*factors[unit],base_unit:unit==='l'||unit==='ml'?'ml':'g'}:null;}
