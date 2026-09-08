const choice=(title,prompt,options,answer,why)=>({type:'choice',title,prompt,options,answer,why});
const order=(title,prompt,items,why)=>({type:'order',title,prompt,items,why});
const check=(title,items,why)=>({type:'check',title,prompt:'Confira cada item antes de continuar.',items,why});
const custom=(type,title,prompt,why)=>({type,title,prompt,why});
export const blocks=[
{title:'Conheça sua missão',subtitle:'Cada peça tem um papel.',badge:'Primeiro contato',time:'3–5 min',photo:'bloco-01-componentes-recriada.webp',missions:[
choice('Encontre o cérebro','Qual componente coordena o console?',['Display ILI9341','ESP32-S3','TP4056'],1,'O ESP32-S3 executa o firmware, processa os jogos e coordena os periféricos.'),
choice('Encontre o display','Qual peça apresenta a interface e os jogos?',['PCM5102A','Bateria 18650','Display ILI9341'],2,'O display transforma os dados do processador em imagens.'),
custom('sort','Organize os componentes','Selecione a função de cada componente.','Energia, processamento, imagem, controles e áudio trabalham juntos para formar o console.') ]},
{title:'Energia',subtitle:'Faça o console despertar.',badge:'Energia sob controle',time:'5–7 min',photo:'bloco-01-energia-instalada-recriada.webp',missions:[
choice('Coloque em segurança','Antes de conectar, qual posição isola a energia?',['ON','OFF'],1,'Energia isolada. No kit real, remova também a bateria antes de ajustar componentes.'),
order('Monte o caminho da energia','Toque nas peças na ordem do fluxo.', ['Bateria','TP4056 · carga e proteção','Chave','Reguladores','PCB'],'A bateria armazena energia; o módulo gerencia carga e proteção; a chave interrompe; os reguladores estabilizam as tensões.'),
choice('Regulador superior','Qual regulador vai no campo 3V3, acima?',['5 V','3,3 V'],1,'O campo superior recebe 3,3 V. Compare sempre os rótulos da placa.'),
choice('Regulador inferior','Qual regulador vai no campo 5V, abaixo?',['3,3 V','5 V'],1,'O campo inferior recebe 5 V. Uma troca exige correção antes do teste.'),
check('Inspecione a alimentação',['Chave em OFF','3V3 acima e 5V abaixo','Polos + e − da bateria alinhados'], 'Inspeção concluída. Agora você pode testar a alimentação virtual.'),
custom('power','Teste a alimentação','Selecione Testar alimentação e depois mova a chave para ON.','Os dois LEDs amarelos acenderam. Há energia nas linhas de 3,3 V e 5 V; o console ainda não iniciou.') ]},
{title:'Processamento e memória',subtitle:'Instale o cérebro.',badge:'Cérebro instalado',time:'5–7 min',photo:'bloco-02-processador-orientacao-recriada.webp',missions:[
choice('Oriente o ESP32-S3','Para onde ficam os conectores USB?',['Para dentro da PCB','Para fora, na borda esquerda'],1,'Compare a referência: USBs para fora e ambas as fileiras sobre os conectores.'),
custom('seat','Alinhe as duas fileiras','Encaixe as duas extremidades; o módulo precisa ficar paralelo.','Todos os pinos estão alinhados e as duas fileiras assentadas.'),
choice('A estante permanente','Qual memória guarda firmware e jogos internos?',['PSRAM','Flash','Cartão SD obrigatório'],1,'A flash mantém o conteúdo mesmo sem energia.'),
choice('A mesa de trabalho','Qual memória é a área temporária de trabalho?',['PSRAM','Flash','Bateria'],0,'A PSRAM oferece espaço temporário para dados durante a execução.'),
choice('A estante removível','O console funciona sem cartão SD?',['Sim, inicia e oferece jogos internos','Não, o launcher fica bloqueado'],0,'O cartão SD amplia a biblioteca. Sua ausência não impede a inicialização.'),
custom('firmware','Carregue o firmware','Transfira os módulos para a memória flash.','Firmware carregado. Processador e memória já podem trabalhar juntos.') ]},
{title:'Imagem',subtitle:'Faça o console enxergar.',badge:'Primeiro pixel',time:'4–6 min',photo:'bloco-04-display-orientacao-recriada-v2.webp',missions:[
choice('Identifique o display','Qual tela equipa esta montagem?',['ILI9341 · 320 × 240 pixels','Uma tela sem controlador'],0,'A imagem é formada por uma grade de 320 por 240 pixels.'),
choice('Oriente a tela','Compare a foto e os pinos antes de pressionar.',['Pinos alinhados e lado visível voltado para fora','Display invertido'],0,'O alinhamento vem antes da pressão; não force uma posição invertida.'),
custom('seat','Encaixe o display','Pressione os dois lados para retirar a inclinação.','Os dois lados estão assentados. A tela está paralela à placa.'),
order('Envie os dados','Monte o caminho dos dados de imagem.',['ESP32-S3','Comunicação SPI','Controlador ILI9341','Pixels'],'SPI transporta dados sincronizados. MOSI leva dados; clock marca o ritmo; chip select seleciona o dispositivo.'),
custom('colors','Teste a tela','Observe a sequência de cores e confirme o teste.','Preto, branco, vermelho, verde, azul e barras verificam a imagem.'),
choice('Por que RGB?','Por que usamos vermelho, verde e azul?',['Sua combinação produz outras cores','São as únicas cores da tela'],0,'Diferentes intensidades de vermelho, verde e azul compõem as cores da imagem.'),
custom('pixels','Construa uma imagem','Acenda os quatro pixels marcados para completar o ícone.','Vídeo OK. Pequenos pontos formam uma imagem quando vistos em conjunto.') ]},
{title:'Controles e áudio',subtitle:'Assuma o controle e encontre o som.',badge:'No controle',time:'6–8 min',photo:'bloco-03-controles-instalados-recriada.webp',missions:[
check('Monte os comandos',['Direcional: cima, baixo, esquerda, direita','Quatro botões de ação: A, B, X e Y','START e SELECT'], 'Cada pressão muda um sinal digital lido pelo ESP32-S3.'),
custom('buttons','Teste cada botão','Pressione o comando solicitado.','Todos os dez comandos respondem individualmente.'),
custom('combo','Dois botões ao mesmo tempo','Menu: SELECT + CIMA. Depois, Option: SELECT + BAIXO.','Os atalhos só são reconhecidos enquanto as duas entradas estão ativas.'),
custom('sequence','Repita a sequência','CIMA → DIREITA → A → START.','Você já sabe transformar comandos em ações.'),
order('Monte o caminho do som','Toque na ordem: do dado digital ao som.',['ESP32-S3','PCM5102A','Potenciômetro','PAM8403','Alto-falantes'],'O PCM5102A converte para analógico; o potenciômetro ajusta o volume; o PAM8403 amplifica; os alto-falantes produzem som.'),
custom('stereo','Canais e volume','Conecte os canais L e R, reduza o volume e teste.','Esquerda e direita testadas. Trocar os canais inverte a posição espacial do som.') ]},
{title:'Inicialização',subtitle:'Ligue, explore e jogue.',badge:'Console Builder',time:'8–12 min',photo:'console-complete-edited.webp',missions:[
check('Inspeção final',['ESP32-S3 alinhado','Display encaixado','Reguladores corretos','Bateria com polaridade correta','Controles testados','Áudio conectado','Volume inicial baixo'],'Tudo pronto para o primeiro boot.'),
choice('Confirme OFF','Qual posição deve ser confirmada antes da liberação?',['OFF','ON'],0,'Chave em OFF. Inicialização liberada.'),
custom('boot','Ligue o console','Teste e mova a chave para ON.','Energia, processador, memória interna, controles e áudio OK. Sem cartão SD: continuando com jogos internos.'),
custom('launcher','Explore o launcher','Mude de sistema, abra uma biblioteca e volte.','O launcher organiza os sistemas e suas bibliotecas.'),
custom('combo','Atalhos no launcher','Abra Menu com SELECT + CIMA e Option com SELECT + BAIXO.','Os mesmos atalhos do diagnóstico funcionam no launcher.'),
{...custom('snake','Desafio 1 — Arcade 8 bits','Colete cinco maçãs sem colidir. Vença para liberar a missão do portátil colorido.','Desafio de 8 bits concluído. A missão do portátil colorido está liberada.'),style:0},
{...custom('snake','Desafio 2 — Portátil colorido','Colete cinco maçãs no jardim pixelado. Vença para liberar a missão de 16 bits.','Desafio portátil concluído. A missão de 16 bits está liberada.'),style:1},
{...custom('snake','Desafio 3 — Era 16 bits','Colete cinco maçãs na clareira. Este desafio conclui seu console digital.','Você venceu os três desafios e concluiu o console digital!'),style:2} ]}
];
export const categories=['Energia','Processamento e memória','Imagem','Controles','Áudio'];
export const parts=[['Bateria',0],['TP4056',0],['ESP32-S3',1],['Flash e PSRAM',1],['Cartão SD',1],['ILI9341',2],['Direcional e botões',3],['PCM5102A e alto-falantes',4]];
export const gameStyles=[{name:'Arcade 8 bits',description:'Arena de blocos, paleta reduzida e sprites simples. Inspiração: NES.',bg:'#141e35',snake:'#9ee85a',food:'#ff7759',speed:220},{name:'Portátil colorido',description:'Jardim pixelado, frutas, contornos e sombras discretas. Inspiração: Game Boy Color.',bg:'#263d38',snake:'#d3ed8c',food:'#f7bb78',speed:220},{name:'Era 16 bits',description:'Clareira com luz, sombras, partículas e movimento suave. Inspiração: Super Nintendo.',bg:'#173a59',snake:'#67edca',food:'#ffd36d',speed:220}];
