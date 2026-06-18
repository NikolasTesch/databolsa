/**
 * SPEC-0039 T-06 — Testes E2E de Grupos de Investimento
 *
 * Cobre os 4 Acceptance Criteria da SPEC-0039:
 *   AC-01: Criar grupo via UI                     → TC-01
 *   AC-02: Gerar convite com link copiável         → TC-02
 *   AC-03: Aceitar convite (fluxo com login)       → TC-03
 *   AC-04: Banner read-only na carteira do membro  → TC-04
 *   Extra: validação de formulário                 → TC-05
 *
 * Requer USE_QUOTE_STUB=true (configurado no playwright.config.ts).
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const PASSWORD = 'Test@123456';

function uniqueEmail(): string {
  return `e2e+${Date.now()}@databolsa.test`;
}

/**
 * Registra um novo usuário e aguarda o redirect para /dashboard.
 */
async function registerUser(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/register`);
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByLabel('Confirmar senha').fill(password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Navega para a página de grupos, abre o modal de criação, preenche
 * o formulário e submete. Retorna a URL final (grupo detalhe).
 */
async function createGroupViaUI(page: Page, name: string, description?: string): Promise<string> {
  await page.goto(`${BASE}/portfolio/groups`);
  await page.waitForURL('**/portfolio/groups');

  // Clica em "Criar Grupo" (botão primário)
  await page.getByRole('button', { name: 'Criar Grupo' }).click();

  // Preenche o formulário no modal
  await page.getByLabel('Nome do grupo').fill(name);
  if (description) {
    await page.getByLabel('Descrição (opcional)').fill(description);
  }

  // Submete
  await page.getByRole('button', { name: 'Criar' }).click();

  // Aguarda redirect para /portfolio/groups/[id]
  await page.waitForURL(/\/portfolio\/groups\/[^/]+$/, { timeout: 10_000 });
  return page.url();
}

test.describe('Grupos - SPEC-0039', () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // AC-01: Criar grupo via UI
  // ─────────────────────────────────────────────────────────────────────────────
  test('TC-01 (AC-01) — Criar grupo com nome e descrição', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email, PASSWORD);

    await createGroupViaUI(page, 'Família Silva', 'Investimentos da família');

    // Deve estar na página do grupo (URL contém /portfolio/groups/[id])
    expect(page.url()).toMatch(/\/portfolio\/groups\/[^/]+$/);

    // O nome do grupo deve aparecer como heading
    await expect(page.getByRole('heading', { name: 'Família Silva' })).toBeVisible();

    // A descrição deve aparecer
    await expect(page.getByText('Investimentos da família')).toBeVisible();

    // O badge "Líder" deve estar visível (criador é líder automático)
    await expect(page.getByText('Líder')).toBeVisible();

    // A seção de membros deve conter 1 membro
    await expect(page.getByText(/1 membro/)).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Erro: criar grupo sem nome
  // ─────────────────────────────────────────────────────────────────────────────
  test('TC-01b (AC-01) — Erro ao criar grupo sem nome', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email, PASSWORD);

    await page.goto(`${BASE}/portfolio/groups`);
    await page.waitForURL('**/portfolio/groups');

    // Abre o modal sem preencher o nome
    await page.getByRole('button', { name: 'Criar Grupo' }).click();

    // Submete o formulário vazio
    await page.getByRole('button', { name: 'Criar' }).click();

    // Deve exibir a mensagem de erro inline
    await expect(page.getByText('Nome do grupo é obrigatório')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AC-02: Gerar convite com link copiável
  // ─────────────────────────────────────────────────────────────────────────────
  test('TC-02 (AC-02) — Líder gera convite e link copiável é exibido', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email, PASSWORD);

    // Cria grupo via UI
    await createGroupViaUI(page, 'Grupo Teste');

    // Clica em "Gerar Convite"
    await page.getByRole('button', { name: 'Gerar Convite' }).click();

    // Modal de convite deve estar aberto
    await expect(page.getByText('Gerar Convite')).toBeVisible();

    // Submete com opções padrão
    await page.getByRole('button', { name: 'Criar Convite' }).click();

    // Mensagem de sucesso deve aparecer
    await expect(page.getByText('Convite criado com sucesso!')).toBeVisible({ timeout: 10_000 });

    // O link de convite deve estar visível num input readonly
    const inviteInput = page.getByDisplayValue(/\/portfolio\/groups\/join\?code=/);
    await expect(inviteInput).toBeVisible();

    // O campo deve conter o origin correto + caminho do convite
    const fullUrl = await inviteInput.inputValue();
    expect(fullUrl).toContain('/portfolio/groups/join?code=');

    // Botão "Copiar" deve estar visível
    const copyButton = page.getByRole('button', { name: 'Copiar' });
    await expect(copyButton).toBeVisible();

    // Clica em "Copiar" — o toast "Link copiado!" deve aparecer
    await copyButton.click();
    await expect(page.getByText('Link copiado!')).toBeVisible({ timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AC-03: Aceitar convite (fluxo com login)
  // ─────────────────────────────────────────────────────────────────────────────
  test('TC-03 (AC-03) — Usuário aceita convite após registro', async ({ page }) => {
    const leaderEmail = uniqueEmail();
    const memberEmail = `member+${Date.now()}@databolsa.test`;

    // ── 1. User A (leader): register, create group, create invite ────────────────
    await registerUser(page, leaderEmail, PASSWORD);

    // Cria grupo
    await createGroupViaUI(page, 'Grupo Colaborativo');

    // Gera convite
    await page.getByRole('button', { name: 'Gerar Convite' }).click();
    await page.getByRole('button', { name: 'Criar Convite' }).click();
    await expect(page.getByText('Convite criado com sucesso!')).toBeVisible({ timeout: 10_000 });

    // Captura o código do convite
    const inviteInput = page.getByDisplayValue(/\/portfolio\/groups\/join\?code=/);
    const fullUrl = await inviteInput.inputValue();
    const inviteCode = fullUrl.split('code=')[1];
    expect(inviteCode).toBeTruthy();

    // ── 2. Logout e registro como User B ─────────────────────────────────────────
    // Limpa cookies para deslogar
    await page.context().clearCookies();

    // Navega para a página de registro (o middleware pode ter redirecionado para login)
    // Garantimos que estamos na página correta
    await page.goto(`${BASE}/register`);
    await page.waitForURL('**/register');

    // Registra User B
    await page.getByLabel('E-mail').fill(memberEmail);
    await page.getByLabel('Senha', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirmar senha').fill(PASSWORD);
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // ── 3. User B acessa o link de convite ─────────────────────────────────────
    await page.goto(`${BASE}/portfolio/groups/join?code=${inviteCode}`);
    await page.waitForURL('**/join*code=*', { timeout: 10_000 });

    // Deve ver a tela de convite com o botão "Aceitar Convite"
    await expect(page.getByText('Você foi convidado para um grupo!')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Aceitar Convite' }),
    ).toBeVisible();

    // Aceita o convite
    await page.getByRole('button', { name: 'Aceitar Convite' }).click();

    // Deve exibir mensagem de sucesso
    await expect(page.getByText('Convite Aceito!')).toBeVisible({ timeout: 10_000 });

    // Clica em "Ver Grupo" para navegar para a página do grupo
    await page.getByRole('link', { name: 'Ver Grupo' }).click();
    await page.waitForURL(/\/portfolio\/groups\/[^/]+$/, { timeout: 10_000 });

    // Deve ver o nome do grupo e o badge "Membro"
    await expect(page.getByText('Grupo Colaborativo')).toBeVisible();
    await expect(page.getByText('Membro')).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // AC-04: Banner read-only na carteira do membro
  // ─────────────────────────────────────────────────────────────────────────────
  test('TC-04 (AC-04) — Banner read-only ao visualizar carteira de membro', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email, PASSWORD);

    // Navega para /portfolio com targetUserId e userEmail simulando
    // a visualização da carteira de um membro
    const targetUserId = '00000000-0000-0000-0000-000000000001';
    const memberEmail = 'membro@example.com';
    await page.goto(
      `${BASE}/portfolio?targetUserId=${targetUserId}&userEmail=${encodeURIComponent(memberEmail)}`,
    );
    await page.waitForURL('**/portfolio*', { timeout: 10_000 });

    // O banner de apenas-leitura deve estar visível
    const banner = page.getByText(/Visualizando carteira de/);
    await expect(banner).toBeVisible({ timeout: 10_000 });

    // O texto deve conter o e-mail do membro e "Apenas Leitura"
    await expect(banner).toContainText(memberEmail);
    await expect(banner).toContainText('Apenas Leitura');

    // O link "Voltar à minha carteira" deve estar presente
    await expect(
      page.getByRole('link', { name: 'Voltar à minha carteira' }),
    ).toBeVisible();
  });
});
