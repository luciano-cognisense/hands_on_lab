const stages=[
 ['BOOT','Inicialização','0x00001000'],['APP','Launcher','0x00010000'],
 ['INPUT','Controles','0x00050000'],['VIDEO','Imagem','0x00070000'],
 ['AUDIO','Áudio','0x00090000'],['CORE','Emuladores','0x00100000'],
 ['GAMES','Jogos internos','0x00200000']
];
export function mountFlashTerminal(area,onComplete){
 let timer,disposed=false;
 area.innerHTML=`<section class="flash-terminal" aria-label="Simulação de gravação do firmware"><header><span class="terminal-dots" aria-hidden="true">● ● ●</span><span>HOL / FLASH CONSOLE</span><b>SIMULAÇÃO</b></header><div class="flash-body"><p class="terminal-command"><span>hol@bancada:~$</span> flash --chip esp32-s3</p><div class="flash-route" aria-hidden="true"><span>FIRMWARE<br>▤</span><i>→ → →</i><span>ESP32-S3<br>▣</span><i>→ → →</i><span>FLASH<br>▥</span></div><div class="flash-log" aria-label="Registro de gravação"></div><div class="flash-memory" aria-label="Módulos na memória flash">${stages.map(([id,name])=>`<span title="${name}">${id}</span>`).join('')}</div><label class="flash-progress-label" for="flash-progress">Aguardando início <span>0%</span></label><progress id="flash-progress" max="100" value="0"></progress><p class="flash-status" role="status">Pronto para gravar o firmware virtual.</p></div></section>`;
 const log=area.querySelector('.flash-log'),memory=[...area.querySelectorAll('.flash-memory span')],progress=area.querySelector('progress'),label=area.querySelector('.flash-progress-label'),status=area.querySelector('.flash-status');
 function line(message,kind=''){const p=document.createElement('p');p.className=kind;p.textContent=message;log.append(p);log.scrollTop=log.scrollHeight;}
 line('[READY] ESP32-S3 · memória flash interna');line('[INFO] Simulação educacional; nenhum dispositivo será gravado.');
 const start=document.createElement('button');start.className='primary';start.textContent='Iniciar gravação virtual';area.append(start);
 start.onclick=()=>{start.disabled=true;area.querySelector('.flash-terminal').classList.add('is-writing');line('> Conectando ao bootloader virtual…');line('[OK] Conexão estabelecida · preparando setores','ok');let tick=0;
  timer=setInterval(()=>{if(disposed)return;const stage=Math.floor(tick/3),part=tick%3,[id,name,address]=stages[stage];
   memory[stage].classList.add('writing');
   if(part===0)line(`ERASE ${address}  ${name}…`);
   if(part===1)line(`WRITE ${address}  [${id}] dados transferidos`);
   if(part===2){line(`[OK] ${name} · verificação concluída`,'ok');memory[stage].className='written';}
   tick++;const percent=Math.round(tick/21*100);progress.value=percent;label.innerHTML=`Gravando na flash <span>${percent}%</span>`;status.textContent=`${name} · ${percent}%`;
   if(tick===21){clearInterval(timer);line('[SUCCESS] 7/7 módulos verificados. Firmware carregado.','ok');line('hol@bancada:~$ _','terminal-command');label.innerHTML='Gravação concluída <span>100%</span>';status.textContent='Firmware carregado e verificado.';area.querySelector('.flash-terminal').classList.remove('is-writing');start.textContent='✓ Firmware gravado';onComplete();}
  },260);
 };
 return()=>{disposed=true;clearInterval(timer);};
}
