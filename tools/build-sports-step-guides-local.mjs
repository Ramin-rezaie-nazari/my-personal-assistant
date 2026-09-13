import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(process.env.MYPA_ROOT || process.cwd());
const MEDIA = path.resolve(process.env.SPORT_MEDIA_OUT || path.join(ROOT, 'data', 'mypa-sports-media-local'));
const OUT = path.resolve(process.env.SPORT_GUIDE_OUT || path.join(ROOT, 'data', 'mypa-sports-guides-local'));
const exists = p => { try { fsSync.accessSync(p); return true; } catch { return false; } };
const run = (args) => new Promise((resolve, reject) => { const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] }); let err=''; p.stderr.on('data', x => { err += x; }); p.on('close', code => code === 0 ? resolve() : reject(new Error(err.slice(-1200)))); });
async function walk(dir, result=[]) { let es; try { es=await fs.readdir(dir,{withFileTypes:true}); } catch { return result; } for (const e of es) { const f=path.join(dir,e.name); if(e.isDirectory()) await walk(f,result); else if(/\.webp$/i.test(e.name)) result.push(f); } return result; }
async function main() {
  if (!exists(MEDIA)) throw new Error(`Media folder not found: ${MEDIA}`);
  await fs.mkdir(OUT,{recursive:true});
  const imgs=await walk(MEDIA); const groups=new Map();
  for (const f of imgs) { const rel=path.relative(MEDIA,f); const parts=rel.split(path.sep); if(parts.length<3) continue; const key=parts.slice(0,2).join('/'); if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(f); }
  let done=0, skipped=0;
  for (const [key, files] of groups) {
    const outDir=path.join(OUT,key); const out=path.join(outDir,'step-guide.mp4'); await fs.mkdir(outDir,{recursive:true});
    if(exists(out)) { skipped++; continue; }
    files.sort(); const list=path.join(outDir,'frames.txt');
    const lines=[]; for(const f of files.slice(0,4)) lines.push(`file '${f.replaceAll("'", "'\\''")}'\nduration 1.2`); if(lines.length===0) continue; lines.push(lines.at(-2));
    await fs.writeFile(list, lines.join('\n')+'\n');
    try { await run(['-y','-f','concat','-safe','0','-i',list,'-vf','scale=720:-2:force_original_aspect_ratio=decrease,pad=720:720:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p','-r','24','-t','5','-movflags','+faststart','-an',out]); done++; } catch (e) { await fs.writeFile(path.join(outDir,'ERROR.txt'),String(e)); }
    await fs.rm(list,{force:true});
    if((done+skipped)%25===0) console.log(JSON.stringify({progress:`${done+skipped}/${groups.size}`,created:done,skipped}));
  }
  console.log(JSON.stringify({status:'complete',created:done,skipped,sourceImageGroups:groups.size,output:OUT,guideType:'step_visualization',note:'These are image-based guides, not real motion videos.'},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
