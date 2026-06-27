'use client';

import { useState } from 'react';

const OPTIONS = [
  { label: 'Menos de 1 ano', value: 'short' },
  { label: 'De 1 a 5 anos', value: 'medium' },
  { label: 'Mais de 5 anos', value: 'long' },
];

export default function InvestorProfileQuiz() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
      <div className="bg-gradient-to-br from-surface to-surface-muted border border-border rounded-xl p-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary mt-0.5">
            psychology
          </span>
          <div>
            <h2 className="text-xl font-semibold text-on-surface">
              Qual é o seu Perfil de Investidor?
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Descubra seu perfil de risco e receba recomendações personalizadas
            </p>
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-base font-medium text-on-surface mb-4">
            Por quanto tempo você pretende manter seus investimentos?
          </p>
          <div className="flex flex-wrap gap-3">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selected === option.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-sm text-on-surface-variant">Pergunta 1 de 5</span>
          <button
            type="button"
            className="text-sm font-medium text-primary hover:text-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!selected}
          >
            Próxima
          </button>
        </div>
      </div>
    </section>
  );
}
