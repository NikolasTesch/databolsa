export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="text-2xl font-bold text-on-surface mb-8">Compliance</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">1. Código de Conduta</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa preza pela integridade, transparência e ética em todas as suas operações. Todos os
          colaboradores e prestadores de serviços devem agir de acordo com os mais elevados padrões de
          conduta, respeitando a legislação aplicável e as políticas internas da empresa.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Esperamos que nossos usuários também atuem de forma ética, utilizando a plataforma para fins
          legítimos e respeitando os direitos de terceiros e as normas de segurança da informação.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">2. Conflito de Interesses</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa mantém uma política rigorosa de conflito de interesses. Nenhum colaborador pode
          utilizar informações privilegiadas obtidas por meio da plataforma para benefício próprio ou de
          terceiros. Situações que possam gerar conflito de interesses devem ser imediatamente reportadas
          ao comitê de compliance.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">3. Canal de Denúncias</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Disponibilizamos um canal de denúncias seguro e confidencial para relatar violações ao Código de
          Conduta, às políticas internas ou à legislação aplicável. As denúncias podem ser feitas de forma
          anônima e serão tratadas com sigilo e imparcialidade.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Canal de denúncias:{' '}
          <a href="mailto:compliance@databolsa.app" className="text-primary underline hover:opacity-80">
            compliance@databolsa.app
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">4. Política Anticorrupção</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa adota uma política de tolerância zero à corrupção e a práticas ilícitas. É proibido
          oferecer, prometer, dar ou receber qualquer vantagem indevida, bem como praticar atos de
          corrupção contra agentes públicos ou privados. Todos os colaboradores devem conhecer e cumprir
          a legislação anticorrupção brasileira (Lei nº 12.846/2013) e os compromissos internacionais
          dos quais o Brasil é signatário.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Realizamos Due Diligence de integridade em parceiros e fornecedores, e mantemos controles
          internos para prevenir, detectar e remediar desvios de conduta.
        </p>
      </section>
    </div>
  );
}
