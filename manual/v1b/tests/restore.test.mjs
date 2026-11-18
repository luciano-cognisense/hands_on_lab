import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {inspectRestore} from '../restore.mjs';
globalThis.crypto=webcrypto;
const local=async url=>{const bytes=await readFile(url);return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}};
test('launcher aprovado confere e restauração permanece bloqueada',async()=>{const m=await inspectRestore(local);assert.equal(m.installationEnabled,false);assert.equal(m.sourceImageSha256,'2541189a2ad8a917fb9d775107c92ffc2ee8cabae4f59e1ba592230e8d4f2c24')});
test('launcher modificado é rejeitado',async()=>{await assert.rejects(inspectRestore(async url=>{const response=await local(url);if(url.pathname.endsWith('.bin'))response.arrayBuffer=async()=>new Uint8Array([1]).buffer;return response}),/Integridade/)});
