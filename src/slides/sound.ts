/**
 * Slide sound system.
 *
 * Spec of record: `spec/slides/21-sound-system.md`. Authors opt-in per
 * slide via `SlideSpec.sound`. The runtime is a singleton — slides call
 * `slideSound.play(kind, volume)` directly from effects / handlers.
 *
 * Asset library (locked 2026-04-27 — see also `21-sound-system.md`):
 *
 *   • `whoosh`    → `/sounds/fade_swoosh_v2.mp3`  (350ms, gentle, -3dB)
 *   • `click`     → `/sounds/click.mp3`           (~2s mechanical click)
 *   • `fadeClick` → `/sounds/click.mp3`           (same source, low volume + long fade envelope — soft tap precursor)
 *   • `zoom`      → `/sounds/zoom.mp3`            (~2.8s rising whoosh, full)
 *   • `fadeZoom`  → `/sounds/fade_zoom.mp3`       (~2.8s, -8dB, 400ms in / 700ms out)
 *
 * On every play we ALSO apply a runtime gain envelope (60ms attack,
 * 120ms release tail) so repeated plays still feel natural and never
 * click. If the asset fails to decode the manager falls back to the
 * procedural synth (when one exists for that kind).
 *
 * Same-kind debouncing: re-triggering the same kind within `dedupeMs`
 * (default 60ms) is a no-op. Prevents double-fires from React effects /
 * onClick chains. Cross-kind plays are never blocked.
 *
 * Autoplay policy: the AudioContext is created lazily and resumed on the
 * first `pointerdown` or `keydown` anywhere on the document. Until that
 * gesture happens, `play()` is a silent no-op. This is browser-mandated.
 */
import { getAudioUrl } from './assetRegistry';
import { reportBrokenAsset } from './brokenAssetReport';


export type SoundKind = 'whoosh' | 'click' | 'fadeClick' | 'pop' | 'zoom' | 'fadeZoom';
export type SoundTrigger = 'enter' | 'focus' | 'click';

const MUTE_STORAGE_KEY = 'slide-sound-muted';

/** Max time (ms) we'll wait for a not-yet-loaded asset buffer before
 *  abandoning the cue. Long enough to cover a slow first decode (the
 *  prefetch + unlock dance usually finishes inside ~400ms), short enough
 *  that the audio doesn't fire wildly out of sync with what the audience
 *  is watching. The cinematic cues (whoosh / zoom / fadeZoom) wait this
 *  long instead of falling back to the procedural synth, which sounds
 *  noticeably different and was the source of the "first whoosh sounds
 *  bad" bug on the StepTimeline slide. */
const READY_WAIT_MS = 800;

interface AssetSpec {
  url: string;
  /** Default volume if play() doesn't override. */
  volume: number;
  /** Runtime fade-in seconds applied on top of the asset's baked envelope. */
  attack: number;
  /** Runtime fade-out seconds. */
  release: number;
  /**
   * If true, a new play() of the same kind ducks the previously playing
   * source instead of letting both ring at once. Recommended for whoosh /
   * zoom because rapid replays can pile up.
   */
  ducksPrevious: boolean;
}

const ASSETS: Record<Exclude<SoundKind, 'pop'>, AssetSpec> = {
  whoosh: {
    // v0.121 — switched from `fade_swoosh_v2.mp3` to `fade_swoosh_v3.mp3`,
    // a derivative bounce processed in ffmpeg with +20% gain, a +1.5dB low-
    // shelf at 180Hz for a touch more body, a soft 2.5:1 compressor and a
    // brick-wall limiter at 0.97 so peaks stay safe. Per the user request
    // for "10–20% louder" — perceptually ~+1.8dB without clipping.
    url: '/sounds/fade_swoosh_v3.mp3',
    volume: 0.54, // was 0.45 — bumped 20% to match the louder source
    attack: 0.06,
    release: 0.12,
    ducksPrevious: true,
  },
  click: {
    url: '/sounds/click.mp3',
    volume: 0.18, // soft mechanical click — kept low per user; was 0.35 (too loud on dot-pagination jumps)
    attack: 0.005,
    release: 0.06,
    ducksPrevious: false,
  },
  /** Reusable "fade-click" cue — same click.mp3 source, but with a much
   *  lower volume and a longer attack/release envelope so it feels like
   *  a soft, faded tap rather than a hard mechanical click. Use this for
   *  every interactive press on the slide surface (capsules, dots, etc.)
   *  where the click is a precursor to a bigger cue (whoosh, zoom). The
   *  runtime envelope literally fades the same MP3 in and out, so we get
   *  a "fade_click" feel without shipping a second asset. */
  fadeClick: {
    url: '/sounds/click.mp3',
    volume: 0.09,
    attack: 0.05,
    release: 0.18,
    ducksPrevious: false,
  },
  zoom: {
    url: '/sounds/zoom.mp3',
    volume: 0.55,
    attack: 0.04,
    release: 0.18,
    ducksPrevious: true,
  },
  fadeZoom: {
    url: '/sounds/fade_zoom.mp3',
    volume: 0.4,
    attack: 0.04,
    release: 0.2,
    ducksPrevious: true,
  },
};

class SlideSoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private unlocked = false;
  /** Decoded buffers keyed by SoundKind. */
  private buffers = new Map<string, AudioBuffer>();
  /** In-flight loads, deduplicated. */
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  /** Per-kind active source so a repeat can fade the previous one. */
  private active = new Map<string, { src: AudioBufferSourceNode; gain: GainNode }>();
  /** Last-play timestamps for same-kind debouncing. */
  private lastPlay = new Map<string, number>();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.muted = window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
      } catch {
        // localStorage may be blocked (private mode); fall back to unmuted.
      }
      // Kick off asset fetch+decode IMMEDIATELY at module load, well before
      // the user gesture that unlocks playback. We can't decode until we
      // have an AudioContext, but we CAN at least fetch the bytes — which
      // is the slow part. Once unlocked we decode from the cached bytes
      // (if needed) or skip straight to play. This eliminates the
      // "first whoosh sounds like the synth" bug: by the time the first
      // step slide arms its focus cue (~3s after navigation), the MP3 is
      // ready and we never need the procedural fallback.
      void this.prefetchAllAssets();

      const unlock = () => {
        this.unlocked = true;
        if (this.ctx && this.ctx.state === 'suspended') {
          void this.ctx.resume();
        }
        // Belt + braces — also pre-decode every asset the moment we have a
        // real user gesture, in case the prefetch above hadn't finished.
        for (const kind of Object.keys(ASSETS) as Array<keyof typeof ASSETS>) {
          void this.loadAsset(kind);
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  /** Cached raw bytes for each asset, populated by `prefetchAllAssets`
   *  before we have an AudioContext. Lets us decode the moment the
   *  context exists without paying a second network round-trip. */
  private prefetched = new Map<string, ArrayBuffer>();

  private async prefetchAllAssets(): Promise<void> {
    if (typeof fetch === 'undefined') return;
    await Promise.all(
      (Object.keys(ASSETS) as Array<keyof typeof ASSETS>).map(async (kind) => {
        if (this.prefetched.has(kind)) return;
        try {
          const res = await fetch(getAudioUrl(kind) ?? ASSETS[kind].url);
          if (!res.ok) return;
          this.prefetched.set(kind, await res.arrayBuffer());
        } catch {
          /* network failure — synth fallback (where it exists) will cover */
        }
      }),
    );
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
      } catch {
        /* ignore */
      }
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(kind: SoundKind, volume?: number, opts?: { dedupeMs?: number }): void {
    if (this.muted) return;
    if (typeof window === 'undefined') return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') return;

    // Same-kind debounce — prevents React strict-mode double-fires and
    // accidental double-handlers from stacking the same cue.
    const dedupeMs = opts?.dedupeMs ?? 60;
    const now = performance.now();
    const last = this.lastPlay.get(kind) ?? 0;
    if (now - last < dedupeMs) return;
    this.lastPlay.set(kind, now);

    if (kind === 'pop') {
      this.synthPop(ctx, clamp(volume ?? 0.45, 0, 1));
      return;
    }

    const asset = ASSETS[kind];
    const v = clamp(volume ?? asset.volume, 0, 1);
    const buffer = this.buffers.get(kind);
    if (buffer) {
      this.playBuffer(kind, ctx, buffer, asset, v);
      return;
    }
    // Buffer not ready. We deliberately do NOT fall back to the procedural
    // synth for the cinematic cues (whoosh / zoom / fadeZoom) because the
    // synth sounds noticeably different from the MP3 — using it for the
    // first play of the deck makes the very first transition sound "off".
    // Instead, kick off the load and play the real buffer the moment it
    // lands, as long as that's within `READY_WAIT_MS` of the call. Past
    // that we drop the cue rather than fire stale audio.
    void this.loadAsset(kind).then((buf) => {
      if (!buf) {
        // Network/decode failed — only `click` / `fadeClick` fall back to
        // synth (the mechanical click is fine), the rest stay silent.
        if (kind === 'click' || kind === 'fadeClick') this.synthClick(ctx, v);
        return;
      }
      const ageMs = performance.now() - now;
      if (ageMs > READY_WAIT_MS) return;
      // Only play if the asset is still relevant (no newer same-kind play
      // happened while we were waiting). lastPlay was set above, so if
      // anyone called play() again it would have updated; compare.
      const newest = this.lastPlay.get(kind) ?? 0;
      if (newest !== now) return;
      this.playBuffer(kind, ctx, buf, asset, v);
    });
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor: typeof AudioContext | undefined =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      if (this.unlocked && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Fetch (or reuse the constructor-time prefetch) + decode a registered
   *  asset. Cached after first success. The prefetch path means decoding
   *  happens with zero network latency the moment we have an AudioContext. */
  private async loadAsset(kind: keyof typeof ASSETS): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(kind);
    if (cached) return cached;
    const inflight = this.loading.get(kind);
    if (inflight) return inflight;
    const ctx = this.ensureContext();
    if (!ctx) return null;
    const promise = (async () => {
      const url = getAudioUrl(kind) ?? ASSETS[kind].url;
      try {
        // Prefer the prefetched bytes from constructor — the network has
        // almost certainly finished by the time the user gestures.
        let arr = this.prefetched.get(kind);
        if (!arr) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${kind} fetch ${res.status}`);
          arr = await res.arrayBuffer();
        }
        const buf = await ctx.decodeAudioData(arr.slice(0));
        this.buffers.set(kind, buf);
        // Free the prefetched copy once decoded — keeping both wastes RAM.
        this.prefetched.delete(kind);
        return buf;
      } catch (err) {
        // v0.173 — surface decode + fetch failures into the broken-asset
        // overlay so the user can see WHY a slide was silent. Dedup is
        // handled inside `reportBrokenAsset`, so a recurring failure for
        // the same cue won't spam the card on every play attempt.
        reportBrokenAsset({
          kind: 'audio',
          slug: kind,
          reason: 'audio-decode-failed',
          url,
          detail: err instanceof Error ? err.message : 'decode failed',
        });
        return null;
      } finally {
        this.loading.delete(kind);
      }
    })();
    this.loading.set(kind, promise);
    return promise;
  }

  private playBuffer(
    kind: string,
    ctx: AudioContext,
    buf: AudioBuffer,
    asset: AssetSpec,
    v: number,
  ): void {
    const now = ctx.currentTime;

    if (asset.ducksPrevious) {
      const prev = this.active.get(kind);
      if (prev) {
        try {
          prev.gain.gain.cancelScheduledValues(now);
          prev.gain.gain.setValueAtTime(prev.gain.gain.value, now);
          prev.gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
          prev.src.stop(now + 0.06);
        } catch {
          /* ignore — prev may already be stopped */
        }
        this.active.delete(kind);
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    const dur = buf.duration;
    const release = Math.min(asset.release, dur * 0.4);
    const attack = Math.min(asset.attack, dur * 0.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v, now + attack);
    gain.gain.setValueAtTime(v, now + Math.max(attack, dur - release));
    gain.gain.linearRampToValueAtTime(0, now + dur);

    src.connect(gain).connect(this.master ?? ctx.destination);
    src.start(now);
    src.stop(now + dur + 0.02);

    this.active.set(kind, { src, gain });
    src.onended = () => {
      const cur = this.active.get(kind);
      if (cur?.src === src) this.active.delete(kind);
    };
  }

  /** Procedural fallback used only when the whoosh MP3 hasn't loaded yet. */
  private synthWhoosh(ctx: AudioContext, v: number): void {
    const now = ctx.currentTime;
    const dur = 0.28;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(v, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(filter).connect(gain).connect(this.master ?? ctx.destination);
    noise.start(now);
    noise.stop(now + dur + 0.02);
  }

  private synthClick(ctx: AudioContext, v: number): void {
    const now = ctx.currentTime;
    const dur = 0.06;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(v, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.master ?? ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  private synthPop(ctx: AudioContext, v: number): void {
    const now = ctx.currentTime;
    const dur = 0.12;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(v, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.master ?? ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export const slideSound = new SlideSoundManager();
