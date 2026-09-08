import * as THREE from './vendor/three.module.min.js';
import {mounting,connectorRows,connectorPins} from './assembly-data.js';
let boardPromise;
export function loadBoard(){
 if(!boardPromise)boardPromise=Promise.all([
  fetch(new URL('./models/pcb.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('PCB metadata');return r.json();}),
  fetch(new URL('./models/pcb.bin',import.meta.url)).then(r=>{if(!r.ok)throw Error('PCB geometry');return r.arrayBuffer();})
 ]).then(([meta,buffer])=>{
  if(buffer.byteLength!==meta.positionCount*12+meta.indexCount*4)throw Error('Incomplete PCB geometry');
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,0,meta.positionCount*3),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,meta.positionCount*12,meta.indexCount),1));
  geometry.computeVertexNormals();
  const materials=meta.groups.map((g,i)=>{
   geometry.addGroup(g.start,g.count,i);
   return new THREE.MeshStandardMaterial({color:new THREE.Color().setRGB(...g.color,THREE.SRGBColorSpace),roughness:.64,metalness:g.name==='mtl31'?.4:.08,side:THREE.DoubleSide});
  });
  return new THREE.Mesh(geometry,materials);
 }).catch(e=>{boardPromise=null;throw e;});
 return boardPromise.then(mesh=>mesh.clone());
}
function box(group,w,h,d,color,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.15}));mesh.position.set(x,y,z);group.add(mesh);return mesh;}
function label(group,text,width,height,z,color='#eef3fc'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 44px Arial';ctx.fillText(text,256,64,490);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));mesh.position.z=z;group.add(mesh);}
export function makeModule(mod){
 const g=new THREE.Group(),[w,h,d]=mod.size;
 // Local +Z faces outward. Back-face modules are flipped as a whole at placement.
 if(mod.kind==='cap'){
  const outline=()=>{const shape=new THREE.Shape();shape.absarc(0,0,Math.min(w,h)/2,0,Math.PI*2,false);return shape;};
  const material=new THREE.MeshStandardMaterial({color:mod.color,roughness:.4,metalness:0});
  const skirt=outline(),recess=new THREE.Path();recess.absarc(0,0,3.25,0,Math.PI*2,true);skirt.holes.push(recess);
  const lower=new THREE.Mesh(new THREE.ExtrudeGeometry(skirt,{depth:1.5,bevelEnabled:false,curveSegments:24}),material);lower.position.z=-d/2;g.add(lower);
  const top=new THREE.Mesh(new THREE.ExtrudeGeometry(outline(),{depth:1.5,bevelEnabled:true,bevelThickness:.25,bevelSize:.25,bevelSegments:3,curveSegments:24}),material.clone());top.position.z=-.0;g.add(top);
  const dark=['B','SELECT','START'].includes(mod.control);label(g,mod.symbol,w*.8,mod.symbol.length>2?2.4:5,1.78,dark?'#252932':'#f5f6fa');
  g.userData.kind='cap';g.userData.recessRadius=3.25;
 }else if(mod.kind==='battery'){
  box(g,w,h,4,0x20232a,0,0,-2);
  const cell=new THREE.Mesh(new THREE.CylinderGeometry(8,8,w-5,24),new THREE.MeshStandardMaterial({color:mod.color,roughness:.4}));cell.rotation.z=Math.PI/2;cell.position.z=5;g.add(cell);
  box(g,2,10,10,0xbfc7d1,w/2-2,0,5);label(g,'+  18650  −',w-8,7,13.1);
 }else if(mod.kind==='speaker'){
  box(g,w,h,2,0x252a32);const cone=new THREE.Mesh(new THREE.CylinderGeometry(w*.43,w*.43,3,24),new THREE.MeshStandardMaterial({color:0x555f69,metalness:.4}));cone.rotation.x=Math.PI/2;cone.position.z=2;g.add(cone);
 }else{
  box(g,w,h,d,mod.color);
  if(mod.kind==='display'){
   box(g,w-7,h-5,1,0x121925,0,0,d/2+.5);box(g,w-12,h-9,.4,0x242947,0,0,d/2+1.2);label(g,'hands on lab',w*.65,7,d/2+1.5);
  }else if(mod.kind==='processor'){
   box(g,w*.4,h*.7,1.7,0xb8c3cc,3,0,d/2+.9);box(g,9,h-3,.7,0x12171c,-w/2+6,0,d/2+.5);label(g,'ESP32-S3',w*.5,4,d/2+2);box(g,5,7,3,0xb6bdc5,w/2-1,0,d/2);
  }else if(mod.kind==='sd'){
   box(g,w*.75,h*.45,2,0xb3bfca,0,-h*.18,d/2+1);box(g,w*.65,7,1,0x151b23,0,-h*.39,d/2+2);label(g,'microSD',w*.82,4,d/2+2.1);
  }else{
   box(g,w*.35,h*.35,2,0x222933,0,0,d/2+1);
   if(mod.kind==='regulator'){box(g,w*.48,h*.25,3,0x5e6770,0,-h*.22,d/2+1.5);label(g,mod.id==='reg33'?'3.3 V':'5 V',w*.9,4,d/2+3.2);}
   else{label(g,mod.name,w*.92,3.5,d/2+2.2);}
   if(mod.kind==='charger')box(g,7,5,3,0xc3cbd3,-w/2+2,0,d/2+1);
  }
  const mount=mounting(mod),length=mount.gap+mount.pinDepth+.2;
  for(const row of connectorRows(mod))for(const pin of connectorPins(row))box(g,.65,.65,length,0xe8c265,pin.x,pin.y,-d/2-length/2+.1);
 }
 return g;
}
// Stationary sockets remain on the host PCB while the component moves above them.
export function makeSocket(mod){
 const group=new THREE.Group(),mount=mounting(mod);
 if(mod.kind==='cap')return group; // The actual switch and plunger are already in the CAD mesh.
 const z=-mount.underside-mount.gap-mount.headerHeight/2;
 if(mount.electronic){
  for(const row of connectorRows(mod)){
   const length=(row.count-1)*row.pitch+2.6;
   box(group,row.axis==='x'?length:2.6,row.axis==='y'?length:2.6,mount.headerHeight,0x24252b,row.x,row.y,z);
   for(const pin of connectorPins(row)){
    box(group,1.1,1.1,.16,0xb99649,pin.x,pin.y,-mount.underside-mount.gap+.08);
    box(group,.72,.72,.18,0x101218,pin.x,pin.y,-mount.underside-mount.gap+.12);
   }
  }
 }else{
  for(const x of [-1,1])box(group,2.4,mod.size[1]-2,mount.headerHeight,0x30343c,x*(mod.size[0]/2-2),0,z);
 }
 return group;
}
export function disposeModule(root){root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});}
