import assert from 'node:assert/strict';
import { resolveFoodEntity, resolverIntegrity } from './food-entity-resolver-final.mjs';
import { resolveLocalizedFoodEntity } from './localized-food-entity-resolver-final.mjs';
import { normalizeFoodQuantity, compareQuantities } from './food-quantity-normalizer.mjs';

const integrity = resolverIntegrity();
assert.equal(integrity.valid, true, JSON.stringify(integrity));
assert.ok(integrity.taxonomy_entries >= 90);

const mixed = resolveFoodEntity('1 1/2 cups cherry tomatoes');
assert.equal(mixed.canonical_id, 'tomato_cherry');
assert.equal(mixed.quantity, 1.5);
assert.equal(mixed.unit, 'cup');

const chicken = resolveFoodEntity('450 g chicken breasts, boneless, skinless');
assert.equal(chicken.canonical_id, 'chicken_breast');
assert.equal(chicken.quantity, 450);
assert.equal(chicken.unit, 'g');

const evoo = resolveFoodEntity('EVOO');
assert.equal(evoo.canonical_id, 'olive_oil_extra_virgin');
assert.equal(evoo.parent_id, 'olive_oil');

const distinct = resolveFoodEntity('olive pomace oil');
assert.equal(distinct.canonical_id, 'olive_pomace_oil');
assert.deepEqual(distinct.relations, [{ type: 'related_but_distinct', target: 'olive_oil' }]);

const spanish = resolveFoodEntity('aceite de oliva');
assert.equal(spanish.canonical_id, 'olive_oil');

const persian = resolveLocalizedFoodEntity('روغن زیتون', { locale: 'fa-IR' });
assert.equal(persian.canonical_id, 'olive_oil');
assert.equal(persian.localization.locale, 'fa-IR');

const arabic = resolveLocalizedFoodEntity('أرز', { locale: 'ar' });
assert.equal(arabic.canonical_id, 'rice');

const turkish = resolveLocalizedFoodEntity('süt', { locale: 'tr' });
assert.equal(turkish.canonical_id, 'milk');

const unknown = resolveFoodEntity('made up laboratory food');
assert.equal(unknown.canonical_id, null);
assert.equal(unknown.review_required, true);

const kg = normalizeFoodQuantity(1, 'kg');
const grams = normalizeFoodQuantity(1000, 'g');
assert.equal(compareQuantities(kg, grams).difference_in_base_units, 0);

console.log(JSON.stringify({ status: 'pass', cases: 10, resolver: integrity }, null, 2));
