export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="text-2xl font-bold text-on-surface mb-8">Termos de Uso</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">1. Uso do Serviço</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa é uma plataforma de acompanhamento patrimonial de investimentos. Ao utilizar nossos
          serviços, você declara ter lido, compreendido e aceitado estes Termos de Uso. O acesso e uso da
          plataforma são de sua inteira responsabilidade, devendo você utilizar o serviço em conformidade
          com a legislação vigente e com a finalidade para a qual foi desenvolvido.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as
          atividades realizadas em sua conta. O DataBolsa não se responsabiliza por acessos não autorizados
          decorrentes de conduta negligente por parte do usuário.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">2. Isenção de Responsabilidade</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          As informações disponibilizadas no DataBolsa têm caráter meramente informativo e não constituem
          recomendação de investimento, análise de valores mobiliários ou qualquer forma de aconselhamento
          financeiro. Os dados de cotações podem sofrer atrasos e não devem ser utilizados como única fonte
          para tomada de decisões de investimento.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa não garante a precisão, integridade ou atualidade das informações exibidas. Consulte
          sempre fontes oficiais e profissionais qualificados antes de realizar qualquer operação financeira.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">3. Propriedade Intelectual</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Todo o conteúdo disponível na plataforma, incluindo textos, gráficos, logotipos, ícones e
          software, é de propriedade do DataBolsa ou de seus licenciadores e está protegido pelas leis de
          propriedade intelectual. É proibida a reprodução, distribuição, modificação ou qualquer forma de
          exploração comercial sem autorização prévia por escrito.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">4. Limitação de Responsabilidade</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Em nenhuma circunstância o DataBolsa será responsável por danos diretos, indiretos, incidentais,
          especiais ou consequenciais decorrentes do uso ou da impossibilidade de uso da plataforma,
          incluindo perda de dados, lucros cessantes ou interrupção de negócios, mesmo que tenha sido
          alertado sobre a possibilidade de tais danos.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">5. Disposições Gerais</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Estes Termos de Uso são regidos pela legislação brasileira. Qualquer controvérsia será resolvida
          no foro da cidade de São Paulo — SP. O DataBolsa reserva-se o direito de alterar estes termos a
          qualquer momento, notificando os usuários sobre mudanças substanciais por meio da plataforma ou
          por e-mail.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Caso alguma disposição destes Termos seja considerada inválida ou inexequível, as demais
          disposições permanecerão em pleno vigor e efeito.
        </p>
      </section>
    </div>
  );
}
