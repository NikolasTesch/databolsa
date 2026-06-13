'use client';

import { type ReactNode } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  actions?: ReactNode;
}

export function Topbar({ onMenuClick, title, actions }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Menu button — mobile only */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-content-muted hover:bg-surface-muted hover:text-content lg:hidden"
          aria-label="Abrir menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && <h1 className="text-base font-semibold text-content lg:text-lg">{title}</h1>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
