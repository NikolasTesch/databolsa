/**
 * SPEC-0016 — TC-03
 * Tests for NewsCard component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewsCard } from '@/components/market/NewsCard';
import type { NewsArticle } from '@/lib/news/news.service';

const ARTICLE_WITH_IMAGE: NewsArticle = {
  id: '1',
  title: 'Petrobras anuncia dividendos extraordinários',
  summary: 'O conselho aprovou distribuição de proventos adicionais.',
  source: 'Bloomberg',
  url: 'https://bloomberg.com/petr4',
  imageUrl: 'https://example.com/img.jpg',
  publishedAt: '2026-06-14T10:00:00.000Z',
};

const ARTICLE_WITHOUT_IMAGE: NewsArticle = {
  id: '2',
  title: 'Selic mantida em reunião do Copom',
  summary: 'O Banco Central decidiu manter a taxa Selic inalterada.',
  source: 'Reuters',
  url: 'https://reuters.com/selic',
  imageUrl: null,
  publishedAt: '2026-06-13T08:00:00.000Z',
};

describe('TC-03 — NewsCard Component', () => {
  it('renderiza título do artigo', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    expect(screen.getByText('Petrobras anuncia dividendos extraordinários')).toBeInTheDocument();
  });

  it('renderiza o resumo do artigo', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    expect(screen.getByText('O conselho aprovou distribuição de proventos adicionais.')).toBeInTheDocument();
  });

  it('renderiza a fonte do artigo', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
  });

  it('link abre em nova aba com rel="noopener noreferrer"', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('href', 'https://bloomberg.com/petr4');
  });

  it('exibe imagem quando imageUrl é fornecida', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    const img = screen.getByRole('presentation', { hidden: true }) as HTMLImageElement;
    // img has aria-hidden="true" so we query it differently
    const imgs = document.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].src).toContain('example.com/img.jpg');
  });

  it('exibe placeholder SVG data URI quando imageUrl é null', () => {
    render(<NewsCard article={ARTICLE_WITHOUT_IMAGE} />);
    const imgs = document.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].src).toContain('data:image/svg+xml');
  });

  it('tem aria-label com o título do artigo', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Petrobras anuncia dividendos extraordinários');
  });

  it('renderiza artigo sem imagem sem quebrar layout (imageUrl null)', () => {
    const { container } = render(<NewsCard article={ARTICLE_WITHOUT_IMAGE} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Selic mantida em reunião do Copom')).toBeInTheDocument();
  });
});
