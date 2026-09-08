import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.min.js';
import {modules,caps,assemblyTasks,priorModules,validateDrop,mounting,seatedPosition,normalizeRotation,connectorRows,connectorPins,targetRotation} from '../assembly-data.js';
import {makeSocket,makeModule,disposeModule} from '../board-model.js';
import {blocks} from '../content.js';
import {normalize,advance,available} from '../state.js';

test('every assembly task replaces an existing mission with known, unique modules',()=>{
 const ids=new Set();
 for(const [key,task] of Object.entries(assemblyTasks)){
  const [b,m]=key.split(':').map(Number);assert(blocks[b].missions[m]);
  for(const id of task.ids){assert(modules.some(x=>x.id===id));if(!task.preview){assert(!ids.has(id));ids.add(id);}}
 }
 assert.equal(ids.size,modules.length);
});
test('prior modules never satisfy the current or future mission',()=>{
 for(const [key,task] of Object.entries(assemblyTasks)){
  const [b,m]=key.split(':').map(Number),previous=priorModules(b,m);
  for(const id of task.ids)assert(!previous.includes(id));
 }
 assert.deepEqual(priorModules(0,0),[]);assert.equal(priorModules(5,0).length,modules.length);
});
test('drop requires matching module, orientation and spatial bounds',()=>{
 for(const mod of modules){
  const p={x:mod.position[0],y:mod.position[1]};
  assert(validateDrop(mod.id,mod.id,targetRotation(mod),p).ok);
  assert(validateDrop(mod.id,mod.id,targetRotation(mod)+360,p).ok);
  for(const delta of [90,180,270,-90])assert.equal(validateDrop(mod.id,mod.id,targetRotation(mod)+delta,p).ok,mod.kind==='cap');
  for(const angle of [NaN,Infinity])assert(!validateDrop(mod.id,mod.id,angle,p).ok);
  assert(validateDrop(mod.id,mod.id,targetRotation(mod)-360,p).ok);
  assert(!validateDrop(mod.id,'wrong',0,p).ok);
  assert(!validateDrop(mod.id,mod.id,targetRotation(mod),{x:p.x+mod.size[0]+10,y:p.y}).ok);
 }
 assert(!validateDrop('missing','missing',0).ok);
});
test('front and back raycasts resolve actual millimetre targets after centering',()=>{
 const root=new THREE.Group();root.position.set(-49,65,.8);
 for(const mod of modules){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(mod.size[0]+4,mod.size[1]+4,.6),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  mesh.position.set(mod.position[0],mod.position[1],mod.side==='front'?2:-2.5);root.add(mesh);root.updateMatrixWorld(true);
  const sign=mod.side==='front'?1:-1;
  const origin=root.localToWorld(new THREE.Vector3(mod.position[0],mod.position[1],sign*200));
  const ray=new THREE.Raycaster(origin,new THREE.Vector3(0,0,-sign));const hits=ray.intersectObject(mesh);
  assert(hits.length>0,mod.id);const p=root.worldToLocal(hits[0].point.clone());
  assert(validateDrop(mod.id,mod.id,targetRotation(mod),p).ok,mod.id);root.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
 }
});
test('CAD binary is complete, finite, indexed and entirely covered by materials',()=>{
 const meta=JSON.parse(readFileSync(new URL('../models/pcb.json',import.meta.url)));
 const bytes=readFileSync(new URL('../models/pcb.bin',import.meta.url));
 assert.equal(bytes.length,meta.positionCount*12+meta.indexCount*4);
 const raw=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);
 const positions=new Float32Array(raw,0,meta.positionCount*3),indices=new Uint32Array(raw,meta.positionCount*12,meta.indexCount);
 for(const x of positions)assert(Number.isFinite(x));for(const i of indices)assert(i<meta.positionCount);
 assert.equal(meta.indexCount%3,0);let end=0;for(const g of meta.groups){assert.equal(g.start,end);end+=g.count;}assert.equal(end,indices.length);
 const bounds=[0,1,2].map(axis=>{let min=Infinity,max=-Infinity;for(let i=axis;i<positions.length;i+=3){min=Math.min(min,positions[i]);max=Math.max(max,positions[i]);}return [min,max];});
 assert(bounds[0][1]-bounds[0][0]>100);assert(bounds[1][1]-bounds[1][0]>125);assert(bounds[2][1]-bounds[2][0]>15);
});
test('assembly replacement preserves sequential progression and existing saved progress',()=>{
 const state=normalize(null,blocks);assert(!available(state,blocks,1));assert(!advance(state,blocks,1,0));
 for(let b=0;b<blocks.length;b++)for(let m=0;m<blocks[b].missions.length;m++)assert(advance(state,blocks,b,m));
 assert.deepEqual(normalize(state,blocks),state);
});


