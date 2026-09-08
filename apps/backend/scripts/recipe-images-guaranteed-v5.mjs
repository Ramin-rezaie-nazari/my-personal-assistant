import { spawn } from 'node:child_process';
import process from 'node:process';

const ROOT = process.cwd();
const steps = [
  { name:'audit-existing-local', script:'./scripts/recipe-images-local-audit-v4.mjs', env:{}, allowFailure:false },
  { name:'repair-source-mapping', script:'./scripts/recipe-source-mapping-repair.mjs', env:{}, allowFailure:false },
  { name:'import-exact-dataset-images', script:'./scripts/recipe-image-dataset-import-v2.mjs', env:{RECIPE_IMAGE_RESET:'0',RECIPE_IMAGE_CONCURRENCY:process.env.RECIPE_IMAGE_CONCURRENCY||'4'}, allowFailure:true },
  { name:'mirror-exact-dataset-local', script:'./scripts/recipe-images-local-mirror-dataset-v1.mjs', env:{}, allowFailure:true },
  { name:'strict-verified-web-resolution', script:'./scripts/recipe-images-local-strict-v3.mjs', env:{RECIPE_LOCAL_CONCURRENCY:process.env.RECIPE_LOCAL_CONCURRENCY||'4',RECIPE_LOCAL_DELAY_MS:process.env.RECIPE_LOCAL_DELAY_MS||'450',RECIPE_LOCAL_LIMIT:process.env.RECIPE_LOCAL_LIMIT||'0',RECIPE_LOCAL_FORCE:'0',RECIPE_LOCAL_AUDIT_EXISTING:'0'}, allowFailure:true },
  { name:'publish-verified-local', script:'./scripts/recipe-images-local-publish-verified-v1.mjs', env:{}, allowFailure:true },
  { name:'final-status', script:'./scripts/recipe-images-local-status.mjs', env:{}, allowFailure:false },
];
function runStep(step){return new Promise((resolve,reject)=>{console.log(`\n========== ${step.name} ==========`);const child=spawn(process.execPath,[step.script],{cwd:ROOT,stdio:'inherit',env:{...process.env,...step.env}});child.on('error',reject);child.on('exit',(code,signal)=>{if(code===0||step.allowFailure)return resolve({code,signal});reject(new Error(`${step.name} exited with code=${code??'null'} signal=${signal??'null'}`));});});}
async function main(){console.log(JSON.stringify({pipeline:'recipe-images-guaranteed-v5',strategy:['audit and invalidate untrusted existing images','repair exact recipe-to-image mapping','import exact mapped dataset images','mirror exact dataset heroes into local manifest','strictly resolve remaining recipes using verified page/image evidence','publish only verified local heroes','print final status']},null,2));for(const step of steps)await runStep(step);console.log('\nPIPELINE COMPLETE');}
main().catch((e)=>{console.error(`\nPIPELINE FAILED: ${e instanceof Error?e.message:String(e)}`);process.exit(1);});
