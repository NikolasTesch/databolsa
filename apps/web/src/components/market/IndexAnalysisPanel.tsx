import {
  INDEX_BENCHMARKS,
  getValuationLabel,
  type IndexLabel,
  type IndexBenchmark,
} from '@/lib/market/index-benchmarks';

interface IndexAnalysisPanelProps {
  /** Current P/E ratio for IBOV. If null, shows historical average only. */
  ibovCurrentPL?: number | null;
  /** Current Dividend Yield (%) for IFIX. If null, shows historical average only. */
  ifixCurrentDY?: number | null;
}

const LABEL_STYLES: Record<IndexLabel, string> = {
  Barato: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Neutro: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Caro: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

function ValuationBadge({ label }: { label: IndexLabel }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${LABEL_STYLES[label]}`}
    >
      {label}
    </span>
  );
}

interface IndexCardProps {
  name: string;
  currentValue: number | null | undefined;
  benchmark: IndexBenchmark;
}

function IndexCard({ name, currentValue, benchmark }: IndexCardProps) {
  const hasCurrentData = currentValue != null;
  const label = hasCurrentData ? getValuationLabel(currentValue, benchmark) : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-content">{name}</h4>
          <p className="text-xs text-content-muted mt-0.5">{benchmark.description}</p>
        </div>
        {label && <ValuationBadge label={label} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-content-muted mb-1">Média histórica</div>
          <div className="text-xl font-bold text-content">
            {benchmark.historicalAvg}
            <span className="text-sm font-normal text-content-muted ml-0.5">
              {benchmark.unit}
            </span>
          </div>
        </div>

        {hasCurrentData ? (
          <div>
            <div className="text-xs text-content-muted mb-1">{benchmark.metric} atual</div>
            <div className="text-xl font-bold text-primary">
              {currentValue!.toFixed(1)}
              <span className="text-sm font-normal text-content-muted ml-0.5">
                {benchmark.unit}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs text-content-muted mb-1">{benchmark.metric} atual</div>
            <div className="text-sm text-content-muted italic">
              Indisponível
            </div>
            <div className="text-xs text-content-subtle mt-0.5">
              Comparar com dados ao vivo em breve
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-content-muted">
          <span>
            Barato: &lt;{benchmark.ranges.cheap}
            {benchmark.unit}
          </span>
          <span>·</span>
          <span>
            Caro: &gt;{benchmark.ranges.expensive}
            {benchmark.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * IndexAnalysisPanel
 *
 * Displays the IBOV P/E and IFIX DY compared to curated historical averages.
 * currentValue props are optional — if not provided, shows historical data only
 * with a note that live data is coming.
 */
export function IndexAnalysisPanel({
  ibovCurrentPL,
  ifixCurrentDY,
}: IndexAnalysisPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-content">Análise de Índices</h3>
        <p className="text-xs text-content-muted mt-1">
          Médias históricas curadas · Atualizado em {INDEX_BENCHMARKS.lastUpdated}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <IndexCard
          name="IBOVESPA"
          currentValue={ibovCurrentPL}
          benchmark={INDEX_BENCHMARKS.ibov}
        />
        <IndexCard
          name="IFIX"
          currentValue={ifixCurrentDY}
          benchmark={INDEX_BENCHMARKS.ifix}
        />
      </div>
    </div>
  );
}
