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
  return (
    <section
      className="bg-surface border-y border-border py-3 px-4"
      aria-label="Indicadores de mercado"
    >
      <div className="overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max md:justify-center">
          {indices.map((idx) => (
            <IndexCard
              key={idx.id}
              label={idx.label}
              value={idx.value}
              changePercent={idx.changePercent}
              stale={idx.stale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
