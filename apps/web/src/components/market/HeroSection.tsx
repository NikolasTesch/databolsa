'use client';

import { Suspense } from 'react';
import { SearchBar } from '@/components/market/SearchBar';
import { QuickChip } from '@/components/market/QuickChip';

const QUICK_CHIPS = [
  { label: 'PETR4', href: '/ativos/PETR4?class=STOCK_BR' },
  { label: 'VALE3', href: '/ativos/VALE3?class=STOCK_BR' },
  { label: 'ITUB4', href: '/ativos/ITUB4?class=STOCK_BR' },
  { label: 'BBDC4', href: '/ativos/BBDC4?class=STOCK_BR' },
  { label: 'BTC', href: '/ativos/BTC?class=CRYPTO' },
  { label: 'AAPL', href: '/ativos/AAPL?class=STOCK_US' },
];

const PARTICLES: { label: string; top: string; left: string; delay: string; duration: string }[] = [
  { label: '+2.4%', top: '30%', left: '8%',  delay: '0s',    duration: '6s'  },
  { label: '-0.7%', top: '55%', left: '15%', delay: '1.8s',  duration: '7s'  },
  { label: '+1.1%', top: '25%', left: '82%', delay: '0.7s',  duration: '5.5s'},
  { label: '+3.2%', top: '60%', left: '88%', delay: '2.5s',  duration: '6.5s'},
  { label: '-1.3%', top: '40%', left: '92%', delay: '0.3s',  duration: '7.5s'},
  { label: '+0.9%', top: '70%', left: '5%',  delay: '3.1s',  duration: '6s'  },
  { label: '+4.0%', top: '20%', left: '75%', delay: '1.2s',  duration: '8s'  },
  { label: '-0.5%', top: '75%', left: '70%', delay: '2.0s',  duration: '5s'  },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-background py-20 md:pb-28 md:pt-28"
      aria-label="Busca de ativos"
    >
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="hero-orb-a absolute -left-48 -top-48 h-[540px] w-[540px] rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 9%, transparent)' }}
        />
        <div
          className="hero-orb-b absolute -right-28 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-tertiary) 7%, transparent)' }}
        />
        <div
          className="hero-orb-c absolute -bottom-20 left-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-2xl"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-tertiary-container) 8%, transparent)' }}
        />
      </div>

      {/* Floating particle numbers */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {PARTICLES.map((p) => (
          <span
            key={p.label + p.left}
            className="absolute font-mono text-[11px] font-semibold tabular-nums opacity-0"
            style={{
              top: p.top,
              left: p.left,
              color: p.label.startsWith('+') ? 'var(--color-profit)' : 'var(--color-loss)',
              animation: `float-particle ${p.duration} ease-in-out ${p.delay} infinite`,
            }}
          >
            {p.label}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-3xl px-4">
        <div className="flex flex-col items-center gap-7 text-center">

          {/* Live badge */}
          <div className="hero-animate-1 inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/70 px-4 py-1.5 text-xs text-on-surface-variant backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Mercado em tempo real · B3, Cripto, Stocks US
          </div>

          {/* Headline */}
          <h1 className="hero-animate-2 max-w-2xl text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Análise de ativos e{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-tertiary) 100%)' }}
            >
              acompanhamento de carteira
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-animate-3 max-w-md text-lg leading-relaxed text-on-surface-variant">
            B3, criptos, stocks americanos e muito mais.
          </p>

          {/* Search bar */}
          <div className="hero-animate-4 w-full">
            <Suspense fallback={null}>
              <SearchBar variant="hero" />
            </Suspense>
          </div>

          {/* Quick chips */}
          <div className="hero-animate-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-on-surface-variant">Mais buscados:</span>
            {QUICK_CHIPS.map((chip) => (
              <QuickChip key={chip.label} label={chip.label} href={chip.href} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
