import {updateBoardDepth} from './camera-depth.js';
import * as THREE from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {loadBoard,makeModule,makeSocket,disposeModule} from './board-model.js';
import {modules,validateDrop,seatedPosition,normalizeRotation,targetRotation,orientationMatches} from './assembly-data.js';
import {record} from './state.js';
import {tone} from './audio.js';
const STORAGE='hol-digital-assembly-v1';
const byId=id=>modules.find(m=>m.id===id);
export function mountWorkbench(host,{required=modules.map(m=>m.id),installed=[],sandbox=false,onComplete=()=>{}}={}){
 let alive=true,ready=false,selected=null,rotation=0,side='front',ghost=null,drag=null,renderer,controls,resizeObserver,frame=0,finished=false;
 const placed=new Set(installed.filter(byId)),meshes=new Map(),targets=new Map(),cards=new Map(),sockets=new Map(),settling=new Map();
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(sandbox){try{const saved=JSON.parse(localStorage.getItem(STORAGE));if(Array.isArray(saved))saved.filter(byId).forEach(id=>placed.add(id));}catch{}}
 host.classList.add('workbench');host.innerHTML=`<div class="wb-view"><div class="wb-toolbar" aria-label="Vista da placa"><button data-view="front">Frente</button><button data-view="back">Verso</button><button data-view="oblique">Perspectiva</button><button data-zoom="in" aria-label="Aproximar a placa">＋</button><button data-zoom="out" aria-label="Afastar a placa">−</button></div><div class="wb-viewport"><div class="wb-loading" role="status">Preparando sua PCB 3D…</div><div class="wb-labels"></div></div><p class="wb-hint">Arraste o fundo para girar · use + e − para aproximar</p><div class="wb-status" role="status" aria-live="polite"></div></div><div class="wb-tray"><div class="wb-tray-title"><h2>Peças na bancada</h2><span class="wb-count"></span></div><p class="muted">Arraste, gire a peça em passos de 90° e alinhe a peça ao seu encaixe. Você também pode selecionar a peça e tocar no encaixe destacado.</p><div class="wb-parts"></div><div class="wb-selection"></div><details class="wb-access"><summary>Encaixar por toque ou teclado</summary><p>Selecione uma peça acima e escolha seu destino. A posição e a orientação também serão verificadas.</p><div class="wb-destinations"></div></details><p class="wb-model-note">PCB original do EasyEDA. Módulos representados por modelos didáticos simplificados.</p></div>`;
 const viewport=host.querySelector('.wb-viewport'),labels=host.querySelector('.wb-labels'),status=host.querySelector('.wb-status'),parts=host.querySelector('.wb-parts'),selection=host.querySelector('.wb-selection');
 parts.before(selection);
 const say=text=>status.textContent=text;
 const addButton=(text,fn,parent,cls='')=>{const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;parent.append(b);return b;};
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x1c2230);
 const camera=new THREE.PerspectiveCamera(38,1,100,420);camera.position.set(15,-65,220);
 const root=new THREE.Group();root.position.set(-49,65,.8);scene.add(root);
 scene.add(new THREE.HemisphereLight(0xe7efff,0x697897,2.6));
 for(const [x,y,z] of [[-100,100,180],[100,-40,-180]]){const light=new THREE.DirectionalLight(0xffffff,2.4);light.position.set(x,y,z);scene.add(light);}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function render(){frame=0;if(!alive||!renderer)return;const now=performance.now();for(const [mesh,tween] of settling){const t=Math.min(1,(now-tween.start)/240);mesh.position.z=tween.end+tween.offset*Math.pow(1-t,3);if(t===1)settling.delete(mesh);}updateBoardDepth(camera,controls?.target||new THREE.Vector3());scene.updateMatrixWorld(true);renderer.render(scene,camera);for(const [id,target] of targets){const el=target.label;const p=target.position.clone();root.localToWorld(p);p.project(camera);const mod=byId(id);el.hidden=!ready||id!==selected||mod.side!==side||placed.has(id)||p.z>1||p.z< -1;el.style.left=`${(p.x*.5+.5)*100}%`;el.style.top=`${(-p.y*.5+.5)*100}%`;el.classList.toggle('active',id===selected);}if(settling.size)requestRender();}
 function requestRender(){if(alive&&!frame)frame=requestAnimationFrame(render);}
 function view(next){side=next==='oblique'?side:next;const sign=side==='front'?1:-1;const distance=225;camera.up.set(0,1,0);camera.position.set(next==='oblique'?65:0,next==='oblique'?-65:0,sign*distance);controls?.target.set(0,0,0);camera.lookAt(0,0,0);controls?.update();host.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===next));for(const [id,t] of targets)t.mesh.visible=byId(id).side===side&&!placed.has(id);requestRender();}
 function sync(){
  host.querySelector('.wb-count').textContent=`${required.filter(id=>placed.has(id)).length} / ${required.length} encaixadas`;
  for(const [id,b] of cards){b.disabled=!ready||placed.has(id);b.classList.toggle('placed',placed.has(id));b.setAttribute('aria-pressed',id===selected);b.querySelector('.wb-part-state').textContent=placed.has(id)?'✓ Encaixada':id===selected?'Selecionada':'Selecionar ou arrastar';}
  host.querySelectorAll('[data-target]').forEach(b=>b.disabled=!ready||placed.has(b.dataset.target)||!selected);
  for(const [id,t] of targets){t.mesh.visible=!placed.has(id)&&byId(id).side===side;t.mesh.material.opacity=id===selected?.2:.045;t.mesh.children[0].material.opacity=id===selected?.95:.3;}
  if(!finished&&required.every(id=>placed.has(id))){finished=true;say('✓ Todos os módulos desta bancada estão encaixados.');onComplete();}
  requestRender();
 }
 function save(){if(sandbox)try{localStorage.setItem(STORAGE,JSON.stringify([...placed]));}catch{say('Montagem mantida nesta sessão; o navegador não permitiu salvar.');}}
 function clearGhost(){if(ghost){root.remove(ghost);disposeModule(ghost);ghost=null;}}
 function put(id,animate=false){const mod=byId(id),mesh=makeModule(mod);mesh.position.set(...seatedPosition(mod));if(mod.side==='back')mesh.rotation.y=Math.PI;mesh.rotation.z=THREE.MathUtils.degToRad(targetRotation(mod));root.add(mesh);meshes.set(id,mesh);if(animate&&!reducedMotion){const offset=mod.side==='back'?-6:6;settling.set(mesh,{end:mesh.position.z,offset,start:performance.now()});mesh.position.z+=offset;requestRender();}}
 function rotatePiece(delta){if(!selected||!ghost||byId(selected).kind==='cap')return;rotation=normalizeRotation(rotation+delta);ghost.rotation.z=THREE.MathUtils.degToRad(rotation);const orientation=selection.querySelector('.wb-orientation');if(orientation)orientation.textContent=`Rotação: ${rotation}° · ${orientationMatches(byId(selected),rotation)?'orientação correta':'gire até alinhar a peça'}`;requestRender();}
 const rotationKey=e=>{if(!selected||byId(selected).kind==='cap'||e.key.toLowerCase()!=='r'||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;e.preventDefault();rotatePiece(e.shiftKey?-90:90);};
 window.addEventListener('keydown',rotationKey);
 function select(id){
  if(!ready||placed.has(id))return;
  if(selected===id)return;
  const mod=byId(id);selected=id;rotation=mod.kind==='cap'?0:90;clearGhost();ghost=makeModule(mod);ghost.position.set(...seatedPosition(mod));ghost.position.z+=mod.side==='front'?24:-24;if(mod.side==='back')ghost.rotation.y=Math.PI;ghost.rotation.z=THREE.MathUtils.degToRad(rotation);
  ghost.traverse(o=>{if(o.material){o.material.transparent=true;o.material.opacity=.72;}});root.add(ghost);side=mod.side;view('oblique');
  selection.innerHTML='';const title=document.createElement('p');title.className='wb-selected-name';title.textContent=mod.name+' · '+(mod.side==='front'?'Face frontal':'Face traseira');selection.append(title);
  const orientation=document.createElement('p');orientation.className='wb-orientation';orientation.textContent=mod.kind==='cap'?'Cap redondo · encaixa em qualquer rotação':`Rotação: ${rotation}° · gire até alinhar os pinos`;selection.append(orientation);
  if(mod.kind!=='cap'){addButton('↶ Girar 90°',()=>rotatePiece(-90),selection);
  addButton('Girar 90° ↷',()=>rotatePiece(90),selection);
  const hint=document.createElement('small');hint.className='wb-rotation-hint';hint.textContent='Teclado: R gira a peça; Shift + R gira no sentido contrário.';selection.append(hint);}
  addButton('Cancelar seleção',()=>{selected=null;clearGhost();selection.innerHTML='';sync();},selection);
  say('Leve '+mod.name+' até o encaixe com o mesmo nome.');sync();
 }
 function attempt(id,point){
  if(!selected||!ready)return;const result=validateDrop(selected,id,rotation,point);
  if(!result.ok){say(result.message);tone(180);return;}
  const selectedId=selected;placed.add(selectedId);clearGhost();put(selectedId,true);selected=null;selection.innerHTML='';say('✓ '+byId(selectedId).name+' encaixado.');tone();record('module_placed',{module:selectedId,mode:sandbox?'sandbox':'mission'});save();sync();
 }
 function at(clientX,clientY){const rect=viewport.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return rect;}
 function moveGhost(e){if(!selected||!ghost)return;at(e.clientX,e.clientY);const mod=byId(selected);const plane=new THREE.Plane(new THREE.Vector3(0,0,1),-(seatedPosition(mod)[2]+.8));const p=raycaster.ray.intersectPlane(plane,new THREE.Vector3());if(p){root.worldToLocal(p);ghost.position.copy(p);ghost.position.z+=mod.side==='front'?4:-4;}requestRender();}
 function drop(e){const rect=at(e.clientX,e.clientY);if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){say('Solte a peça dentro da área da PCB.');return;}
  const candidates=[...targets.values()].filter(t=>t.mesh.visible);const hits=raycaster.intersectObjects(candidates.map(t=>t.mesh),false);
  if(hits.length){const point=root.worldToLocal(hits[0].point.clone());attempt(hits[0].object.userData.id,point);}else say('Ainda está fora do encaixe. Aproxime a peça da área destacada.');
 }
 function begin(e,id){if(e.button!==0||!ready||placed.has(id))return;select(id);e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};if(controls)controls.enabled=false;}
 const pointerMove=e=>{if(!drag||e.pointerId!==drag.pointer)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(drag.moved){if(e.clientY<65)window.scrollBy(0,-18);else if(e.clientY>window.innerHeight-65)window.scrollBy(0,18);moveGhost(e);viewport.classList.add('dragging');}};
 const pointerEnd=e=>{if(!drag||e.pointerId!==drag.pointer)return;const moved=drag.moved;drag=null;viewport.classList.remove('dragging');if(controls)controls.enabled=true;if(moved)drop(e);requestRender();};
 const cancelDrag=()=>{drag=null;viewport.classList.remove('dragging');if(controls)controls.enabled=true;};
 window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',cancelDrag);window.addEventListener('blur',cancelDrag);
 for(const id of required){const mod=byId(id);const b=addButton('',()=>{select(id);if(window.innerWidth<850&&!placed.has(id)&&viewport.getBoundingClientRect().top<0)viewport.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},parts,'wb-part');b.innerHTML=`<span class="wb-part-icon" style="--part-color:#${mod.color.toString(16).padStart(6,'0')};font-size:${mod.symbol?.length>2?'10px':'24px'}">${mod.kind==='cap'?mod.symbol:mod.kind==='battery'?'＋ −':mod.kind==='display'?'▣':'▦'}</span><span><b>${mod.name}</b><small>${mod.role}</small><small class="wb-part-state">Preparando…</small></span>`;b.disabled=true;b.onpointerdown=e=>begin(e,id);b.ondragstart=e=>e.preventDefault();cards.set(id,b);
  const plane=new THREE.Mesh(new THREE.BoxGeometry(mod.size[0]+4,mod.size[1]+4,.6),new THREE.MeshBasicMaterial({color:0xb49bff,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide}));plane.position.set(mod.position[0],mod.position[1],mod.side==='front'?2:-2.5);plane.userData.id=id;root.add(plane);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(plane.geometry),new THREE.LineBasicMaterial({color:0xbba6ff,transparent:true,opacity:.9}));plane.add(edges);
  const label=addButton(mod.name,()=>{if(selected)attempt(id);else select(id);},labels,'wb-target');label.dataset.target=id;label.hidden=true;label.setAttribute('aria-label','Encaixe '+mod.name);targets.set(id,{mesh:plane,label,position:plane.position.clone()});
  const target=addButton('Encaixe '+mod.name,()=>attempt(id),host.querySelector('.wb-destinations'));target.dataset.target=id;
 }
 if(sandbox){const actions=document.createElement('div');actions.className='actions';host.querySelector('.wb-tray').append(actions);addButton('Desmontar e recomeçar',()=>{if(!confirm('Remover as peças da bancada livre? O progresso das missões será preservado.'))return;clearGhost();selected=null;selection.innerHTML='';for(const mesh of meshes.values()){root.remove(mesh);disposeModule(mesh);}meshes.clear();settling.clear();placed.clear();finished=false;save();sync();say('Bancada pronta. Escolha uma peça para começar.');},actions);}
 host.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));host.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{camera.position.multiplyScalar(b.dataset.zoom==='in'?.85:1.18);camera.position.clampLength(90,420);controls?.update();requestRender();});
 async function init(){try{
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute('aria-label','Modelo 3D interativo da PCB Hands on Lab');renderer.domElement.tabIndex=0;viewport.prepend(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=90;controls.maxDistance=420;controls.addEventListener('change',()=>{const newSide=camera.position.z>=0?'front':'back';if(newSide!==side){side=newSide;for(const [id,t] of targets)t.mesh.visible=byId(id).side===side&&!placed.has(id);}requestRender();});
  renderer.domElement.addEventListener('pointerdown',e=>{if(!selected||!ghost)return;at(e.clientX,e.clientY);if(raycaster.intersectObject(ghost,true).length){e.stopImmediatePropagation();begin(e,selected);}},true);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!alive)return;say('A visualização 3D foi interrompida. Reabra a bancada para recuperar o modelo.');});
  resizeObserver=new ResizeObserver(()=>{const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);requestRender();});resizeObserver.observe(viewport);
  const board=await loadBoard();if(!alive)return;root.add(board);for(const id of new Set([...required,...placed])){const mod=byId(id),socket=makeSocket(mod);socket.position.set(...seatedPosition(mod));if(mod.side==='back')socket.rotation.y=Math.PI;socket.rotation.z=THREE.MathUtils.degToRad(targetRotation(mod));root.add(socket);sockets.set(id,socket);}for(const id of placed)put(id);ready=true;host.querySelector('.wb-loading').remove();side=byId(required.find(id=>!placed.has(id))||required[0])?.side||'front';view('oblique');say('Sua PCB está pronta. Selecione ou arraste uma peça.');sync();
 }catch(error){if(!alive)return;console.error('PCB viewer:',error);host.querySelector('.wb-loading').textContent='Não foi possível abrir o modelo 3D. Verifique se a aceleração gráfica está disponível e reabra a bancada.';say('O progresso permanece salvo.');}}
 init();
 return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',rotationKey);window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerEnd);window.removeEventListener('pointercancel',cancelDrag);window.removeEventListener('blur',cancelDrag);resizeObserver?.disconnect();controls?.dispose();clearGhost();for(const mesh of meshes.values())disposeModule(mesh);for(const socket of sockets.values())disposeModule(socket);settling.clear();for(const t of targets.values())disposeModule(t.mesh);renderer?.dispose();renderer?.forceContextLoss();};
}
