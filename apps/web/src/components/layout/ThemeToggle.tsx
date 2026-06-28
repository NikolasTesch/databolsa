'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true); // default dark

  useEffect(() => {
    // Verificar estado inicial no mount
    const root = document.documentElement;
    const hasDarkClass = root.classList.contains('dark');
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !isDark;
    
    if (nextDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDark(nextDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-surface/40 text-on-surface-variant hover:bg-surface-muted hover:text-on-surface transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-300 hover:rotate-12">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
