# Screenshots do produto

A landing (`src/Landing.jsx`) tenta carregar estes ficheiros. Enquanto não existirem,
mostra automaticamente um placeholder com a especificação da captura — nada a alterar
no código depois de os adicionares aqui.

## agenda.png
Usado na secção "A agenda do teu estúdio, sem adivinhações."
Backoffice — Agenda/Sessões, vista de semana ou dia. Mostrar várias aulas com horário,
nome da aula, treinador/recurso e capacidade ou nº de participantes por sessão.

## sessao.png
Usado na secção "Antes da aula começar, já sabes quem vem." — o screenshot mais
importante da landing para uma box de CrossFit.
Backoffice — Detalhe de uma Session/aula. Mostrar nome da aula, dia e hora, capacidade,
nº de inscritos, lista de participantes e estado da sessão.

## Regras para ambos
- Usar dados de demonstração (ex.: "Cross Training 18:00", "Open Box", "Mobility"),
  nunca o nome de um cliente real da Mavera.
- Anonimizar ou substituir por dados fictícios quaisquer nomes, telefones ou emails
  de alunos reais.
- Exportar em PNG, largura recomendada ≥ 1600px (a imagem escala para caber no frame).

Não existe um terceiro screenshot (fluxo do aluno em mobile) — a secção correspondente
foi feita apenas com texto, conforme instrução de não inventar UI que ainda não existe.
Se vier a existir uma boa captura desse fluxo, adicionar `aluno.png` e uma `ProductShot`
na secção "Para o aluno, confirmar que vai deve demorar segundos." em `src/Landing.jsx`.
