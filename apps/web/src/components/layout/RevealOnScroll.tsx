'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

type RevealOnScrollProps = {
  children: ReactNode;
  className?: string;
  delay?: 'none' | 'short' | 'medium' | 'long';
};

const delayClasses = {
  none: '',
  short: 'motion-safe:delay-75',
  medium: 'motion-safe:delay-150',
  long: 'motion-safe:delay-300',
};

export function RevealOnScroll({
  children,
  className = '',
  delay = 'none',
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '160px 0px', threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={[
        'motion-safe:transition-opacity motion-safe:duration-300 motion-safe:ease-out',
        delayClasses[delay],
        isVisible ? 'motion-safe:opacity-100' : 'motion-safe:opacity-0',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
