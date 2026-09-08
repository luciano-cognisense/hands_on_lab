import test from 'node:test';
import assert from 'node:assert/strict';
import {mountGame} from '../game.js';
test('fifth apple unlocks once, sixth keeps scoring, collision and restart retain unlock',()=>{
 const names=['window','document','CustomEvent','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame'];
 const saved=new Map(names.map(n=>[n,globalThis[n]])),random=Math.random;
 let tick,intervalActive=false,spawns=0,wins=0;const messages=[];
 const gradient={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
 function element(tag){return {tag,children:[],dataset:{},classList:{add(){},remove(){}},append(...els){this.children.push(...els);},setAttribute(){},getContext:()=>ctx};}
 let dispose;
 try{
  globalThis.window={matchMedia:()=>({matches:true}),addEventListener(){},removeEventListener(){},dispatchEvent(){}};
  globalThis.document={createElement:element,addEventListener(){},removeEventListener(){}};
  globalThis.CustomEvent=class {};
  globalThis.setInterval=fn=>{tick=fn;intervalActive=true;return 1;};globalThis.clearInterval=()=>{intervalActive=false;};
  globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
  // Place each apple immediately ahead of the growing snake on the same row.
  Math.random=()=>144.1/(297-spawns++);
  const area=element('div');dispose=mountGame(area,0,()=>wins++,message=>messages.push(message));
  const buttons=area.children.filter(e=>e.tag==='button');buttons.find(b=>b.textContent==='Jogar / continuar').onclick();
  for(let i=0;i<4;i++)tick();assert.equal(wins,0);
  tick();assert.equal(wins,1);assert(intervalActive);
  tick();assert.equal(wins,1);assert(intervalActive);assert(area.children.some(e=>e.textContent?.includes('6 maçãs')));
  // Keep going to the right-hand wall.
  for(let i=0;i<8;i++)tick();assert(!intervalActive);assert.equal(wins,1);assert(messages.at(-1).includes('continua liberada'));
  spawns=0;buttons.find(b=>b.textContent==='Nova partida').onclick();for(let i=0;i<5;i++)tick();assert.equal(wins,1);assert(intervalActive);
  dispose();dispose=null;assert(!intervalActive);
 }finally{dispose?.();Math.random=random;for(const [name,value] of saved){if(value===undefined)delete globalThis[name];else globalThis[name]=value;}}
});
