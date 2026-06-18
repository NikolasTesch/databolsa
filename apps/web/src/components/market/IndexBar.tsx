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
      {/* marquee-track: 4 cópias garantem preenchimento em monitores largos */}
      <div className="marquee-track flex items-center" aria-hidden="false">
        {[0, 1, 2, 3].flatMap((group) =>
          indices.map((idx) => (
            <IndexCard
              key={`${group}_${idx.id}`}
              label={idx.label}
              value={idx.value}
              changePercent={idx.changePercent}
              stale={idx.stale}
              className="border-r"
            />
          )),
        )}
      </div>
    </section>
  );
}
