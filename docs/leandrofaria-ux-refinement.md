# Refinamento da área de cliente — 24 outubro 2026

## Resultado

- Cabeçalho compacto na área pessoal, com fotografia de 34 px, nome e ligação «Conta» para o rodapé. Saudação grande removida. Contacto, Instagram e logout continuam acessíveis.
- «Marcar treino» é o primeiro título. A sequência Plano → Data → Horário → Confirmar surge imediatamente abaixo.
- Uma cobertura continua a ser pré-selecionada segundo a lógica existente. Faixa com nome, cobertura, saldo e período exatos, validade, «Alterar» e detalhes acessíveis. Várias coberturas usam cartões compactos que recolhem após seleção; detalhes individuais continuam disponíveis.
- Opções únicas de serviço/local/profissional resumidas numa única linha. Seletores mantidos quando existem alternativas.
- Faixa inicial de sete dias, anterior/seguinte, mês/ano visível e «Ver mês» para aceder ao calendário mensal existente. Dias manipulados como datas de calendário UTC, com o dia atual definido pelo timezone real da API; mantém comportamento em Europe/Lisbon e DST.
- Horários reais logo abaixo da data; grupos visíveis quando existe mais de um período do dia. Nenhum horário é selecionado automaticamente.
- Resumo compacto após escolha da hora, detalhes opcionais e CTA «Confirmar treino» sempre desativado. Resumo sticky em mobile.
- Próximo treino e histórico de treinos na secção secundária recolhível «Os meus treinos».

## Contratos e segurança

Sem alterações ao adaptador público, SDK, booking-api, Phone Claim, elegibilidade, quotas ou cálculo de disponibilidade. Mantidos os pedidos GET, parâmetros, AbortSignals, descoberta do timezone e invalidação das escolhas dependentes. Navegar semanas/meses não dispara pedidos de disponibilidade; escolher uma data mantém a consulta existente. Testes usam respostas simuladas, sem contas/reservas/compras/pagamentos reais.

## Validação

- Testes direcionados de agendamento/dashboard: 30 passaram.
- Suite completa final: 101 testes passaram em 6 ficheiros.
- `npm run build` e `git diff --check`: passaram.
- Chrome headless com perfil temporário e todos os pedidos externos interceptados; fixture sintético, sem autenticação real.

| Viewport | Calendário antes → depois | Primeira fila de horários antes → depois |
| --- | --- | --- |
| Mobile 390×844 | 1189 → 347 px | 1616 → 491 px |
| Desktop 1280×900 | 1096 → 361 px | 1502 → 505 px |

Posições medidas desde o topo do viewport, após selecionar uma data. Sem overflow horizontal nos dois tamanhos. No cenário de um plano e opções únicas, o calendário e a primeira fila de horários ficam no primeiro ecrã mobile. Com várias opções, o espaço necessário depende da seleção; o utilizador continua a escolher a data antes de consultar horários.

Capturas do build anterior a este refinamento e do build final:

- [Mobile antes](ux-captures/before-mobile.png) / [depois](ux-captures/after-mobile.png)
- [Desktop antes](ux-captures/before-desktop.png) / [depois](ux-captures/after-desktop.png)
- [Mobile com horário selecionado e CTA desativado](ux-captures/after-mobile-selection.png)

A confirmação continua indisponível nesta fase. Estas verificações visuais não substituem validação com dados reais em produção. Sem commit, push ou deploy.
