'use client';

import { useQuery } from '@tanstack/react-query';

interface TickerData {
  name: string;
  value: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
}

function fetchTickers(): Promise<TickerData[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { name: 'IBOV',  value: '128.452,10', changePercent: '+1,24%', trend: 'up' },
        { name: 'S&P500', value: '5.123,40',  changePercent: '-0,52%', trend: 'down' },
        { name: 'USD/BRL', value: '4,9523',   changePercent: '-0,18%', trend: 'down' },
        { name: 'BTC/BRL', value: '345.890',  changePercent: '+2,45%', trend: 'up' },
        { name: 'DXY',    value: '104,20',    changePercent: '0,00%',  trend: 'flat' },
      ]);
    }, 0);
  });
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const icon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'horizontal_rule';
  const color =
    trend === 'up'
      ? 'text-profit'
      : trend === 'down'
        ? 'text-loss'
        : 'text-neutralChange';

  return (
    <span className={`material-symbols-outlined text-[18px] ${color}`} aria-hidden="true">
      {icon}
    </span>
  );
}

export default function MarketTickerBar() {
  const { data: tickers } = useQuery({
    queryKey: ['market-ticker-bar'],
    queryFn: fetchTickers,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  if (!tickers || tickers.length === 0) return null;

  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop" aria-label="Cotações de mercado">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
        {tickers.map((ticker) => (
          <div
            key={ticker.name}
            className="glass-panel p-4 rounded-lg min-w-[200px] flex-shrink-0 snap-start"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wide text-outline">
                {ticker.name}
              </span>
              <TrendIcon trend={ticker.trend} />
            </div>

            {/* Value */}
            <div className="font-mono text-lg font-semibold text-on-surface">
              {ticker.value}
            </div>

            {/* Change */}
            <div
              className={`font-mono text-sm mt-0.5 ${
                ticker.trend === 'up'
                  ? 'text-profit'
                  : ticker.trend === 'down'
                    ? 'text-loss'
                    : 'text-neutralChange'
              }`}
            >
              {ticker.changePercent}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
