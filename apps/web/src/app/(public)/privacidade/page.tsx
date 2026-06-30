export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="text-2xl font-bold text-on-surface mb-8">Política de Privacidade</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">1. Coleta de Dados</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa coleta os dados estritamente necessários para o funcionamento da plataforma, incluindo
          nome, e-mail e informações sobre ativos e operações financeiras inseridas pelo usuário. Esses
          dados são armazenados de forma segura e utilizados exclusivamente para prover a experiência de
          acompanhamento patrimonial.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Não coletamos dados sensíveis sem seu consentimento explícito. Você pode, a qualquer momento,
          solicitar a exclusão de sua conta e dos dados associados, conforme previsto na Lei Geral de
          Proteção de Dados (LGPD).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">2. Cookies</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Utilizamos cookies essenciais para o funcionamento da plataforma, como os necessários para manter
          sua sessão autenticada. Cookies de terceiros podem ser empregados para análises de uso e melhoria
          do serviço. Você pode configurar seu navegador para recusar cookies, mas isso pode impactar a
          funcionalidade de algumas áreas da plataforma.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">3. Compartilhamento com Terceiros</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          O DataBolsa não vende, aluga ou compartilha seus dados pessoais com terceiros para fins de
          marketing. Podemos compartilhar dados anonimizados ou agregados para análises internas ou com
          prestadores de serviços essenciais ao funcionamento da plataforma (como hospedagem e banco de
          dados), que estão contratualmente obrigados a proteger suas informações.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">4. Direitos do Usuário (LGPD)</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui os seguintes
          direitos: confirmação da existência de tratamento de dados; acesso aos dados; correção de dados
          incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados
          desnecessários ou tratados em desconformidade; portabilidade dos dados; e revogação do
          consentimento a qualquer tempo.
        </p>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Para exercer seus direitos, entre em contato pelo e-mail abaixo. Responderemos em até 15 dias
          úteis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-on-surface mb-3">5. Contato</h2>
        <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
          Em caso de dúvidas sobre esta Política de Privacidade ou para exercer seus direitos, entre em
          contato conosco pelo e-mail:{' '}
          <a href="mailto:contato@databolsa.app" className="text-primary underline hover:opacity-80">
            contato@databolsa.app
          </a>
        </p>
      </section>
    </div>
  );
}
