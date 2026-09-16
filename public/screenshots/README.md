# Capturas do produto

Imagens captadas em Chromium a partir do código real de `mavera-backoffice`,
numa cópia local isolada, com respostas da API substituídas por dados fictícios.
O backoffice e a API de produção não foram alterados.

- `agenda.png` — 2160 × 1673; agenda semanal de 14–20 setembro de 2026.
  Inclui uma marcação individual de massagem e sessões de mobilidade, Pilates e
  treino funcional, com profissionais e capacidade.
- `sessao.png` — 1815 × 1335; captura direta da área principal do detalhe de
  Mobilidade, com três participantes confirmados e capacidade de sete lugares.

Os nomes são fictícios e os contactos usam o domínio reservado `example.test`.
As capturas não são mockups: não foram acrescentados controlos, molduras de
browser ou funcionalidades ao UI. A landing permite abrir cada imagem em tamanho
completo e identifica os dados de demonstração.

Para atualizar: executar uma cópia do backoffice com dados de demonstração,
abrir `/agenda?view=week&date=2026-09-15` num viewport de 1440 × 1050 com escala 1.5,
aguardar os dados e as fontes e captar a página completa. Para a sessão, captar
`.workspace main` no detalhe de uma sessão preenchida. Atualizar as dimensões dos
atributos da imagem em `src/Landing.jsx` caso mudem.

Referência visual: `mavera-backoffice/src/styles.css` e `src/components/Shell.tsx`:
DM Sans, Manrope, accent #285f59, ink #20383b, muted #56696d, fundo #f5f7f7,
superfícies brancas, linhas #e0e7e7, radius 8px e botões com radius 6px.
