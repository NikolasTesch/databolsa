'use client';

import { type ReactNode } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  actions?: ReactNode;
}

export function Topbar({ onMenuClick, title, actions }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-margin-mobile md:px-margin-desktop">
      <div className="flex items-center gap-3">
        {/* Menu button — mobile only */}
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center rounded-lg p-2 text-on-surface-variant hover:text-on-surface lg:hidden"
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>
        {title && <h1 className="text-base font-semibold text-on-surface lg:text-lg">{title}</h1>}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
