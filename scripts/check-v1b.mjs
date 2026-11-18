import {spawnSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
function run(...args){const result=spawnSync(args[0],args.slice(1),{cwd:new URL('.',root),stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
const tests=(await readdir(new URL('manual/v1b/tests/',root))).filter(x=>x.endsWith('.test.mjs')).sort();
for(const test of tests)run('node',`manual/v1b/tests/${test}`);
const dir=new URL('manual/v1b/firmware/',root);
const activity=JSON.parse(await readFile(new URL('manifest.json',dir)));
const restore=JSON.parse(await readFile(new URL('restore-manifest.json',dir)));
for(const [manifest,part] of [[activity,activity.parts[0]],[restore,restore.part]]){
 if(manifest.installationEnabled!==false || part.offset!==0x10000)throw new Error('Unexpected installation policy or offset');
 const bytes=await readFile(new URL(part.path,dir));
 if(bytes.length!==part.size || createHash('sha256').update(bytes).digest('hex')!==part.sha256)throw new Error(`Bad package: ${part.path}`);
}
if(activity.requiredLayout!==restore.requiredLayout)throw new Error('Firmware and restore layouts differ');
run('git','diff','--check');
console.log('V1B checks passed; physical validation remains pending.');
