import test from 'node:test';
import assert from 'node:assert/strict';
import {paintBackdrop,paintSnakeFrame} from '../snake-art.js';
import {moveSnake} from '../game.js';
import {gameStyles} from '../content.js';
function context(){const calls=[];const gradient={addColorStop(){}};const target={calls,createLinearGradient:()=>gradient,createRadialGradient:()=>gradient};return new Proxy(target,{get(o,k){return k in o?o[k]:(...args)=>{assert(args.filter(a=>typeof a==='number').every(Number.isFinite),k);calls.push([k,...args]);};}});}
test('three renderers produce different scenery and do not change simulation coordinates',()=>{
 const snake=[{x:8,y:7},{x:7,y:7},{x:6,y:7}],before=JSON.stringify(snake),signatures=[];
 for(let style=0;style<3;style++){
  const c=context();paintBackdrop(c,style);paintSnakeFrame(c,{style,backdrop:{},snake,previous:snake.map(p=>({...p,x:p.x-1})),dir:{x:1,y:0},food:{x:12,y:9},score:2,running:true,time:400,blend:.5,effects:[{x:7,y:7,time:200}]});
  signatures.push(JSON.stringify(c.calls));assert(c.calls.some(([name])=>name==='fillRect'));
 }
 assert.equal(new Set(signatures).size,3);assert.equal(JSON.stringify(snake),before);
 assert.equal(new Set(gameStyles.map(s=>s.speed)).size,1);
});
test('art changes preserve growth, wall and body collision and vacating tail cells',()=>{
 assert(moveSnake([{x:19,y:0}],{x:1,y:0},{x:1,y:1}).collision);
 const s=[{x:2,y:2},{x:1,y:2},{x:1,y:3},{x:2,y:3}];
 assert(moveSnake(s,{x:-1,y:0},{x:9,y:9}).collision);
 assert(!moveSnake(s,{x:0,y:1},{x:9,y:9}).collision);
 assert.equal(moveSnake(s,{x:1,y:0},{x:3,y:2}).snake.length,5);
});
