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

Publicar a pasta `dist`. Configurar o alojamento para servir `index.html` nas rotas `/privacidade` e `/termos`.

Contacto: `app.mavera@gmail.com`. Os textos de Privacidade e Termos são minutas para o site informativo. Antes de publicar, completar a identidade e morada da entidade, confirmar os prestadores de alojamento/email, transferências e prazos de conservação e rever os textos. Não abrangem o tratamento de dados ou condições comerciais do backoffice. Editar `src/LegalContent.jsx` ou apontar para documentos externos através de `VITE_PRIVACY_URL` e `VITE_TERMS_URL`.

Referência para revisão de privacidade: [orientações da União Europeia sobre proteção de dados](https://europa.eu/youreurope/business/governance-and-sustainability/digital-and-data-compliance/data-protection-gdpr/index_en.htm).

Copiar `.env.example` para `.env` para personalizar estas definições e voltar a executar o build.
