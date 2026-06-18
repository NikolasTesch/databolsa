import { IndexCard } from './IndexCard';

interface IndexCardData {
  id: string;
  label: string;
  value: string;
  changePercent: string | null;
  stale?: boolean;
}

interface IndexBarProps {
  indices: IndexCardData[];
}

export function IndexBar({ indices }: IndexBarProps) {
  if (!indices.length) return null;

  return (
    <section
      className="bg-surface border-y border-border py-3 overflow-hidden"
      aria-label="Indicadores de mercado"
    >
      {/* marquee-track duplica o conteúdo para loop contínuo */}
      <div className="marquee-track flex w-max items-center">
        {/* Cópia visível */}
        {indices.map((idx) => (
          <IndexCard
            key={idx.id}
            label={idx.label}
            value={idx.value}
            changePercent={idx.changePercent}
            stale={idx.stale}
            className="border-r"
          />
        ))}
        {/* Cópia para loop contínuo */}
        <div className="flex items-center" aria-hidden="true">
          {indices.map((idx) => (
            <IndexCard
              key={`_${idx.id}`}
              label={idx.label}
              value={idx.value}
              changePercent={idx.changePercent}
              stale={idx.stale}
              className="border-r"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
