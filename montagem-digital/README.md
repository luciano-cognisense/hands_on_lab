# Montagem digital


Rota estática `montagem-digital/`, compatível com o site existente e hospedagem em subdiretório. Não altera o manual, seu progresso ou o firmware. O CTA final aponta para a página atual do kit, conforme decisão do proprietário.

## Organização

- `content.js`: seis blocos, 35 atividades, explicações e estilos dos jogos.
- `state.js`: progresso versionado no navegador, desbloqueio e eventos desacoplados.
- `app.js`: montagem guiada, diagnóstico, multitouch e alternativa de SELECT mantido.
- `audio.js`: áudio sintético opcional, ativado por gesto.
- `game.js`: Snake original com colisão, pausa, controles virtuais e três direções de arte.
- `digital.css`: identidade compartilhada com o manual e layout responsivo.
- `workbench.js`: bancada 3D, câmera, arraste com Pointer Events, toque/teclado, validação e persistência livre.
- `assembly-data.js`: módulos, posições CAD, critérios de encaixe e onze missões de montagem.
- `board-model.js`: carregamento da malha real e modelos didáticos dos módulos.
- `models/`: malha indexada de 2,93 MB, convertida do OBJ/MTL EasyEDA fornecido.
- `vendor/`: Three.js 0.180.0 local, com licença MIT.
- `tools/convert_pcb.py`: conversor reproduzível; preserva os arquivos de origem.

Sem instalação de dependências ou etapa de compilação. Three.js é servido localmente e carregado apenas ao abrir a bancada. Servir a raiz do repositório por HTTP e abrir `/montagem-digital/` (módulos ES não devem ser abertos via `file://`).

Eventos são emitidos como `CustomEvent('hol:analytics')` na janela, sem envio externo: start, mission_complete, block_complete, abandon, game_start, game_mission_complete, generation_compare, module_placed e kit_cta. `abandon` significa página ocultada, sendo apenas um indicador provisório de abandono. A integração analítica continua aberta.

## Limites desta primeira versão

A bancada utiliza a geometria real da PCB e dos componentes fixos do arquivo `3D_PCB1_2026-09-07.zip` (OBJ/MTL). STEP e DXF não são necessários no navegador. A PCB contém 130.601 triângulos e mantém ambas as faces e a serigrafia. Os onze módulos removíveis são modelos didáticos simplificados, posicionados segundo a serigrafia do CAD; não são modelos industriais dos módulos. Arraste funciona por Pointer Events, incluindo toque; seleção seguida de toque no encaixe ou escolha por teclado usa os mesmos critérios de peça e orientação.

Onze atividades usam encaixes 3D, incluindo as duas primeiras missões de reconhecimento. Esses encaixes introdutórios são exploratórios e não pulam a instalação definitiva dos blocos seguintes. A bancada livre tem a chave `hol-digital-assembly-v1`, independente do progresso sequencial `hol-digital-v1`. As missões preservam os índices antigos, carregam as peças de etapas anteriores e exigem novo encaixe das peças da atividade atual. A montagem de alto-falantes é seguida pelo controle de volume e teste estéreo. A bancada renderiza sob demanda, limita a densidade de pixels e libera controles e recursos próprios ao sair. WebGL é necessário para abrir a bancada. Ainda não existe animação completa das trilhas. As comparações do Snake são estilísticas, não representam emulação nem restrições históricas verificadas. O final exige vencer três missões consecutivas: 8 bits, portátil e 16 bits, com pelo menos cinco maçãs em cada partida.

Pendentes para versão definitiva: modelos detalhados dos módulos removíveis, revisão da sequência física com o responsável pelo kit, experiência de launcher mais fiel, animações de boot e firmware, música final autoral desenvolvida, vídeo e informações comerciais de tempo/público, validação das referências históricas e textuais, testes reais de multitouch e acessibilidade em dispositivos móveis. Prévia publicada pelo GitHub Pages na rota `montagem-digital/`.

## Verificação

Verificados sintaxe dos módulos, desbloqueio sequencial, bloqueio de saltos, normalização do progresso, crescimento e colisões do Snake. A rota respondeu HTTP 200. Ainda não foi executada validação de interação em navegador/dispositivo real.

Execute `npm test` nesta pasta: treze testes cobrem correspondência de missões, preservação da progressão, validação de peça/orientação/posição, interseção de raios nas duas faces e integridade completa da malha e materiais. O teste não precisa de dependências instaladas. Sintaxe dos módulos e entrega HTTP do modelo também verificadas.

## Altura e rotação de encaixe

`mounting()` e `seatedPosition()` centralizam a altura: superfície frontal em Z=0 e traseira em Z=-1,64 mm; conectores didáticos de 8,5 mm e 2 mm de pino aparente para módulos eletrônicos. Os centros ficam em Z=12,5 mm para o display, Z=-14,14 mm para o ESP32-S3 e Z=-13,64 mm para módulos de 3 mm de espessura. Bateria e alto-falantes usam apoios de 3 mm. A altura da própria peça é considerada para evitar interseção da face inferior com os conectores.

