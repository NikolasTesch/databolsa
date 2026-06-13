/**
 * TC-02 — E2E negativo: SELL acima da posição exibe erro inline
 *
 * Cenário: usuário compra 100 unidades e tenta vender 200.
 * Expectativa: formulário exibe mensagem de erro visível (422 da API).
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

function uniqueEmail() {
  return `e2e-neg+${Date.now()}@databolsa.test`;
}

test.describe('TC-02 — SELL inválido', () => {
  test('SELL acima da posição exibe mensagem de erro no formulário', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'Senha@1234';

    // ── Registro ──────────────────────────────────────────────────────────────
    await page.goto(`${BASE}/register`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByLabel('Confirmar senha').fill(password);
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    // ── Criar ativo ───────────────────────────────────────────────────────────
    await page.getByRole('link', { name: '+ Novo Ativo' }).click();
    await page.waitForURL('**/assets/new');

    await page.getByLabel('Ticker').fill('PETR4');
    await page.getByLabel('Nome').fill('Petrobras PN');
    await page.getByLabel('Categoria').selectOption('STOCK_BR');
    await page.getByLabel('Moeda').selectOption('BRL');
    await page.getByLabel('Fonte de cotação').selectOption('BRAPI');
    await page.getByRole('button', { name: 'Criar Ativo' }).click();

    await page.waitForURL(/\/assets\/[^/]+$/, { timeout: 10_000 });
    const assetUrl = page.url();

    // ── BUY 100 unidades ─────────────────────────────────────────────────────
    await page.getByRole('link', { name: '+ Nova Transação' }).click();
    await page.waitForURL(/\/transactions\/new/);

    await page.getByLabel('Tipo').selectOption('BUY');
    await page.getByLabel('Quantidade').fill('100');
    await page.getByLabel('Preço unitário').fill('30');
    await page.getByRole('button', { name: 'Registrar Transação' }).click();
    await page.waitForURL(new RegExp(assetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), { timeout: 10_000 });

    // ── SELL 200 (acima da posição de 100) ────────────────────────────────────
    await page.getByRole('link', { name: '+ Nova Transação' }).click();
    await page.waitForURL(/\/transactions\/new/);

    await page.getByLabel('Tipo').selectOption('SELL');
    await page.getByLabel('Quantidade').fill('200');
    await page.getByLabel('Preço unitário').fill('32');

    // Aguarda a resposta da API ao submeter o formulário
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/proxy/') && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.getByRole('button', { name: 'Registrar Transação' }).click(),
    ]);

    // API deve responder 422 (violação de regra de negócio)
    expect(response.status()).toBe(422);

    // Mensagem de erro inline deve ficar visível no formulário
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 5_000 });

    // A mensagem deve indicar "venda" ou "posição" (texto gerado pelo TransactionForm)
    await expect(errorAlert).toContainText(/venda|posição|quantidade/i);
  });
});
