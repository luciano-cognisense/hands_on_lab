import test from 'node:test';
import assert from 'node:assert/strict';
import {Device, validateBlink} from '../device.mjs';
test('rejeita parâmetros inválidos', () => {
  for (const onMs of [0, 99, 5001, NaN, 100.5, '500']) assert.throws(() => validateBlink({color:'#ffffff',onMs,offMs:500}));
});
test('não aceita confirmação sem persistência', async () => {
  const d = new Device(); d.ready = true; d.request = async () => ({persisted:false});
  await assert.rejects(d.saveBlink({color:'#ffffff',onMs:500,offMs:500}), /persistência/);
});
test('não aceita leitura divergente', async () => {
  const d = new Device(); d.ready = true;
  d.request = async cmd => cmd === 'blink.set' ? {persisted:true} : {color:'#000000',onMs:500,offMs:500};
  await assert.rejects(d.saveBlink({color:'#ffffff',onMs:500,offMs:500}), /diverge/);
});
test('aceita somente confirmação e leitura correspondentes', async () => {
  const d = new Device(); d.ready = true;
  const params = {color:'#ffffff',onMs:500,offMs:500};
  d.request = async cmd => cmd === 'blink.set' ? {persisted:true} : params;
  assert.deepEqual(await d.saveBlink(params), params);
});
test('reconectar sem reiniciar não comprova persistência', async () => {
  const d=new Device(); d.ready=true; d.info={bootId:'same',deviceId:'unit'}; d.saved={bootId:'same',deviceId:'unit',params:{color:'#ffffff',onMs:500,offMs:500}};
  await assert.rejects(d.verifyAfterRestart(), /reinício/);
});
test('novo boot exige parâmetros correspondentes', async () => {
  const d=new Device(); d.ready=true; d.info={bootId:'new',deviceId:'unit'}; const params={color:'#ffffff',onMs:500,offMs:500}; d.saved={bootId:'old',deviceId:'unit',params};
  d.request=async()=>({...params,onMs:100}); await assert.rejects(d.verifyAfterRestart(), /correspondem/);
  d.request=async()=>params; assert.deepEqual(await d.verifyAfterRestart(),params);
});
test('ignora respostas de outra versão ou identificador', async () => {
  const d=new Device(); d.writer={write:async()=>{}};
  const pending=d.request('hello');
  d.accept('{"protocol":2,"id":1,"ok":true,"result":{}}');
  d.accept('{"protocol":1,"id":2,"ok":true,"result":{}}');
  assert.equal(d.pending.size,1);
  d.accept('{"protocol":1,"id":1,"ok":true,"result":{"version":"0.1.0"}}');
  assert.deepEqual(await pending,{version:'0.1.0'});
});
test('erro explícito do firmware não vira sucesso', async () => {
  const d=new Device(); d.writer={write:async()=>{}};
  const pending=d.request('blink.set');
  d.accept('{"protocol":1,"id":1,"ok":false,"error":"Persistence failed"}');
  await assert.rejects(pending,/Persistence failed/);
});

test('outro console não comprova persistência', async () => {
 const d=new Device(); d.ready=true; d.info={bootId:'new',deviceId:'other'}; d.saved={bootId:'old',deviceId:'original',params:{color:'#ffffff',onMs:500,offMs:500}};
 await assert.rejects(d.verifyAfterRestart(),/mesmo console/);
});
test('nova tentativa de salvamento invalida confirmação anterior',async()=>{
 const d=new Device();d.ready=true;d.info={bootId:'boot',deviceId:'unit'};
 d.saved={bootId:'old',deviceId:'unit',params:{color:'#ffffff',onMs:500,offMs:500}};
 d.request=async()=>{throw new Error('USB falhou')};
 await assert.rejects(d.saveBlink({color:'#ffffff',onMs:500,offMs:500}),/USB falhou/);
 assert.equal(d.saved,null);
});
test('verificação concluída não pode ser reutilizada em outra reconexão',async()=>{
 const d=new Device();d.ready=true;d.info={bootId:'new',deviceId:'unit'};
 const params={color:'#ffffff',onMs:500,offMs:500};d.saved={bootId:'old',deviceId:'unit',params};d.request=async()=>params;
 await d.verifyAfterRestart();assert.equal(d.saved,null);
 await assert.rejects(d.verifyAfterRestart(),/Salve o Blink/);
});
