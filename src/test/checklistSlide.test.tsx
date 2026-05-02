import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { ChecklistSlide } from '@/slides/types/ChecklistSlide';
import { SLIDE_FIXTURES } from '@/slides/fixtures';
import type { SlideSpec } from '@/slides/types';

const baseSpec = SLIDE_FIXTURES.ChecklistSlide.valid as SlideSpec;

function renderSlide(spec: SlideSpec = baseSpec) {
  return render(<ChecklistSlide spec={spec} />);
}

describe('ChecklistSlide — interaction integrity', () => {
  it('renders one role=checkbox per item, initially unchecked', () => {
    renderSlide();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);
    boxes.forEach((b) => expect(b).toHaveAttribute('aria-checked', 'false'));
  });

  it('does not nest interactive elements (no <button> inside <button>)', () => {
    const { container } = renderSlide();
    container.querySelectorAll('button').forEach((btn) => {
      expect(btn.querySelector('button')).toBeNull();
    });
  });

  it('toggles done on click and updates progressbar', () => {
    renderSlide();
    const [first] = screen.getAllByRole('checkbox');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'true');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-checked', 'false');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('toggles done with Space and Enter via keyboard', () => {
    renderSlide();
    const boxes = screen.getAllByRole('checkbox');
    fireEvent.keyDown(boxes[0], { key: 'Enter' });
    expect(boxes[0]).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(boxes[0], { key: ' ' });
    expect(boxes[0]).toHaveAttribute('aria-checked', 'false');
  });

  it('expands and collapses item detail via chevron button', () => {
    renderSlide();
    // Item 2 has detail in fixture.
    const expandBtn = screen.getByRole('button', { name: /Expand detail for Slide deck rehearsed/i });
    expect(screen.queryByText('Run-through with timer')).toBeNull();
    fireEvent.click(expandBtn);
    expect(screen.getByText('Run-through with timer')).toBeInTheDocument();
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(expandBtn);
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('chevron click does NOT toggle the row checkbox', () => {
    renderSlide();
    const expandBtn = screen.getByRole('button', { name: /Expand detail for Slide deck rehearsed/i });
    const checkbox = screen.getAllByRole('checkbox')[1];
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(expandBtn);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('Alt+Enter on row toggles detail expansion (keyboard reveal)', () => {
    renderSlide();
    const checkbox = screen.getAllByRole('checkbox')[1];
    const expandBtn = screen.getByRole('button', { name: /Expand detail for Slide deck rehearsed/i });
    fireEvent.keyDown(checkbox, { key: 'Enter', altKey: true });
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('arrow keys move focus between rows; Home/End jump to ends', () => {
    renderSlide();
    const boxes = screen.getAllByRole('checkbox');
    boxes[0].focus();
    fireEvent.keyDown(boxes[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(boxes[1]);
    fireEvent.keyDown(boxes[1], { key: 'End' });
    expect(document.activeElement).toBe(boxes[2]);
    fireEvent.keyDown(boxes[2], { key: 'Home' });
    expect(document.activeElement).toBe(boxes[0]);
    fireEvent.keyDown(boxes[0], { key: 'ArrowUp' });
    // No-op at top; focus stays on first.
    expect(document.activeElement).toBe(boxes[0]);
  });

  it('uses roving tabindex (only one row is tabbable at a time)', () => {
    renderSlide();
    const boxes = screen.getAllByRole('checkbox');
    const tabbable = boxes.filter((b) => b.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('resets state when remounted (simulates slide navigation)', () => {
    const { unmount } = renderSlide();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    unmount();
    renderSlide();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    screen.getAllByRole('checkbox').forEach((b) =>
      expect(b).toHaveAttribute('aria-checked', 'false'),
    );
  });

  it('progressbar reaches 100% when all items are confirmed', () => {
    renderSlide();
    screen.getAllByRole('checkbox').forEach((b) => fireEvent.click(b));
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(within(bar).getByText('3 / 3')).toBeInTheDocument();
  });
});
