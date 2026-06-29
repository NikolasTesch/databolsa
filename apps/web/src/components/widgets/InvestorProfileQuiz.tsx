'use client';

import { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: { label: string; value: number }[];
}

interface ProfileResult {
  label: string;
  icon: string;
  description: string;
  color: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Por quanto tempo você pretende manter seus investimentos?',
    options: [
      { label: 'Menos de 1 ano', value: 1 },
      { label: 'De 1 a 5 anos', value: 2 },
      { label: 'Mais de 5 anos', value: 3 },
    ],
  },
  {
    id: 2,
    question: 'Qual seria sua reação se seus investimentos caíssem 20% em um mês?',
    options: [
      { label: 'Venderia tudo para evitar mais perdas', value: 1 },
      { label: 'Venderia uma parte', value: 2 },
      { label: 'Manteria e esperaria recuperar', value: 3 },
      { label: 'Compraria mais para aproveitar a queda', value: 4 },
    ],
  },
  {
    id: 3,
    question: 'Com qual tipo de investimento você se sente mais confortável?',
    options: [
      { label: 'Poupança / CDB / Tesouro Direto', value: 1 },
      { label: 'Fundos multimercado / Debêntures', value: 2 },
      { label: 'Ações de grandes empresas (blue chips)', value: 3 },
      { label: 'Criptomoedas / Derivativos / Small caps', value: 4 },
    ],
  },
  {
    id: 4,
    question: 'Qual é seu nível de conhecimento sobre o mercado financeiro?',
    options: [
      { label: 'Não tenho conhecimento', value: 1 },
      { label: 'Conhecimento básico', value: 2 },
      { label: 'Conhecimento intermediário', value: 3 },
      { label: 'Conhecimento avançado', value: 4 },
    ],
  },
  {
    id: 5,
    question: 'Qual é seu principal objetivo financeiro com seus investimentos?',
    options: [
      { label: 'Preservar o patrimônio, segurança acima de tudo', value: 1 },
      { label: 'Complementar renda com baixo risco', value: 2 },
      { label: 'Crescimento do patrimônio no médio prazo', value: 3 },
      { label: 'Máximo retorno possível, assumindo altos riscos', value: 4 },
    ],
  },
];

const PROFILES: Record<string, ProfileResult> = {
  Conservador: {
    label: 'Conservador',
    icon: 'shield',
    description:
      'Você prioriza a segurança do seu capital e prefere investimentos de baixo risco, mesmo que o retorno seja menor. Seu perfil é adequado para renda fixa, Tesouro Direto e fundos conservadores. A preservação do patrimônio é sua principal preocupação.',
    color: 'text-secondary',
  },
  Moderado: {
    label: 'Moderado',
    icon: 'balance',
    description:
      'Você busca um equilíbrio entre segurança e rentabilidade. Aceita certo risco em busca de retornos melhores, mas sem abrir mão de uma base sólida. Uma carteira diversificada entre renda fixa e variável é ideal para você.',
    color: 'text-primary',
  },
  Agressivo: {
    label: 'Agressivo',
    icon: 'trending_up',
    description:
      'Você tem alta tolerância a risco e busca o máximo retorno possível para seus investimentos. Não se importa com volatilidade de curto prazo e está disposto a investir em ativos de maior risco como ações, derivativos e criptomoedas.',
    color: 'text-tertiary',
  },
};

function getProfile(score: number): ProfileResult {
  if (score <= 8) return PROFILES.Conservador;
  if (score <= 13) return PROFILES.Moderado;
  return PROFILES.Agressivo;
}

export default function InvestorProfileQuiz() {
  const [step, setStep] = useState<'quiz' | 'result'>('quiz');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const question = QUESTIONS[currentQuestion];

  const handleNext = () => {
    if (selectedOption === null) return;
    setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setStep('result');
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedOption(answers[QUESTIONS[currentQuestion - 1].id] ?? null);
    }
  };

  const restart = () => {
    setStep('quiz');
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedOption(null);
  };

  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const profile = getProfile(totalScore);
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  if (step === 'result') {
    return (
      <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
        <div className="bg-gradient-to-br from-surface to-surface-muted border border-border rounded-xl p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                profile.label === 'Conservador'
                  ? 'bg-secondary/10'
                  : profile.label === 'Moderado'
                    ? 'bg-primary/10'
                    : 'bg-tertiary/10'
              }`}
            >
              <span className={`material-symbols-outlined text-4xl ${profile.color}`}>
                {profile.icon}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-on-surface mb-1">
              Seu perfil de investidor
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-semibold ${
                profile.label === 'Conservador'
                  ? 'bg-secondary/10 text-secondary'
                  : profile.label === 'Moderado'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-tertiary/10 text-tertiary'
              }`}
            >
              {profile.label}
            </span>

            <p className="text-sm text-on-surface-variant mt-4 max-w-lg leading-relaxed">
              {profile.description}
            </p>

            <div className="flex items-center gap-2 mt-6 text-xs text-on-surface-variant">
              <span>Pontuação: {totalScore}/{QUESTIONS.length * 4}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>
                {totalScore <= 8
                  ? '5-8 Conservador'
                  : totalScore <= 13
                    ? '9-13 Moderado'
                    : '14-20 Agressivo'}
              </span>
            </div>

            <button
              onClick={restart}
              className="mt-6 rounded-lg bg-surface border border-border px-5 py-2 text-sm font-medium text-on-surface hover:bg-surface-muted transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              Refazer teste
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-max-width px-margin-mobile md:px-margin-desktop py-12">
      <div className="bg-gradient-to-br from-surface to-surface-muted border border-border rounded-xl p-8">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary mt-0.5">psychology</span>
          <div>
            <h2 className="text-xl font-semibold text-on-surface">Qual é o seu Perfil de Investidor?</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Descubra seu perfil de risco e receba recomendações personalizadas
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-surface-container-low rounded-full mb-6">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div key={question.id} className="animate-[fade-in-up_0.35s_ease-out]">
          <p className="text-base font-medium text-on-surface mb-5">{question.question}</p>
          <div className="flex flex-col gap-2">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedOption(option.value)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            {currentQuestion > 0 && (
              <button
                onClick={handlePrev}
                className="text-sm text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Anterior
              </button>
            )}
            <span className="text-xs text-on-surface-variant">
              Pergunta {currentQuestion + 1} de {QUESTIONS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedOption === null}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {currentQuestion < QUESTIONS.length - 1 ? 'Próxima' : 'Ver resultado'}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {QUESTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx <= currentQuestion ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
