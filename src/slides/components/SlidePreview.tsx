import { useRef } from 'react';
import type { SlideSpec } from '../types';
import { TitleSlide } from '../types/TitleSlide';
import { KeywordSlide } from '../types/KeywordSlide';
import { CapsuleListSlide } from '../types/CapsuleListSlide';
import { StepTimelineSlide } from '../types/StepTimelineSlide';
import { FocusTimelineSlide } from '../types/FocusTimelineSlide';
import { QrMeetingSlide } from '../types/QrMeetingSlide';
import { ImageSlide } from '../types/ImageSlide';
import { SectionDividerSlide } from '../types/SectionDividerSlide';
import { MetricGridSlide } from '../types/MetricGridSlide';
import { TableSlide } from '../types/TableSlide';
import { CodeBlockSlide } from '../types/CodeBlockSlide';
import { BoxDiagramSlide } from '../types/BoxDiagramSlide';
import { LayoutSlide } from '../types/LayoutSlide';
import { BlastRadiusSlide } from '../types/BlastRadiusSlide';
import { SessionOutlineSlide } from '../types/SessionOutlineSlide';
import { BrandHeader } from './BrandHeader';
import { SlidePreviewAlignmentOverlay } from './SlidePreviewAlignmentOverlay';

const SLIDE_W = 1920;
const SLIDE_H = 1080;

function renderBody(slide: SlideSpec) {
  switch (slide.slideType) {
    case 'TitleSlide':         return <TitleSlide spec={slide} />;
    case 'KeywordSlide':       return <KeywordSlide spec={slide} />;
    case 'CapsuleListSlide':   return <CapsuleListSlide spec={slide} onCapsuleClickReveal={() => {}} />;
    case 'StepTimelineSlide':  return <StepTimelineSlide spec={slide} />;
    // FocusTimelineSlide accepts a forwarded ref but the preview never
    // navigates internally, so we omit it — the slide simply renders its
    // initial focus state.
    case 'FocusTimelineSlide': return <FocusTimelineSlide spec={slide} />;
    case 'QrMeetingSlide':     return <QrMeetingSlide spec={slide} />;
    case 'ImageSlide':         return <ImageSlide spec={slide} />;
    case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
    case 'MetricGridSlide':    return <MetricGridSlide spec={slide} />;
    case 'TableSlide':         return <TableSlide spec={slide} />;
    case 'CodeBlockSlide':     return <CodeBlockSlide spec={slide} />;
    case 'BoxDiagramSlide':    return <BoxDiagramSlide spec={slide} />;
    case 'LayoutSlide':        return <LayoutSlide spec={slide} />;
    case 'BlastRadiusSlide':   return <BlastRadiusSlide spec={slide} />;
    case 'SessionOutlineSlide':return <SessionOutlineSlide spec={slide} />;
    default:                   return <TitleSlide spec={slide} />;
  }
}

interface Props {
  slide: SlideSpec;
  /** Rendered tile width in CSS px. Height auto-derives from 16:9. */
  width: number;
  className?: string;
}

/**
 * Pixel-accurate scaled-down preview of any slide. Renders the actual slide
 * component inside a 1920x1080 stage scaled via CSS transform. Used by both
 * the GridOverview and the PresenterView.
 *
 * v0.74 — when the global "Alignment guide" toggle is on (`/settings`),
 * a `SlidePreviewAlignmentOverlay` is mounted inside the stage drawing
 * the logo edge / body grid edge / timeline rail guides. Lets the author
 * verify positioning in every preview tile (Builder, Settings, Grid)
 * before exporting the deck.
 */
export function SlidePreview({ slide, width, className }: Props) {
  const scale = width / SLIDE_W;
  const height = width * (SLIDE_H / SLIDE_W);
  const stageRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`relative overflow-hidden bg-background ${className ?? ''}`}
      style={{ width, height }}
    >
      <div
        ref={stageRef}
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})` }}
      >
        <div className="relative h-full w-full overflow-hidden noise">
          {slide.showBrandHeader && (
            <BrandHeader
              showPresenter={slide.showPresenterChip}
              offsetTop={0}
            />
          )}
          {renderBody(slide)}
          <SlidePreviewAlignmentOverlay stageRef={stageRef} />
        </div>
      </div>
    </div>
  );
}
