import type { PriceSourceKind } from '../models/price-intelligence.model';

export type GlobalMarketSourceRole = 'retailer' | 'aggregator' | 'discovery';

export type GlobalMarketSource = {
  id: string;
  name: string;
  kind: PriceSourceKind | 'retailer_network' | 'grocery_aggregator' | 'marketplace' | 'discovery';
  role: GlobalMarketSourceRole;
  baseUrl: string;
  searchUrlTemplate: string;
  enabled: boolean;
};

export type GlobalMarketProfile = {
  countryCode: string;
  sourceIds: string[];
  coverage: 'direct_and_aggregator' | 'discovery_only';
};

export const GLOBAL_MARKET_COUNTRY_CODES = 'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CR CI HR CU CY CZ CD DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT PS QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW'.split(' ');

export const GLOBAL_MARKET_SOURCES: Readonly<Record<string, GlobalMarketSource>> = {
  'wolt': { id: 'wolt', name: 'Wolt', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://wolt.com/', searchUrlTemplate: 'https://wolt.com/en/search?q={query}', enabled: true },
  'glovo': { id: 'glovo', name: 'Glovo', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://glovoapp.com/', searchUrlTemplate: 'https://glovoapp.com/en/search/{query}/', enabled: true },
  'foodpanda': { id: 'foodpanda', name: 'foodpanda', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.foodpanda.com/', searchUrlTemplate: 'https://www.foodpanda.com/search?q={query}', enabled: true },
  'talabat': { id: 'talabat', name: 'talabat', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.talabat.com/', searchUrlTemplate: 'https://www.talabat.com/search?query={query}', enabled: true },
  'hungerstation': { id: 'hungerstation', name: 'HungerStation', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://hungerstation.com/', searchUrlTemplate: 'https://hungerstation.com/search?query={query}', enabled: true },
  'yemeksepeti': { id: 'yemeksepeti', name: 'Yemeksepeti', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.yemeksepeti.com/', searchUrlTemplate: 'https://www.yemeksepeti.com/search?query={query}', enabled: true },
  'pedidosya': { id: 'pedidosya', name: 'PedidosYa', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.pedidosya.com/', searchUrlTemplate: 'https://www.pedidosya.com/search?q={query}', enabled: true },
  'efood': { id: 'efood', name: 'efood', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.e-food.gr/', searchUrlTemplate: 'https://www.e-food.gr/search?q={query}', enabled: true },
  'foody': { id: 'foody', name: 'Foody', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.foody.com.cy/', searchUrlTemplate: 'https://www.foody.com.cy/search?q={query}', enabled: true },
  'carrefour': { id: 'carrefour', name: 'Carrefour', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.carrefour.com/', searchUrlTemplate: 'https://www.carrefour.com/search?q={query}', enabled: true },
  'tesco': { id: 'tesco', name: 'Tesco', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.tesco.com/groceries/', searchUrlTemplate: 'https://www.tesco.com/groceries/en-GB/search/default.aspx?searchBox={query}', enabled: true },
  'sainsburys': { id: 'sainsburys', name: "Sainsbury's", kind: 'retailer', role: 'retailer', baseUrl: 'https://www.sainsburys.co.uk/gol-ui/groceries', searchUrlTemplate: 'https://www.sainsburys.co.uk/gol-ui/groceries/searchresults/{query}', enabled: true },
  'asda': { id: 'asda', name: 'ASDA', kind: 'retailer', role: 'retailer', baseUrl: 'https://groceries.asda.com/', searchUrlTemplate: 'https://groceries.asda.com/search/{query}', enabled: true },
  'morrisons': { id: 'morrisons', name: 'Morrisons', kind: 'retailer', role: 'retailer', baseUrl: 'https://groceries.morrisons.com/', searchUrlTemplate: 'https://groceries.morrisons.com/search?entry={query}', enabled: true },
  'ocado': { id: 'ocado', name: 'Ocado', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.ocado.com/', searchUrlTemplate: 'https://www.ocado.com/search?entry={query}', enabled: true },
  'mercadona': { id: 'mercadona', name: 'Mercadona', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.mercadona.es/', searchUrlTemplate: 'https://www.mercadona.es/search?q={query}', enabled: true },
  'conad': { id: 'conad', name: 'Conad', kind: 'retailer', role: 'retailer', baseUrl: 'https://spesaonline.conad.it/', searchUrlTemplate: 'https://spesaonline.conad.it/search?q={query}', enabled: true },
  'auchan': { id: 'auchan', name: 'Auchan', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.auchan.fr/', searchUrlTemplate: 'https://www.auchan.fr/search?q={query}', enabled: true },
  'e_leclerc': { id: 'e_leclerc', name: 'E.Leclerc', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.e.leclerc/', searchUrlTemplate: 'https://www.e.leclerc/recherche?q={query}', enabled: true },
  'walmart': { id: 'walmart', name: 'Walmart', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.walmart.com/', searchUrlTemplate: 'https://www.walmart.com/search?q={query}', enabled: true },
  'walmart_ca': { id: 'walmart_ca', name: 'Walmart Canada', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.walmart.ca/', searchUrlTemplate: 'https://www.walmart.ca/en/search?q={query}', enabled: true },
  'walmart_mx': { id: 'walmart_mx', name: 'Walmart Mexico', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.walmart.com.mx/', searchUrlTemplate: 'https://www.walmart.com.mx/search?q={query}', enabled: true },
  'kroger': { id: 'kroger', name: 'Kroger', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.kroger.com/', searchUrlTemplate: 'https://www.kroger.com/search?searchTerm={query}', enabled: true },
  'instacart': { id: 'instacart', name: 'Instacart', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.instacart.com/', searchUrlTemplate: 'https://www.instacart.com/store/s?k={query}', enabled: true },
  'loblaws': { id: 'loblaws', name: 'Loblaw', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.loblaws.ca/', searchUrlTemplate: 'https://www.loblaws.ca/search?search-bar={query}', enabled: true },
  'sobeys': { id: 'sobeys', name: 'Sobeys', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.sobeys.com/', searchUrlTemplate: 'https://www.sobeys.com/search?q={query}', enabled: true },
  'coles': { id: 'coles', name: 'Coles', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.coles.com.au/', searchUrlTemplate: 'https://www.coles.com.au/search?q={query}', enabled: true },
  'woolworths_au': { id: 'woolworths_au', name: 'Woolworths Australia', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.woolworths.com.au/', searchUrlTemplate: 'https://www.woolworths.com.au/shop/search/products?searchTerm={query}', enabled: true },
  'spar': { id: 'spar', name: 'SPAR International', kind: 'retailer_network', role: 'retailer', baseUrl: 'https://www.spar-international.com/', searchUrlTemplate: 'https://www.spar-international.com/?s={query}', enabled: true },
  'lulu': { id: 'lulu', name: 'LuLu Hypermarket', kind: 'retailer_network', role: 'retailer', baseUrl: 'https://www.luluhypermarket.com/', searchUrlTemplate: 'https://www.luluhypermarket.com/en-ae/search?q={query}', enabled: true },
  'instashop': { id: 'instashop', name: 'InstaShop', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://instashop.com/', searchUrlTemplate: 'https://instashop.com/search?q={query}', enabled: true },
  'baemin': { id: 'baemin', name: 'Baemin', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.baemin.com/', searchUrlTemplate: 'https://www.baemin.com/search?query={query}', enabled: true },
  'coupang': { id: 'coupang', name: 'Coupang', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.coupang.com/', searchUrlTemplate: 'https://www.coupang.com/np/search?q={query}', enabled: true },
  'fairprice': { id: 'fairprice', name: 'FairPrice', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.fairprice.com.sg/', searchUrlTemplate: 'https://www.fairprice.com.sg/search?query={query}', enabled: true },
  'aeon': { id: 'aeon', name: 'AEON', kind: 'retailer_network', role: 'retailer', baseUrl: 'https://www.aeon.com/', searchUrlTemplate: 'https://www.aeon.com/search?q={query}', enabled: true },
  'bigbasket': { id: 'bigbasket', name: 'BigBasket', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.bigbasket.com/', searchUrlTemplate: 'https://www.bigbasket.com/ps/?q={query}', enabled: true },
  'blinkit': { id: 'blinkit', name: 'Blinkit', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://blinkit.com/', searchUrlTemplate: 'https://blinkit.com/s/?q={query}', enabled: true },
  'jiomart': { id: 'jiomart', name: 'JioMart', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.jiomart.com/', searchUrlTemplate: 'https://www.jiomart.com/search/{query}', enabled: true },
  'chaldal': { id: 'chaldal', name: 'Chaldal', kind: 'retailer', role: 'retailer', baseUrl: 'https://chaldal.com/', searchUrlTemplate: 'https://chaldal.com/search/{query}', enabled: true },
  'naheed': { id: 'naheed', name: 'Naheed', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.naheed.pk/', searchUrlTemplate: 'https://www.naheed.pk/catalogsearch/result/?q={query}', enabled: true },
  'keells': { id: 'keells', name: 'Keells', kind: 'retailer', role: 'retailer', baseUrl: 'https://keellssuper.com/', searchUrlTemplate: 'https://keellssuper.com/search?q={query}', enabled: true },
  'klik_indomaret': { id: 'klik_indomaret', name: 'Klik Indomaret', kind: 'retailer', role: 'retailer', baseUrl: 'https://klikindomaret.com/', searchUrlTemplate: 'https://klikindomaret.com/search?q={query}', enabled: true },
  'happyfresh': { id: 'happyfresh', name: 'HappyFresh', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.happyfresh.com/', searchUrlTemplate: 'https://www.happyfresh.com/search?q={query}', enabled: true },
  'bachhoa': { id: 'bachhoa', name: 'Bách Hóa Xanh', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.bachhoaxanh.com/', searchUrlTemplate: 'https://www.bachhoaxanh.com/tim-kiem?s={query}', enabled: true },
  'bigc': { id: 'bigc', name: 'Big C / GO!', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.bigc.co.th/', searchUrlTemplate: 'https://www.bigc.co.th/search?q={query}', enabled: true },
  'lotuss': { id: 'lotuss', name: "Lotus's", kind: 'retailer', role: 'retailer', baseUrl: 'https://www.lotuss.com/', searchUrlTemplate: 'https://www.lotuss.com/en/search?q={query}', enabled: true },
  'pxmart': { id: 'pxmart', name: 'PX Mart', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.pxmart.com.tw/', searchUrlTemplate: 'https://www.pxmart.com.tw/search?q={query}', enabled: true },
  'parknshop': { id: 'parknshop', name: 'PARKnSHOP', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.pns.hk/', searchUrlTemplate: 'https://www.pns.hk/search?q={query}', enabled: true },
  'puregold': { id: 'puregold', name: 'Puregold', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.puregold.com.ph/', searchUrlTemplate: 'https://www.puregold.com.ph/search?q={query}', enabled: true },
  'jumia': { id: 'jumia', name: 'Jumia', kind: 'marketplace', role: 'aggregator', baseUrl: 'https://www.jumia.com/', searchUrlTemplate: 'https://www.jumia.com/search/?q={query}', enabled: true },
  'shoprite': { id: 'shoprite', name: 'Shoprite', kind: 'retailer_network', role: 'retailer', baseUrl: 'https://www.shoprite.co.za/', searchUrlTemplate: 'https://www.shoprite.co.za/search?q={query}', enabled: true },
  'checkers_sixty60': { id: 'checkers_sixty60', name: 'Checkers Sixty60', kind: 'grocery_aggregator', role: 'aggregator', baseUrl: 'https://www.checkers.co.za/', searchUrlTemplate: 'https://www.checkers.co.za/search?q={query}', enabled: true },
  'picknpay': { id: 'picknpay', name: 'Pick n Pay', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.pnp.co.za/', searchUrlTemplate: 'https://www.pnp.co.za/search?q={query}', enabled: true },
  'woolworths_za': { id: 'woolworths_za', name: 'Woolworths South Africa', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.woolworths.co.za/', searchUrlTemplate: 'https://www.woolworths.co.za/corporate/search?query={query}', enabled: true },
  'naivas': { id: 'naivas', name: 'Naivas', kind: 'retailer', role: 'retailer', baseUrl: 'https://www.naivas.co.ke/', searchUrlTemplate: 'https://www.naivas.co.ke/search?q={query}', enabled: true },
  'market_directory': { id: 'market_directory', name: 'ShopByCountries country/platform directory', kind: 'discovery', role: 'discovery', baseUrl: 'https://www.shopbycountries.com/en', searchUrlTemplate: 'https://www.shopbycountries.com/en/search?q={query}', enabled: false },
  'retailer_directory': { id: 'retailer_directory', name: 'FreshPlaza retailer directory', kind: 'discovery', role: 'discovery', baseUrl: 'https://www.freshplaza.com/europe/content/retailers/', searchUrlTemplate: 'https://www.freshplaza.com/europe/content/retailers/?q={query}', enabled: false },
};

export const GLOBAL_MARKET_COUNTRY_SOURCE_OVERRIDES: Readonly<Record<string, string[]>> = {
  AF: ['market_directory','retailer_directory'],
  AL: ['wolt'], AT: ['wolt','tesco','spar'], AZ: ['wolt'],
  AR: ['pedidosya','carrefour'], AM: ['wolt','glovo'], AU: ['coles','woolworths_au'],
  BE: ['carrefour','wolt','spar'], BG: ['wolt','glovo'], BH: ['talabat','lulu','carrefour'],
  BD: ['foodpanda','chaldal'], BR: ['carrefour'], CA: ['walmart_ca','instacart','loblaws','sobeys'],
  CH: ['spar','wolt'], CL: ['pedidosya','carrefour'], CO: ['pedidosya','carrefour'],
  CY: ['wolt','foody'], CZ: ['wolt','tesco'], DE: ['wolt','spar'], DK: ['wolt'],
  DO: ['pedidosya'], EC: ['pedidosya'], EE: ['wolt'], EG: ['talabat','instashop','carrefour'],
  ES: ['mercadona','carrefour','glovo','wolt'], FI: ['wolt'], FR: ['carrefour','auchan','e_leclerc'],
  GB: ['tesco','sainsburys','asda','morrisons','ocado','wolt'], GE: ['wolt','glovo'],
  GR: ['efood','wolt','carrefour'], HK: ['foodpanda','aeon','parknshop'], HR: ['wolt','glovo'],
  HU: ['wolt','tesco'], ID: ['klik_indomaret','happyfresh','aeon'], IE: ['tesco','spar'],
  IL: ['wolt'], IN: ['bigbasket','blinkit','jiomart','lulu'], IR: ['market_directory','retailer_directory'],
  IS: ['wolt'], IT: ['conad','carrefour','glovo','wolt'], JP: ['wolt','aeon'],
  JO: ['talabat','carrefour'], KE: ['jumia','naivas','glovo'], KG: ['wolt','glovo'],
  KH: ['foodpanda'], KR: ['coupang','baemin'], KW: ['talabat','lulu','carrefour'],
  KZ: ['wolt','glovo'], LA: ['foodpanda'], LK: ['keells'], LT: ['wolt'], LU: ['wolt'],
  LV: ['wolt'], MA: ['glovo','carrefour','jumia'], ME: ['wolt','glovo'], MK: ['wolt'],
  MM: ['foodpanda'], MN: ['market_directory','retailer_directory'], MX: ['walmart_mx','mercadona'],
  MY: ['foodpanda','lulu','aeon','happyfresh'], NG: ['jumia','shoprite','glovo'], NL: ['spar'],
  NO: ['wolt'], NP: ['market_directory','retailer_directory'], NZ: ['woolworths_au'], OM: ['talabat','lulu','carrefour'],
  PA: ['pedidosya'], PE: ['pedidosya','carrefour'], PH: ['foodpanda','puregold','happyfresh'],
  PK: ['foodpanda','naheed'], PL: ['wolt','glovo','carrefour'], PT: ['glovo','carrefour','mercadona'],
  QA: ['talabat','lulu','carrefour'], RO: ['wolt','glovo','carrefour'], RS: ['wolt','glovo'],
  RU: ['market_directory','retailer_directory'], SA: ['hungerstation','talabat','carrefour','lulu'],
  SE: ['wolt'], SG: ['fairprice','foodpanda'], SI: ['wolt'], SK: ['wolt','tesco'],
  SN: ['glovo'], TH: ['foodpanda','bigc','lotuss','happyfresh'], TN: ['glovo','carrefour'],
  TR: ['yemeksepeti'], UA: ['wolt','glovo'], US: ['walmart','kroger','instacart'], UY: ['pedidosya'],
  UZ: ['wolt'], VE: ['pedidosya'], VN: ['bachhoa','aeon'], ZA: ['woolworths_za','shoprite','checkers_sixty60','picknpay','jumia'],
  ZM: ['shoprite','jumia'],
};

const DISCOVERY_SOURCES = ['market_directory', 'retailer_directory'] as const;

export function buildGlobalMarketProfile(countryCode: string): GlobalMarketProfile | null {
  const normalized = countryCode.trim().toUpperCase();
  if (!GLOBAL_MARKET_COUNTRY_CODES.includes(normalized)) return null;
  const configured = GLOBAL_MARKET_COUNTRY_SOURCE_OVERRIDES[normalized] ?? [];
  const direct = configured.filter((id) => id !== 'market_directory' && id !== 'retailer_directory');
  const sourceIds = [...direct, ...DISCOVERY_SOURCES.filter((id) => !configured.includes(id))];
  return {
    countryCode: normalized,
    sourceIds,
    coverage: direct.length ? 'direct_and_aggregator' : 'discovery_only',
  };
}
