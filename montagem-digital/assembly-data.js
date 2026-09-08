// Coordinates in millimetres, measured against the supplied EasyEDA model/silkscreen.
// Removable modules are schematic teaching models; the host PCB is the actual CAD mesh.
export const caps=[
 ['up','CIMA','↑',23.895,-65.378,0x202329],
 ['left','ESQUERDA','←',12.361,-77.126,0x202329],
 ['right','DIREITA','→',35.602,-77.126,0x202329],
 ['down','BAIXO','↓',23.895,-88.875,0x202329],
 ['x','X','X',75.457,-63.474,0x2878d4],
 ['a','A','A',88.942,-77.317,0xd83e44],
 ['y','Y','Y',61.891,-77.317,0x299764],
 ['b','B','B',75.457,-90.779,0xefbb27],
 ['select','SELECT','SELECT',39.969,-111.988,0xe1e3e9],
 ['start','START','START',59.019,-112.115,0xe1e3e9],
].map(([id,control,symbol,x,y,color])=>({id:'cap-'+id,name:'Cap '+control,role:'Pushbutton · '+control,side:'front',position:[x,y,7.741],size:[11,11,3.5],color,kind:'cap',symbol,control}));
export const modules=[
 ...caps,
 {id:'tp4056',targetRotation:180,name:'TP4056',role:'Carga e proteção',side:'back',position:[13,-10,-4],size:[25,18,3],color:0x257fb7,kind:'charger'},
 {id:'reg33',name:'Regulador 3,3 V',role:'Campo 3V3',side:'back',position:[58,-27,-4],size:[15,28,3],color:0x664cb8,kind:'regulator'},
 {id:'reg5',name:'Regulador 5 V',role:'Campo 5V',side:'back',position:[38,-27,-4],size:[15,28,3],color:0x237857,kind:'regulator'},
 {id:'battery',name:'Bateria 18650',role:'Energia armazenada',side:'back',position:[51,-79,-5],size:[68,20,17],color:0x704cca,kind:'battery'},
 {id:'esp32',targetRotation:180,name:'ESP32-S3',role:'Processamento',side:'back',position:[69,-114,-6],size:[54,24,4],color:0x203c36,kind:'processor'},
 {id:'sd',targetRotation:180,name:'Leitor microSD',role:'Biblioteca expansível',side:'back',position:[81,-23,-5],size:[22,39,3],color:0x257bb7,kind:'sd'},
 {id:'display',name:'Display ILI9341',role:'Imagem · 320 × 240',side:'front',position:[54,-24,10],size:[75,42,4],color:0xd02f38,kind:'display'},
 {id:'pcm',name:'PCM5102A',role:'Conversão digital → analógica',side:'back',position:[7,-48,-5],size:[14,29,3],color:0x215fa3,kind:'dac'},
 {id:'amp',name:'PAM8403',role:'Amplificação',side:'back',position:[11,-116,-5],size:[17,20,3],color:0x197854,kind:'amp'},
 {id:'speakerL',name:'Alto-falante 1',role:'Saída de áudio',side:'front',position:[6,-114,6],size:[9,14,6],color:0x30343b,kind:'speaker'},
 {id:'speakerR',name:'Alto-falante 2',role:'Saída de áudio',side:'front',position:[18,-114,6],size:[9,14,6],color:0x30343b,kind:'speaker'},
];
// The component origin is above its connector, measured outward from its PCB face.
// Connector dimensions are didactic; they can be replaced with module-specific CAD.
export function mounting(mod){
 if(mod.kind==='cap')return {surfaceZ:0,headerHeight:5.991,gap:0,pinDepth:0,underside:1.75,electronic:false};
 const electronic=!['battery','speaker'].includes(mod.kind);
 return {surfaceZ:mod.side==='back'?-1.64:0,headerHeight:electronic?8.5:3,
  gap:electronic?2:0,pinDepth:2,underside:mod.kind==='battery'?4:mod.kind==='speaker'?1:mod.size[2]/2,electronic};
}
export function seatedPosition(mod){const mount=mounting(mod),sign=mod.side==='back'?-1:1;return [mod.position[0],mod.position[1],mount.surfaceZ+sign*(mount.headerHeight+mount.gap+mount.underside)];}
export function targetRotation(mod){return mod.targetRotation??0;}
export function orientationMatches(mod,angle){return Number.isFinite(angle)&&(mod.kind==='cap'||normalizeRotation(angle)===targetRotation(mod));}
export function normalizeRotation(degrees){return ((degrees%360)+360)%360;}
export function connectorRows(mod){
 if(mod.kind==='display')return [{x:35,y:0,axis:'y',count:14,pitch:2.54}];
 if(mod.kind==='processor')return [-12.7,12.7].map(y=>({x:0,y,axis:'x',count:21,pitch:2.54}));
 if(mod.kind==='sd')return [{x:0,y:-15,axis:'x',count:6,pitch:2.54}];
 if(mod.kind==='dac')return [{x:0,y:-mod.size[1]/2+1,axis:'x',count:6,pitch:2.54}];
 if(mod.kind==='amp')return [{x:0,y:-mod.size[1]/2+1,axis:'x',count:4,pitch:2.54}];
 return [-1,1].map(sign=>({x:0,y:sign*(mod.size[1]/2-1),axis:'x',count:Math.min(10,Math.floor(mod.size[0]/2.54)),pitch:2.54}));
}
export function connectorPins(row){return Array.from({length:row.count},(_,i)=>({x:row.x+(row.axis==='x'?(i-(row.count-1)/2)*row.pitch:0),y:row.y+(row.axis==='y'?(i-(row.count-1)/2)*row.pitch:0)}));}
export const assemblyTasks={
 '0:0':{ids:['esp32'],preview:true,title:'Encontre e encaixe o cérebro',prompt:'Conheça a placa real: arraste o ESP32-S3 até suas duas fileiras de conectores e gire a peça para alinhar os pinos. Este primeiro encaixe é uma exploração.'},
 '0:1':{ids:['display'],preview:true,title:'Experimente o encaixe do display',prompt:'Na face frontal, arraste o display até seu conector. Use os botões de rotação para alinhar a fileira de pinos. A instalação definitiva será feita no bloco de imagem.'},
 '1:1':{ids:['tp4056','battery'],title:'Monte o caminho da energia',prompt:'Vire a PCB e encaixe o TP4056 e a bateria nos campos indicados. Arraste uma peça ou selecione-a e toque no destino.'},
 '1:2':{ids:['reg33'],title:'Encaixe o regulador de 3,3 V',prompt:'Localize a inscrição 3V3 na face traseira e solte o regulador sobre ela.'},
 '1:3':{ids:['reg5'],title:'Encaixe o regulador de 5 V',prompt:'Encontre o campo 5V. Os reguladores têm funções diferentes: confira o rótulo antes de encaixar.'},
 '2:1':{ids:['esp32'],title:'Instale o cérebro na PCB',prompt:'Leve o ESP32-S3 até as duas fileiras de conectores. Se a orientação estiver invertida, gire a peça antes de encaixar.'},
 '2:4':{ids:['sd'],title:'Adicione a biblioteca expansível',prompt:'Encaixe o leitor no campo SDCARD. Ele amplia a biblioteca; o console também funciona com os jogos internos, sem cartão.'},
 '3:2':{ids:['display'],title:'Encaixe o display',prompt:'Na face frontal, posicione o display dentro da marcação de 2,4 polegadas, alinhado ao conector.'},
 '4:0':{ids:caps.map(cap=>cap.id),title:'Encaixe os caps dos controles',prompt:'Arraste os quatro caps pretos para o direcional, os coloridos para os botões de ação e os claros para SELECT e START. Cada cap encaixa sobre o pushbutton já instalado.'},
 '4:4':{ids:['pcm','amp'],title:'Monte os módulos de áudio',prompt:'Encontre PCM5102A e PAM8403 na face traseira. Encaixe o conversor e depois o amplificador.'},
 '4:5':{ids:['speakerL','speakerR'],title:'Conecte as saídas de som',prompt:'Encaixe os alto-falantes nos campos SPEAKER 1 e SPEAKER 2 da face frontal. Depois reduza o volume para o teste.'},
};
export function priorModules(block,mission){return Object.entries(assemblyTasks).filter(([key,task])=>{if(task.preview)return false;const [b,m]=key.split(':').map(Number);return b<block||b===block&&m<mission;}).flatMap(([,task])=>task.ids);}
export function validateDrop(moduleId,targetId,rotation,point){
 const mod=modules.find(m=>m.id===moduleId);
 if(!mod||targetId!==moduleId)return {ok:false,message:'Este encaixe pertence a outra peça. Confira o nome indicado na PCB.'};
 if(!orientationMatches(mod,rotation))return {ok:false,message:'Os pinos ainda não estão alinhados. Gire a peça em passos de 90° até a fileira dourada coincidir com o conector.'};
 if(point&&(Math.abs(point.x-mod.position[0])>mod.size[0]/2+3||Math.abs(point.y-mod.position[1])>mod.size[1]/2+3))return {ok:false,message:'Aproxime a peça da área destacada e solte dentro do encaixe.'};
 return {ok:true};
}
