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
];
for (const [input, expected] of auditCases) assert.equal(resolveFoodEntity(input).canonical_id, expected, input);

console.log(JSON.stringify({ status: 'pass', cases: 12 + auditCases.length, ...integrity, ...localePackIntegrity() }, null, 2));
