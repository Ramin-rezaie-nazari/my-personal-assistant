import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const LIMIT = Math.max(Number(process.env.RECIPE_COUNTRY_LIMIT || '0'), 0);
const DRY_RUN = /^(1|true|yes)$/i.test(process.env.RECIPE_COUNTRY_DRY_RUN || 'false');
const VERSION = 'country-intelligence-final-v3';

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL (or SUPABASE_DB_URL) is required.');
}

const esc = (value) => String(value).replace(/'/g, "''");

const originRules = [
  ['IT', 'origin', 0.96, 'distinctive Italian dish family', ['neapolitan pizza','pizza napoletana','carbonara','cacio e pepe','ossobuco','osso buco','risotto alla milanese','tiramisu','saltimbocca','panzanella','bresaola','arancini','vitello tonnato','bistecca alla fiorentina']],
  ['VN', 'origin', 0.96, 'distinctive Vietnamese dish family', ['cao lau','banh mi','pho','bun bo hue','bun cha','goi cuon']],
  ['JP', 'origin', 0.96, 'distinctive Japanese dish family', ['sashimi','ramen','tempura','okonomiyaki','yakitori','onigiri','udon','soba']],
  ['KR', 'origin', 0.96, 'distinctive Korean dish family', ['kimchi','bibimbap','bulgogi','tteokbokki','kimbap','japchae']],
  ['TH', 'origin', 0.96, 'distinctive Thai dish family', ['pad thai','tom yum','tom kha','massaman curry','som tam','larb']],
  ['ID', 'origin', 0.96, 'distinctive Indonesian dish family', ['nasi goreng','rendang','gado gado','gado-gado','sate ayam','soto ayam']],
  ['MY', 'origin', 0.96, 'distinctive Malaysian dish family', ['nasi lemak','laksa','char kway teow','roti canai']],
  ['ET', 'origin', 0.96, 'distinctive Ethiopian dish family', ['injera','doro wat','doro wot','tibs','kitfo']],
  ['EG', 'origin', 0.96, 'distinctive Egyptian dish family', ['koshari','molokhia','ful medames','foul medames']],
  ['IR', 'origin', 0.96, 'distinctive Iranian dish family', ['ghormeh sabzi','chelow kebab','fesenjan','ash reshteh','abgoosht','zereshk polo','baghali polo','kuku sabzi']],
  ['LB', 'origin', 0.96, 'distinctive Lebanese dish family', ['tabouleh','tabbouleh','kibbeh','kibbe','fattoush','manakish']],
  ['PS', 'origin', 0.96, 'distinctive Palestinian dish family', ['mujaddara','mejadra','maqluba','maklouba','musabaha']],
  ['IN', 'origin', 0.96, 'distinctive Indian dish family', ['dosa','idli','chana masala','dal makhani','rajma']],
  ['NP', 'origin', 0.96, 'distinctive Nepali dish family', ['dal bhat']],
  ['BR', 'origin', 0.96, 'distinctive Brazilian dish family', ['feijoada','brigadeiro','pao de queijo','moqueca']],
  ['PE', 'origin', 0.96, 'distinctive Peruvian dish family', ['ceviche','lomo saltado','aji de gallina','anticuchos']],
  ['CO', 'origin', 0.96, 'distinctive Colombian dish family', ['ajiaco','bandeja paisa']],
  ['CU', 'origin', 0.96, 'distinctive Cuban dish family', ['ropa vieja','moros y cristianos']],
  ['CA', 'origin', 0.96, 'distinctive Canadian dish family', ['poutine','tourtiere','montreal smoked meat']],
  ['ES', 'origin', 0.96, 'distinctive Spanish dish family', ['paella','gazpacho','tortilla espanola','tortilla de patatas','patatas bravas','gambas al ajillo']],
  ['PT', 'origin', 0.96, 'distinctive Portuguese dish family', ['bacalhau','caldo verde','pastel de nata','francesinha']],
  ['AT', 'origin', 0.96, 'distinctive Austrian dish family', ['sachertorte','kaiserschmarrn']],
  ['HU', 'origin', 0.96, 'distinctive Hungarian dish family', ['paprikash','dobos torte']],
  ['PL', 'origin', 0.96, 'distinctive Polish dish family', ['pierogi','paczki','barszcz']],
  ['GB', 'origin', 0.96, 'distinctive British dish family', ['fish and chips','beef wellington','sticky toffee pudding','yorkshire pudding','toad in the hole','eton mess']],
  ['IE', 'origin', 0.96, 'distinctive Irish dish family', ['boxty','colcannon','irish stew','soda bread','barmbrack']],
  ['FR', 'origin', 0.96, 'distinctive French dish family', ['coq au vin','bouillabaisse','quiche lorraine','creme brulee','beef bourguignon','tarte tatin','clafoutis','pot-au-feu']],
  ['MX', 'origin', 0.96, 'distinctive Mexican dish family', ['mole poblano','tacos al pastor','chiles en nogada','pozole','cochinita pibil']],
  ['US', 'origin', 0.96, 'distinctive US regional dish family', ['gumbo','jambalaya','shrimp creole']],
];

const cuisineRules = [
  ['US','american'],['GB','british'],['GB','english'],['FR','french'],['IT','italian'],['ES','spanish'],['PT','portuguese'],['DE','german'],['GR','greek'],['LB','lebanese'],['PS','palestinian'],['IR','persian'],['IR','iranian'],['IN','indian'],['CN','chinese'],['JP','japanese'],['KR','korean'],['TH','thai'],['VN','vietnamese'],['ID','indonesian'],['MY','malaysian'],['PH','filipino'],['CA','canadian'],['TR','turkish'],['MA','moroccan'],['EG','egyptian'],
];

const globalPatterns = ['pizza','pasta','burger','hamburger','fried rice','noodle','sushi','ramen','taco','curry','sandwich','ice cream','cheesecake','pancake','waffle','hot dog','french fries','chocolate cake','chocolate chip cookie','mochi','dumpling','shawarma','falafel','hummus','teriyaki','pad thai','pho','biryani','empanada','crepe','smoothie','muffin','doughnut','donut','fried chicken'];

const patternValues = originRules.flatMap(([iso2,type,confidence,evidence,patterns]) => patterns.map((pattern) => `('${esc(iso2)}','${esc(type)}',${confidence},'${esc(evidence)}','${esc(pattern)}')`)).join(',\n');
const cuisineValues = cuisineRules.map(([iso2,token]) => `('${esc(iso2)}','${esc(token)}')`).join(',\n');
const globalValues = globalPatterns.map((pattern) => `'${esc(pattern)}'`).join(',');

const limitClause = LIMIT > 0 ? `LIMIT ${LIMIT}` : '';

const sql = `
BEGIN;
DROP TABLE IF EXISTS tmp_recipe_country_final;
DROP TABLE IF EXISTS tmp_recipe_global_final;

CREATE TEMP TABLE tmp_recipe_country_final AS
WITH base AS (
  SELECT r.id, r.name, r.native_name, r.cuisine,
         lower(coalesce(r.name,'') || ' ' || coalesce(r.native_name,'') || ' ' || coalesce(r.cuisine,'')) AS name_cuisine,
         lower(coalesce(r.name,'') || ' ' || coalesce(r.native_name,'')) AS name_only
  FROM recipes r
  ORDER BY r.created_at ASC
  ${limitClause}
), origin_map(iso2,relation_type,confidence,evidence,pattern) AS (
  VALUES ${patternValues}
), origin_candidates AS (
  SELECT b.id,o.iso2,o.relation_type,o.confidence,o.evidence
  FROM base b JOIN origin_map o ON b.name_only ~* ('\\m' || regexp_replace(o.pattern,'([.\\\\+*?\\[\\^$(){=|])','\\\\\\1','g') || '\\M')
  WHERE NOT (o.iso2='PS' AND b.name_only !~* '\\m(palestinian|palestine)\\M')
), cuisine_map(iso2,token) AS (VALUES ${cuisineValues}), cuisine_candidates AS (
  SELECT b.id,c.iso2,CASE WHEN b.cuisine ILIKE '%inspired%' THEN 'associated' ELSE 'traditional' END AS relation_type,CASE WHEN b.cuisine ILIKE '%inspired%' THEN 0.78 ELSE 0.90 END AS confidence,'recipe.cuisine='||b.cuisine AS evidence
  FROM base b JOIN cuisine_map c ON b.cuisine ILIKE '%'||c.token||'%'
), compound_candidates AS (
  SELECT id,'CA' iso2,'associated' relation_type,0.92 confidence,'compound cultural term: French Canadian' evidence FROM base WHERE name_only ~* '\\mfrench canadian\\M'
), all_candidates AS (
  SELECT * FROM origin_candidates UNION ALL SELECT * FROM cuisine_candidates UNION ALL SELECT * FROM compound_candidates
), ranked AS (
  SELECT *,row_number() OVER (PARTITION BY id,iso2 ORDER BY CASE relation_type WHEN 'origin' THEN 4 WHEN 'traditional' THEN 3 WHEN 'associated' THEN 2 ELSE 1 END DESC,confidence DESC) rn
  FROM all_candidates
)
SELECT id,iso2,relation_type,confidence,evidence FROM ranked WHERE rn=1;

CREATE TEMP TABLE tmp_recipe_global_final AS
WITH base AS (
  SELECT r.id,r.name,r.cuisine,lower(coalesce(r.name,'')||' '||coalesce(r.cuisine,'')) t
  FROM recipes r ORDER BY r.created_at ASC ${limitClause}
)
SELECT id,
       (t ~* ('\\m(' || replace('${esc(globalPatterns.join('|'))}','\\|','|') || ')\\M') OR cuisine ~* '(international|world cuisine|worldwide|fusion)') AS is_global,
       CASE WHEN t ~* ('\\m(' || replace('${esc(globalPatterns.join('|'))}','\\|','|') || ')\\M') THEN 0.92 WHEN cuisine ~* '(international|world cuisine|worldwide|fusion)' THEN 0.84 ELSE NULL END AS global_confidence
FROM base;

DELETE FROM recipe_country_relations WHERE source LIKE 'country-intelligence-final-%';
DELETE FROM recipe_intelligence_profiles WHERE classification_version LIKE 'country-intelligence-final-%';

INSERT INTO recipe_country_relations(recipe_id,country_id,relation_type,confidence,source,source_ref,evidence,is_primary)
SELECT x.id,c.id,x.relation_type,x.confidence,'${VERSION}','${VERSION}',x.evidence,(x.relation_type='origin')
FROM tmp_recipe_country_final x JOIN countries c ON c.iso2=x.iso2;

UPDATE recipes r
SET is_global=g.is_global,
    global_confidence=g.global_confidence,
    classification_version='${VERSION}'
FROM tmp_recipe_global_final g
WHERE g.id=r.id;

INSERT INTO recipe_intelligence_profiles(recipe_id,classification_version,source,evidence,created_at,updated_at)
SELECT r.id,'${VERSION}','rule-engine-final',
       jsonb_build_object(
         'country_relations',COALESCE((SELECT jsonb_agg(jsonb_build_object('iso2',c.iso2,'relation_type',rc.relation_type,'confidence',rc.confidence,'evidence',rc.evidence) ORDER BY c.iso2) FROM recipe_country_relations rc JOIN countries c ON c.id=rc.country_id WHERE rc.recipe_id=r.id AND rc.source='${VERSION}'),'[]'::jsonb),
         'global',r.is_global,
         'global_confidence',r.global_confidence,
         'unknown',(NOT r.is_global AND NOT EXISTS(SELECT 1 FROM recipe_country_relations rc WHERE rc.recipe_id=r.id AND rc.source='${VERSION}')),
         'unknown_reason',CASE WHEN r.is_global OR EXISTS(SELECT 1 FROM recipe_country_relations rc WHERE rc.recipe_id=r.id AND rc.source='${VERSION}') THEN NULL WHEN r.cuisine IS NULL AND r.native_name IS NULL AND r.description ILIKE '%pending ingredient normalization%' THEN 'source_metadata_only' ELSE 'insufficient_cultural_evidence' END
       ),now(),now()
FROM recipes r
${LIMIT > 0 ? `WHERE r.id IN (SELECT id FROM tmp_recipe_global_final)` : ''}
ON CONFLICT(recipe_id) DO UPDATE SET classification_version=EXCLUDED.classification_version,source=EXCLUDED.source,evidence=EXCLUDED.evidence,updated_at=now();

SELECT count(*)::int AS recipes_processed,
       (SELECT count(*) FROM recipe_country_relations WHERE source='${VERSION}')::int AS country_relations,
       (SELECT count(*) FROM recipes WHERE classification_version='${VERSION}' AND is_global)::int AS global_recipes,
       (SELECT count(*) FROM recipes WHERE classification_version='${VERSION}' AND NOT is_global AND id NOT IN (SELECT DISTINCT recipe_id FROM recipe_country_relations WHERE source='${VERSION}'))::int AS unknown_recipes
FROM recipes
${LIMIT > 0 ? `WHERE id IN (SELECT id FROM tmp_recipe_global_final)` : ''};
`;

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();
try {
  await client.query(sql);
  if (DRY_RUN) await client.query('ROLLBACK');
  else await client.query('COMMIT');
  console.log(JSON.stringify({ status: 'complete', mode: DRY_RUN ? 'dry-run' : 'apply', version: VERSION }, null, 2));
} catch (error) {
  try { await client.query('ROLLBACK'); } catch {}
  throw error;
} finally {
  await client.end();
}
`;
