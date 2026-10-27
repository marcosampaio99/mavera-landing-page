# Agendamento — refinamento final

- Seleção inicial automática do dia atual no timezone devolvido pela API, seguida da consulta real de disponibilidade. Sem seleção automática de hora ou procura silenciosa de outro dia. Descoberta inicial do timezone preservada.
- Faixa do plano com nome e saldo: «2 treinos disponíveis esta semana» apenas com saldo finito e período semanal atual. Períodos fora do atual não recebem esse texto. Validade e datas exatas continuam em «Detalhes».
- Navegação semanal com botões de 44×44 px, bordas e estado desativado distinto. Intervalos entre grupos de horários reduzidos, mantendo botões de 44 px.
- Resumo em fluxo normal em mobile; apenas a ação tem comportamento sticky limitado ao resumo, com safe-area. Não há uma caixa flutuante sobre os horários. CTA «Confirmar treino» permanece desativado.
- Sem alterações ao SDK, API, adaptador público, Phone Claim. Mantidos parâmetros, planos Individual/Duo, estados de erro e limpeza das seleções dependentes.

## Validação

`npm test`: 105 testes passaram em 6 ficheiros. Incluem hoje em Europe/Lisbon perto da meia-noite/DST, ausência de horários sem fallback, erro/repetição na consulta automática, saldo semanal e detalhes.

`npm run build` e `git diff --check`: passaram.

Chrome headless, com perfil temporário e respostas externas totalmente simuladas:

- iPhone em viewport 393×852: calendário a 329 px e primeira fila de horários a 473 px do topo, sem cliques nem overflow horizontal. Data atual selecionada, nenhuma hora selecionada. Depois de escolher uma hora, CTA desativado e abaixo dos horários.
- Desktop 1280×900: calendário a 361 px e primeira fila a 505 px; sem overflow horizontal.
- Capturas: [mobile](ux-captures/final-mobile.png), [mobile com seleção](ux-captures/final-mobile-selection.png), [desktop](ux-captures/final-desktop.png).

A validação mobile usa Chrome com dimensões de iPhone; não é uma execução em Safari/iPhone físico. A safe-area está prevista em CSS. Nenhuma reserva real, commit, push ou deploy.
