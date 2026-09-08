// Original artwork, drawn in a shared 20 × 15 arena. Decorations never affect collisions.
export const ART_WIDTH=352,ART_HEIGHT=288;
const X=16,Y=32,S=16;
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
function ellipse(c,color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(c,s,x,y,color,size=9){c.fillStyle=color;c.font=`bold ${size}px monospace`;c.fillText(s,x,y);}
function sprite(c,rows,colors,x,y,scale=1){rows.forEach((row,dy)=>[...row].forEach((p,dx)=>{if(colors[p])rect(c,colors[p],x+dx*scale,y+dy*scale,scale,scale);}));}
const fruit=['....gg....','...gg.....','..rrrrrr..','.rrhrrrrr.','rrhhrrrrrr','rrrrrrrrrr','.rrrrrrrr.','..rrrrrr..'];
const fern=['...g...','g..g..g','.g.g.g.','..ggg..','...g...'];
function noise(x,y){return ((x*47+y*131+x*y*17)%101)/101;}
export function paintBackdrop(c,style){
 c.clearRect(0,0,ART_WIDTH,ART_HEIGHT);
 if(style===0){
  rect(c,'#090e25',0,0,352,288);rect(c,'#111a35',X,Y,320,240);
  for(let y=0;y<15;y++)for(let x=0;x<20;x++)if((x+y)%2===0)rect(c,'#16203d',X+x*S,Y+y*S,16,16);
  for(let y=32;y<288;y+=8)for(let x=0;x<352;x+=16)if(x<16||x>=336||y>=272){rect(c,'#544c85',x+(y%16?4:0),y,14,6);rect(c,'#918cc2',x+(y%16?4:0),y,14,1);}
  text(c,'SEED RUN / 01',16,20,'#c1a9ff',10);
 }else if(style===1){
  rect(c,'#283c45',0,0,352,288);rect(c,'#c6df91',X,Y,320,240);
  for(let y=0;y<15;y++)for(let x=0;x<20;x++){
   const px=X+x*S,py=Y+y*S,n=noise(x,y);rect(c,(x+y)%2?'#bed988':'#c6df91',px,py,16,16);
   if(n>.45){rect(c,'#a3c57c',px+3,py+11,2,2);rect(c,'#afcf80',px+11,py+4,1,3);}
  }
  for(let y=32;y<280;y+=12)for(const x of [2,338]){rect(c,'#456b50',x,y,12,10);rect(c,'#80a764',x+2,y,8,3);rect(c,'#30493d',x+3,y+8,6,2);}
  for(let x=16;x<336;x+=12){rect(c,'#456b50',x,274,10,12);rect(c,'#8ebd73',x+2,274,6,3);if(x%36===16)sprite(c,['.p.','ppp','.y.'],{p:'#ec9ca0',y:'#f8e8a7'},x+3,278,2);}
  text(c,'JARDIM DE BOLSO',16,20,'#e4ecc1',10);
 }else{
  const g=c.createLinearGradient(0,32,0,272);g.addColorStop(0,'#326f59');g.addColorStop(.5,'#509466');g.addColorStop(1,'#2d6b58');c.fillStyle=g;c.fillRect(0,0,352,288);
  for(let y=0;y<15;y++)for(let x=0;x<20;x++){
   const px=X+x*S,py=Y+y*S,n=noise(x,y);rect(c,n>.55?'#ffffff05':'#062e2808',px,py,16,16);
   if(n>.4){rect(c,'#82b57744',px+4,py+5,1,3);rect(c,'#123f3920',px+11,py+10,3,1);}
  }
  // Distant canopy and stream stay outside the playable clearing.
  rect(c,'#102d3b',0,0,352,32);rect(c,'#164955',0,272,352,16);
  for(let x=-12;x<352;x+=24){ellipse(c,'#163f3b',x,31,22,7);ellipse(c,'#275747',x+6,27,15,5);}
  for(let y=36;y<270;y+=23)for(const x of [5,345]){ellipse(c,'#183e35',x,y+4,10,12);ellipse(c,'#31694b',x-2,y,8,9);sprite(c,fern,{g:'#80a96a'},x-5,y-6,1.5);}
  text(c,'CLAREIRA LUMINOSA',16,19,'#dcf0d4',10);
 }
}
function body8(c,p,index){const x=X+p.x*S,y=Y+p.y*S;rect(c,'#0c1025',x+1,y+1,14,14);rect(c,index?'#63b858':'#ace879',x+2,y+2,12,12);rect(c,'#d5f69c',x+3,y+2,9,2);if(index)rect(c,'#31704d',x+5,y+7,5,4);}
function bodyPocket(c,p,index){const x=X+p.x*S,y=Y+p.y*S;rect(c,'#6b995c',x+3,y+5,12,11);sprite(c,['..oooooo..','.oggggggo.','oghhhhgggo','oggggggggo','oggggggggo','.oggggggo.','..oooooo..'],{o:'#304f43',g:index?'#5b9170':'#71b588',h:'#b3d998'},x+1,y+2,1.4);}
function body16(c,p,index,time){const x=X+p.x*S+8,y=Y+p.y*S+8;ellipse(c,'#102d3f55',x+2,y+5,7,4);ellipse(c,'#193f46',x,y,7.5,7);ellipse(c,index?'#43c8af':'#72e7cb',x,y-1,6.7,6);ellipse(c,'#aff8d077',x-2,y-3,3.5,2);if(index){c.strokeStyle='#248e94';c.lineWidth=1;c.beginPath();c.arc(x,y+1,3,0,Math.PI);c.stroke();}}
export function paintSnakeFrame(c,{style,backdrop,snake,previous,dir,food,score,running,time=0,blend=1,effects=[]}){
 c.clearRect(0,0,352,288);c.drawImage(backdrop,0,0,352,288);
 if(style===2){
  // Slow reflections and light shafts add a background layer without hiding the grid.
  c.save();c.beginPath();c.rect(X,Y,320,240);c.clip();
  for(let i=0;i<3;i++){c.fillStyle='#effdc309';c.beginPath();const x=50+i*115+Math.sin(time/6000+i)*13;c.moveTo(x,32);c.lineTo(x+18,32);c.lineTo(x+92,272);c.lineTo(x+46,272);c.fill();}c.restore();
  for(let i=0;i<14;i++)rect(c,'#7de0cf66',(i*29+time/130)%352,276+(i%3)*3,10,1);
 }
 const fx=X+food.x*S,fy=Y+food.y*S;
 if(style===0)sprite(c,fruit,{g:'#88d96e',r:'#e85d75',h:'#ffe5a4'},fx+3,fy+4);
 else if(style===1){rect(c,'#82a96b',fx+3,fy+12,11,2);sprite(c,fruit,{g:'#497551',r:'#d96864',h:'#ffe5a4'},fx+2,fy+3,1.2);}
 else{
  const bob=running?Math.sin(time/220)*1.1:0;ellipse(c,'#122f3555',fx+9,fy+13,6,2.5);
  const glow=c.createRadialGradient(fx+8,fy+7,1,fx+8,fy+7,13);glow.addColorStop(0,'#ffe89466');glow.addColorStop(1,'#ffe89400');c.fillStyle=glow;c.fillRect(fx-5,fy-6,26,26);
  ellipse(c,'#d17438',fx+8,fy+8+bob,5.8,6);ellipse(c,'#ffc879',fx+7,fy+7+bob,4.6,4.6);ellipse(c,'#fff3b9',fx+5,fy+5+bob,1.5,2);ellipse(c,'#81dba0',fx+10,fy+1+bob,3,1.5);
 }
 let head;
 c.save();c.beginPath();c.rect(X,Y,320,240);c.clip();
 for(let i=snake.length-1;i>=0;i--){let p=snake[i];if(style===2&&previous&&blend<1){const old=previous[Math.min(i,previous.length-1)];p={x:old.x+(p.x-old.x)*blend,y:old.y+(p.y-old.y)*blend};}
  if(style===0)body8(c,p,i);else if(style===1)bodyPocket(c,p,i);else body16(c,p,i,time);if(i===0)head=p;
 }
 if(head){const x=X+head.x*S+8,y=Y+head.y*S+8;for(const side of [-1,1]){const ex=x+dir.x*4-dir.y*side*3,ey=y+dir.y*4+dir.x*side*3;if(style===2){ellipse(c,'#f9ffe8',ex,ey,2.2,2.2);ellipse(c,'#16273b',ex+dir.x*.6,ey+dir.y*.6,1.1,1.3);}else{rect(c,'#f5f3c4',Math.round(ex)-1,Math.round(ey)-1,3,3);rect(c,'#17273b',Math.round(ex+dir.x),Math.round(ey+dir.y),1,1);}}}
 if(style===2)for(const e of effects){const age=(time-e.time)/550;if(age<0||age>1)continue;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.globalAlpha=1-age;ellipse(c,i%2?'#a0ffdc':'#ffdb7c',X+e.x*S+8+Math.cos(a)*age*23,Y+e.y*S+8+Math.sin(a)*age*23-age*8,2-age,2-age);}c.globalAlpha=1;}
 c.restore();
 text(c,score>=5?`${score.toString().padStart(3,'0')}  OK`:`${score.toString().padStart(2,'0')} / 05`,270,20,style===0?'#f6dca2':'#edfacf',10);
}
