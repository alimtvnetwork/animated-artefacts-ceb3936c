/**
 * PresenterWebcamButton — toggle for the presenter webcam overlay.
 *
 * Idle state (camera off): a 32×32 chip with a Video icon that subtly
 * "squiggles" (rotate + translate keyframe) every ~6 s so the presenter
 * notices the affordance. When the camera is on/hidden, the wiggle
 * stops and the icon swaps to VideoOff.
 *
 * Tooltip mirrors other ControllerBar chips so the chrome stays
 * consistent.
 *
 * See `mem://features/presenter-webcam-overlay`.
 */
import { Video, VideoOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePresenterWebcam } from '@/slides/components/usePresenterWebcam';

export function PresenterWebcamButton() {
  const { state, toggle } = usePresenterWebcam();
  const isOn = state.phase === 'on';
  const isHidden = state.phase === 'tray' || state.phase === 'fullscreen';
  const isRequesting = state.phase === 'requesting';
  const isDenied = state.phase === 'denied';

  const label = isRequesting
    ? 'Requesting camera…'
    : isOn
      ? 'Hide presenter camera'
      : isDenied
        ? 'Camera blocked — check site settings'
        : 'Show presenter camera';

  const icon = isRequesting ? (
    <Loader2 size={14} className="animate-spin" />
  ) : isOn || isHidden ? (
    <VideoOff size={14} />
  ) : (
    <Video size={14} />
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={isOn}
          onClick={() => {
            void toggle();
          }}
          className={`presenter-cam-button inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
            isOn
              ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.18)] text-[hsl(var(--gold))]'
              : isDenied
                ? 'border-[hsl(var(--destructive)/0.6)] bg-[hsl(var(--destructive)/0.10)] text-[hsl(var(--destructive))]'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--cream))] hover:bg-[hsl(var(--muted))]'
          }`}
          data-state={state.phase}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
