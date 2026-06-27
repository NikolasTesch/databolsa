'use client';

import { useState } from 'react';

type ProfileId = 'conservador' | 'moderado' | 'agressivo';

interface AllocationItem {
  label: string;
  percentage: number;
}

interface Profile {
  id: ProfileId;
  icon: string;
  title: string;
  risk: string;
  objective: string;
  allocation: AllocationItem[];
  explanation: string;
}

interface Tip {
  icon: string;
  title: string;
  text: string;
}

const PROFILES: Profile[] = [
  {
    id: 'conservador',
    icon: 'shield',
    title: 'Conservador',
    risk: 'Baixa',
    objective: 'Preservação de capital',
    allocation: [
      { label: 'Renda Fixa', percentage: 70 },
      { label: 'Fundos Imobiliários', percentage: 15 },
      { label: 'Ações', percentage: 10 },
      { label: 'Caixa', percentage: 5 },
    ],
    explanation:
      'Prioriza a segurança do capital acima do potencial de retorno. Indicado para quem está começando a investir ou tem objetivos de curto prazo. A maior parte dos recursos fica alocada em renda fixa (Tesouro Direto, CDBs, LCIs e LCAs), proporcionando previsibilidade e baixa volatilidade.',
  },
  {
    id: 'moderado',
    icon: 'balance',
    title: 'Moderado',
    risk: 'Média',
    objective: 'Crescimento com segurança',
    allocation: [
      { label: 'Renda Fixa', percentage: 40 },
      { label: 'Ações', percentage: 30 },
      { label: 'Fundos Imobiliários', percentage: 20 },
      { label: 'Caixa', percentage: 10 },
    ],
    explanation:
      'Equilibra segurança e rentabilidade, aceitando alguma volatilidade em troca de maior potencial de retorno. Combina renda fixa com exposição significativa a renda variável e fundos imobiliários. Ideal para quem tem horizonte de médio prazo e tolerância moderada a oscilações.',
  },
  {
    id: 'agressivo',
    icon: 'trending_up',
    title: 'Agressivo',
    risk: 'Alta',
    objective: 'Máximo retorno',
    allocation: [
      { label: 'Ações', percentage: 50 },
      { label: 'Fundos Imobiliários', percentage: 25 },
      { label: 'Renda Fixa', percentage: 15 },
      { label: 'Caixa', percentage: 10 },
    ],
    explanation:
      'Busca o máximo de rentabilidade no longo prazo, aceitando alta volatilidade e possibilidade de perdas no curto prazo. A maior parte da carteira está em renda variável (ações e FIIs). Recomendado para quem tem horizonte de investimento longo (acima de 10 anos) e perfil emocional preparado.',
  },
];

const TIPS: Tip[] = [
  {
    icon: 'book',
    title: 'Eduque-se',
    text: 'Leia livros, faça cursos, entenda o básico antes de investir. Conhecimento é o melhor investimento que você pode fazer.',
  },
  {
    icon: 'account_balance',
    title: 'Diversifique',
    text: 'Não coloque todos os ovos na mesma cesta. Distribua seus investimentos entre diferentes classes de ativos para reduzir riscos.',
  },
  {
    icon: 'show_chart',
    title: 'Invista com Regularidade',
    text: 'Aporte todo mês, independente do cenário. A consistência dos investimentos periódicos potencializa os juros compostos ao longo do tempo.',
  },
  {
    icon: 'shield',
    title: 'Gerencie Riscos',
    text: 'Defina limites de perda e mantenha reserva de emergência. Nunca invista todo o seu patrimônio em ativos de risco sem proteção.',
  },
];

function PercentBar({ label, percentage }: AllocationItem) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-on-surface-variant w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-primary/20 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-mono font-medium text-on-surface w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

function ProfileCard({
  profile,
  isSelected,
  onSelect,
}: {
  profile: Profile;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`bg-surface border rounded-xl p-6 cursor-pointer transition-all text-left w-full ${
        isSelected
          ? 'border-primary ring-1 ring-primary'
          : 'border-border hover:border-primary/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="material-symbols-outlined text-[36px] text-primary flex-shrink-0">
          {profile.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-on-surface">{profile.title}</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Risco: {profile.risk} · {profile.objective}
          </p>
        </div>
      </div>

      {/* Allocation (always visible, but more prominent when selected) */}
      <div className={`space-y-2 transition-all ${!isSelected ? 'opacity-70' : 'opacity-100'}`}>
        <p className="text-xs font-medium text-on-surface-variant mb-2">
          Alocação sugerida:
        </p>
        {profile.allocation.map((item) => (
          <PercentBar key={item.label} label={item.label} percentage={item.percentage} />
        ))}
      </div>
    </button>
  );
}

export default function BeginnerGuide() {
  const [selected, setSelected] = useState<ProfileId | null>(null);

  const selectedProfile = PROFILES.find((p) => p.id === selected);

  return (
    <div className="space-y-10">
      {/* ─── Title ─────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[28px] text-primary mt-0.5 flex-shrink-0">
          school
        </span>
        <div>
          <h2 className="text-xl font-semibold text-on-surface">Guia Iniciante</h2>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Descubra qual perfil de investidor combina com você e veja sugestões de alocação
            de carteira baseadas nos princípios de diversificação da ANBIMA.
          </p>
        </div>
      </div>

      {/* ─── Section 1: Profile Cards ──────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-on-surface mb-4">Qual é o seu perfil?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROFILES.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isSelected={selected === profile.id}
              onSelect={() => setSelected(profile.id === selected ? null : profile.id)}
            />
          ))}
        </div>
      </section>

      {/* ─── Section 2: Profile Explanations ──────────────── */}
      {(selected === null || selectedProfile) && (
        <section>
          <h3 className="text-base font-semibold text-on-surface mb-4">Explicação dos Perfis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROFILES.map((profile) => (
              <div
                key={profile.id}
                className={`glass-panel p-6 rounded-lg transition-all ${
                  selected === profile.id
                    ? 'ring-1 ring-primary'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[24px] text-primary">
                    {profile.icon}
                  </span>
                  <h4 className="text-sm font-semibold text-on-surface">{profile.title}</h4>
                </div>
                <div className="text-xs text-on-surface-variant mb-2">
                  Risco: <span className="font-medium text-on-surface">{profile.risk}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {profile.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Section 3: Tips ───────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-on-surface mb-4">Dicas para Iniciantes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              className="bg-surface border border-border rounded-lg p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[28px] text-primary flex-shrink-0 mt-0.5">
                  {tip.icon}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface mb-1">{tip.title}</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{tip.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
