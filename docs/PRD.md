# PRD — DataBolsa

> Documento de Requisitos de Produto (Product Requirements Document)
> Versão 1.0 — Produção · Status: consolidado

## 1. Visão geral

Aplicativo de acompanhamento de patrimônio em investimentos. O usuário registra manualmente seus ativos e operações (compra/venda) e o sistema calcula automaticamente a posição atual, rentabilidade, lucro/prejuízo e alocação da carteira, consolidando tudo em uma moeda única (BRL). A interface principal é **web**, com um **aplicativo mobile** complementar para consulta e edição.

O produto cobre três classes de ativos no MVP: ativos da B3 (ações, FIIs, ETFs, BDRs), criptoativos e ações dos EUA / exterior.

## 2. Contexto e problema

Investidores pessoa física frequentemente possuem ativos espalhados por mais de uma corretora e classe (renda variável nacional, cripto, exterior). Consolidar o patrimônio total e medir a rentabilidade real costuma exigir planilhas manuais e trabalhosas, ou ferramentas que dependem de integração bancária complexa.

Este produto resolve isso com **lançamento manual** das operações: simples de usar, sem necessidade de credenciais bancárias, e suficiente para responder às perguntas que importam — "quanto eu tenho?", "quanto rendeu?", "como está distribuído?".

## 3. Objetivos

**Objetivo de produto:** permitir que o usuário visualize e entenda seu patrimônio consolidado em poucos minutos, sem planilhas.

**Objetivo pessoal (contexto deste projeto):** servir como projeto de portfólio que demonstre competências de mercado — arquitetura web + mobile com código compartilhado, integração com múltiplas APIs externas, backend seguro e lógica de negócio não trivial (cálculos financeiros).

## 4. Público-alvo

| Persona | Descrição | Necessidade principal |
|---------|-----------|-----------------------|
| Investidor iniciante | Tem poucos ativos, quer começar a organizar | Cadastro simples, visão clara do total |
| Investidor diversificado | Possui ações, FIIs, cripto e exterior | Consolidação em uma moeda só, alocação por classe |
| Usuário em movimento | Quer consultar/editar pelo celular | App mobile com as funções essenciais |

## 5. Escopo do MVP

### Dentro do escopo
- Cadastro e autenticação de usuário.
- Cadastro manual de ativos e lançamentos de operações (compra e venda).
- Suporte às classes: ações B3, FIIs, ETFs, BDRs, criptoativos, ações EUA.
- Busca automática de cotações atuais via APIs externas.
- Conversão de ativos em moeda estrangeira para BRL (câmbio).
- Cálculo de preço médio, posição atual, lucro/prejuízo e rentabilidade.
- Dashboard de patrimônio consolidado com gráficos de alocação e evolução.
- Interface web (principal) e app mobile (consulta + edição).

### Fora do escopo (MVP)
- Integração automática com corretoras / Open Finance (planejado para Fase 2).
- Emissão de relatórios de imposto de renda.
- Recomendações de investimento ou consultoria financeira.
- Cotações em tempo real de baixa latência (o MVP trabalha com cotação atrasada/em cache).
- Renda fixa detalhada com marcação a mercado (tratada de forma simplificada no MVP).

## 6. Requisitos funcionais

**RF-01 — Conta de usuário.** O usuário pode criar conta, autenticar-se e encerrar sessão. Cada usuário só acessa os próprios dados.

**RF-02 — Cadastro de ativo.** O usuário busca um ativo pelo ticker/símbolo (ex.: PETR4, HGLG11, BTC, AAPL) e o adiciona à sua carteira. O sistema identifica a classe e a moeda de negociação.

**RF-03 — Lançamento de operação.** Para cada ativo, o usuário registra operações informando: tipo (compra/venda), data, preço unitário, quantidade e (opcional) taxas/corretagem. Pode registrar múltiplas operações por ativo.

**RF-04 — Edição e exclusão.** O usuário pode editar ou excluir qualquer operação previamente registrada, e os cálculos são recomputados.

**RF-05 — Cotação atual.** O sistema busca a cotação atual de cada ativo nas fontes externas correspondentes à sua classe e a mantém em cache.

**RF-06 — Cálculo de métricas.** O sistema calcula por ativo e para a carteira total: preço médio, quantidade em custódia, valor investido, valor atual, lucro/prejuízo (R$ e %) e rentabilidade.

**RF-07 — Consolidação em BRL.** Ativos em moeda estrangeira são convertidos para BRL pela cotação de câmbio vigente, para compor o patrimônio total.

**RF-08 — Dashboard.** O usuário vê o patrimônio total, a alocação por classe/ativo (gráfico de pizza) e a evolução do patrimônio ao longo do tempo (gráfico de linha).

**RF-09 — Multiplataforma.** Web exibe a experiência completa; o app mobile permite ao menos consultar o patrimônio e registrar/editar operações.

**RF-10 — Notícias relacionadas.** O sistema exibe notícias financeiras integradas e de fontes relevantes para o portfólio do usuário e na tela pública.

**RF-11 — Ferramentas financeiras.** Um conversor de moedas integrado (fiat e cripto) e simulador what-if para planejar futuras alocações e compras.

**RF-12 — Cursos educacionais.** Integração com a listagem de cursos gratuitos disponibilizados pela B3 para educação financeira.

**RF-13 — Dashboards de proventos e benchmarks.** Visões dedicadas para recebimento de dividendos (histórico e yield on cost) e comparação de rentabilidade da carteira frente a índices (CDI, IBOV, IPCA, S&P500).

**RF-14 — Alertas de preço.** Permite configurar disparadores in-app para avisar o usuário quando a cotação de um ativo cruza um limite definido.

