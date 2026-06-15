import { CurrencyConverter } from './CurrencyConverter';
import { CryptoConverter } from './CryptoConverter';
import { IndexAnalysisPanel } from './IndexAnalysisPanel';

/**
 * ToolsSection — displayed on the public home page.
 * Wraps the three financial tools in a unified section.
 */
export function ToolsSection() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-12"
      aria-label="Ferramentas financeiras"
      id="ferramentas"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-content">Ferramentas Financeiras</h2>
        <p className="text-sm text-content-muted mt-1">
          Conversores de câmbio e análise de índices do mercado brasileiro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CurrencyConverter />
        <CryptoConverter />
        <div className="md:col-span-2 xl:col-span-1">
          <IndexAnalysisPanel />
        </div>
      </div>
    </section>
  );
}
