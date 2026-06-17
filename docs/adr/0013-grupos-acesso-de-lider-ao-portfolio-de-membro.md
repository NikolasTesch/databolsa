# ADR 0013 — Grupos de investimento: acesso de líder ao portfolio de membro

- **Status:** Accepted
- **Data:** 2026-06-17
- **Decisores:** Nikolas

## Contexto

RN-11 (isolamento por usuário) garante que todo asset, transaction e métrica
pertence exclusivamente a um `user_id` e nunca é visível por outro usuário.
Essa garantia é a base de segurança do produto.

A feature de grupos de investimento exige, pela primeira vez, que um usuário
(o líder do grupo) possa ler dados de portfolio pertencentes a outro usuário
(membro). Não há, hoje, nenhum mecanismo de autorização cross-user no sistema —
apenas isolamento absoluto por JWT.

Também não existe o conceito de papel global de administrador. Os únicos papéis
existentes são inferidos do JWT (sub = user_id), sem hierarquia.

As decisões a tomar são:

1. Como modelar a relação "líder pode ver membro" sem violar RN-11?
2. Como separar o papel por-grupo (LEADER/MEMBER) do papel global (ADMIN)?
3. O que o líder pode e não pode ver do membro?
4. Como gerar convites de forma segura?

## Opções consideradas

**Opção A — ACL flat (lista de pares viewer→target)**
- Prós: simples de implementar.
- Contras: não escala para grupos; não representa o contexto de grupo; difícil
  auditar quem autorizou quem e quando.

**Opção B — Grupos com papéis por-membro (decisão adotada)**
- Prós: modela o domínio real (grupo = unidade de compartilhamento); papel
  LEADER/MEMBER é explícito e auditável; suporta múltiplos líderes por grupo
  e múltiplos grupos por usuário; convite é entidade de primeira classe.
- Contras: schema mais complexo; requer nova camada de autorização.

**Opção C — Herança de role global (ADMIN vê tudo)**
- Prós: implementação mínima.
- Contras: viola o princípio do menor privilégio; ADMIN não deve ver carteiras
  de usuários sem consentimento explícito; mistura auditoria de plataforma com
  acesso de negócio.

## Decisão

Adotar a **Opção B**, com as seguintes especificações:

### Modelo de dados

- `Role` (enum global em `User`): `USER | ADMIN`. Define privilégios de
  plataforma (ex.: acessar painel admin). Separado do papel por-grupo.
- `GroupMemberRole` (enum por `GroupMembership`): `LEADER | MEMBER`. Define o
  que o usuário pode fazer dentro de um grupo específico.
- Entidades: `Group`, `GroupMembership` (unique por group+user), `GroupInvite`
  (código opaco, com expiração e limite de uso).

### Integridade referencial de `created_by`

`Group.created_by` e `GroupInvite.created_by` têm FK explícita para `User`
com `ON DELETE RESTRICT`. Isso significa que não é possível excluir um usuário
enquanto ele for criador de algum grupo ou convite. A alternativa (`SET NULL`
ou `CASCADE`) foi descartada:

- `SET NULL` exigiria `created_by` opcional, perdendo a auditabilidade de quem
  criou o grupo.
- `CASCADE` (excluir o grupo ao excluir o criador) é destrutivo e removeria
  membros legítimos sem aviso.

Consequência prática: fluxos de exclusão de conta precisarão transferir a
propriedade do grupo ou excluir o grupo antes de remover o usuário. Esse fluxo
será especificado em SPEC-0038 ou SPEC de gerenciamento de conta.

### Regra de acesso cross-user

Toda leitura de dados de outro usuário deve passar pela função
`assertCanViewPortfolio(viewerId, targetUserId)`:

- Se `viewerId === targetUserId` → passa imediatamente (sem query).
- Se `viewerId` é `LEADER` em ao menos um `Group` do qual `targetUserId` também
  é membro (qualquer papel) → passa.
- Qualquer outra combinação → lança `Error('FORBIDDEN')`.

Esta função é a **única porta de entrada** para acesso cross-user. Nenhum
handler pode ler dados de outro usuário sem passar por ela.

### O que o líder pode ver do membro

O líder vê: portfolio (posições, P/L, alocação), ativos e transações do membro.

O líder **NÃO** vê: metas de renda mensal (`monthly_income_goal`) e alertas de
preço (`PriceAlert`). Esses dados permanecem estritamente privados — pertencem
ao planejamento pessoal do usuário e não ao grupo.

### Admin

O papel `ADMIN` é global e independente do papel de grupo. `assertIsAdmin`
verifica apenas `user.role === 'ADMIN'`. Um admin não tem acesso automático à
carteira de usuários — para isso precisaria também ser LEADER do grupo.

### Convites

Convites são gerados via código opaco (UUID ou token randômico), armazenados
na tabela `group_invites`. A geração e validação de convites é implementada
em SPEC-0038. Esta spec (0037) apenas modela a entidade `GroupInvite` no banco.

## Consequências

**Positivas:**
- RN-11 permanece válido: compartilhamento só acontece sob autorização explícita
  modelada em `GroupMembership`.
- A camada de autorização cross-user é centralizada em uma única função
  (`assertCanViewPortfolio`), facilitando auditoria e testes.
- Papéis globais (ADMIN) e papéis de grupo (LEADER/MEMBER) são orthogonais,
  seguindo o princípio do menor privilégio.
- A migração é não-destrutiva: `role` tem default `USER`, portanto todos os
  usuários existentes continuam funcionando sem alteração.

**Negativas / trade-offs aceitos:**
- Handlers de portfolio precisarão aceitar `targetUserId` (resolvido pela camada
  de autorização) — mudança adiada para SPEC-0038.
- Ligeiro aumento na complexidade do schema.
- `assertCanViewPortfolio` faz até duas queries (busca grupos do viewer e verifica
  se target está em algum deles); aceitável dado o volume esperado de líderes.

**RN-11 reformulado:** "Todo dado pertence a um único usuário e só é acessível
por outros usuários mediante autorização explícita modelada em `GroupMembership`
com papel `LEADER`, validada por `assertCanViewPortfolio`."
