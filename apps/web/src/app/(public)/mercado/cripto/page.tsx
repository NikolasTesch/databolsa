import Link from 'next/link';
import { getCryptoOverview } from '@/lib/market/crypto-overview';

export const revalidate = 300;

function ChangeIndicator({ percent }: { percent: string }) {
  const isNeutral = percent === '0.00%';
  const up = percent.startsWith('+');
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium ${isNeutral ? 'text-neutralChange' : up ? 'text-profit' : 'text-loss'}`}>
      <span className="material-symbols-outlined text-sm">{isNeutral ? 'remove' : up ? 'trending_up' : 'trending_down'}</span>
      {percent}
    </span>
  );
}

function getEmoji(symbol: string): string {
  const map: Record<string, string> = { BTC: '₿', ETH: 'Ξ', USDT: '₮', SOL: 'S', BNB: '◆' };
  return map[symbol] ?? '₿';
}

export default async function CryptoPage() {
  const overview = await getCryptoOverview();
  const assets = overview.assets;

  return (
    <div className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-on-surface font-medium">Cripto</span>
        <span>/</span>
        <span className="text-on-surface">Mercado</span>
      </div>

      <h1 className="text-xl font-semibold text-on-surface mb-6">Mercado Cripto</h1>

      {assets.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-8 text-center">Dados de cripto indisponíveis no momento.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <Link
              key={asset.symbol}
              href={`/ativos/${asset.symbol}?class=CRYPTO`}
              className="glass-panel rounded-lg p-4 block cursor-pointer focus-visible:ring-2 focus-visible:ring-primary transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono">{getEmoji(asset.symbol)}</span>
                  <div>
                    <span className="text-sm font-semibold text-on-surface">{asset.symbol}</span>
                    <span className="text-xs text-on-surface-variant ml-1">{asset.name}</span>
                  </div>
                </div>
                <ChangeIndicator percent={asset.changePercent} />
              </div>
              <p className="text-base font-mono font-semibold text-on-surface">{asset.price}</p>
              {asset.volume24h !== '—' && <p className="text-xs text-on-surface-variant mt-1">Vol 24h: {asset.volume24h}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
