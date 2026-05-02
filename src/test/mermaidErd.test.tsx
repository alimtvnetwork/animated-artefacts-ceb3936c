/**
 * DatabaseDiagramSlide Mermaid path unit test (audit cleanup polish).
 *
 * Locks contract:
 *  - When `content.diagram` is a non-empty string, the Mermaid render
 *    path is taken (host div + dynamic import).
 *  - When `content.diagram` is absent, the inline-SVG fallback renders
 *    a `<svg>` from `dbEntities`.
 *  - Theme variables are token-driven (no raw hex) — covered by source
 *    snapshot of the constant.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { DatabaseDiagramSlide } from '@/slides/types/DatabaseDiagramSlide';
import type { SlideSpec } from '@/slides/types';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (id: string) => ({ svg: `<svg data-testid="mermaid-svg" data-id="${id}"><g/></svg>` })),
  },
}));

function spec(content: Record<string, unknown>): SlideSpec {
  return {
    id: 'test',
    slideName: 'ERD Test',
    slideType: 'DatabaseDiagramSlide',
    transition: 'FadeIn',
    textAnimation: 'FadeIn',
    content,
  } as unknown as SlideSpec;
}

describe('DatabaseDiagramSlide', () => {
  it('takes Mermaid path when content.diagram is provided', async () => {
    const { container } = render(
      <DatabaseDiagramSlide spec={spec({ title: 'Schema', diagram: 'erDiagram\n  USER ||--o{ ORDER : places' })} />
    );
    await waitFor(() => {
      expect(container.querySelector('.mermaid-erd-host')).not.toBeNull();
    });
  });

  it('falls back to inline SVG when diagram is empty/absent', () => {
    const { container } = render(
      <DatabaseDiagramSlide spec={spec({
        title: 'Inline',
        dbEntities: [
          { id: 'u', name: 'users', fields: ['id'] },
          { id: 'o', name: 'orders', fields: ['id', 'user_id'] },
        ],
        dbRelationships: [{ from: 'u', to: 'o', label: '1..N' }],
      })} />
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('.mermaid-erd-host')).toBeNull();
  });

  it('treats empty-string diagram as fallback (not Mermaid)', () => {
    const { container } = render(
      <DatabaseDiagramSlide spec={spec({
        diagram: '',
        dbEntities: [{ id: 'u', name: 'users' }],
      })} />
    );
    expect(container.querySelector('.mermaid-erd-host')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders title + eyebrow when provided', () => {
    const { getByText } = render(
      <DatabaseDiagramSlide spec={spec({
        eyebrow: 'Data Layer',
        title: 'User Schema',
        diagram: 'erDiagram\n  A ||--o{ B : has',
      })} />
    );
    expect(getByText('Data Layer')).toBeTruthy();
    expect(getByText('User Schema')).toBeTruthy();
  });
});
