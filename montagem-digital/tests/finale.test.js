import test from 'node:test';
import assert from 'node:assert/strict';
import {blocks} from '../content.js';
import {normalize,advance} from '../state.js';
test('three fixed Snake missions require sequential completion',()=>{
 const games=blocks[5].missions.slice(5);assert.equal(games.length,3);assert.deepEqual(games.map(g=>g.style),[0,1,2]);assert(games.every(g=>g.type==='snake'));
 const state=normalize({version:2,steps:blocks.map((b,i)=>i===5?5:b.missions.length)},blocks);
 assert(!advance(state,blocks,5,6));assert(advance(state,blocks,5,5));assert.equal(state.steps[5],6);
 assert(!advance(state,blocks,5,7));assert(advance(state,blocks,5,6));assert.equal(state.steps[5],7);
 assert(advance(state,blocks,5,7));assert.equal(state.steps[5],blocks[5].missions.length);
 assert.deepEqual(normalize(state,blocks),state);
});
test('old comparison completion does not award unplayed portable/SNES challenges',()=>{
 const steps=blocks.map((b,i)=>i===5?7:b.missions.length);
 const migrated=normalize({version:1,steps},blocks);assert.equal(migrated.steps[5],6);assert.equal(migrated.version,2);
 assert.equal(normalize({version:1,steps:steps.map((n,i)=>i===5?5:n)},blocks).steps[5],5);
 assert.equal(normalize({version:2,steps:steps.map((n,i)=>i===5?8:n)},blocks).steps[5],8);
});
