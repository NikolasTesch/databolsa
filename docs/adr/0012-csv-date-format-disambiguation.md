# ADR-0012 — Desambiguação de formato de data no import CSV

**Status:** aceito  
**Data:** 2026-06-17

## Contexto

O parser de CSV (`apps/web/src/lib/import/csv-parser.ts`) aceita datas nos formatos
DD/MM/YYYY (padrão pt-BR, usado por B3/CEI) e MM/DD/YYYY (padrão americano).
O bug original usava o mesmo regex para ambos, tornando o branch MM/DD inalcançável.

Para datas como `06/07/2026`, os dois formatos são indistinguíveis: pode ser 6 de julho
ou 7 de junho. O público-alvo do DataBolsa é brasileiro, e os exportadores de referência
(B3, CEI, corretoras nacionais) sempre emitem DD/MM/YYYY.

## Decisão

1. ISO `YYYY-MM-DD` → detectado pelo regex e retornado diretamente.
2. Formato `NN/NN/YYYY`:
   - Se o **primeiro** componente for > 12 → inequivocamente DD/MM → parse DD/MM.
   - Se o **segundo** componente for > 12 → inequivocamente MM/DD → parse MM/DD.
   - **Ambíguo** (ambos ≤ 12) → assumir **DD/MM** (padrão pt-BR).
3. Data resultante é validada com `Date.getTime() !== NaN`; se inválida → retorna `null`
   (linha tratada como erro de parse).

## Consequências

- Usuários com arquivos americanos cujo dia seja ≤ 12 receberão datas interpretadas como
  DD/MM. Mitigação: a tela de preview do import exibe as datas antes do commit, permitindo
  que o usuário cancele e reformate o arquivo.
- A regra é documentada na UI como "formato esperado: DD/MM/YYYY ou YYYY-MM-DD".
- Não há forma de detectar formato via header/meta do CSV — a decisão é estática por
  componente, não por arquivo.
