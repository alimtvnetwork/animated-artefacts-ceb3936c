/**
 * Regression: slide stage four (StepsChain3DSlide) navigation.
 *
 * Reproduces the reported issue where the active step appeared to advance on
 * its own and click/keyboard input felt unresponsive. Asserts the spec-61
 * contract:
 *
 *   1. The slide does NOT auto-advance — `aria-current="step"` stays on
 *      step 1 after a generous time window with no user input.
 *   2. Clicking a card sets it as the active step.
 *   3. Keyboard ArrowRight on the focused active card moves the active step
 *      forward by exactly one (and ArrowLeft moves it back).
 *   4. The deck/controller `tryAdvance` imperative handle moves one step at
 *      a time and returns `false` only at the chain edges.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { StepsChain3DSlide } from '../slides/types/StepsChain3DSlide';
import type { FocusTimelineHandle } from '../slides/hooks/useFocusTimeline';
import type { SlideSpec } from '../slides/types';

const spec = {
  slideNumber: 4,
  slideName: 'process-3d',
  slideType: 'StepsChain3DSlide',
  transition: 'FadeIn',
  textAnimation: 'FadeIn',
  isClickReveal: false,
  showBrandHeader: false,
  showPresenterChip: false,
  content: {
    title: 'Process',
    steps: [
      { label: 'A', title: 'Step One',   description: { bullets: ['alpha'] } },
      { label: 'B', title: 'Step Two',   description: { bullets: ['beta']  } },
      { label: 'C', title: 'Step Three', description: { bullets: ['gamma'] } },
      { label: 'D', title: 'Step Four',  description: { bullets: ['delta'] } },
    ],
  },
} as unknown as SlideSpec;

function activeIndex(container: HTMLElement): number {
  const cards = container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');
  return Array.from(cards).findIndex(c => c.getAttribute('data-active') === 'true');
}

describe('StepsChain3DSlide — slide 4 navigation regression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom lacks Web Animations API — stub a no-op so passive effects mount.
    if (!(Element.prototype as unknown as { animate?: unknown }).animate) {
      (Element.prototype as unknown as { animate: () => unknown }).animate = () => {
        const done = Promise.resolve();
        return {
          ready: done, finished: done,
          cancel: () => {}, finish: () => {}, play: () => {}, pause: () => {},
          addEventListener: () => {}, removeEventListener: () => {},
          onfinish: null, oncancel: null, playState: 'finished',
        };
      };
    }
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('does NOT auto-advance the active step over time without input', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    expect(activeIndex(container)).toBe(0);

    // Simulate 10s of "no user input" — well beyond any plausible autoplay
    // interval. Spec 61 forbids any internal timer driving step changes.
    act(() => { vi.advanceTimersByTime(10_000); });

    expect(
      activeIndex(container),
      'StepsChain3DSlide must not auto-advance — step must stay on 0 without input',
    ).toBe(0);
  });

  it('advances to the clicked step on card click', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    const cards = container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');
    expect(cards.length).toBe(4);

    act(() => { fireEvent.mouseDown(cards[2], { button: 0 }); });
    expect(activeIndex(container)).toBe(2);

    act(() => { fireEvent.mouseDown(cards[0], { button: 0 }); });
    expect(activeIndex(container)).toBe(0);
  });

  it('does not render a transparent hit layer or extra step scrubber controls', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    expect(container.querySelector('[data-chain3d-hit-layer]')).toBeNull();
    expect(container.querySelector('[data-chain3d-hit-target]')).toBeNull();
    expect(container.querySelector('[data-step-scrubber]')).toBeNull();
  });

  it('advances exactly one step per ArrowRight / ArrowLeft on the focused card', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    // Arrow keys must originate from the focused card — that is the realistic
    // input path and what the (target.closest('[data-chain3d-card]')) guard
    // requires after the roving-tabindex fix.
    const card = () =>
      container.querySelector<HTMLButtonElement>('[data-chain3d-card][data-active="true"]')!;

    act(() => { fireEvent.keyDown(card(), { key: 'ArrowRight' }); });
    expect(activeIndex(container)).toBe(1);

    act(() => { fireEvent.keyDown(card(), { key: 'ArrowRight' }); });
    expect(activeIndex(container)).toBe(2);

    act(() => { fireEvent.keyDown(card(), { key: 'ArrowLeft' }); });
    expect(activeIndex(container)).toBe(1);
  });

  it('deck/controller tryAdvance walks steps one-by-one and returns false at edges', () => {
    const ref = createRef<FocusTimelineHandle>();
    const { container } = render(<StepsChain3DSlide spec={spec} ref={ref} />);
    expect(ref.current).toBeTruthy();

    // Backward at first step → false (deck should leave to previous slide).
    let consumed = false;
    act(() => { consumed = ref.current!.tryAdvance('backward'); });
    expect(consumed).toBe(false);
    expect(activeIndex(container)).toBe(0);

    // Forward through every step.
    for (let i = 1; i < 4; i++) {
      act(() => { consumed = ref.current!.tryAdvance('forward'); });
      expect(consumed, `forward at step ${i - 1} → ${i}`).toBe(true);
      expect(activeIndex(container)).toBe(i);
    }

    // At the final step → false (deck should advance to next slide).
    act(() => { consumed = ref.current!.tryAdvance('forward'); });
    expect(consumed).toBe(false);
    expect(activeIndex(container)).toBe(3);
  });
});

describe('StepsChain3DSlide — cause-tagged transition variants (spec 61 §3.6)', () => {
  let captured: Array<{ keyframes: unknown; opts: unknown }> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    captured = [];
    // Stub Element.animate to capture keyframes per call so we can inspect
    // which revolver-tilt degree the WAAPI effect picked for each cause.
    (Element.prototype as unknown as { animate: (k: unknown, o: unknown) => unknown }).animate =
      function (this: Element, keyframes: unknown, opts: unknown) {
        captured.push({ keyframes, opts });
        const done = Promise.resolve();
        return {
          ready: done, finished: done,
          cancel: () => {}, finish: () => {}, play: () => {}, pause: () => {},
          addEventListener: () => {}, removeEventListener: () => {},
          onfinish: null, oncancel: null, playState: 'finished',
        };
      };
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  function tiltDegFor(cause: 'click' | 'controller' | 'keyboard'): number {
    // The chain tilt animation is the only call whose middle keyframe encodes
    // `rotateX(Ndeg)`. Find it among the captured calls and parse N.
    for (const c of captured) {
      const kfs = c.keyframes as Array<{ transform?: string }>;
      const mid = kfs?.[1]?.transform;
      const m = mid?.match(/rotateX\((\d+)deg\)/);
      if (m) return Number(m[1]);
    }
    throw new Error(`no rotateX keyframe captured for ${cause}`);
  }

  it('click variant uses 5deg revolver tilt', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    captured = []; // discard mount-time animations
    const cards = container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');
    act(() => { fireEvent.click(cards[2]); });
    expect(tiltDegFor('click')).toBe(5);
  });

  it('keyboard variant uses 4deg revolver tilt', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    captured = [];
    const card = container.querySelector('[data-chain3d-card][data-active="true"]') as HTMLElement;
    act(() => { fireEvent.keyDown(card, { key: 'ArrowRight' }); });
    expect(tiltDegFor('keyboard')).toBe(4);
  });

  it('controller (tryAdvance) variant uses 4deg revolver tilt', () => {
    const ref = createRef<FocusTimelineHandle>();
    render(<StepsChain3DSlide spec={spec} ref={ref} />);
    captured = [];
    act(() => { ref.current!.tryAdvance('forward'); });
    expect(tiltDegFor('controller')).toBe(4);
  });
});

describe('StepsChain3DSlide — roving tabindex reconciliation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    if (!(Element.prototype as unknown as { animate?: unknown }).animate) {
      (Element.prototype as unknown as { animate: () => unknown }).animate = () => {
        const done = Promise.resolve();
        return {
          ready: done, finished: done,
          cancel: () => {}, finish: () => {}, play: () => {}, pause: () => {},
          addEventListener: () => {}, removeEventListener: () => {},
          onfinish: null, oncancel: null, playState: 'finished',
        };
      };
    }
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('always gives the active card the lone tabIndex=0', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    const cards = () => container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');
    const tabbable = () => Array.from(cards()).filter(c => c.tabIndex === 0);

    expect(tabbable().length).toBe(1);
    expect(tabbable()[0]).toBe(cards()[0]);

    act(() => { fireEvent.click(cards()[2]); });
    expect(tabbable().length).toBe(1);
    expect(tabbable()[0]).toBe(cards()[2]);
  });

  it('moves DOM focus to the new active card after a non-keyboard step change while a card is focused', async () => {
    const ref = createRef<FocusTimelineHandle>();
    const { container } = render(<StepsChain3DSlide spec={spec} ref={ref} />);
    const cards = container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');

    // User tabs into the chain — first card gets focus.
    act(() => { cards[0].focus(); });
    expect(document.activeElement).toBe(cards[0]);

    // Deck/controller drives the next step (no keyboard rove).
    act(() => { ref.current!.tryAdvance('forward'); });
    // Focus reconciliation is deferred via rAF; flush it.
    await act(async () => { await Promise.resolve(); });
    // Then the next-frame focus call.
    act(() => { vi.advanceTimersByTime(32); });

    // Focus must have followed the active step so the next ArrowRight roves
    // from the correct origin.
    expect(document.activeElement).toBe(cards[1]);
    expect(cards[1].tabIndex).toBe(0);
    expect(cards[0].tabIndex).toBe(-1);
  });

  it('ignores arrow keys whose target is not a chain card', () => {
    const { container } = render(<StepsChain3DSlide spec={spec} />);
    const list = container.querySelector('[role="list"]') as HTMLElement;
    // Synthesise a keydown bubbling from a non-card element by re-targeting:
    // fireEvent.keyDown on the list itself sets target=list, which is NOT a
    // [data-chain3d-card]; the handler must early-return and leave active=0.
    act(() => { fireEvent.keyDown(list, { key: 'ArrowRight' }); });
    const cards = container.querySelectorAll<HTMLButtonElement>('[data-chain3d-card]');
    expect(cards[0].getAttribute('data-active')).toBe('true');
    expect(cards[1].getAttribute('data-active')).toBe('false');
  });
});
