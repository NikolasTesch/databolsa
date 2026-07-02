import type { AssetAnalysis, AnalysisScoreBreakdown } from '@/lib/analysis/asset-analysis.types';

interface AnalysisSummaryProps {
  analysis: AssetAnalysis;
}

function scoreLabel(analysis: AssetAnalysis): string {
  if (analysis.scoreLevel === 'unknown') return 'Dados insuficientes';
  return `Score ${analysis.totalScore}/100`;
}

function positiveReasons(breakdown: AnalysisScoreBreakdown[]): string[] {
  return breakdown
    .filter((item) => item.level === 'positive')
    .flatMap((item) => item.reasons)
    .slice(0, 3);
}

function missingData(breakdown: AnalysisScoreBreakdown[]): string[] {
  return Array.from(new Set(breakdown.flatMap((item) => item.missing))).slice(0, 4);
}

export function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  const strengths = positiveReasons(analysis.breakdown);
  const missing = missingData(analysis.breakdown);
  const hasInsufficientData = analysis.scoreLevel === 'unknown';

  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <h2 className="text-lg font-semibold text-on-surface">Resumo da analise</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Leitura baseada nos indicadores disponiveis, dados de mercado e comparacao setorial.
          </p>
        </div>

        <div
          className={
            hasInsufficientData
              ? 'rounded-lg border border-border bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface-variant'
              : 'rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary'
          }
        >
          {scoreLabel(analysis)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold text-on-surface">Pontos fortes</h3>
          {strengths.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
              {strengths.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">Sem sinais positivos suficientes.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-on-surface">Pontos de atencao</h3>
          {analysis.alerts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
              {analysis.alerts.slice(0, 4).map((alert) => (
                <li key={alert.id}>
                  <span className="font-medium text-on-surface">{alert.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">Nenhum alerta relevante com os dados atuais.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-on-surface">Dados ausentes</h3>
          {missing.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">Principais campos da analise disponiveis.</p>
          )}
        </div>
      </div>
    </section>
  );
}
