'use client';

import { cn } from '@/components/ui/cn';
import type { DataQualityReport } from '@/lib/analysis/data-quality';

interface DataQualityBadgeProps {
  report: DataQualityReport;
}

const LEVEL_CONFIG = {
  complete: {
    label: 'Dados completos',
    bg: 'bg-[#1a3a2a] border-[#2d6a4f]',
    text: 'text-[#4edea3]',
    icon: 'check_circle',
  },
  partial: {
    label: 'Dados parciais',
    bg: 'bg-[#3a2e1a] border-[#6a5a2d]',
    text: 'text-[#ffb786]',
    icon: 'warning_amber',
  },
  insufficient: {
    label: 'Dados insuficientes',
    bg: 'bg-[#2a2a2a] border-[#4a4a4a]',
    text: 'text-on-surface-variant',
    icon: 'error_outline',
  },
};

export function DataQualityBadge({ report }: DataQualityBadgeProps) {
  const config = LEVEL_CONFIG[report.level];

  return (
    <div className="group relative inline-flex">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
          config.bg,
          config.text,
        )}
      >
        <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
        {config.label}
        <span className="ml-0.5 text-[10px] opacity-60">{report.coverageScore}%</span>
      </span>

      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface p-3 text-xs shadow-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Qualidade dos dados
        </p>

        <p className="text-on-surface">
          Cobertura: <span className="font-semibold">{report.coverageScore}%</span>
        </p>

        {report.lastUpdatedAt && (
          <p className="mt-1 text-on-surface-variant">
            Última atualização:{' '}
            {new Date(report.lastUpdatedAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}

        {report.missingFields.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Campos ausentes
            </p>
            <ul className="mt-0.5 list-inside list-disc text-on-surface">
              {report.missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {report.staleFields.length > 0 && (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Campos desatualizados
            </p>
            <ul className="mt-0.5 list-inside list-disc text-on-surface">
              {report.staleFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {report.sourceWarnings.length > 0 && (
          <div className="mt-2">
            {report.sourceWarnings.map((warning, idx) => (
              <p key={idx} className="text-warning">
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
