import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendBadge } from '@/components/ui/TrendBadge';

describe('TrendBadge (TC-08)', () => {
  it('exibe — quando value é null', () => {
    render(<TrendBadge value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('aplica classe text-profit para valor positivo', () => {
    const { container } = render(<TrendBadge value="1.23" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-profit');
  });

  it('aplica classe text-loss para valor negativo', () => {
    const { container } = render(<TrendBadge value="-0.45" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-loss');
  });

  it('aplica classe text-on-surface-variant para zero', () => {
    const { container } = render(<TrendBadge value="0" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-on-surface-variant');
  });

  it('exibe + antes do valor positivo sem prefixo', () => {
    render(<TrendBadge value="2.50" />);
    expect(screen.getByText('+2.50%')).toBeInTheDocument();
  });

  it('mantém o sinal - para valor negativo', () => {
    render(<TrendBadge value="-1.10" />);
    expect(screen.getByText('-1.10%')).toBeInTheDocument();
  });

  it('não exibe ícone quando showIcon=false', () => {
    const { container } = render(<TrendBadge value="1.5" showIcon={false} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
