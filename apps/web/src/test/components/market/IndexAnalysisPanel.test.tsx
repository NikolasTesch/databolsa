/**
 * SPEC-0017 — TC-05
 * Tests for IndexAnalysisPanel widget — badges (Barato/Neutro/Caro)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexAnalysisPanel } from '@/components/market/IndexAnalysisPanel';

describe('TC-05 — IndexAnalysisPanel Widget', () => {
  it('renderiza ambos os índices com dados históricos', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={10.5} ifixCurrentDY={8.2} />);
    expect(screen.getByText('IBOVESPA')).toBeInTheDocument();
    expect(screen.getByText('IFIX')).toBeInTheDocument();
    expect(screen.getAllByText(/Média histórica/).length).toBe(2);
  });

  it('exibe badge Barato quando P/L abaixo do threshold', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={8.0} ifixCurrentDY={10.0} />);
    const badges = screen.getAllByText('Barato');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('exibe badge Neutro quando valor dentro da faixa', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={11.0} ifixCurrentDY={8.0} />);
    const badges = screen.getAllByText('Neutro');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('exibe badge Caro quando valor acima do threshold', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={15.0} ifixCurrentDY={5.0} />);
    const badges = screen.getAllByText('Caro');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('exibe "Indisponível" quando currentValue é null/undefined', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={null} ifixCurrentDY={undefined} />);
    const unavailableElements = screen.getAllByText('Indisponível');
    expect(unavailableElements.length).toBeGreaterThanOrEqual(2);
  });

  it('exibe a data de última atualização dos benchmarks', () => {
    render(<IndexAnalysisPanel ibovCurrentPL={10.5} ifixCurrentDY={8.2} />);
    expect(screen.getByText(/atualizado em/i)).toBeInTheDocument();
  });
});