Pinos entram 2 mm nos soquetes. Fileiras específicas para display, ESP32-S3, SD e áudio substituem os pinos genéricos. São aproximações didáticas, não especificações mecânicas de fabricação. A animação de encaixe desce 6 mm em 240 ms e respeita redução de movimento.

As peças começam em 90° e giram em passos de 90°, pelos botões ou R/Shift+R. O encaixe exige a orientação configurada por módulo: ESP32-S3, TP4056 e SD usam 180°; os demais módulos usam 0°. Os soquetes e as peças já salvas usam essa mesma referência. Caps redondos não exigem orientação. A bancada livre e as missões compartilham o mesmo renderizador, alturas e critérios. Montagens já salvas reaparecem com as novas alturas.

## Caps dos pushbuttons

Dez caps em `assembly-data.js`, derivados dos centros dos atuadores do OBJ original: quatro pretos no direcional, X azul, Y verde, A vermelho, B amarelo, SELECT/START claros, conforme o manual. Os caps são modelos didáticos circulares de 11 mm de diâmetro com borda suavizada, cavidade inferior de raio 3,25 mm e identificação no topo. O teto da cavidade encontra o atuador em Z=7,491 mm; não são adicionados switches nem soquetes sobre os pushbuttons existentes. Não se destinam a fabricação/impressão sem revisão dimensional.

Disponíveis na bancada livre e na primeira missão de Controles e áudio. Caps redondos aceitam qualquer ângulo, não mostram controles de rotação e exigem apenas o comando correto no destino. O diagnóstico individual continua na atividade seguinte. Os testes verificam centros contra a malha CAD, cores, integração na progressão e colisão do raio com o teto da cavidade.

## Snake: progressão visual e terminal de flash

`snake-art.js` separa a arte da simulação: arena de blocos em 8 bits; jardim com sprites, contornos e vegetação no portátil; clareira com sombras, raios de luz, reflexos, frutas com brilho, partículas e interpolação na versão de 16 bits. O último estilo usa canvas em resolução dupla; todos mantêm a grade de 20 × 15, passo de 220 ms e objetivo de cinco itens. As cenas são autorais e estilizadas, sem alegação de reproduzir limitações exatas das plataformas.

O fundo é desenhado uma vez por estilo. Apenas a versão de 16 bits pede quadros contínuos; pausa, aba oculta e saída cancelam a animação. Redução de movimento desliga interpolação e efeitos animados. O texto de status muda apenas quando necessário.

`flash-terminal.js` apresenta gravação virtual em terminal preto: conexão, apagamento, escrita, verificação, mapa de sete módulos e progresso percentual. A interface identifica a simulação explicitamente e não acessa dispositivos. Ao sair da missão, o timer é cancelado. A tela de boot também usa fundo preto e tipografia de terminal.

## Layout físico dos controles e acesso provisório de testes

Diagnóstico individual, sequências e atalhos compartilham a disposição do console: direcional em cruz à esquerda; X azul acima, Y verde à esquerda, A vermelho à direita e B amarelo abaixo; SELECT e START claros na base. Snake usa a mesma cruz direcional. Eventos Pointer Events e detecção simultânea permanecem intactos.

O botão provisório no mapa ativa `hol-digital-test-unlock`. Libera todos os blocos e acrescenta um seletor de qualquer missão, incluindo firmware, controles e comparação de Snake. Não marca blocos como concluídos; completar atividades nesse modo não modifica o progresso normal. Desativar o botão restaura os bloqueios normais. Mantido nesta prévia para refinamento; remover antes do lançamento definitivo.

## Final sequencial

O bloco 6 termina em três missões Snake com estilo fixo: NES (8 bits), GBC (portátil), SNES (16 bits). Cada vitória salva imediatamente o avanço e libera a missão seguinte. Iniciar uma partida não concede conclusão. A quinta maçã em 16 bits conclui o objetivo e libera o botão para a apresentação do kit físico; a partida continua até o jogador optar por avançar. O modo provisório de teste pode pular missões e continua sem alterar o progresso normal.

O formato de progresso agora usa versão 2 na mesma chave local. Saves anteriores preservam a montagem e a vitória em NES, mas a antiga atividade de comparação não conta como vitória em GBC/SNES: esses usuários retomam no desafio portátil.

A quinta maçã salva o desbloqueio uma única vez, sem parar o timer. A pontuação continua crescendo; colisão ou nova partida não revogam o botão já liberado. No último estilo, o botão “Concluir e conhecer o kit físico” substitui a transição automática. Somente colisão, pausa ou preenchimento total das 300 células encerram/interrompem a partida. Um teste com relógio e canvas simulados verifica a quinta e sexta maçãs, colisão, reinício e limpeza ao sair.
