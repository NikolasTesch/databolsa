export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop py-12">
      <h1 className="text-2xl font-bold text-on-surface mb-8">Ajuda — Perguntas Frequentes</h1>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">Como cadastrar um ativo?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        Acesse o menu &ldquo;Ativos&rdquo; no painel principal e clique em &ldquo;Cadastrar Ativo&rdquo;.
        Informe o ticker, o nome do ativo, a classe (ação, FII, ETF, etc.), a moeda e a fonte de dados.
        Após salvar, o ativo estará disponível para registro de operações.
      </p>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">Como registrar uma operação?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        No perfil do ativo desejado, clique em &ldquo;Nova Operação&rdquo;. Selecione o tipo (Compra,
        Venda ou Dividendos), informe a data, a quantidade, o preço unitário e as taxas, se houver.
        O sistema atualizará automaticamente sua posição e o extrato patrimonial.
      </p>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">As cotações são em tempo real?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        As cotações são obtidas de fontes externas com atualização periódica (geralmente a cada 5 a 15
        minutos). Não garantimos tempo real absoluto. Para dados intradiários, recomendamos consultar
        fontes oficiais como a B3 ou seu corretor.
      </p>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">O que significa &ldquo;stale&rdquo;?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        &ldquo;Stale&rdquo; indica que a cotação exibida não foi atualizada recentemente e pode estar
        defasada. Isso ocorre quando a fonte externa não retorna dados novos dentro do intervalo esperado.
        O sistema mantém a última cotação disponível para referência, mas exibe o alerta de stale para
        que você saiba que o dado pode não refletir o valor atual de mercado.
      </p>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">Como criar grupos de investimento?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        No menu &ldquo;Grupos&rdquo;, clique em &ldquo;Criar Grupo&rdquo;, dê um nome e adicione
        participantes por e-mail. Grupos permitem comparar rentabilidade entre diferentes carteiras de
        forma centralizada. Apenas o criador do grupo pode gerenciar convites e remover membros.
      </p>

      <h2 className="text-lg font-semibold text-on-surface mt-6 mb-2">Como entrar em contato?</h2>
      <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
        Você pode nos enviar um e-mail para{' '}
        <a href="mailto:contato@databolsa.app" className="text-primary underline hover:opacity-80">
          contato@databolsa.app
        </a>
        . Respondemos em até 2 dias úteis. Sugestões e reporte de bugs são muito bem-vindos.
      </p>
    </div>
  );
}
