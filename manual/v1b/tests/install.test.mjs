import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {inspectPackage} from '../install.mjs';
globalThis.crypto=webcrypto;
const fetchLocal=async url=>{
  const data=await readFile(url);
  return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};
};
test('pacote real confere e mantém instalação desabilitada',async()=>{
  const manifest=await inspectPackage(fetchLocal);
  assert.equal(manifest.installationEnabled,false);
});
test('corrupção de binário é rejeitada',async()=>{
  await assert.rejects(inspectPackage(async url=>{
    const response=await fetchLocal(url);
    if(url.pathname.endsWith('.bin')) response.arrayBuffer=async()=>new Uint8Array([0]).buffer;
    return response;
  }),/Integridade/);
});