test('modules seat above sockets on both PCB faces, with pins penetrating the sockets',()=>{
 for(const mod of modules){
  if(mod.kind==='cap'){assert.equal(makeSocket(mod).children.length,0);continue;}
  const mount=mounting(mod),sign=mod.side==='front'?1:-1;
  const position=seatedPosition(mod);
  const underside=position[2]-sign*mount.underside;
  assert(Math.abs(sign*(underside-mount.surfaceZ)-(mount.headerHeight+mount.gap))<1e-8,mod.id);
  const socket=makeSocket(mod);socket.position.set(...position);if(sign<0)socket.rotation.y=Math.PI;
  socket.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(socket);
  const inner=sign>0?bounds.min.z:bounds.max.z,outer=sign>0?bounds.max.z:bounds.min.z;
  assert(Math.abs(inner-mount.surfaceZ)<1e-5,mod.id+' socket touches PCB');
  if(mount.electronic){
   assert(sign*(underside-outer)>1.7,mod.id+' visible pin clearance');
   const pinTip=underside-sign*(mount.gap+mount.pinDepth);
   assert(sign*(pinTip-inner)>0&&sign*(outer-pinTip)>0,mod.id+' pins inside socket');
  }
  disposeModule(socket);
 }
});
test('quarter turns preserve the local outward face and return asymmetric pins to sockets',()=>{
 const mod=modules.find(m=>m.id==='display');
 const pins=connectorRows(mod).flatMap(connectorPins);assert.equal(pins.length,14);
 const original=new THREE.Vector3(pins[0].x,pins[0].y,0);
 const turned=original.clone().applyAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2);
 assert(turned.distanceTo(original)>20);
 let angle=90;for(let i=0;i<3;i++)angle=normalizeRotation(angle+90);
 assert.equal(angle,0);
 assert(original.clone().applyAxisAngle(new THREE.Vector3(0,0,1),angle).distanceTo(original)<1e-9);
});
test('introductory placement uses the same module tasks without pre-installing later missions',()=>{
 assert(assemblyTasks['0:0'].preview);assert(assemblyTasks['0:1'].preview);
 assert.deepEqual(assemblyTasks['0:0'].ids,['esp32']);assert.deepEqual(assemblyTasks['0:1'].ids,['display']);
 assert(!priorModules(2,1).includes('esp32'));assert(!priorModules(3,2).includes('display'));
});


test('ten caps match the CAD plungers and manual colors without duplicating switches',()=>{
 assert.equal(caps.length,10);assert.equal(new Set(caps.map(c=>c.control)).size,10);
 assert(caps.slice(0,4).every(c=>c.color===0x202329));
 assert.deepEqual(caps.slice(4,8).map(c=>c.color),[0x2878d4,0xd83e44,0x299764,0xefbb27]);
 assert(caps.slice(8).every(c=>c.color===0xe1e3e9));
 assert.deepEqual(assemblyTasks['4:0'].ids,caps.map(c=>c.id));
 assert(!priorModules(4,0).some(id=>id.startsWith('cap-')));
 assert.equal(priorModules(4,1).filter(id=>id.startsWith('cap-')).length,10);
 const meta=JSON.parse(readFileSync(new URL('../models/pcb.json',import.meta.url)));
 const bytes=readFileSync(new URL('../models/pcb.bin',import.meta.url));
 const raw=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);
 const v=new Float32Array(raw,0,meta.positionCount*3);
 for(const cap of caps){
  let nearest=Infinity;for(let i=0;i<v.length;i+=3)if(Math.abs(v[i+2]-7.491)<.01)nearest=Math.min(nearest,Math.hypot(v[i]-cap.position[0],v[i+1]-cap.position[1]));
  assert(nearest<3.3,cap.id+' positioned above a real CAD plunger');
 }
});
test('cap recess accepts the existing plunger and stops at its top surface',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
 try{
  for(const cap of caps){
   const mesh=makeModule(cap);mesh.position.set(...seatedPosition(cap));mesh.updateMatrixWorld(true);
   const ray=new THREE.Raycaster(new THREE.Vector3(cap.position[0],cap.position[1],0),new THREE.Vector3(0,0,1));
   const hits=ray.intersectObject(mesh,true);assert(hits.length);
   assert(Math.abs(hits[0].point.z-7.491)<.001,cap.id+' recess ceiling meets plunger');
   const box=new THREE.Box3().setFromObject(mesh);assert(box.min.z>5.9);assert(box.max.z>9.4);assert(box.max.x-box.min.x<12);
   disposeModule(mesh);
  }
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});


test('corrected modules require 180 degrees; circular caps have no keyed orientation',()=>{
 for(const id of ['esp32','tp4056','sd']){
  const mod=modules.find(m=>m.id===id);assert.equal(targetRotation(mod),180);
  assert(validateDrop(id,id,180).ok);assert(validateDrop(id,id,-180).ok);assert(!validateDrop(id,id,0).ok);
 }
 for(const cap of caps)for(const angle of [0,45,90,180,270,359,-123])assert(validateDrop(cap.id,cap.id,angle).ok);
});
