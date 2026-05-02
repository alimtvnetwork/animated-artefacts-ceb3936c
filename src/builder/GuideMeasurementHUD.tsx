/**
 * GuideMeasurementHUD — compact live readout of the three alignment-guide
 * x-positions (Logo / Body / Rail) measured inside the SlidePreview's
 * unscaled 1920px stage, plus a relative "last updated" timestamp.
 *
 * Lives in the Step editor (above the snap controls) so authors can
 * sanity-check why a snap button is producing a given px before clicking.
 *
 * When the alignment overlay is OFF (positions are null), the HUD renders
 * a dim "guides off" state and a hint pointing at /settings.
 *
 * See spec/slides/40-step-snap-to-guides.md and spec/slides/50-...-extraction.md.
 */
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  useGuidePositions,
  useGuidePositionsUpdatedAt,
} from '../slides/guidePositions';

function formatRelative(ts: number | null, now: number): string {
  if (ts === null) return 'never';
  const seconds = Math.max(0, Math.round((now - ts) / 1000));
  if (seconds < 1) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function GuideMeasurementHUD() {
  const guides = useGuidePositions();
  const updatedAt = useGuidePositionsUpdatedAt();
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second so the "Xs ago" label stays fresh. Cheap; the
  // component is only mounted while the Step editor is open.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const guidesLive =
    guides.logoX !== null || guides.bodyX !== null || guides.railX !== null;

  const rows: ReadonlyArray<{ key: string; tone: string; value: number | null }> = [
    { key: 'Logo', tone: 'text-gold',  value: guides.logoX },
    { key: 'Body', tone: 'text-cream', value: guides.bodyX },
    { key: 'Rail', tone: 'text-ember', value: guides.railX },
  ];

  return (
    <div className="space-y-2 p-2 border border-border/60 rounded-md bg-surface-1/40">
      <div className="flex items-center gap-2">
        <Activity
          className={`h-3 w-3 ${guidesLive ? 'text-gold animate-pulse' : 'text-muted-foreground'}`}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/80">
          Live guide HUD
        </p>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {formatRelative(updatedAt, now)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {rows.map(r => (
          <div
            key={r.key}
            className="flex flex-col items-center justify-center py-1.5 rounded-md border border-border/50 bg-background/30"
          >
            <span className={`text-[10px] uppercase tracking-wider ${r.tone}/80`}>
              {r.key}
            </span>
            <span className="text-[12px] font-mono text-foreground tabular-nums">
              {r.value !== null ? `${Math.round(r.value)}px` : '—'}
            </span>
          </div>
        ))}
      </div>

      {!guidesLive ? (
        <p className="text-[10px] text-ember/80 leading-relaxed">
          Alignment guide is OFF — toggle it in <span className="font-mono">/settings</span>{' '}
          to capture live x-values from the SlidePreview overlay.
        </p>
      ) : null}
    </div>
  );
}
