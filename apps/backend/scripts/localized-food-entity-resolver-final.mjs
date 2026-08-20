import packs from '../data/food-entity-locale-pack-v1.json' with { type: 'json' };
import knowledge from '../data/food-entity-knowledge-v1.json' with { type: 'json' };
import { resolveFoodEntity } from './food-entity-resolver-final.mjs';
const aliasToCanonical=new Map();
for(const pack of packs)for(const [id,names] of Object.entries(pack.aliases||{}))for(const name of names)aliasToCanonical.set(String(name).toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'').trim(),id);
const byId=new Map(knowledge.map(x=>[x.id,x]));
export function resolveLocalizedFoodEntity(input,locale=null){const key=String(input||'').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'').trim();const id=aliasToCanonical.get(key);if(id){const canonical=byId.get(id)?.name||id;const r=resolveFoodEntity(canonical);return{...r,matched_by:'localized-alias',locale};}return resolveFoodEntity(input);}
export function localePackIntegrity(){return{packs:packs.length,locales:packs.map(x=>x.locale),valid:packs.length>0};}
