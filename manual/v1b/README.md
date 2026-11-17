# Manual didático V1B

Primeira implementação do roteiro de 17/11/2026. A página é estática, em `manual/v1b/`, e preserva o manual V1A.

## Disponível
- Navegação por seis blocos e links por hash.
- Roteiro das atividades, previsões, conceitos e evidências esperadas.
- Confirmação manual por bloco, persistida separadamente da V1A.
- Prévia local do Blink, iniciada explicitamente pelo usuário, com cor e tempos de 100–5000 ms.

## Próximas entregas
1. Localizar o repositório do firmware e conferir config.h, GPIO48 e conflito com SPI.
2. Validar alimentação e isolamento durante gravação USB na v1b.
3. Implementar firmware didático mínimo: boas-vindas, reinício, Blink e parâmetros persistentes.
4. Definir comunicação versionada: identificação, seleção de atividade, escrita e leitura de parâmetros, confirmação e erros.
5. Integrar instalador e comunicação ao navegador; não simular sucesso antes da confirmação do dispositivo.
6. Conferir fotos reais da v1b e completar procedimentos de montagem e solução de problemas.
7. Implementar controles, display, áudio, armazenamento e diagnóstico integrado.

A inversão dos conversores não está liberada. TP4056, áudio e pinout exigem validação de bancada. O firmware didático e os binários de protótipo estão em `../../firmware/activities` e `firmware/`. A gravação pelo navegador permanece desabilitada até validação física. A comunicação USB de parâmetros pode ser testada em uma placa de bancada já preparada.

## Integração em desenvolvimento — 17/11/2026

Origem confirmada do firmware de jogos: `../rg-launcher-art-v2`, branch
`design/launcher-art-v2`, base `a9c8fb9b`, com alterações locais de pinagem.
Não usar o checkout `../retro-go` como origem do launcher aprovado.

Decisão de hardware V1B: WS2812 e clock do display compartilham GPIO48.
Usar o RGB somente antes do bloco Display, com display desconectado.
Encerrar o driver RGB antes de inicializar SPI. Nas etapas com display,
o LED pode acender involuntariamente; esta limitação foi aceita pelo usuário.
O GPIO38 permanece como indicador de status separado.

`device.mjs` é a primeira camada experimental de comunicação; está ligada à interface de Blink. O código do firmware correspondente está em
`../../firmware/activities`; há pacote verificável e adaptador de gravação, mas a instalação está bloqueada até validação física.
Protocolo proposto: JSON por linha, `protocol: 1`, identificador `id` e
`command`. Respostas devem repetir protocolo e identificador, informar `ok`
e trazer `result` ou `error`. Comandos: `hello`, `blink.set`, `blink.get`.
O hello identifica `firmware: hol-activities`, `board: v1b`, `version` e
`capabilities: [blink]`. Blink usa `color` hexadecimal, `onMs` e `offMs`.
O firmware só deve confirmar `persisted: true` após sucesso na memória
persistente. O cliente exige leitura de volta correspondente. O botão de verificação exige novo `bootId` e leitura após reinício; a observação do LED físico continua obrigatória.

Teste local: `node manual/v1b/tests/device.test.mjs`.
Não há instalação ou gravação física liberada nesta implementação parcial.

## Bloqueio de instalação

A partição `otadata` escolhe o slot de boot. Escrever apenas `launcher` em
`0x10000` não garante que o firmware didático iniciará, e substituir o
launcher exige um caminho testado de restauração. Manter
`installationEnabled: false` até identificar o slot ativo, preservar o
launcher e validar a volta ao firmware de jogos na placa.

## Pacotes preparados para o site

A seção do Blink verifica por SHA-256 tanto o firmware didático quanto o
launcher aprovado de retorno. Ambos os manifestos mantêm
`installationEnabled: false`. Essa verificação comprova a integridade dos
arquivos servidos, não a compatibilidade da placa conectada ou o sucesso de
uma gravação. O diagnóstico de boot permanece somente em código, pois a
leitura física por esptool-js ainda não foi integrada à interface.

## Estados da conexão USB

Ao desconectar, a interface desativa salvamento e verificação. Uma nova
tentativa de salvar invalida a confirmação anterior; a verificação após
reinício é consumida uma única vez. O estudante deve observar o LED físico
mesmo quando a leitura dos parâmetros confere.

## Verificação local única

A partir da raiz do repositório, executar `node scripts/check-v1b.mjs`.
O comando roda os testes do manual, confere tamanhos e SHA-256 dos pacotes
de atividades e retorno, exige que ambos continuem bloqueados para
instalação e verifica `git diff --check`. Ele não substitui teste visual,
medição elétrica ou validação no ESP32.
