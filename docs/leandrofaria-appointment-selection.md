# Agendamento APPOINTMENT — seleção e disponibilidade

## Alterações

- `components/appointments/AppointmentPlanner.jsx`: integra «O meu plano», mantém uma seleção de cobertura e coordena serviço → local → profissional → data → horário → resumo. Componentes dependentes recebem chaves distintas para limpar escolhas e abortar leituras ao mudar os parâmetros. Mudanças de sessão/tenant limpam o fluxo completo.
- `components/appointments/publicBookingApi.js`: adaptador exclusivo de GETs públicos, configurado pelo client SDK do tenant; sem bearer token, cookies ou endpoints administrativos. Suporta AbortSignal, cache no-store e erros apresentados sem detalhes internos.
- `components/appointments/AppointmentCalendar.jsx`: calendário por datas locais, meses/dias válidos e timezone da API; horários agrupados por manhã/tarde/noite com expansão.
- `components/plans/MyPlans.jsx`: reutiliza os dados dos hooks existentes para selecionar a referência e os metadados do plano; cobertura pendente/cancelada não é selecionável. ACTIVE continua sem garantir elegibilidade futura. Coberturas Duo continuam exclusivamente na secção partilhada.
- `components/AccountDashboard.jsx` e `styles.css`: integração e apresentação responsiva. Testes de dashboard/plano adaptados ao novo callback e integração.
- Nenhuma alteração adicional a Phone Claim, SDK ou API. Trabalho local anterior preservado.

## Contratos utilizados

Todos os caminhos abaixo são relativos a `/api/v1`.

- SDK 0.8.0: `getPublicServices(signal)`, hooks de entitlements individuais, Duos e coberturas partilhadas. Nenhum método de mutação é usado.
- `GET /public/:tenantSlug/locations`: `{ locations }`.
- `GET /public/:tenantSlug/resources`: `{ resources }`; query opcional `serviceIds` (CSV) e `locationId`. A projeção devolve `type`, `services` e `locations` públicos.
- `GET /public/:tenantSlug/availability`: query `locationId`, `serviceIds`, `date` (`YYYY-MM-DD`) e `resourceId`; resposta com `date`, `timezone` e `slots: [{ start, end, resourceIds }]`.
- Só são apresentados serviços APPOINTMENT com uma associação pública a profissional PERSON/localização. Quando conhecidos, os `eligibleServices` individuais delimitam o catálogo apresentado; isso não valida quota nem elegibilidade futura.
- Para Duo, os candidatos públicos são apresentados sem supor `duoEligible`, serviços cobertos ou `entitlementChargePolicy`.

O catálogo não devolve timezone. Uma primeira consulta de disponibilidade com a data UTC do dia obtém o timezone real antes de mostrar o calendário. Essa consulta é apenas descoberta: não seleciona um dia nem apresenta os seus horários. Depois da seleção de data é feita a consulta do dia local escolhido. A resposta deve corresponder à data/fuso pedidos e os horários são limitados ao profissional consultado.

## Validação

`npm test`: 93 testes passaram em 6 ficheiros, incluindo 19 testes novos para adaptador, datas, timezone/DST, ano bissexto, seleção Individual/Duo, limpeza por dependência, respostas antigas, mudança de sessão/tenant, catálogo vazio, ausência de horários, erros e nova tentativa. O conjunto inclui regressões de Phone Claim, planos e dashboard.

`npm run build` e `git diff --check`: passaram. Sem testes contra produção, operações reais ou verificação visual em browser mobile.

## Limites da confirmação

O resumo é uma escolha provisória; o botão de confirmação está sempre desativado. Não há criação de Booking, compra ou pagamento.

A disponibilidade pública não garante cobertura ou quota semanal para a data, nem exclui sobreposições do mesmo Duo noutro profissional. O saldo atual nunca é usado para calcular saldo futuro.

Para a próxima etapa, é necessário definir como confirmar elegibilidade com a API. Uma validação prévia informativa exige um contrato autenticado adequado, atualmente não encontrado na auditoria; a criação autenticada existente continua a ser a autoridade transacional. Para Duo, o catálogo público também não expõe a compatibilidade do serviço. O frontend não deve preencher essas lacunas com regras locais. As políticas de cobrança devem ser confirmadas antes de habilitar qualquer criação.

Sem commit, push ou deploy.
