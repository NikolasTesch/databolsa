import HighlightsSection from './HighlightsSection';
import { fetchAssetsForClass } from '@/lib/market/highlights-data';

function parseChangePercent(value: string): number {
  return Number.parseFloat(value.replace('%', '').replace(',', '.')) || 0;
}

function sortByChangeDesc<T extends { changePercent: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseChangePercent(b.changePercent) - parseChangePercent(a.changePercent));
}

function sortByChangeAsc<T extends { changePercent: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseChangePercent(a.changePercent) - parseChangePercent(b.changePercent));
}

export default async function HighlightsSectionServer() {
  try {
    const items = await fetchAssetsForClass('STOCK_BR');
    const initialData = {
      gainers: sortByChangeDesc(items).slice(0, 4),
      losers: sortByChangeAsc(items).slice(0, 4),
      type: 'STOCK_BR',
    };

    return <HighlightsSection initialData={initialData} />;
  } catch {
    return <HighlightsSection initialData={null} />;
  }
}
