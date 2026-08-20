import assert from 'node:assert/strict';
import { resolveFoodEntity, resolverIntegrity } from './food-entity-resolver.mjs';

const integrity = resolverIntegrity();
assert.equal(integrity.valid, true, JSON.stringify(integrity));
assert.ok(integrity.taxonomy_entries >= 90);
assert.ok(integrity.knowledge_entries >= 8);

const olive = resolveFoodEntity('extra virgin olive oil');
assert.equal(olive.canonical_id, 'olive_oil_extra_virgin');
assert.equal(olive.parent_id, 'olive_oil');
assert.ok(olive.confidence >= .98);

const evoo = resolveFoodEntity('EVOO');
assert.equal(evoo.canonical_id, 'olive_oil_extra_virgin');

const variant = resolveFoodEntity('1 1/2 cups cherry tomatoes');
assert.equal(variant.canonical_id, 'tomato_cherry');
assert.equal(variant.parent_id, 'tomato');
assert.equal(variant.quantity, 1.5);
assert.equal(variant.unit, 'cup');

const base = resolveFoodEntity('tomatoes');
assert.equal(base.canonical_id, 'tomato');

const alias = resolveFoodEntity('1 cup whole milk');
assert.equal(alias.canonical_id, 'milk');
assert.equal(alias.quantity, 1);
assert.equal(alias.unit, 'cup');

const flour = resolveFoodEntity('1/2 cup all-purpose flour');
assert.equal(flour.canonical_id, 'wheat_flour');
assert.equal(flour.quantity, .5);
assert.equal(flour.unit, 'cup');

const multilingual = resolveFoodEntity('aceite de oliva');
assert.equal(multilingual.canonical_id, 'olive_oil');

const unknown = resolveFoodEntity('dragon fruit protein concentrate');
assert.equal(unknown.canonical_id, null);
assert.equal(unknown.review_required, true);

const distinct = resolveFoodEntity('olive pomace oil');
assert.equal(distinct.canonical_id, 'olive_pomace_oil');
assert.deepEqual(distinct.relations, [{ type: 'related_but_distinct', target: 'olive_oil' }]);

console.log(JSON.stringify({ status: 'pass', cases: 9, ...integrity }, null, 2));
