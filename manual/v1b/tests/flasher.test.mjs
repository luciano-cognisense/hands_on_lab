import test from 'node:test';
import assert from 'node:assert/strict';
import {flashVerifiedPackage} from '../flasher.mjs';
import {webcrypto} from 'node:crypto';
globalThis.crypto = webcrypto;
test('pacote não liberado nunca inicia gravação',async()=>{
 let called=false;
 await assert.rejects(flashVerifiedPackage({manifest:{installationEnabled:false},files:[],loader:{writeFlash:async()=>{called=true;}}}),/validação física/);
 assert.equal(called,false);
});
test('chip incorreto nunca inicia gravação',async()=>{
 await assert.rejects(flashVerifiedPackage({manifest:{installationEnabled:true},files:[],loader:{chip:{CHIP_NAME:'ESP32'}}}),/ESP32-S3/);
});

test('layout físico divergente impede gravação',async()=>{
  let called=false;
  const manifest={installationEnabled:true,requiredLayout:'v1b-with-gbsp',partitionTableSha256:'0'.repeat(64),parts:[{offset:0x10000}]};
  const loader={chip:{CHIP_NAME:'ESP32-S3'},readFlash:async()=>new Uint8Array(0xc00),writeFlash:async()=>{called=true;}};
  await assert.rejects(flashVerifiedPackage({manifest,files:[new Uint8Array(1)],loader}),/tabela de partições/);
  assert.equal(called,false);
});
