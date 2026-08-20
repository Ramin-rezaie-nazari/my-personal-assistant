import assert from 'node:assert/strict';
import { resolveLocalizedFoodEntity } from './localized-food-entity-resolver.mjs';
import { normalizeFoodQuantity, compareQuantities } from './food-quantity-normalizer.mjs';
import { resolverIntegrity } from './food-entity-resolver.mjs';

const integrity = resolverIntegrity();
assert.equal(integrity.valid, true, JSON.stringify(integrity));

const faOlive = resolveLocalizedFoodEntity('روغن زیتون', { locale: 'fa-IR' });
assert.equal(faOlive.canonical_id, 'olive_oil');
assert.equal(faOlive.localization.matched, true);
assert.equal(faOlive.localization.locale, 'fa-IR');

const faChicken = resolveLocalizedFoodEntity('سینه مرغ', { locale: 'fa-IR' });
assert.equal(faChicken.canonical_id, 'chicken_breast');

const arRice = resolveLocalizedFoodEntity('أرز', { locale: 'ar' });
assert.equal(arRice.canonical_id, 'rice');

const trMilk = resolveLocalizedFoodEntity('süt', { locale: 'tr' });
assert.equal(trMilk.canonical_id, 'milk');

const kg = normalizeFoodQuantity(1, 'kg');
const g = normalizeFoodQuantity(1000, 'g');
assert.equal(kg.base_amount, 1000);
assert.deepEqual(compareQuantities(kg, g).comparable, true);
assert.equal(compareQuantities(kg, g).difference_in_base_units, 0);

const cup = normalizeFoodQuantity(4, 'cup');
const ml = normalizeFoodQuantity(960, 'ml');
assert.equal(compareQuantities(cup, ml).comparable, true);
assert.ok(compareQuantities(cup, ml).confidence >= .95);

console.log(JSON.stringify({ status: 'pass', cases: 7, resolver: integrity }, null, 2));
