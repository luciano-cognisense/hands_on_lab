import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('manual expõe V1B e mantém instalação bloqueada nos dois manifestos',async()=>{
 const home=await readFile(new URL('../../index.html',root),'utf8');
 const manual=await readFile(new URL('index.html',root),'utf8');
 const activity=JSON.parse(await readFile(new URL('firmware/manifest.json',root)));
 const restore=JSON.parse(await readFile(new URL('firmware/restore-manifest.json',root)));
 assert.match(home,/manual\/v1b\//);
 assert.match(manual,/v1b\.js/);
 assert.equal(activity.installationEnabled,false);
 assert.equal(restore.installationEnabled,false);
 assert.equal(activity.parts[0].offset,restore.part.offset);
});
