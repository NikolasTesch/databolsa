import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertRuleModal } from '@/components/analysis/AlertRuleModal';

describe('AlertRuleModal', () => {
  const onClose = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza quando fechado', () => {
    const { container } = render(
      <AlertRuleModal open={false} onClose={onClose} onSave={onSave} />,
    );

    expect(container.innerHTML).toBe('');
  });

  it('renderiza quando aberto', () => {
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    expect(screen.getByText('Novo Alerta')).toBeDefined();
    expect(screen.getByText('Criar Alerta')).toBeDefined();
    expect(screen.getByText('Cancelar')).toBeDefined();
  });

  it('exibe os botões de métrica', () => {
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    expect(screen.getByText('DY')).toBeDefined();
    expect(screen.getByText('P/L')).toBeDefined();
    expect(screen.getByText('P/VP')).toBeDefined();
    expect(screen.getByText('ROE')).toBeDefined();
    expect(screen.getByText('Score')).toBeDefined();
    expect(screen.getByText('Stale')).toBeDefined();
  });

  it('exibe condição e valor-alvo para métrica normal', () => {
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    expect(screen.getByText('Acima de')).toBeDefined();
    expect(screen.getByText('Abaixo de')).toBeDefined();
    expect(screen.getByPlaceholderText('ex: 6,5')).toBeDefined();
  });

  it('esconde condição e valor-alvo para stale', async () => {
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    // Clica no botão Stale
    const staleButton = screen.getByText('Stale');
    fireEvent.click(staleButton);

    // Verifica se a ajuda do stale aparece
    await waitFor(() => {
      expect(
        screen.getByText(/24h sem atualização/),
      ).toBeDefined();
    });

    // Valor-alvo não deve estar visível para stale
    expect(screen.queryByPlaceholderText('ex: 6,5')).toBeNull();
  });

  it('mostra erro quando ticker está vazio', async () => {
    const user = userEvent.setup();
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    const submitButton = screen.getByText('Criar Alerta');
    await user.click(submitButton);

    expect(screen.getByText('Informe o ticker do ativo.')).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('mostra erro quando valor-alvo é inválido', async () => {
    const user = userEvent.setup();
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    const tickerInput = screen.getByPlaceholderText('ex: PETR4');
    await user.type(tickerInput, 'PETR4');

    const submitButton = screen.getByText('Criar Alerta');
    await user.click(submitButton);

    expect(
      screen.getByText('Informe um valor-alvo válido (maior que zero).'),
    ).toBeDefined();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('chama onSave com dados corretos', async () => {
    onSave.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} ticker="PETR4" />,
    );

    // Ticker já preenchido
    const targetInput = screen.getByPlaceholderText('ex: 6,5');
    await user.type(targetInput, '6');

    const submitButton = screen.getByText('Criar Alerta');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        ticker: 'PETR4',
        metric: 'dy',
        condition: 'ABOVE',
        target_value: '6',
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('chama onClose ao clicar em Cancelar', async () => {
    const user = userEvent.setup();
    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} />,
    );

    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('mostra loading state durante salvamento', async () => {
    // Save nunca resolve para manter loading
    onSave.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();

    render(
      <AlertRuleModal open={true} onClose={onClose} onSave={onSave} ticker="PETR4" />,
    );

    const targetInput = screen.getByPlaceholderText('ex: 6,5');
    await user.type(targetInput, '6');

    const submitButton = screen.getByText('Criar Alerta');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeDefined();
    });
  });
});
