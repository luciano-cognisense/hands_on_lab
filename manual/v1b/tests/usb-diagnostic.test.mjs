import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseConsole} from '../usb-diagnostic.mjs';
test('diagnóstico usa apenas leitura e sempre solta a porta',async()=>{
 const calls=[];const port={};
 class Transport{constructor(p){assert.equal(p,port)}async disconnect(){calls.push('disconnect')}}
 class Loader{async main(){calls.push('connect')}async readFlash(offset,size){calls.push([offset,size]);return new Uint8Array(size)}}
 const result=await diagnoseConsole({requestPort:async()=>port},{SerialTransport:Transport,Loader,packageInfo:async()=>({partitionTableSha256:'x'}),inspect:async loader=>{await loader.readFlash(0x8000,0xc00);return {canInstall:false}}});
 assert.equal(result.canInstall,false);assert.deepEqual(calls,['connect',[0x8000,0xc00],'disconnect']);
});
test('falha de leitura também libera a porta',async()=>{
 let closed=false;
 class Transport{async disconnect(){closed=true}}
 class Loader{async main(){} }
 await assert.rejects(diagnoseConsole({requestPort:async()=>({})},{SerialTransport:Transport,Loader,packageInfo:async()=>({}),inspect:async()=>{throw new Error('read failed')}}),/read failed/);
 assert.equal(closed,true);
});
