import Link from 'next/link';

interface CryptoAsset {
  emoji: string;
  symbol: string;
  name: string;
  changePercent: string;
  changeUp: boolean;
  price: string;
  volume: string;
}

interface NewsItem {
  date: string;
  category: string;
  title: string;
  href: string;
}

interface TrendingItem {
  symbol: string;
  changePercent: string;
  changeUp: boolean;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  { emoji: '₿', symbol: 'BTC', name: 'Bitcoin', changePercent: '+1,45%', changeUp: true, price: '$ 68.234,00', volume: '32B' },
  { emoji: 'Ξ', symbol: 'ETH', name: 'Ethereum', changePercent: '+2,10%', changeUp: true, price: '$ 3.450,20', volume: '18B' },
  { emoji: '₮', symbol: 'USDT', name: 'Tether', changePercent: '0,00%', changeUp: true, price: '$ 1,00', volume: '45B' },
  { emoji: 'S', symbol: 'SOL', name: 'Solana', changePercent: '-1,24%', changeUp: false, price: '$ 145,80', volume: '4,2B' },
];

const NEWS: NewsItem[] = [
  {
    date: '25 jun',
    category: 'Regulação',
    title: 'SEC adia decisão sobre ETFs de Ethereum, mercado reage com cautela',
    href: '#',
  },
  {
    date: '24 jun',
    category: 'Mercado',
    title: 'Bitcoin testa suporte dos US$ 65 mil após saída de liquidez',
    href: '#',
  },
  {
    date: '23 jun',
    category: 'Análise',
    title: 'Altitude Smart Money aponta acúmulo de SOL por baleias',
    href: '#',
  },
];

const TRENDING: TrendingItem[] = [
  { symbol: 'PEPE', changePercent: '+15,2%', changeUp: true },
  { symbol: 'WIF', changePercent: '+8,4%', changeUp: true },
  { symbol: 'ONDO', changePercent: '+5,1%', changeUp: true },
  { symbol: 'FET', changePercent: '-2,3%', changeUp: false },
];

function ChangeIndicator({ percent, up }: { percent: string; up: boolean }) {
  const isNeutral = percent === '0,00%';
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${
        isNeutral
          ? 'text-neutralChange'
          : up
            ? 'text-profit'
            : 'text-loss'
      }`}
    >
      <span className="material-symbols-outlined text-sm">
        {isNeutral ? 'remove' : up ? 'trending_up' : 'trending_down'}
      </span>
      {percent}
    </span>
  );
}

function CryptoSections() {
  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12 space-y-10">
      {/* ── Mercado Cripto ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-on-surface">Mercado Cripto</h2>
          <Link
            href="/mercado/cripto"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Painel completo
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CRYPTO_ASSETS.map((asset) => (
            <div key={asset.symbol} className="glass-panel rounded-lg p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono">{asset.emoji}</span>
                  <div>
                    <span className="text-sm font-semibold text-on-surface">{asset.symbol}</span>
                    <span className="text-xs text-on-surface-variant ml-1">{asset.name}</span>
                  </div>
                </div>
                <ChangeIndicator percent={asset.changePercent} up={asset.changeUp} />
              </div>

              {/* Price */}
              <p className="text-base font-mono font-semibold text-on-surface">{asset.price}</p>

              {/* Volume */}
              <p className="text-xs text-on-surface-variant mt-1">Vol 24h: {asset.volume}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Radar Cripto ── */}
      <div>
        <h2 className="text-xl font-semibold text-on-surface mb-5">Radar Cripto</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* News list — 2/3 */}
          <div className="md:col-span-2 space-y-4">
            {NEWS.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="block rounded-lg border border-border bg-surface p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <time className="text-xs text-on-surface-variant">{item.date}</time>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <p className="text-sm text-on-surface font-medium leading-snug">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>

          {/* Trending sidebar — 1/3 */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">trending_up</span>
              Trending
            </h3>
            <div className="space-y-3">
              {TRENDING.map((item) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-semibold text-on-surface">{item.symbol}</span>
                  <ChangeIndicator percent={item.changePercent} up={item.changeUp} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CryptoSections;
