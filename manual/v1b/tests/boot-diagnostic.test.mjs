import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {inspectBoot} from '../boot-diagnostic.mjs';
globalThis.crypto=webcrypto;
test('diagnóstico lê tabela e otadata sem autorizar gravação',async()=>{
 const table=new Uint8Array(0xc00); const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',table))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const calls=[]; const loader={chip:{CHIP_NAME:'ESP32-S3'},readFlash:async(offset,size)=>{calls.push([offset,size]);return new Uint8Array(size);}};
 const result=await inspectBoot(loader,{partitionTableSha256:hash});
 assert.deepEqual(calls,[[0x8000,0xc00],[0xd000,0x2000]]);
 assert.equal(result.canInstall,false); assert.equal(result.bootSelection,'unverified');
});
test('layout divergente interrompe antes de ler otadata',async()=>{
 const calls=[]; const loader={chip:{CHIP_NAME:'ESP32-S3'},readFlash:async(offset,size)=>{calls.push(offset);return new Uint8Array(size);}};
 await assert.rejects(inspectBoot(loader,{partitionTableSha256:'0'.repeat(64)}),/difere/);
 assert.deepEqual(calls,[0x8000]);
});
