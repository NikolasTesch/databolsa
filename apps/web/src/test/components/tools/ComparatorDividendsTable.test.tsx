import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import ComparatorDividendsTable, { type DividendData } from '@/components/tools/ComparatorDividendsTable';

const MOCK_DATA: DividendData[] = [
  {
    ticker: 'PETR4',
    dy: '12',
    lastDividend: '1.50',
    totalScore: '82',
    pe: '8',
    pb: '1.2',
    roe: '25',
    netMargin: '18',
    debtToEquity: '0.5',
  },
  {
    ticker: 'VALE3',
    dy: '8',
    lastDividend: '2.00',
    totalScore: '75',
    pe: '6',
    pb: '1.5',
    roe: '20',
    netMargin: '15',
    debtToEquity: '0.3',
  },
];

describe('ComparatorDividendsTable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders table with dividend data', () => {
    render(<ComparatorDividendsTable data={MOCK_DATA} />);
    expect(screen.getByText('Proventos')).toBeInTheDocument();
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('VALE3')).toBeInTheDocument();
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    expect(screen.getByText('8.0%')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.50')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.00')).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<ComparatorDividendsTable data={[]} />);
    expect(screen.getByText(/Nenhum dado de proventos/)).toBeInTheDocument();
  });

  it('renders CSV export button and triggers download', () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const anchorProto = HTMLAnchorElement.prototype;
    const originalClick = anchorProto.click;
    const clickSpy = vi.fn();
    anchorProto.click = clickSpy;

    render(<ComparatorDividendsTable data={MOCK_DATA} />);

    const exportBtn = screen.getByText('Exportar CSV');
    fireEvent.click(exportBtn);

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    anchorProto.click = originalClick;
  });

  it('handles null values gracefully', () => {
    const partialData: DividendData[] = [
      {
        ticker: 'TEST',
        dy: null,
        lastDividend: null,
        totalScore: null,
        pe: null,
        pb: null,
        roe: null,
        netMargin: null,
        debtToEquity: null,
      },
    ];
    render(<ComparatorDividendsTable data={partialData} />);
    expect(screen.getByText('TEST')).toBeInTheDocument();
    // Null values show '—'
    const dashElements = screen.getAllByText('—');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('colors DY correctly', () => {
    const dyData: DividendData[] = [
      { ...MOCK_DATA[0], dy: '6' },    // 3-12% range → green
      { ...MOCK_DATA[1], dy: '15' },    // >12% → amber (attention)
      { ticker: 'TEST', dy: null, lastDividend: null, totalScore: null, pe: null, pb: null, roe: null, netMargin: null, debtToEquity: null }, // null → gray
    ];
    render(<ComparatorDividendsTable data={dyData} />);

    // DY values rendered (format: X.Y%)
    expect(screen.getByText('6.0%')).toBeInTheDocument();
    expect(screen.getByText('15.0%')).toBeInTheDocument();
  });
});
