import test from 'node:test';
import assert from 'node:assert/strict';
import {boardDepthRange,updateBoardDepth} from '../camera-depth.js';
import * as THREE from '../vendor/three.module.min.js';
function depth(z,n,f){return f/(f-n)-f*n/((f-n)*z);}
test('0.01 mm CAD layers remain distinguishable across supported camera zoom',()=>{
 for(const distance of [90,125,225,244,420]){
  const {near,far}=boardDepthRange(distance);
  assert(near>0&&far>near);
  assert(near<Math.max(2,distance-100));assert(far>distance+100);
  for(const z of [distance,distance+80]){
   const steps=Math.abs(depth(z+.01,near,far)-depth(z,near,far))*(2**24-1);
   assert(steps>4,`distance=${distance}, z=${z}: ${steps} depth steps`);
  }
 }
 // Old camera had less than one depth step between these layers at default view.
 assert(Math.abs(depth(244.01,.1,1000)-depth(244,.1,1000))*(2**24-1)<1);
});
test('depth projection updates with orbit distance without changing camera pose',()=>{
 const camera=new THREE.PerspectiveCamera(38,1,.1,1000);camera.position.set(65,-65,225);
 const pose=camera.position.clone(),target=new THREE.Vector3();updateBoardDepth(camera,target);
 assert(camera.position.equals(pose));assert.equal(camera.near,pose.length()-110);
 const before=camera.projectionMatrix.clone();camera.position.multiplyScalar(.5);updateBoardDepth(camera,target);
 assert(!camera.projectionMatrix.equals(before));assert(camera.near>0);
});
