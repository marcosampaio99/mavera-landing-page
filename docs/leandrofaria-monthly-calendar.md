# Calendário mensal — Leandro Faria

## Alterações

- `src/tenants/leandrofaria/components/appointments/AppointmentCalendar.jsx`: vista mensal principal, inspirada na composição do MyScheduleCalendar do Raízes do Yoga, sem lógica SESSION. Grelha de segunda a domingo, navegação mês/ano, seleção preta/branca, hoje subtil, dias passados desativados e posições exteriores ao mês vazias. Removidos a faixa semanal e «Ver mês».
- Teclado: botões nativos com Tab/Enter/Space; setas movem o foco entre dias disponíveis do mês, sem selecionar automaticamente. Mês anunciado com aria-live, hoje com aria-current e seleção com aria-pressed.
- `AppointmentPlanner.jsx`: entrada sem dia selecionado e sem horários expandidos. Escolher um dia faz a consulta integrada existente; mudar mês limpa data e hora. Nenhuma alteração ao motor de disponibilidade ou à confirmação de reservas.
- Horários em grelha, com Manhã/Tarde/Noite quando houver dados, seleção monocromática e expansão apenas quando necessária. Estado vazio: «Sem horários disponíveis neste dia. Escolhe outra data.»
- `styles.css`: composição mensal compacta, bordas subtis e tipografia monocromática; estilos semanais obsoletos removidos.
- Testes `AppointmentPlanner.test.jsx` e `AppointmentConfirmation.test.jsx` atualizados para escolha explícita do dia; acrescentados casos de mudança de ano e navegação do foco.

## Preservação funcional

O timezone continua a ser descoberto pela mesma leitura pública inicial de disponibilidade, porque o catálogo não o fornece. Essa leitura não seleciona um dia nem apresenta horários. Só depois da escolha explícita do dia é mostrada a disponibilidade desse dia. Não são consultados todos os dias do mês, nem inventados marcadores de disponibilidade.

Contratos, AbortSignal, tratamento de respostas antigas, planos Individual/Duo, entitlements, carregamento/erros, resumo, criação de reservas e proteção contra duplicações preservados. `bookingCommands.js`, o adaptador público, Phone Claim, SDK e booking-api não foram alterados nesta etapa.

## Validação

- `npm test`: **131 testes passaram em 7 ficheiros**, incluindo criação Individual/Duo, idempotência, conflitos, sessões/tenants, respostas assíncronas e regressões de Phone Claim.
- `npm run build` e `git diff --check`: passaram.
- Chrome headless com perfil isolado, todos os pedidos externos simulados, sem criar reservas. Comparação entre o build anterior a esta etapa e o build final.
- Viewports 393×852 e 1280×900: sem overflow horizontal. Entrada com calendário sem seleção/horários; depois de selecionar o dia, horários apresentados imediatamente abaixo. Calendário a ~329 px do topo em mobile e primeira fila de horários a ~712 px após a seleção.

| Captura | Antes | Depois |
| --- | --- | --- |
| Mobile 393 px, entrada | [Antes](ux-captures/monthly/before-mobile.png) | [Calendário](ux-captures/monthly/after-mobile.png) |
| Mobile, dia escolhido | — | [Calendário e horários](ux-captures/monthly/after-mobile-times.png) |
| Desktop, entrada | [Antes](ux-captures/monthly/before-desktop.png) | [Calendário](ux-captures/monthly/after-desktop.png) |
| Desktop, dia escolhido | — | [Calendário e horários](ux-captures/monthly/after-desktop-times.png) |

A validação mobile utiliza dimensões de iPhone em Chrome, não um iPhone/Safari físico. As capturas usam dados fictícios. Sem commit, push ou deploy.
