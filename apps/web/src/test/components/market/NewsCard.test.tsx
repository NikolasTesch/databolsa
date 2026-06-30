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

  it('exibe source e data formatada quando tem imagem (imageUrl fornecida)', () => {
    render(<NewsCard article={ARTICLE_WITH_IMAGE} />);
    // Component no longer renders images; verify source and date are shown
    expect(screen.getByText('Bloomberg')).toBeInTheDocument();
    expect(screen.getByText(/14 de jun\. de 2026/)).toBeInTheDocument();
  });

  it('exibe source e data formatada sem imagem (imageUrl null)', () => {
    render(<NewsCard article={ARTICLE_WITHOUT_IMAGE} />);
    expect(screen.getByText('Reuters')).toBeInTheDocument();
    expect(screen.getByText(/13 de jun\. de 2026/)).toBeInTheDocument();
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
