# @databolsa/core

Regras de negócio e cálculos financeiros (RN-01..RN-11), independentes de
framework e reutilizáveis por `apps/api`, `apps/web` e `apps/mobile`.

**Prioridade do projeto:** este pacote é construído **primeiro** e com cobertura
de testes próxima de 100%, antes de qualquer UI (ver `docs/SPEC.md §11`). A
primeira entrega está especificada em `docs/specs/0001-core-position-calculation.json`.

Regras críticas:

- Usar `decimal`/`numeric` para dinheiro e quantidades — **nunca `float`**.
- Uma venda não altera o preço médio das unidades remanescentes (critério de
  preço médio, RN-03).
- Venda maior que a posição na data deve ser rejeitada (RN-02).
- Casos de borda obrigatórios nos testes: venda parcial, venda total, ativo sem
  cotação, múltiplas compras com preços diferentes, ativo em moeda estrangeira,
  posição zero (divisão por zero).

- `src/`   → implementação dos cálculos
- `tests/` → testes unitários das regras
