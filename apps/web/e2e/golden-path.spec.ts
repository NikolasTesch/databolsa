/**
 * TC-01 — Golden path E2E
 *
 * Fluxo: registro → login → criar ativo PETR4 → BUY 100 @ R$30 →
 *        BUY 50 @ R$33 → SELL 50 → dashboard com P/L correto.
 *
 * Cálculo esperado (stub PETR4 = R$36):
 *   preço_médio    = (100×30 + 50×33) / 150 = R$ 31,00
 *   SELL 50 não altera preço_médio (RN-03), qtd_atual = 100
 *   valor_atual    = 100 × 36 = R$ 3.600,00
 *   valor_investido = 100 × 31 = R$ 3.100,00
 *   lucro_prejuizo  = R$ 500,00 (+16,13%)
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

function uniqueEmail() {
  return `e2e+${Date.now()}@databolsa.test`;
}

test.describe('TC-01 — Golden path', () => {
  test('registro → login → ativo → transações → P/L no dashboard', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'Senha@1234';

    // ── 1. Registro ──────────────────────────────────────────────────────────
    await page.goto(`${BASE}/register`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByLabel('Confirmar senha').fill(password);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    // Após registro bem-sucedido, o app redireciona para o dashboard
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // ── 2. Criar ativo PETR4 ──────────────────────────────────────────────────
    await page.getByRole('link', { name: '+ Novo Ativo' }).click();
    await page.waitForURL('**/assets/new');

    await page.getByLabel('Ticker').fill('PETR4');
    await page.getByLabel('Nome').fill('Petrobras PN');
    await page.getByLabel('Categoria').selectOption('STOCK_BR');
    await page.getByLabel('Moeda').selectOption('BRL');
    await page.getByLabel('Fonte de cotação').selectOption('BRAPI');
    await page.getByRole('button', { name: 'Criar Ativo' }).click();

    // Após criar, redireciona para /assets/:id
    await page.waitForURL(/\/assets\/[^/]+$/, { timeout: 10_000 });
    const assetUrl = page.url();

    // ── 3. BUY 100 unidades @ R$30,00 ────────────────────────────────────────
    await page.getByRole('link', { name: '+ Nova Transação' }).click();
    await page.waitForURL(/\/transactions\/new/);

    await page.getByLabel('Tipo').selectOption('BUY');
    await page.getByLabel('Quantidade').fill('100');
    await page.getByLabel('Preço unitário').fill('30');
    await page.getByRole('button', { name: 'Registrar Transação' }).click();

    // Retorna à página do ativo
    await page.waitForURL(new RegExp(assetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), { timeout: 10_000 });

    // ── 4. BUY 50 unidades @ R$33,00 ─────────────────────────────────────────
    await page.getByRole('link', { name: '+ Nova Transação' }).click();
    await page.waitForURL(/\/transactions\/new/);

    await page.getByLabel('Tipo').selectOption('BUY');
    await page.getByLabel('Quantidade').fill('50');
    await page.getByLabel('Preço unitário').fill('33');
    await page.getByRole('button', { name: 'Registrar Transação' }).click();

    await page.waitForURL(new RegExp(assetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), { timeout: 10_000 });

    // ── 5. SELL 50 unidades @ R$36,00 (preço atual stub) ─────────────────────
    await page.getByRole('link', { name: '+ Nova Transação' }).click();
    await page.waitForURL(/\/transactions\/new/);

    await page.getByLabel('Tipo').selectOption('SELL');
    await page.getByLabel('Quantidade').fill('50');
    await page.getByLabel('Preço unitário').fill('36');
    await page.getByRole('button', { name: 'Registrar Transação' }).click();

    await page.waitForURL(new RegExp(assetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), { timeout: 10_000 });

    // ── 6. Dashboard — verificar P/L ─────────────────────────────────────────
    await page.goto(`${BASE}/dashboard`);
    // Aguarda a tabela de posições aparecer
    await page.waitForSelector('[aria-label="Posições do portfólio"]', { timeout: 15_000 });

    // Verifica preço médio R$ 31,00 na linha do PETR4
    // A tabela formata em pt-BR: "R$ 31,00"
    const petr4Row = page.getByRole('row', { name: /PETR4/ });
    await expect(petr4Row).toBeVisible();

    // Preço médio = R$ 31,00
    await expect(petr4Row).toContainText('31,00');

    // Quantidade atual = 100
    await expect(petr4Row).toContainText('100');

    // P/L positivo deve aparecer (R$ 500,00)
    await expect(petr4Row).toContainText('500,00');
  });
});
