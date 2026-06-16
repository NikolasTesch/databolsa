# ADR 0007 — Expandir Moedas no Conversor

- **Status:** Accepted
- **Data:** 2026-06-15
- **Decisores:** Arquiteto (Subagente)

## Contexto

O conversor de moedas (`CurrencyConverter`) do DataBolsa possui atualmente suporte limitado para moedas de origem no frontend (apenas USD, EUR, GBP para moedas fiat, convertendo de forma fixa para BRL) e não expõe criptomoedas no frontend, apesar de a API ter suporte inicial e básico para algumas criptomoedas (BTC, ETH, SOL, etc.).
A fim de expandir a utilidade da ferramenta, é necessário estender as moedas fiat suportadas, mapear novas criptomoedas relevantes, e adaptar a interface para permitir a escolha dinâmica de tipo de conversão (Fiat vs. Cripto) e de moeda de destino (BRL para Fiat, BRL/USD para Cripto).
Tudo isso deve respeitar os mecanismos de cache e de degradação graciosa em falhas de API (RN-10).

## Opções consideradas

- **Opção A: Unificar todas as moedas em um único dropdown gigante.**
  - *Prós:* Menos elementos de controle na interface.
  - *Contras:* Experiência do usuário (UX) poluída. Criptomoedas e moedas fiat têm regras de destino distintas (fiat converte apenas para BRL na API atual do AwesomeAPI; cripto converte para BRL e USD via CoinGecko). Misturar as duas em um dropdown único exigiria validações confusas de erros ao tentar fazer combinações não suportadas (ex: CHF para USD).

- **Opção B: Separar as moedas em duas abas (Fiat e Cripto) com destinos customizados.**
  - *Prós:* UX limpa e intuitiva. Permite filtrar dinamicamente as moedas de destino elegíveis (Fiat converte apenas para BRL; Cripto converte para BRL e USD). Reduz erros de parâmetros inválidos enviados à API.
  - *Contras:* Adiciona um pequeno elemento visual (seletor de aba) no topo do componente de conversão.

## Decisão

Adotamos a **Opção B** para a interface do usuário, acompanhada das seguintes melhorias técnicas:

1. **Moedas Fiat:** Expansão na API e no frontend para incluir `USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, ARS` a partir da AwesomeAPI (destino fixado em BRL).
2. **Criptomoedas:** Adicionar novas criptomoedas populares no `CRYPTO_TICKER_MAP` (`DOGE, AVAX, SHIB, TRX, TON`) além das existentes (`BTC, ETH, BNB, SOL, ADA, DOT, MATIC, LINK, LTC, XRP`), alcançando 15 criptoativos. O frontend terá suporte completo para converter qualquer uma dessas criptomoedas para `BRL` ou `USD`.
3. **Mecanismo de Cache e Degradação Graciosa (RN-10):** A API de conversão (`route.ts`) continuará a usar o cache em memória com TTL de 5 minutos. Adicionalmente, implementaremos um mapa de backup (`fallbackRates`) persistido na memória da rota para servir o último valor conhecido (marcado com `stale: true`) em caso de falha de rede/timeout com as APIs externas (AwesomeAPI e CoinGecko).
4. **Precisão de Moedas (Cripto baratas):** O frontend adaptará a formatação com base no valor da taxa: para taxas unitárias inferiores a 0.01 (como SHIB), usaremos 8 casas decimais, e para valores maiores usaremos 4 casas decimais na exibição da taxa e 2 no resultado final.

## Consequências

- **Positivas:**
  - Melhora drástica da utilidade da ferramenta de conversão.
  - Interface do usuário intuitiva que previne erros de par não suportado.
  - Robustez no tratamento de erros de rede de acordo com a RN-10 (degradação graciosa com cache stale).
  - Suporte correto para exibição de criptoativos de baixo valor unitário (ex: SHIB, DOGE).

- **Negativas/Trade-offs:**
  - Pequeno aumento na complexidade do estado da interface (controle da aba ativa).
  - O cache de taxas é baseado em memória local na rota, o que é reiniciado em reinicializações do servidor. No entanto, dado o baixo volume esperado e o tempo de TTL (5min), isso é perfeitamente adequado e dispensa a necessidade de Redis para esta funcionalidade.
