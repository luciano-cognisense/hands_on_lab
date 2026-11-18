# Firmware didático V1B — protótipo 0.1.0

Projeto ESP-IDF 5.3.1 separado do launcher de jogos. Inicializa somente
WS2812 no GPIO48 e USB Serial/JTAG. O display deve estar desconectado.
Ao iniciar, lê os parâmetros NVS, mostra três pulsos e executa Blink.
Cor RGB usa ordem GRB e brilho de 1/8 neste protótipo.

O layout de build agora reproduz a tabela V1B **com GBSP**. A imagem do
firmware didático substitui somente `launcher` (`ota_0`, 0x10000). O pacote
web inclui somente esse binário; não inclui bootloader ou tabela de partições.
Ainda é preciso verificar o layout real no console antes de gravar, pois
existem versões com e sem GBSP. Jogos e saves internos permanecem na VFS
somente se seus offsets e layout forem preservados.

Para compilar, no workspace: `source ./gbsp-env.sh`, entrar nesta pasta e
executar `idf.py build`. Depois, executar `python3 tools/package.py`.
O pacote permanece bloqueado para instalação até validação de alimentação,
USB, layout real e retorno ao launcher de jogos. Não gravar este protótipo
em um console de uso sem estratégia de recuperação.

Comandos USB HOL/1: `hello`, `blink.set` e `blink.get`. `blink.set` confirma
apenas após `nvs_commit`; o site exige leitura igual. O identificador de boot
permite distinguir reconexão de reinício. Conferir o LED físico na bancada.

O encoder RMT veio do exemplo `led_strip` do ESP-IDF 5.3.1, com avisos de
licença preservados.

## Seleção de boot e retorno ao launcher

A tabela possui `otadata` em `0xd000` e o launcher em `ota_0`. Gravar a
imagem didática em `0x10000` não seleciona automaticamente `ota_0` se o
console estiver configurado para iniciar outro aplicativo. A documentação
oficial do ESP-IDF confirma que o bootloader usa `otadata` para escolher o
slot OTA. O instalador precisa ler/identificar o slot atual e preparar a
seleção de `ota_0` sem destruir o estado de retorno. O protótipo atual **não**
faz isso; `installationEnabled` deve permanecer `false`.

Antes de qualquer gravação em bancada, registrar hash da tabela instalada,
backup do launcher em `0x10000`, slot de boot ativo e backup de `otadata`.
Planejar a restauração do launcher aprovado e confirmar jogos/saves depois.
A biblioteca de gravação existente ainda não foi conectada a esse fluxo.

## Pacote de retorno preparado

`manual/v1b/firmware/restore-manifest.json` identifica o launcher aprovado,
extraído do build `a9c8fb9b`. Seus 834.544 bytes foram comparados byte a byte
com o slot `0x10000` da imagem final V1B com GBSP, SHA-256 da imagem completa
`2541189a2ad8a917fb9d775107c92ffc2ee8cabae4f59e1ba592230e8d4f2c24`.
O pacote de retorno também permanece desabilitado: requer diagnóstico físico
de `otadata` e da configuração de boot antes de qualquer gravação.
