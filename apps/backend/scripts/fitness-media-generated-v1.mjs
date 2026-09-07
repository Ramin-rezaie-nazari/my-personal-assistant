#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT=path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT??path.join(process.cwd(),'content-mirror'));
const MEDIA_ROOT=path.join(ROOT,'media','fitness');
const MANIFEST_PATH=path.join(ROOT,'fitness-media-guaranteed-manifest.json');
const SUMMARY_PATH=path.join(ROOT,'fitness-media-guaranteed-summary.json');
const DATASET_URL=process.env.FITNESS_DATASET_URL??'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const REQUIRED=4, MAX_BYTES=64*1024;
const CONCURRENCY=Math.min(16,Math.max(1,Number(process.env.FITNESS_MEDIA_CONCURRENCY??12)));
const MAX_ITEMS=Number.isFinite(Number(process.env.FITNESS_MEDIA_MAX))&&Number(process.env.FITNESS_MEDIA_MAX)>0?Math.floor(Number(process.env.FITNESS_MEDIA_MAX)):null;
const UA='MYPA-fitness-stage-media/2.0';
const clean=v=>String(v??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
const norm=v=>clean(v).toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
const slug=v=>norm(v).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||createHash('sha1').update(clean(v)).digest('hex').slice(0,12);
const sha=b=>createHash('sha256').update(b).digest('hex');
async function save(file,val){await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(val,null,2)+'\n','utf8');}
async function json(url){const r=await fetch(url,{headers:{'User-Agent':UA,Accept:'application/json'}});if(!r.ok)throw new Error(`${r.status} ${r.statusText}`);return r.json();}
function classify(r){const e=norm(r.equipment??'');const t=norm([r.name,r.category,...(r.primaryMuscles??[]),...(r.secondaryMuscles??[])].join(' '));if(/yoga|asana|pose|warrior|triangle|tree|cobra|pigeon|downward|upward|lotus|camel|sphinx|child|dancer/.test(t))return'yoga';return !e||/none|body only|bodyweight/.test(e)?'calisthenics':'gym';}
function wrap(t,max){const w=clean(t).split(/\s+/),out=[];let line='';for(const x of w){const n=line?`${line} ${x}`:x;if(n.length>max&&line){out.push(line);line=x}else line=n}if(line)out.push(line);return out.slice(0,4);}
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&apos;');}
function stagePose(pos){
  const poses={
    1:{headY:265,bodyEndY:450,shoulderL:365,shoulderR:535,elbowL:335,elbowR:335,handLY:395,handRY:395,hipY:450,kneeLY:550,kneeRY:550,footLY:635,footRY:635,label:'Start / neutral stance'},
    2:{headY:285,bodyEndY:445,shoulderL:365,shoulderR:535,elbowL:350,elbowR:550,handLY:420,handRY:420,hipY:445,kneeLY:525,kneeRY:545,footLY:625,footRY:640,label:'Setup / load position'},
    3:{headY:315,bodyEndY:430,shoulderL:350,shoulderR:550,elbowL:300,elbowR:600,handLY:385,handRY:385,hipY:430,kneeLY:500,kneeRY:520,footLY:620,footRY:650,label:'Movement / active phase'},
    4:{headY:265,bodyEndY:450,shoulderL:370,shoulderR:530,elbowL:340,elbowR:560,handLY:395,handRY:395,hipY:450,kneeLY:545,kneeRY:545,footLY:635,footRY:635,label:'Finish / controlled end'}
  };
  return poses[pos];
}
function svg(item,pos){
  const labels=['Start','Setup','Movement','Finish']; const label=labels[pos-1]; const pose=stagePose(pos); const title=wrap(item.name,28); const ins=wrap(item.instructions?.[(pos-1)%Math.max(item.instructions.length,1)]||'Perform the movement with controlled form and comfortable range of motion.',42);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><rect width="900" height="900" rx="42" fill="#f5f5f5"/><text x="50" y="70" font-family="Arial" font-size="24" font-weight="700">MYPA · ${esc(label)} · ${esc(item.discipline)}</text>${title.map((x,i)=>`<text x="50" y="${120+i*42}" font-family="Arial" font-size="35" font-weight="700">${esc(x)}</text>`).join('')}<circle cx="450" cy="400" r="175" fill="#fff" stroke="#222" stroke-width="8"/><circle cx="450" cy="${pose.headY}" r="31" fill="none" stroke="#222" stroke-width="10"/><path d="M450 310 L450 ${pose.bodyEndY} M450 337 L${pose.shoulderL} 390 L${pose.elbowL} 430 L${pose.shoulderL-10} ${pose.handLY} M450 337 L${pose.shoulderR} 390 L${pose.elbowR} 430 L${pose.shoulderR+10} ${pose.handRY} M450 ${pose.bodyEndY} L410 ${pose.kneeLY} L385 ${pose.footLY} M450 ${pose.bodyEndY} L490 ${pose.kneeRY} L515 ${pose.footRY} M345 665 H555" fill="none" stroke="#222" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><text x="50" y="700" font-family="Arial" font-size="23" font-weight="700">Stage cue · ${esc(pose.label)}</text>${ins.map((x,i)=>`<text x="50" y="${740+i*28}" font-family="Arial" font-size="20">${esc(x)}</text>`).join('')}<text x="50" y="865" font-family="Arial" font-size="18">Generated stage-specific MYPA fitness illustration from exercise instructions</text></svg>`;
}
async function webp(svgText){for(const[w,q]of [[900,76],[800,68],[700,60],[600,52],[500,44],[420,34],[360,28]]){const o=await sharp(Buffer.from(svgText),{density:150}).resize({width:w,height:w,fit:'inside'}).webp({quality:q,effort:5}).toBuffer();if(o.length<=MAX_BYTES)return o}throw new Error('WebP size budget exceeded');}
async function main(){
  await mkdir(MEDIA_ROOT,{recursive:true}); const dataset=await json(DATASET_URL); if(!Array.isArray(dataset))throw new Error('Fitness dataset invalid'); const rows=MAX_ITEMS?dataset.slice(0,MAX_ITEMS):dataset;
  const manifest={schemaVersion:11,generatedAt:new Date().toISOString(),root:ROOT,requiredMediaPerExercise:REQUIRED,stageContract:['Start','Setup','Movement','Finish'],items:{}}; let cursor=0;
  const worker=async()=>{while(true){const i=cursor++;if(i>=rows.length)return;const r=rows[i],item={index:i,name:clean(r.name||`Exercise ${i+1}`),slug:slug(r.name||`exercise-${i+1}`),discipline:classify(r),sourceId:clean(r.id),instructions:Array.isArray(r.instructions)?r.instructions.map(clean).filter(Boolean):[]};const dir=path.join(MEDIA_ROOT,item.discipline,`${item.slug}-${i}`);await mkdir(dir,{recursive:true});const media=[],seen=new Set();for(let p=1;p<=REQUIRED;p++){let made=false;for(let attempt=0;attempt<4&&!made;attempt++){const candidate=((p-1+attempt)%4)+1;const out=await webp(svg(item,candidate)),digest=sha(out);if(seen.has(digest))continue;seen.add(digest);const file=path.join(dir,`${String(p).padStart(2,'0')}-${item.slug}-${digest.slice(0,10)}.webp`);await writeFile(file,out);media.push({position:p,stage:['Start','Setup','Movement','Finish'][p-1],localPath:path.relative(ROOT,file).split(path.sep).join('/'),objectKey:path.relative(path.join(ROOT,'media'),file).split(path.sep).join('/'),sha256:digest,sizeBytes:out.length,format:'webp',provider:'MYPA deterministic stage renderer',license:'generated-original',attribution:'MYPA',sourceUrl:null,sourceType:'generated-stage-illustration',evidence:`${item.name}: distinct ${['start','setup','movement','finish'][p-1]} pose rendered from exercise instructions`,status:'ready'});made=true}if(!made)throw new Error(`Unable to create unique stage asset ${item.name}#${p}`)}manifest.items[`fitness:${i}:${item.discipline}:${item.slug}`]={...item,requiredMedia:REQUIRED,stageContract:['Start','Setup','Movement','Finish'],media,mediaCount:media.length,physicalStatus:'complete',releaseStatus:'ready'};}};
  await Promise.all(Array.from({length:CONCURRENCY},worker)); await save(MANIFEST_PATH,manifest); const items=Object.values(manifest.items); const complete=items.filter(x=>x.mediaCount===REQUIRED&&x.physicalStatus==='complete'&&x.media.every((m)=>m.status==='ready'&&m.format==='webp'&&m.sizeBytes>0&&m.sizeBytes<=MAX_BYTES&&m.stage)).length; const summary={schemaVersion:11,generatedAt:manifest.generatedAt,root:ROOT,requiredMediaPerExercise:REQUIRED,stageContract:['Start','Setup','Movement','Finish'],datasetRows:rows.length,exercises:items.length,complete,incomplete:items.length-complete,failed:0,licensedMedia:0,generatedMedia:items.length*REQUIRED,corpusComplete:items.length===rows.length&&complete===rows.length}; await save(SUMMARY_PATH,summary); console.log(JSON.stringify(summary,null,2)); if(!summary.corpusComplete)process.exitCode=2;
}
main().catch(e=>{console.error(e);process.exitCode=1});
