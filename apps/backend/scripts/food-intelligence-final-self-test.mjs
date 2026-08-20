import assert from 'node:assert/strict';
import { resolveFoodEntity, resolverIntegrity } from './food-entity-resolver-final.mjs';
import { resolveLocalizedFoodEntity, localePackIntegrity } from './localized-food-entity-resolver-final.mjs';
import { normalizeQuantity } from './food-quantity-normalizer.mjs';
const integrity = resolverIntegrity();
assert.equal(integrity.valid, true);
assert.ok(integrity.knowledge_entries >= 8);
assert.equal(resolveFoodEntity('450 g chicken breasts, boneless, skinless').canonical_id, 'chicken_breast');
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').canonical_id, 'tomato_cherry');
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').quantity, 1.5);
assert.equal(resolveFoodEntity('1 1/2 cups cherry tomatoes').unit, 'cup');
assert.equal(resolveFoodEntity('EVOO').canonical_id, 'olive_oil_extra_virgin');
assert.equal(resolveFoodEntity('aceite de oliva').canonical_id, 'olive_oil');
assert.equal(resolveFoodEntity('روغن زیتون فرابکر').canonical_id, 'olive_oil_extra_virgin');
assert.equal(resolveFoodEntity('olive pomace oil').canonical_id, 'olive_pomace_oil');
assert.deepEqual(resolveFoodEntity('olive pomace oil').relations, [{ type: 'related_but_distinct', target: 'olive_oil' }]);
assert.equal(resolveFoodEntity('dragon fruit protein concentrate').canonical_id, null);
assert.equal(resolveFoodEntity('dragon fruit protein concentrate').review_required, true);
assert.equal(resolveLocalizedFoodEntity('aceite de oliva', 'es').canonical_id, 'olive_oil');
assert.equal(normalizeQuantity('1 1/2 cups').quantity, 1.5);
assert.equal(normalizeQuantity('1/2 cup').quantity, 0.5);
assert.equal(normalizeQuantity('1⁄2 tsp').quantity, 0.5);
assert.equal(normalizeQuantity('1/2-inch pieces').quantity, null);
assert.equal(normalizeQuantity('1 1/2-inch-thick').quantity, null);

const ambiguous = resolveFoodEntity('2 6 ounces fillets branzino or black bass');
assert.equal(ambiguous.canonical_id, null);
assert.equal(ambiguous.review_required, true);
assert.equal(ambiguous.reason, 'ambiguous_alternatives');
assert.deepEqual(ambiguous.alternatives.map((x) => x.canonical_id), ['branzino', 'black_bass']);

