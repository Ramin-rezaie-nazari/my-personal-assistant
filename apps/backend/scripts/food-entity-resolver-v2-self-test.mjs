import assert from 'node:assert/strict';
import { resolveFoodEntity, resolverIntegrity } from './food-entity-resolver-v2.mjs';

const integrity = resolverIntegrity();
assert.equal(integrity.valid, true, JSON.stringify(integrity));

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

const unknown = resolveFoodEntity('made up laboratory food');
assert.equal(unknown.canonical_id, null);
assert.equal(unknown.review_required, true);

console.log(JSON.stringify({ status: 'pass', cases: 4, ...integrity }, null, 2));
