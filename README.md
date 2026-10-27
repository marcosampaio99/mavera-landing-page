# Mavera

Landing page simples em React e Vite.

```sh
npm install
npm run dev
```

Para produção:

```sh
npm run build
npm run preview
```

Publicar a pasta `dist`. O build cria `dist/solucoes/`, `dist/privacidade/` e `dist/termos/` com uma cópia de `index.html`, por isso as rotas funcionam em qualquer alojamento estático. Ao criar uma rota nova em `src/main.jsx`, acrescentá-la também a `routes` em `vite.config.js`.

## Frontends de clientes (tenants)

Cada cliente tem uma entrada HTML própria, isolada do site Mavera (CSS, JS e meta tags próprios):

- `leandrofaria/index.html` → `src/tenants/leandrofaria/` — https://mavera.pt/leandrofaria
  - `/leandrofaria` página de marcações (link privado, `noindex`)
  - `/leandrofaria/entrar` autenticação, registo (`?modo=registo`) e recuperação de palavra-passe
  - `/leandrofaria/conta` área protegida, associação explícita de perfil, próximas reservas e saída

As sub-rotas estão em `src/tenants/<tenant>/tenant.js` e têm de constar também em `tenants` no `vite.config.js`, que gera as cópias de `index.html` no build e as serve no `npm run dev`. A administração dos tenants é feita no backoffice Mavera.

Contacto: `app.mavera@gmail.com`. Os textos de Privacidade e Termos são minutas para o site informativo. Antes de publicar, completar a identidade e morada da entidade, confirmar os prestadores de alojamento/email, transferências e prazos de conservação e rever os textos. Não abrangem o tratamento de dados ou condições comerciais do backoffice. Editar `src/LegalContent.jsx` ou apontar para documentos externos através de `VITE_PRIVACY_URL` e `VITE_TERMS_URL`.

Referência para revisão de privacidade: [orientações da União Europeia sobre proteção de dados](https://europa.eu/youreurope/business/governance-and-sustainability/digital-and-data-compliance/data-protection-gdpr/index_en.htm).

Copiar `.env.example` para `.env` para personalizar estas definições e voltar a executar o build.

## Autenticação do Leandro Faria

SDK: `@marcosampaio99/mavera-client` 0.8.1, publicado no GitHub Packages. O `.npmrc` lê o token de `${NPM_TOKEN}` (apenas para `npm.pkg.github.com`): definir `NPM_TOKEN` no ambiente local e no Vercel (Production/Preview) com um token GitHub só com `read:packages`; nunca guardar o valor no repositório. O Vercel instala com pnpm 10 a partir de `pnpm-lock.yaml` (frozen); manter também `package-lock.json` coerente.

O UUID `25d0df29-5e2e-4ddb-a4fc-72003c59f8e7` está configurado em `src/tenants/leandrofaria/tenant.js`. Para o substituir, copiar `.env.example` para `.env.local` e definir `VITE_LEANDROFARIA_TENANT_ID`. O slug da API é `leandro-faria`; o endereço do site mantém `/leandrofaria`. O slug não substitui o UUID. Os valores públicos de API/Supabase têm os mesmos defaults do backoffice; podem ser substituídos pelas variáveis indicadas. Uma configuração vazia ou inválida apresenta acesso indisponível e não efetua pedidos de autenticação. Alterações de configuração exigem novo build.

O site é servido em `https://www.mavera.pt` (o domínio sem `www` redireciona). No Supabase, permitir os callbacks `https://www.mavera.pt/leandrofaria/entrar` e `https://www.mavera.pt/leandrofaria/entrar?modo=nova-palavra-passe`, além dos equivalentes de desenvolvimento usados. Confirmar que os templates de confirmação e recuperação respeitam o redirect indicado. A API deve permitir a origem `https://www.mavera.pt` em CORS. Temporariamente, `AUTH_EMAIL_TENANTS` associa a origem `https://www.mavera.pt` ao tenant Leandro (o hook resolve o tenant apenas pela origem do `redirect_to`); antes de publicar outro tenant em `mavera.pt/<slug>` é necessário isolamento por tenant (subdomínio ou suporte a caminhos no hook).

A sessão e a renovação de tokens são geridas pelo SDK/Supabase. A associação ao perfil de cliente é explícita e pode criar um novo perfil quando não existe correspondência por email verificado. O frontend nunca associa perfis automaticamente após registo ou login.

Validação: `npm test` e `npm run build`. Os testes simulam o SDK; a verificação ponta a ponta requer o tenant real, uma conta de teste e callbacks/CORS configurados. Na verificação de 20 de outubro de 2026, `GET /api/v1/public/leandro-faria/booking-policy` respondeu com o UUID configurado, `bookingAuthenticationPolicy: PUBLIC_ALLOWED` e `trialsEnabled: false`. O CORS para `https://mavera.pt` também foi confirmado.

## Área de cliente Leandro Faria

A área de cliente mantém o calendário, seleção de horários, reservas com planos
Individual/Duo, autenticação e Phone Claim. «Próximos treinos» fica sempre visível
(com cancelamento segundo `cancellationPolicy`) e o «Histórico de treinos» é recolhível;
os dias com treino marcado aparecem assinalados no calendário.
O Layout alargado aplica-se apenas à conta Leandro Faria; cabeçalho, contactos e
rodapé de sessão mantêm-se.
