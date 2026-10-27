# Confirmação real APPOINTMENT — Leandro Faria

## Auditoria anterior à implementação

Em 24 outubro 2026 foram feitas exclusivamente leituras públicas da API publicada em `https://mavera-api-production.up.railway.app`:

- `GET /openapi.json` confirmou `POST /api/v1/customer/tenants/{tenantId}/bookings`, DTO, autenticação bearer e erros de quota/entitlement/conflito. Para Duo, descreve explicitamente requestId obrigatório, um serviço elegível ENTITLEMENT_REQUIRED/ONSITE e um único consumo partilhado.
- `GET /api/v1/public/leandro-faria/services` devolveu «Aula PT», APPOINTMENT, duração **60 minutos**, intervalo entre inícios **30 minutos**, ENTITLEMENT_REQUIRED, ONSITE, preço público null. Intervalo entre inícios não é duração. Não se presume gratuitidade nem se calcula qualquer valor no frontend.
- `GET /api/v1/public/leandro-faria/resources` confirmou profissional PERSON, serviço e localização públicos associados.
- `GET /api/v1/public/leandro-faria/availability` para 26 outubro 2026 confirmou Europe/Lisbon, durationMinutes=60 e slots reais como 07:00–08:00 e 07:30–08:30. Não foram criadas reservas nem consultados perfis privados.

SDK instalado: `@marcosampaio99/mavera-client` **0.8.0**. Confirmados métodos/distribuição JavaScript, declarações `CreateCustomerAppointmentInput` e hook `useCreateCustomerAppointmentBooking` exportado. A implementação usa o método core, com AbortSignal, para manter o comando exato acima dos componentes de data/horário.

O código local de booking-api foi cruzado com o OpenAPI publicado para detalhes de consumo transacional, duração/end, idempotência Duo e respostas. A documentação pública não permite comprovar as configurações privadas `duoEligible`/`entitlementChargePolicy` do tenant. Não foi usado nenhum endpoint administrativo.

## Limitações de contrato identificadas antes de implementar

1. **Idempotência Individual:** o backend só admite requestId em Duo; não é possível garantir retry automático de POST Individual após resultado de rede desconhecido. A UI conserva a intenção e oferece «Verificar reserva», que lê a agenda e procura uma reserva própria ativa com local/profissional/serviços/data/hora correspondentes. Se não encontrar uma correspondência única, não envia outro POST e orienta o contacto. Uma leitura vazia não prova que uma escrita anterior não tenha sido concluída.
2. **Catálogo público:** não contém `duoEligible` ou `entitlementChargePolicy`. O frontend não fabrica esses campos. A criação autenticada valida e consome cobertura/quota atomicamente; Duo inelegível é tratado pelo código de erro, sem fallback Individual.
3. **Recibos Duo:** um replay pode devolver o estado original mesmo depois de cancelado. Após obter um recibo, o frontend consulta `getBooking(id)` e só mostra sucesso se o estado atual for CONFIRMED. PENDING e CANCELLED nunca são apresentados como confirmados.
4. **OpenAPI parcial:** a resposta de criação é um objeto aberto; o schema publicado do GET de Duos referencia CustomerEntitlement, embora o contrato real desse GET seja uma lista `{ id, status, isCommercialCustomer }` já usado pelo SDK. Não foi alterado o SDK ou o backend.

## Alterações

- `components/appointments/bookingCommands.js`: validação estrutural e coordenação da mutação, comando imutável por intenção, proteção contra concorrência, UUID Duo estável, reconciliação Individual e leitura do estado atual. O registo vive em memória, isolado por client/tenant/sessão e acima das escolhas de plano/data. Não se garante persistência de intents após reload/fecho do browser.
- `components/appointments/AppointmentPlanner.jsx`: ativação do CTA apenas com campos válidos, cobertura coerente e serviço APPOINTMENT/ENTITLEMENT_REQUIRED/ONSITE; estados de processamento, erro, resultado incerto, PENDING e CONFIRMED. End prévio vem de slot.end, nunca de intervalos fixos. End confirmado vem de Booking.endAt no timezone da API. Duração visível nos detalhes.
- Controlo das seleções fica desativado durante a submissão. Trocas de sessão/tenant abortam o transporte e impedem resultados antigos, incluindo troca síncrona antes do primeiro envio. SDK mantém a autoridade sobre autenticação e reset em 401; a área de conta mantém o redirecionamento de login existente.
- Conflitos de disponibilidade limpam a hora, repetem a disponibilidade e exigem nova escolha. Erros de quota/entitlement, Duo/configuração e sessão têm mensagens próprias; nenhuma mensagem interna é exposta.
- A invalidação do SDK na criação limpa reservas, entitlements/detalhes e vistas Duo. A agenda e os entitlements são atualizados explicitamente pelos métodos de refresh do SDK; os hooks Duo montados recarregam as coberturas partilhadas. A seleção não desaparece durante essa invalidação. Falhas posteriores de atualização não repetem a criação e são comunicadas separadamente.
- `styles.css`: apenas reset de bordas/margens dos fieldsets que bloqueiam controlos durante processamento. Sem redesenho.

A confirmação é limitada aos serviços ONSITE deste fluxo de planos. Serviços PUBLIC/AUTHENTICATED ou com pagamentos online não são ativados por este fluxo. Preços/cobrança continuam inteiramente do backend. Não há cálculo de elegibilidade futura, quota por data, preço ou consumo no cliente.

## Validação

- 24 testes direcionados de confirmação, usando o **SDK 0.8.0 real**, Supabase simulado e transporte simulado sem acesso externo.
- Suite completa: **129 testes passaram em 7 ficheiros**, incluindo regressões de Phone Claim, planos e UX de calendário.
- `npm run build` e `git diff --check`: passaram.
- Cobertura: Individual/Duo; UUID e comando estáveis ao mudar de dia/voltar; duplo clique/concorrência; rede e reconciliação sem duplicação; quota/entitlement; conflito e disponibilidade; 401; mudanças de sessão/tenant e respostas tardias; PENDING; replay de reserva cancelada; falha de GET depois de criação; falha de refresh; datas locais e transição DST, incluindo horas repetidas.

Não foi exercitada uma criação contra produção. O autêntico comportamento transacional, a configuração Duo privada e a entrega de notificações só podem ser verificados numa validação separada autorizada. Para retry Individual durável/idempotente ou confirmação prévia não mutante da elegibilidade, é necessário um contrato adicional do backend; a implementação atual não o simula.

Sem alterações a booking-api, SDK, backoffice, Phone Claim. Sem reservas reais, commit, push ou deploy.