**RF-15 — Importação de transações.** Upload de arquivos CSV para carregamento em massa de operações, com pré-visualização e desambiguação de datas.

**RF-16 — Grupos de investimento.** Compartilhamento de carteiras entre usuários através de grupos, permitindo a visualização consolidada por líderes e administradores.

## 7. Regras de negócio

Estas regras são o coração do produto e devem ter cobertura de testes (ver SPEC.md).

**RN-01 — Preço médio ponderado.** O preço médio de um ativo é a média ponderada dos preços de compra pela quantidade, considerando as taxas quando informadas:

```
preço_médio = (Σ (quantidade_compra × preço_compra) + taxas) / Σ quantidade_compra
```

**RN-02 — Posição atual (quantidade em custódia).** É a soma das quantidades compradas menos a soma das quantidades vendidas. Não pode ser negativa: o sistema deve impedir o registro de uma venda maior que a posição disponível na data.

**RN-03 — Venda e realização de resultado.** Uma venda **não** altera o preço médio das unidades remanescentes; ela apenas reduz a quantidade e realiza lucro/prejuízo sobre as unidades vendidas, calculado contra o preço médio vigente (critério de preço médio, padrão no Brasil).

**RN-04 — Valor investido.** É a quantidade atual em custódia multiplicada pelo preço médio.

**RN-05 — Valor atual (posição).** É a quantidade atual multiplicada pela cotação atual do ativo.

**RN-06 — Lucro/prejuízo não realizado.** `valor_atual − valor_investido`, expresso em R$ e em % sobre o valor investido.

**RN-07 — Conversão de moeda.** Para ativos cotados em moeda estrangeira (ex.: ações dos EUA em USD), o valor atual é convertido para BRL pela cotação de câmbio do momento da consulta. Criptoativos podem ser obtidos já em BRL na fonte.

**RN-08 — Patrimônio total.** É a soma, em BRL, do valor atual de todas as posições com quantidade maior que zero.

**RN-09 — Alocação.** A participação de cada ativo/classe é o valor atual da posição dividido pelo patrimônio total, em %.

**RN-10 — Cotação indisponível.** Se a cotação de um ativo não puder ser obtida, o sistema usa o último valor em cache e sinaliza que o dado pode estar desatualizado, em vez de quebrar o cálculo do patrimônio total.

**RN-11 — Isolamento por usuário.** Toda operação, ativo e cálculo pertence a um único usuário; nenhum dado é compartilhado entre contas.

**RN-12 — Cálculo de rentabilidade histórica (TWR).** A rentabilidade consolidada histórica da carteira deve ser calculada usando a metodologia TWR (Time-Weighted Return) para evitar distorções causadas por novos fluxos de aporte/retirada.

**RN-13 — Cache persistente de câmbio.** Conversões de moedas no conversor de ferramentas utilizam cotações de banco de dados locais caso as APIs externas falhem, com alertas de dados stale caso a taxa tenha mais de 24 horas.

**RN-14 — Privacidade em grupos.** Um usuário ao entrar em um grupo de investimentos pode selecionar quais de suas carteiras deseja compartilhar. Membros regulares não possuem visibilidade sobre carteiras de outros membros; apenas o Líder/Admin possui visão agregada/detalhada conforme permissão.

**RN-15 — Avaliação assíncrona de alertas de preço.** Os gatilhos de alertas de preço configurados são processados em segundo plano (lazy-evaluation) à medida que novas cotações entram no cache de cotações (`QuoteCache`), sem sobrecarregar a API principal.

## 8. Requisitos não-funcionais

- **Segurança:** dados acessíveis apenas pelo dono; chaves de API externas nunca expostas no cliente; senhas com hash.
- **Privacidade (LGPD):** o usuário pode exportar e excluir seus dados; coleta mínima de dados pessoais.
- **Desempenho:** dashboard deve carregar em poucos segundos; cotações servidas de cache para não estourar limites das APIs gratuitas.
- **Disponibilidade:** degradação graciosa quando uma API externa falha (ver RN-10).
- **Usabilidade:** cadastro de uma operação em poucos toques/cliques.

## 9. Métricas de sucesso

Como projeto de portfólio, o sucesso é medido por demonstração de competência, mas mantemos métricas de produto como exercício:
- Tempo para registrar a primeira operação após criar conta.
- Usuário consegue ver o patrimônio consolidado correto após cadastrar operações em ≥ 2 classes de ativos.
- Cobertura de testes das regras de negócio (RN-01 a RN-11) próxima de 100%.

## 10. Roadmap por fases

**Fase 1 — MVP & Lançamento Manual (Concluída).** Lançamento de operações, cotações resilientes com cache, dashboard, conversor, notícias, cursos, simulador, importação CSV, alertas, benchmarks TWR e grupos de investimento.

**Fase 2 — Integração Automática (Próximo Passo).** Sincronização automática com corretoras via APIs de Open Finance (ex.: Pluggy / B3), minimizando a necessidade de lançamentos manuais.

**Fase 3 — Relatórios & Imposto de Renda.** Geração automatizada de relatórios fiscais mensais e anuais, cálculo de DARF e declaração pré-preenchida de IR.

## 11. Riscos e considerações

- **Limites das APIs gratuitas:** o cache de cotações é essencial para não estourar os limites de requisição.
- **Qualidade do dado de câmbio:** a conversão para BRL depende de uma fonte de câmbio confiável.
- **Dados financeiros sensíveis (Fase 2):** a integração com Open Finance traz peso regulatório (LGPD, segurança) — deliberadamente adiada para depois do MVP.
- **Escopo:** resistir à tentação de adicionar funcionalidades antes de o fluxo manual estar sólido e testado.
