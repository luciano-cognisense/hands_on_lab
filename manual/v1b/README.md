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

A inversão dos conversores não está liberada. TP4056, áudio e pinout exigem validação de bancada. Nenhuma atividade da página grava no dispositivo nesta versão. Não há binário de firmware neste repositório.