const auditCases = [
  ['2 serrano chiles, seeds removed, finely chopped', 'serrano_chile'],
  ['1 lb skirt steak', 'skirt_steak'],
  ['3 ounces Spanish chorizo, finely chopped', 'spanish_chorizo'],
  ['4 ounces Swiss cheese, sliced', 'swiss_cheese'],
  ['4 swordfish steaks', 'swordfish'],
  ['1 1/2 cups fresh tangerine juice', 'tangerine_juice'],
  ['1 tablespoon Thai green curry paste', 'thai_green_curry_paste'],
  ['1 pound tomatillos, husked, rinsed', 'tomatillo'],
  ['4 small radishes, thinly sliced', 'radish'],
  ['5 cups small cauliflower florets', 'cauliflower'],
  ['4 cups mixed berries', 'mixed_berries'],
  ['2 cups chopped herbs', 'culinary_herbs'],
  ['2 cups sprouts', 'sprouts'],
  ['1 tablespoon prepared white horseradish', 'prepared_horseradish'],
  ['1/2 vanilla bean, split', 'vanilla_bean'],
  ['1/2 cup pine nuts, toasted', 'pine_nut'],
  ['1/2 cup mascarpone', 'mascarpone'],
  ['1/2 cup dried tart cherries', 'dried_tart_cherry'],
  ['1 cup raisins', 'raisin'],
  ['1/4 teaspoon whole black peppercorns', 'black_peppercorn'],
  ['Pinch of freshly ground nutmeg', 'nutmeg'],
  ['1/2 tsp ground cardamom', 'cardamom'],
  ['1/4 teaspoon allspice', 'allspice'],
  ['1 teaspoon pumpkin pie spice', 'pumpkin_pie_spice'],
  ['1 teaspoon wasabi paste', 'wasabi_paste'],
  ['3 tablespoons white miso paste', 'miso_paste'],
  ['1 cup unsalted matzo meal', 'matzo_meal'],
  ['1 tablespoon gochujang', 'gochujang'],
  ['1/2 cup bulgur', 'bulgur'],
  ['1/2 cup Pecorino Romano', 'pecorino'],
  ['1/2 cup semisweet chocolate chips', 'semisweet_chocolate_chip'],
  ['1/2 cup fresh grapefruit juice', 'grapefruit_juice'],
  ['1/4 cup sunflower oil', 'sunflower_oil'],
  ['1/4 cup vegetable shortening', 'vegetable_shortening'],
  ['1/4 cup poppy seeds', 'poppy_seed'],
  ['1/4 cup sake', 'sake'],
  ['1/4 cup white rum', 'white_rum'],
  ['3/4 cup Campari', 'campari'],
  ['2 ounces amaro', 'amaro'],
  ['2 ounces tequila', 'tequila'],
  ['2 cups bottled clam juice', 'clam_juice'],
  ['4 6-ounce halibut fillets', 'halibut'],
  ['1 (15-ounce) can cannellini beans, drained, rinsed', 'cannellini_bean'],
  ['1 (15-ounce) can pinto beans, rinsed', 'pinto_bean'],
  ['1 can white beans, drained and rinsed', 'white_bean'],
  ['6 cups finely chopped bok choy', 'bok_choy'],
  ['1 bunch Swiss chard', 'swiss_chard'],
  ['8 black tea bags', 'black_tea'],
  ['2 cups freshly brewed coffee', 'coffee'],
  ['3/4 ounce simple syrup', 'syrup_simple'],
  ['1 tablespoon agave syrup', 'agave_syrup'],
  ['2 small acorn squash', 'acorn_squash'],
  ['2 tablespoons anise seed', 'anise_seed'],
  ['1 tablespoon annatto seeds', 'annatto_seed'],
  ['4 Bartlett pears', 'bartlett_pear'],
  ['1 large beet', 'beet'],
  ['2 tablespoons blood orange juice', 'blood_orange_juice'],
  ['1 pound breakfast sausage, casings removed', 'breakfast_sausage'],
  ['1 pound broccolini', 'broccolini'],
  ['1 pound bucatini', 'bucatini'],
  ['1/2 cup caramel sauce', 'caramel_sauce'],
  ['1 teaspoon chaat masala', 'chaat_masala'],
  ['2 tablespoons chervil', 'chervil'],
  ['2 tablespoons cocoa nibs', 'cocoa_nib'],
  ['1 pound Concord grapes', 'concord_grape'],
  ['2 teaspoons Creole seasoning', 'creole_seasoning'],
  ['4 ounces croutons', 'crouton'],
  ['2 Cubanelle peppers', 'cubanelle_pepper'],
  ['1 pound cultivated mussels', 'mussel'],
  ['1 disk Mexican chocolate', 'mexican_chocolate'],
  ['2 cups dried Great Northern beans', 'great_northern_bean'],
  ['2 cups dried hibiscus flowers', 'hibiscus_flower'],
  ['1 teaspoon Italian seasoning blend', 'italian_seasoning'],
  ['4 Earl Grey tea bags', 'earl_grey_tea'],
  ['1 cup shelled edamame', 'edamame'],
  ['1 ounce elderflower liqueur', 'elderflower_liqueur'],
  ['6 ounces farmer cheese', 'farmer_cheese'],
  ['1 1/2 cups fava beans', 'fava_bean'],
  ['1 1/2 cups graham cracker crumbs', 'graham_cracker_crumb'],
  ['1 teaspoon five-spice powder', 'five_spice'],
  ['1 cup grated fontina', 'fontina'],
  ['1 tablespoon ghee', 'ghee'],
  ['1 cup granola', 'granola'],
  ['2 globe eggplants', 'globe_eggplant'],
  ['2 3-ounce packages liquid pectin', 'liquid_pectin'],
  ['1 1/2 3-ounce packages soft ladyfingers', 'ladyfinger'],
  ['1 3-pound whole fresh octopus, cleaned', 'octopus'],
  ['1 4-pound trimmed flat-cut brisket', 'brisket'],
  ['2 5-pound whole Peking ducks', 'peking_duck'],
  ['3 6 1/2-ounce cans chopped clams in juice', 'clam'],
  ['6 6-ounce Arctic char steaks', 'arctic_char'],
  ['4 6-ounce monkfish fillets', 'monkfish'],
  ['4 6-ounce tilapia fillets', 'tilapia'],
  ['1 750-ml chilled bottle Prosecco', 'prosecco'],
  ['2 8-inch whole wheat tortillas', 'whole_wheat_tortilla'],
  ['6-8 tablespoons jam of your choice', 'jam'],
  ['achiote paste, 3 tbsp', 'achiote_paste'],
  ['2 ounces aged Gouda', 'aged_gouda'],
  ['2/3 cup aged provolone', 'aged_provolone'],
  ['1/4 teaspoon ajwain seeds', 'ajwain_seed'],
  ['2/3 cup vanilla whey protein powder', 'whey_protein_powder'],
  ['1 teaspoon aloe vera juice', 'aloe_vera_juice'],
  ['16 ounces andouille sausage, sliced into thin rounds', 'andouille_sausage'],
  ['2 large Anjou pears', 'anjou_pear'],
  ['3 tablespoons aonori', 'aonori'],
  ['1 ounce applejack', 'applejack'],
  ['1/2 cup grated Asiago', 'asiago'],
  ['4 pounds baby back ribs', 'baby_back_rib'],
  ['1 tablespoon Baharat Seasoning', 'baharat'],
  ['Balsamic vinaigrette', 'balsamic_vinaigrette'],
  ['2/3 cup barley malt syrup', 'barley_malt_syrup'],
  ['1 teaspoon bee pollen', 'bee_pollen'],
  ['2 pounds Belgian endives', 'belgian_endive'],
  ['4 black bass fillets', 'black_bass'],
  ['3/4 pound skin-on black cod fillet', 'black_cod'],
  ['4 boquerones, chopped', 'boquerones'],
  ['2 tablespoons bottled yuzu juice', 'yuzu_juice'],
  ['8 ounces brie cheese', 'brie'],
  ['12 cups brioche, sliced', 'brioche'],
  ['8 ounces burrata', 'burrata'],
  ['3/4 cup butterscotch chips', 'butterscotch_chip'],
  ['2 teaspoons Cajun Spice Mix', 'cajun_spice_mix'],
];
for (const [input, expected] of auditCases) assert.equal(resolveFoodEntity(input).canonical_id, expected, input);

console.log(JSON.stringify({ status: 'pass', cases: 19 + auditCases.length, ...integrity, ...localePackIntegrity() }, null, 2));
