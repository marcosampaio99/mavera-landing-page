# Customer Phone Claim — Leandro Faria

## Atualização para o SDK 0.8.0

Atualizado com `npm install --save-exact @marcosampaio99/mavera-client@0.8.0`, seguindo o gestor documentado no README. `package.json` e `package-lock.json` fixam 0.8.0; o lockfile pnpm preexistente não é o usado nesta instalação. Todo o trabalho local anterior foi preservado.

O pacote instalado exporta `getClaimOptions`, `refreshClaimOptions`, `startPhoneClaim`, `confirmPhoneClaim` e `refreshCustomer`, e os hooks `useClaimOptions`, `useStartPhoneClaim` e `useConfirmPhoneClaim`. Confirmados nos ficheiros JavaScript e declarações distribuídos pelo GitHub Packages. Removida apenas a deteção temporária de métodos para 0.7.0; a consulta de disponibilidade por tenant continua obrigatória.

Os contratos `PHONE_CLAIM_*`, `{ status: "COMPLETED" }` e a invalidação interna de caches são compatíveis com o frontend. Com a feature OFF, nenhum formulário de telefone/OTP nem erro é apresentado; surge apenas informação de indisponibilidade.

## Auditoria inicial antes da implementação

- Login, registo, recuperação e sessão usam Supabase através do SDK. `SignIn.jsx` permanece inalterado.
- `Account.jsx` já lê a associação via `useMaveraCustomer`. O formulário anterior chamava `claim({ name })`, com texto indicando criação implícita; não distinguia clientes existentes de novos.
- Na auditoria inicial, dependência declarada: `^0.7.0`; pacote efetivamente instalado: **0.7.0**. Os exports/types e JavaScript instalados não contêm Phone Claim. Nenhuma instalação ou alteração de lockfile foi feita.
- O checkout local `../mavera-client/src/client.ts` contém `getClaimOptions`, `startPhoneClaim`, `confirmPhoneClaim`, `refreshCustomer`. O seu package.json ainda diz 0.7.0: essa versão, por si só, não prova suporte. A proteção temporária por deteção de métodos foi removida após instalar e confirmar os exports de 0.8.0.
- Contratos conferidos no código local de booking-api, sem pedidos à produção: `src/customer-phone-claim/{phone-claim.controller.ts,phone-claim.service.ts,phone-claim.dto.ts}` e `src/customer-self-service/customer-self-service.service.ts`.

## Contratos relevantes

- `GET claim/options`: `phoneClaimAvailable` reflete feature do tenant e disponibilidade do provider; exige email Supabase verificado. `emailClaimAvailable` não é uma pesquisa de correspondência de email.
- `POST claim/phone/start`: `{ phone }` → `{ claimId, status: "PENDING", expiresAt, resendAfterSeconds: 60 }`. Resposta uniforme para Customer elegível, inexistente ou inelegível. Sem criação de Customer.
- `POST claim/phone/confirm`: `{ claimId, code }` com seis dígitos → **`{ status: "COMPLETED" }`**, nunca um Customer.
- `PHONE_CLAIM_NOT_CONFIRMED`: cobre código errado/expirado, número inexistente e perfil inelegível; a UI mantém uma única mensagem sem revelar a causa.
- `PHONE_CLAIM_RATE_LIMITED`, `PHONE_CLAIM_DISABLED`, `PHONE_CLAIM_UNAVAILABLE`: mensagens explícitas, sem detalhes internos. Em rate limit a UI aplica espera mínima conservadora de 60 s; o servidor continua a impor os seus limites.
- Claim por email sem telefone associa apenas uma correspondência segura por email verificado; sem correspondência devolve `CUSTOMER_PHONE_REQUIRED_FOR_CLAIM`. Não o chamar automaticamente. Esse comportamento é dependência de backend para garantir associação sem criação.

## Implementação

`CustomerClaim.jsx` separa associação por email, cliente existente por SMS e criação explícita com nome/telefone. Mantém classes visuais existentes, formulários com labels, teclado numérico/autoComplete para OTP, estados de carregamento, erro, sucesso, expiração e espera. O OTP só existe em memória e desaparece ao desmontar ou mudar de sessão.

O SDK local auditado executa `acceptCustomerClaim()` ao confirmar: limpa Customer, reservas, duos, entitlements/detalhes, inscrições, compras/detalhes e commerce; atualiza Account. O frontend chama depois `refreshCustomer()` para ler o perfil real. Não replica essas caches. A área de associação permanece montada durante a invalidação, permitindo repetir uma leitura falhada sem repetir a confirmação.

A chave da área pessoal acompanha utilizador e token de sessão; pedidos pendentes recebem AbortSignal e resultados tardios são ignorados ao desmontar. O SDK deve continuar a impor o seu controlo de sessão e isolamento por tenant.

## Validação e publicação

- Testes simulam o SDK: sucesso, número inexistente, código inválido, cooldown/reenvio, expiração, rate limit, feature OFF, criação explícita, claim por email (incluindo email não verificado), Customer já associado, mudança de utilizador/sessão e invalidação seguida de falha de leitura.
- Na atualização para 0.8.0: `npm test` passou com 59 testes em 4 ficheiros; `npm run build` e `git diff --check` passaram. Confirmados os HTML e assets gerados de `/`, `/solucoes`, `/privacidade`, `/termos`, `/leandrofaria`, `/leandrofaria/entrar` e `/leandrofaria/conta`. O teste temporário de SDK sem métodos foi removido; a regressão de feature OFF verifica ausência de OTP e de alertas de erro. Sem SMS, contas reais ou validação funcional contra produção; sem inspeção visual em browser mobile.
- Para disponibilizar SMS em produção, continuam a ser necessários endpoints/migrações/configuração Verify na booking-api e a feature habilitada para o tenant. O SDK 0.8.0 já foi instalado; não foi alterada a configuração do backend.
- Não foi alterada a booking-api nem o SDK; sem commit, push ou deploy.
