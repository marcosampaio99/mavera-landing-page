import React from 'react';

export function LegalContent({ privacy, email }) {
  return <>
    <p className="draft">Versão preliminar — sujeita a revisão e à confirmação dos dados da entidade responsável antes da publicação.</p>
    {privacy ? <>
      <h2>1. Âmbito e contacto</h2>
      <p>Este texto descreve a privacidade no site de apresentação da Mavera. Não abrange o tratamento de dados de reservas, clientes ou utilizadores no backoffice, que exige informação própria. Para questões de privacidade, escreve para <a href={`mailto:${email}`}>{email}</a>. A identificação completa e a morada da entidade responsável serão acrescentadas na versão final.</p>
      <h2>2. Dados e finalidades</h2>
      <p>Se nos contactares por email, poderemos tratar o teu endereço, nome e os dados que incluíres na mensagem para responder ao pedido. Evita enviar dados sensíveis ou informações de terceiros que não sejam necessárias. A resposta a pedidos comerciais pode apoiar-se em diligências pré-contratuais; outras questões podem apoiar-se no interesse legítimo em responder aos contactos recebidos, conforme o caso.</p>
      <h2>3. Cookies e acesso ao site</h2>
      <p>Esta página não integra ferramentas de análise, publicidade, formulários ou cookies no seu código. O serviço de alojamento poderá tratar dados técnicos, como o endereço IP e registos de acesso, para disponibilizar e proteger o site. O fornecedor, os dados tratados e os prazos aplicáveis devem ser confirmados na versão final.</p>
      <h2>4. Conservação e prestadores</h2>
      <p>As mensagens deverão ser conservadas apenas durante o tempo necessário para responder e acompanhar o pedido, ou para cumprir obrigações legais aplicáveis. Antes da publicação serão definidos os prazos concretos, os prestadores de email e alojamento e, quando existam transferências para fora do Espaço Económico Europeu, as respetivas garantias.</p>
      <h2>5. Os teus direitos</h2>
      <p>Nos termos aplicáveis, podes solicitar acesso, retificação, apagamento, limitação, portabilidade ou oposição ao tratamento através do email indicado. Quando o tratamento depender de consentimento, podes retirá-lo sem afetar a licitude do tratamento anterior. Podes também apresentar reclamação à Comissão Nacional de Proteção de Dados.</p>
      <h2>6. Atualizações</h2>
      <p>Este texto será atualizado para refletir a configuração efetiva do serviço e a identificação da entidade responsável.</p>
    </> : <>
      <h2>1. Objeto</h2>
      <p>Este site apresenta a Mavera, uma plataforma de gestão de reservas e agendamentos para negócios, e disponibiliza um contacto e uma ligação ao backoffice. Estes termos referem-se apenas à utilização deste site informativo.</p>
      <h2>2. Acesso à plataforma</h2>
      <p>O botão «Entrar no backoffice» encaminha para app.mavera.pt/login. A criação de conta, subscrição, pagamentos e utilização da plataforma deverão reger-se por condições próprias apresentadas nesse serviço. A visita a esta página não cria uma subscrição nem uma obrigação de pagamento.</p>
      <h2>3. Utilização do site</h2>
      <p>O visitante deve utilizar o site de forma lícita, sem comprometer a sua segurança, tentar aceder a áreas sem autorização ou prejudicar o acesso de outras pessoas.</p>
      <h2>4. Conteúdos e disponibilidade</h2>
      <p>Os conteúdos têm natureza informativa e podem ser atualizados. Procuramos manter a informação correta e o site disponível, mas poderão ocorrer interrupções ou erros. Nada nestes termos exclui direitos ou responsabilidades que não possam ser afastados pela lei aplicável.</p>
      <h2>5. Contacto e identificação</h2>
      <p>Para questões sobre o site, contacta <a href={`mailto:${email}`}>{email}</a>. A identificação legal, morada e demais informações obrigatórias da entidade responsável serão acrescentadas antes da publicação definitiva.</p>
      <h2>6. Lei aplicável</h2>
      <p>Estes termos são regidos pela lei portuguesa, sem prejuízo das normas imperativas e dos direitos dos consumidores que sejam aplicáveis.</p>
    </>}
  </>;
}
