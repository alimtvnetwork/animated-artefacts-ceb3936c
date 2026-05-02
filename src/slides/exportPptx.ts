/**
 * One-click PPTX export (v0.154).
 *
 * # What this does
 * Builds a PowerPoint (.pptx) file from the live deck spec, one slide per
 * `linearSlides` entry, in the deck's Noir & Gold palette. Triggered from
 * the ShareMenu — no server, no headless Chrome, no new route. Uses
 * `pptxgenjs` to emit native shapes / textboxes so the file is fully
 * editable in PowerPoint, Keynote, and Google Slides.
 *
 * # Why "animations disabled, final states preserved" is automatic here
 * PPTX is a static slide format. Every shape lands in its final position,
 * every text run in its final color, every capsule on its final fill. There
 * are no Framer variants, no CSS keyframes, no `data-export-mode` toggle.
 * The "final states preserved" promise of the spec is satisfied for free
 * by the medium — we just have to translate the content tree faithfully.
 *
 * # Design philosophy: editability over pixel parity
 * A 1:1 visual port of the React renderer (cinematic capsule blur, ambient
 * icon scatter, focus-timeline camera) is impossible in PPTX without
 * degenerating every slide into a single rasterised image — which would
 * defeat the "easy editing" promise. So we deliberately render a CLEAN,
 * EDITABLE static layout per slide type, sharing the Noir & Gold palette
 * and Inter / Ubuntu typography but dropping the motion-only flourishes.
 * The user can then tweak text or reposition shapes inside PowerPoint
 * without fighting baked-in raster art.
 *
 * # Slide types covered
 * Every entry in `SlideType` except `ClickRevealSlide` (which is excluded
 * upstream by `linearSlides`). For unknown / future types we fall back to
 * a generic "title + subtitle" layout so a deck with experimental types
 * still exports cleanly.
 */

import PptxGenJS from 'pptxgenjs';
import { deck, linearSlides } from './loader';
import { SlideType } from './enums';
import type {
  SlideSpec, CapsuleSpec, StepSpec, MetricSpec,
  TableColumnSpec, TableRowSpec,
  DiagramNodeSpec, DiagramEdgeSpec, DiagramFieldSpec,
  LayoutSlotSpec, LayoutGridPreset,
} from './types';

/**
 * Noir & Gold palette — pulled from `src/index.css` semantic tokens. We
 * keep the hex values inline (not imported) because pptxgenjs needs raw
 * hex without the `#` prefix and there's no live HSL→hex bridge at module
 * load time. Mirror this table with `index.css` if the brand palette ever
 * shifts.
 */
const PALETTE = {
  ink:       '0D0D0D', // bg
  inkSoft:   '1A1A1A', // raised surface
  gold:      'C9A84C', // primary accent
  goldSoft:  '8A7236', // dimmed gold for secondary text
  ember:     'E85D3A', // warning accent (used sparingly)
  cream:     'F0D78C', // headline-on-dark
  foreground:'EDE7D6', // body text on noir
  muted:     '8B8578', // captions, eyebrows
  rule:      '2A2A2A', // hairline rule between blocks
} as const;

/**
 * Map the deck's `CapsuleColor` enum onto pptxgenjs hex colors. Capsules
 * lose their gradient/glow but keep brand color identity — enough for the
 * audience to recognise the same content blocks they saw in the live deck.
 */
function capsuleFill(color: string | undefined): string {
  switch (color) {
    case 'gold':    return PALETTE.gold;
    case 'ember':   return PALETTE.ember;
    case 'cream':   return PALETTE.cream;
    case 'ink':     return PALETTE.inkSoft;
    case 'outline': return PALETTE.ink;
    default:        return PALETTE.gold;
  }
}
function capsuleText(color: string | undefined): string {
  // Light fills get dark text, dark fills get cream. Matches the live
  // deck's contrast policy where `cream` and `gold` capsules ride on dark
  // text while `ink`/`outline` capsules show cream text.
  return color === 'ink' || color === 'outline' ? PALETTE.cream : PALETTE.ink;
}

/**
 * Standard title + eyebrow header used by ~every slide type. Emitted once
 * per slide so the visual rhythm matches the deck's brand-header pattern.
 * Returns the bottom-edge Y of the header so the body content can offset
 * itself without overlapping.
 */
function addHeader(pptx: PptxGenJS, slide: PptxGenJS.Slide, content: SlideSpec['content']): number {
  let y = 0.55;
  if (content.eyebrow) {
    slide.addText(content.eyebrow.toUpperCase(), {
      x: 0.6, y, w: 12.13, h: 0.35,
      fontFace: 'Inter', fontSize: 11, bold: true,
      color: PALETTE.gold, charSpacing: 6,
    });
    y += 0.45;
  }
  if (content.title) {
    slide.addText(content.title, {
      x: 0.6, y, w: 12.13, h: 1.0,
      fontFace: 'Ubuntu', fontSize: 32, bold: true,
      color: PALETTE.cream, valign: 'top',
    });
    y += 1.05;
  }
  if (content.subtitle) {
    slide.addText(content.subtitle, {
      x: 0.6, y, w: 12.13, h: 0.6,
      fontFace: 'Inter', fontSize: 16,
      color: PALETTE.foreground, valign: 'top',
    });
    y += 0.7;
  }
  return y + 0.2;
}

/**
 * Render a row of capsule pills. Used by `CapsuleListSlide`,
 * `KeywordSlide` (as colored pills around plain words), and as the
 * trailing capsule on a `StepSpec`.
 */
function addCapsuleRow(
  slide: PptxGenJS.Slide,
  capsules: CapsuleSpec[],
  startX: number, startY: number, maxWidth: number,
) {
  let x = startX;
  let y = startY;
  const pillH = 0.45;
  const padX = 0.22;
  for (const cap of capsules) {
    // Approximate text width: 0.09" per char @ 14pt Inter Medium. A rough
    // but stable heuristic — the cap is editable in PowerPoint anyway.
    const estW = Math.max(0.8, cap.text.length * 0.09 + padX * 2);
    if (x + estW > startX + maxWidth) { x = startX; y += pillH + 0.18; }
    slide.addShape('roundRect', {
      x, y, w: estW, h: pillH,
      fill: { color: capsuleFill(cap.color) },
      line: { color: capsuleFill(cap.color), width: 0 },
      rectRadius: pillH / 2,
    });
    slide.addText(cap.text, {
      x, y, w: estW, h: pillH,
      fontFace: 'Inter', fontSize: 12, bold: true,
      color: capsuleText(cap.color),
      align: 'center', valign: 'middle',
    });
    x += estW + 0.18;
  }
  return y + pillH;
}

/* ------------------------------------------------------------------ *
 *  Per-slide-type renderers                                          *
 * ------------------------------------------------------------------ */

function renderTitleOrMiddle(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  // Center-stack: eyebrow / title / subtitle vertically centered. Mirrors
  // the live `TitleSlide` and `MiddleTitleSlide` composition (the latter
  // is the section break — same mental model in static form).
  if (c.eyebrow) {
    slide.addText(c.eyebrow.toUpperCase(), {
      x: 0.6, y: 2.6, w: 12.13, h: 0.4,
      fontFace: 'Inter', fontSize: 14, bold: true,
      color: PALETTE.gold, charSpacing: 8, align: 'center',
    });
  }
  slide.addText(c.title ?? spec.slideName, {
    x: 0.6, y: 3.1, w: 12.13, h: 1.6,
    fontFace: 'Ubuntu', fontSize: 54, bold: true,
    color: PALETTE.cream, align: 'center', valign: 'middle',
  });
  if (c.subtitle) {
    slide.addText(c.subtitle, {
      x: 1.2, y: 4.8, w: 10.93, h: 0.8,
      fontFace: 'Inter', fontSize: 18,
      color: PALETTE.foreground, align: 'center',
    });
  }
}

function renderKeyword(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  if (c.keywords?.length) {
    // Render keywords as cream pills — same visual register as the live
    // deck's keyword chip set.
    const pseudoCapsules: CapsuleSpec[] = c.keywords.map(k => ({ text: k, color: 'cream' }));
    addCapsuleRow(slide, pseudoCapsules, 0.6, headerBottom + 0.4, 12.13);
  }
}

function renderCapsuleList(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  if (c.capsules?.length) addCapsuleRow(slide, c.capsules, 0.6, headerBottom + 0.4, 12.13);
}

function renderStepTimeline(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  if (!c.steps?.length) return;
  // Vertical step list: number badge + title + subtitle, evenly spaced.
  // Static layout — no focus carousel, no camera dolly, just every step
  // visible and editable.
  const top = headerBottom + 0.3;
  const rowH = Math.min(0.95, (6.8 - top) / Math.max(c.steps.length, 1));
  c.steps.forEach((step: StepSpec, i: number) => {
    const y = top + i * rowH;
    // Numbered badge (gold ring + index)
    slide.addShape('ellipse', {
      x: 0.6, y, w: 0.55, h: 0.55,
      fill: { color: PALETTE.ink },
      line: { color: PALETTE.gold, width: 1.5 },
    });
    slide.addText(step.label || String(i + 1), {
      x: 0.6, y, w: 0.55, h: 0.55,
      fontFace: 'Inter', fontSize: 14, bold: true,
      color: PALETTE.gold, align: 'center', valign: 'middle',
    });
    // Title + subtitle, indented
    slide.addText(step.title, {
      x: 1.35, y, w: 10.5, h: 0.4,
      fontFace: 'Ubuntu', fontSize: 18, bold: true,
      color: PALETTE.cream, valign: 'top',
    });
    if (step.subtitle) {
      slide.addText(step.subtitle, {
        x: 1.35, y: y + 0.42, w: 10.5, h: 0.4,
        fontFace: 'Inter', fontSize: 13,
        color: PALETTE.foreground, valign: 'top',
      });
    }
  });
}

function renderImage(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  addHeader(pptx, slide, c);
  // We can't reliably embed remote/imported assets here without a fetch +
  // base64 round-trip and CORS uncertainty. Instead emit a placeholder
  // box with the asset path so the user can drop the actual image in
  // PowerPoint. Honest > broken.
  if (c.image) {
    slide.addShape('rect', {
      x: 1.6, y: 2.5, w: 10.13, h: 4.0,
      fill: { color: PALETTE.inkSoft },
      line: { color: PALETTE.rule, width: 1, dashType: 'dash' },
    });
    slide.addText(`Image: ${c.image}\n(placeholder — drop the asset in PowerPoint)`, {
      x: 1.6, y: 2.5, w: 10.13, h: 4.0,
      fontFace: 'Inter', fontSize: 14, italic: true,
      color: PALETTE.muted, align: 'center', valign: 'middle',
    });
  }
}

function renderQrMeeting(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  addHeader(pptx, slide, c);
  // Two-column: contact rows on the left, QR placeholder card on the
  // right. We don't generate the QR PNG here (would require an async
  // import + canvas rasterisation per slide); instead leave a labelled
  // tile with the URL, which the user can replace by pasting a fresh
  // QR or letting PowerPoint scan-link it.
  const url = c.meetingUrl ?? c.qrUrl ?? deck.meeting?.url ?? '';
  const label = c.meetingLabel ?? deck.meeting?.label ?? url;
  // Left column — contacts + CTA
  let y = 2.4;
  if (c.contactRows?.length) {
    for (const row of c.contactRows) {
      slide.addText(`• ${row.text.replace(/\n/g, ' — ')}`, {
        x: 0.8, y, w: 6.5, h: 0.5,
        fontFace: 'Inter', fontSize: 14,
        color: PALETTE.foreground,
      });
      y += 0.55;
    }
  }
  if (c.cta?.text) {
    slide.addShape('roundRect', {
      x: 0.8, y: y + 0.2, w: 3.4, h: 0.55,
      fill: { color: PALETTE.gold }, line: { color: PALETTE.gold, width: 0 },
      rectRadius: 0.27,
    });
    slide.addText(c.cta.text, {
      x: 0.8, y: y + 0.2, w: 3.4, h: 0.55,
      fontFace: 'Inter', fontSize: 13, bold: true,
      color: PALETTE.ink, align: 'center', valign: 'middle',
    });
  }
  // Right column — QR placeholder tile
  slide.addShape('roundRect', {
    x: 8.2, y: 2.4, w: 4.0, h: 4.0,
    fill: { color: 'FFFFFF' }, line: { color: PALETTE.gold, width: 1.5 },
    rectRadius: 0.15,
  });
  slide.addText('[ QR CODE ]', {
    x: 8.2, y: 3.0, w: 4.0, h: 0.6,
    fontFace: 'Inter', fontSize: 22, bold: true,
    color: PALETTE.ink, align: 'center', valign: 'middle',
  });
  slide.addText(label, {
    x: 8.2, y: 5.6, w: 4.0, h: 0.5,
    fontFace: 'Inter', fontSize: 11,
    color: PALETTE.ink, align: 'center', valign: 'middle',
  });
  if (url && url !== label) {
    slide.addText(url, {
      x: 8.2, y: 6.05, w: 4.0, h: 0.4,
      fontFace: 'Inter', fontSize: 9, italic: true,
      color: PALETTE.goldSoft, align: 'center',
    });
  }
}

function renderSectionDivider(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  // Hairline gold rule + giant title — divider energy.
  slide.addShape('line', {
    x: 0.6, y: 3.6, w: 1.5, h: 0,
    line: { color: PALETTE.gold, width: 2 },
  });
  if (c.eyebrow) {
    slide.addText(c.eyebrow.toUpperCase(), {
      x: 0.6, y: 3.0, w: 12.13, h: 0.4,
      fontFace: 'Inter', fontSize: 12, bold: true,
      color: PALETTE.gold, charSpacing: 8,
    });
  }
  slide.addText(c.title ?? spec.slideName, {
    x: 0.6, y: 3.85, w: 12.13, h: 1.5,
    fontFace: 'Ubuntu', fontSize: 60, bold: true,
    color: PALETTE.cream, valign: 'top',
  });
  if (c.subtitle) {
    slide.addText(c.subtitle, {
      x: 0.6, y: 5.5, w: 12.13, h: 0.6,
      fontFace: 'Inter', fontSize: 18,
      color: PALETTE.foreground,
    });
  }
}

function renderMetricGrid(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  if (!c.metrics?.length) return;
  // Auto-grid mirroring the live renderer's count→layout map:
  //   2→1×2, 3→1×3, 4→2×2, 5/6→2×3
  const n = c.metrics.length;
  const cols = n <= 3 ? n : 3;
  const rows = n <= 3 ? 1 : 2;
  const top = headerBottom + 0.3;
  const cellW = (12.13 - 0.4 * (cols - 1)) / cols;
  const cellH = (6.8 - top - 0.4 * (rows - 1)) / rows;
  c.metrics.forEach((m: MetricSpec, i: number) => {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const x = 0.6 + col * (cellW + 0.4);
    const y = top + r * (cellH + 0.4);
    slide.addShape('roundRect', {
      x, y, w: cellW, h: cellH,
      fill: { color: PALETTE.inkSoft }, line: { color: PALETTE.rule, width: 1 },
      rectRadius: 0.12,
    });
    slide.addText(m.value, {
      x: x + 0.2, y: y + 0.3, w: cellW - 0.4, h: cellH * 0.55,
      fontFace: 'Ubuntu', fontSize: Math.max(36, Math.min(72, 80 - m.value.length * 3)), bold: true,
      color: capsuleFill(m.accent),
      align: 'center', valign: 'middle',
    });
    slide.addText(m.label, {
      x: x + 0.2, y: y + cellH * 0.62, w: cellW - 0.4, h: 0.4,
      fontFace: 'Inter', fontSize: 14, bold: true,
      color: PALETTE.cream, align: 'center',
    });
    if (m.caption) {
      slide.addText(m.caption, {
        x: x + 0.2, y: y + cellH * 0.78, w: cellW - 0.4, h: 0.4,
        fontFace: 'Inter', fontSize: 11,
        color: PALETTE.muted, align: 'center',
      });
    }
  });
}

/* ------------------------------------------------------------------ *
 *  v0.182 — generic slide-type renderers (Table / Code / Diagram /   *
 *  Layout). Live counterparts in `src/slides/types/*.tsx`. Each      *
 *  renderer keeps the Noir & Gold palette so the export reads as     *
 *  one cohesive deck even when the React side uses a per-slide       *
 *  theme (e.g. navy-blue on ER diagrams). Pixel parity is not the    *
 *  goal — clean, editable, on-brand output is.                       *
 * ------------------------------------------------------------------ */

/**
 * `TableSlide` — title + headers + zebra rows + per-row accent bar.
 * pptxgenjs has a native `addTable` but we hand-roll cells so we can
 * paint the accent bar in the first column AND apply zebra fills.
 * Caps at 12 rows × 8 columns to match the live spec; extras are
 * silently dropped (consistent with the React renderer's truncation).
 */
function renderTable(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  const cols: TableColumnSpec[] = (c.tableColumns ?? []).slice(0, 8);
  const rows: TableRowSpec[] = (c.tableRows ?? []).slice(0, 12);
  if (!cols.length || !rows.length) return;

  const top = headerBottom + 0.2;
  const bottomLimit = c.tableNote ? 6.4 : 6.8;
  const tableW = 12.13;
  // Distribute width: explicit widths are honored proportionally as raw
  // hints; everything else splits the remainder. Keeps the layout stable
  // even when `width` strings are missing or mixed units.
  const weights = cols.map(col => {
    const m = col.width?.match(/([\d.]+)/);
    return m ? Math.max(0.5, parseFloat(m[1])) : 1;
  });
  const totalW = weights.reduce((a, b) => a + b, 0);
  const colWs = weights.map(w => (w / totalW) * tableW);

  const headerH = 0.5;
  const rowH = Math.min(0.55, Math.max(0.4, (bottomLimit - top - headerH) / rows.length));

  // Header row
  let x = 0.6;
  cols.forEach((col, i) => {
    slide.addShape('rect', {
      x, y: top, w: colWs[i], h: headerH,
      fill: { color: PALETTE.inkSoft }, line: { color: PALETTE.rule, width: 0.75 },
    });
    slide.addText(col.label, {
      x: x + 0.12, y: top, w: colWs[i] - 0.24, h: headerH,
      fontFace: 'Inter', fontSize: 12, bold: true,
      color: PALETTE.gold, align: col.align ?? 'left', valign: 'middle',
      charSpacing: 4,
    });
    x += colWs[i];
  });

  // Body rows — zebra alternation + accent bar in first cell
  rows.forEach((row, r) => {
    const y = top + headerH + r * rowH;
    const zebra = r % 2 === 1 ? PALETTE.inkSoft : PALETTE.ink;
    let cx = 0.6;
    cols.forEach((col, i) => {
      slide.addShape('rect', {
        x: cx, y, w: colWs[i], h: rowH,
        fill: { color: zebra }, line: { color: PALETTE.rule, width: 0.5 },
      });
      // Accent bar on the first column's left edge
      if (i === 0) {
        slide.addShape('rect', {
          x: cx, y: y + 0.06, w: 0.08, h: rowH - 0.12,
          fill: { color: capsuleFill(row.accent) }, line: { color: capsuleFill(row.accent), width: 0 },
        });
      }
      const value = i === 0 ? row.name : (row.cells?.[col.key] ?? '—');
      slide.addText(value, {
        x: cx + (i === 0 ? 0.24 : 0.12), y,
        w: colWs[i] - (i === 0 ? 0.36 : 0.24), h: rowH,
        fontFace: 'Inter', fontSize: 11,
        color: i === 0 ? PALETTE.cream : PALETTE.foreground,
        bold: i === 0,
        align: col.align ?? 'left', valign: 'middle',
      });
      cx += colWs[i];
    });
  });

  if (c.tableNote) {
    slide.addText(c.tableNote, {
      x: 0.6, y: top + headerH + rows.length * rowH + 0.15, w: tableW, h: 0.4,
      fontFace: 'Inter', fontSize: 10, italic: true,
      color: PALETTE.muted,
    });
  }
}

/**
 * `CodeBlockSlide` — title + dark code surface + monospace body. Syntax
 * highlighting is dropped (no shiki in the export pipeline — would
 * require shipping the wasm and a theme JSON, both heavy and
 * editor-hostile). What we DO preserve: the language label badge,
 * highlighted-line backdrop, optional line numbers, and the caption.
 * The result is editable in PowerPoint as a single text frame plus
 * a few rectangles — drop the user's own syntax-colored screenshot in
 * if pixel-perfect coloring matters.
 */
function renderCodeBlock(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  const code = c.code ?? (c.codeTokens ?? []).map(line => line.map(t => t.text).join('')).join('\n');
  if (!code) return;

  const top = headerBottom + 0.2;
  const bodyW = 12.13;
  const bodyH = (c.codeCaption ? 5.7 : 6.2) - top;
  const lines = code.split('\n');
  const showLineNumbers = c.codeShowLineNumbers ?? !!c.codeHighlightLines?.length;
  const highlight = new Set(c.codeHighlightLines ?? []);

  // Surface
  slide.addShape('roundRect', {
    x: 0.6, y: top, w: bodyW, h: bodyH,
    fill: { color: PALETTE.inkSoft }, line: { color: PALETTE.rule, width: 1 },
    rectRadius: 0.1,
  });

  // Language badge (top-right)
  if (c.codeLanguage) {
    slide.addText(c.codeLanguage.toUpperCase(), {
      x: bodyW - 0.5, y: top + 0.12, w: 1.0, h: 0.3,
      fontFace: 'Inter', fontSize: 9, bold: true,
      color: PALETTE.goldSoft, align: 'right', charSpacing: 4,
    });
  }

  // Body — render line by line so we can paint highlighted backdrops
  // and a gutter. Font sizes auto-shrink for tall blocks so 30-line
  // snippets still fit; clamp at 9pt for readability.
  const padTop = 0.45;
  const padX = 0.3;
  const gutterW = showLineNumbers ? 0.55 : 0;
  const lineH = Math.max(0.18, Math.min(0.28, (bodyH - padTop - 0.3) / Math.max(lines.length, 1)));
  const fontSize = Math.max(9, Math.min(14, lineH * 50));

  lines.forEach((text, i) => {
    const y = top + padTop + i * lineH;
    const lineNo = i + 1;
    if (highlight.has(lineNo)) {
      slide.addShape('rect', {
        x: 0.6 + 0.08, y, w: bodyW - 0.16, h: lineH,
        // Approximate the gold/14% backdrop the React side paints. We
        // can't do real alpha in pptxgenjs without `transparency`, so
        // pick a desaturated gold that reads as a backdrop on inkSoft.
        fill: { color: '3A3220' }, line: { color: '3A3220', width: 0 },
      });
    }
    if (showLineNumbers) {
      slide.addText(String(lineNo), {
        x: 0.6 + 0.08, y, w: gutterW, h: lineH,
        fontFace: 'Consolas', fontSize: fontSize - 1,
        color: PALETTE.muted, align: 'right', valign: 'middle',
      });
    }
    slide.addText(text || ' ', {
      x: 0.6 + padX + gutterW, y, w: bodyW - padX * 2 - gutterW, h: lineH,
      fontFace: 'Consolas', fontSize,
      color: highlight.has(lineNo) ? PALETTE.cream : PALETTE.foreground,
      valign: 'middle',
    });
  });

  if (c.codeCaption) {
    slide.addText(c.codeCaption, {
      x: 0.6, y: top + bodyH + 0.15, w: bodyW, h: 0.4,
      fontFace: 'Inter', fontSize: 12, italic: true,
      color: PALETTE.muted,
    });
  }
}

/**
 * `BoxDiagramSlide` / `ERDiagramSlide` — node boxes + crow's-foot
 * connectors. Coordinates are %-of-canvas in the spec; we project them
 * onto the diagram region (left pane reserved for `diagramExplanation`
 * when present, mirroring the live 4/8 split).
 *
 * What's preserved: every node + every field row + every edge as a
 * straight line with a midpoint label. What's dropped: animated
 * draw-on, glow, and exact crow's-foot SVG glyphs — endpoints get a
 * simple `[1]` / `[N]` text marker instead, which an editor can
 * upgrade to real connectors if needed.
 */
function renderDiagram(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  const nodes: DiagramNodeSpec[] = (c.entities ?? c.diagramNodes ?? []) as DiagramNodeSpec[];
  const edges: DiagramEdgeSpec[] = (c.relationships ?? c.diagramEdges ?? []) as DiagramEdgeSpec[];
  if (!nodes.length) return;

  // Canvas region — split left pane for explanation when present.
  const top = headerBottom + 0.2;
  const bottom = 6.7;
  const fullLeft = 0.6;
  const fullW = 12.13;
  let canvasX = fullLeft;
  let canvasW = fullW;
  if (c.diagramExplanation) {
    const paneW = fullW * 4 / 12 - 0.3;
    slide.addText(c.diagramExplanation, {
      x: fullLeft, y: top, w: paneW, h: bottom - top,
      fontFace: 'Inter', fontSize: 13,
      color: PALETTE.foreground, valign: 'top',
    });
    canvasX = fullLeft + paneW + 0.4;
    canvasW = fullW - paneW - 0.4;
  }
  const canvasH = bottom - top;

  // Field row metrics — used both to draw the box and to compute
  // anchor points for edges.
  const titleH = 0.32;
  const fieldH = 0.26;
  const nodeFor = (id: string) => nodes.find(n => n.id === id);
  const boxRect = (n: DiagramNodeSpec) => {
    const w = ((n.w ?? 22) / 100) * canvasW;
    const fields: DiagramFieldSpec[] = n.fields ?? [];
    const h = titleH + fields.length * fieldH;
    const x = canvasX + (n.x / 100) * canvasW;
    const y = top + (n.y / 100) * canvasH;
    return { x, y, w, h };
  };

  // Edges first so boxes paint on top
  edges.forEach(edge => {
    const a = nodeFor(edge.from);
    const b = nodeFor(edge.to);
    if (!a || !b) return;
    const ra = boxRect(a);
    const rb = boxRect(b);
    const ax = ra.x + ra.w / 2;
    const ay = ra.y + ra.h / 2;
    const bx = rb.x + rb.w / 2;
    const by = rb.y + rb.h / 2;
    // pptxgenjs `line` shape draws a diagonal line bound by the bbox.
    slide.addShape('line', {
      x: Math.min(ax, bx), y: Math.min(ay, by),
      w: Math.abs(bx - ax), h: Math.abs(by - ay),
      // pptxgenjs needs `flipH/flipV` to direct the diagonal correctly.
      flipH: bx < ax, flipV: by < ay,
      line: { color: PALETTE.gold, width: 1.25 },
    });
    const [ca, cb] = edge.cardinality ?? ['1', 'N'];
    // Endpoint markers — small text labels near each node center.
    slide.addText(`[${ca}]`, {
      x: ax - 0.25, y: ay - 0.18, w: 0.5, h: 0.22,
      fontFace: 'Inter', fontSize: 9, bold: true,
      color: PALETTE.gold, align: 'center',
    });
    slide.addText(`[${cb}]`, {
      x: bx - 0.25, y: by - 0.18, w: 0.5, h: 0.22,
      fontFace: 'Inter', fontSize: 9, bold: true,
      color: PALETTE.gold, align: 'center',
    });
    if (edge.label) {
      slide.addText(edge.label, {
        x: (ax + bx) / 2 - 0.7, y: (ay + by) / 2 - 0.15, w: 1.4, h: 0.3,
        fontFace: 'Inter', fontSize: 10, italic: true,
        color: PALETTE.cream, align: 'center',
      });
    }
  });

  // Node boxes
  nodes.forEach(n => {
    const r = boxRect(n);
    // Outer frame
    slide.addShape('rect', {
      x: r.x, y: r.y, w: r.w, h: r.h,
      fill: { color: PALETTE.inkSoft }, line: { color: PALETTE.gold, width: 1.25 },
    });
    // Title bar
    slide.addShape('rect', {
      x: r.x, y: r.y, w: r.w, h: titleH,
      fill: { color: PALETTE.gold }, line: { color: PALETTE.gold, width: 0 },
    });
    slide.addText(n.title, {
      x: r.x + 0.08, y: r.y, w: r.w - 0.16, h: titleH,
      fontFace: 'Inter', fontSize: 11, bold: true,
      color: PALETTE.ink, valign: 'middle',
    });
    // Field rows — pk/fk get accent colors
    (n.fields ?? []).forEach((f, i) => {
      const fy = r.y + titleH + i * fieldH;
      const roleColor =
        f.role === 'pk' ? PALETTE.gold :
        f.role === 'fk' ? PALETTE.ember :
        PALETTE.foreground;
      slide.addText(f.name, {
        x: r.x + 0.08, y: fy, w: r.w * 0.6, h: fieldH,
        fontFace: 'Inter', fontSize: 9, bold: f.role === 'pk',
        color: roleColor, valign: 'middle',
      });
      if (f.type) {
        slide.addText(f.type, {
          x: r.x + r.w * 0.55, y: fy, w: r.w * 0.4 - 0.08, h: fieldH,
          fontFace: 'Consolas', fontSize: 9,
          color: PALETTE.muted, align: 'right', valign: 'middle',
        });
      }
    });
  });
}

/**
 * `LayoutSlide` — generic grid wrapper. We resolve the chosen preset to
 * a concrete `{cols, rows, span}` layout and paint each `layoutSlots[]`
 * entry as either a card (rounded inkSoft frame), plain text, or a
 * mini code surface. Slot count is clamped to the grid; surplus slots
 * are dropped, mirroring the live renderer's overflow policy.
 */
function renderLayout(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  const c = spec.content;
  const headerBottom = addHeader(pptx, slide, c);
  const slots: LayoutSlotSpec[] = c.layoutSlots ?? [];
  if (!slots.length) return;

  const preset: LayoutGridPreset = c.layout ?? 'split-2-equal';
  const top = headerBottom + 0.2;
  const left = 0.6;
  const totalW = 12.13;
  const totalH = 6.6 - top;
  const gap = 0.25;

  // Resolve preset → array of {x,y,w,h} cell rects in slot order.
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  const splitCols = (ratios: number[]) => {
    const sum = ratios.reduce((a, b) => a + b, 0);
    const widths = ratios.map(r => ((totalW - gap * (ratios.length - 1)) * r) / sum);
    let cx = left;
    widths.forEach(w => {
      cells.push({ x: cx, y: top, w, h: totalH });
      cx += w + gap;
    });
  };
  const cardGrid = (cols: number) => {
    const rows = Math.max(1, Math.ceil(slots.length / cols));
    const cellW = (totalW - gap * (cols - 1)) / cols;
    const cellH = (totalH - gap * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      cells.push({ x: left + cc * (cellW + gap), y: top + r * (cellH + gap), w: cellW, h: cellH });
    }
  };
  switch (preset) {
    case 'split-5-7':     splitCols([5, 7]); break;
    case 'split-4-8':     splitCols([4, 8]); break;
    case 'split-3-9':     splitCols([3, 9]); break;
    case 'split-2-equal': splitCols([1, 1]); break;
    case '3-panel':       splitCols([1, 1, 1]); break;
    case '12-column':     cardGrid(Math.min(12, slots.length)); break;
    case 'card-grid-2x3': cardGrid(2); break;
    case 'card-grid-3x3': cardGrid(3); break;
    case 'centered-hero':
      cells.push({ x: left + totalW * 0.15, y: top, w: totalW * 0.7, h: totalH });
      break;
  }

  slots.forEach((slot, i) => {
    const cell = cells[i];
    if (!cell) return; // overflow → drop, matches React renderer
    renderLayoutSlot(slide, slot, cell);
  });
}

/** Variant border colors for `kind: 'card'`. Mirrors `.slide-card--*`. */
function variantBorder(v?: LayoutSlotSpec['variant']): string {
  switch (v) {
    case 'success': return '6FB36F';
    case 'danger':  return PALETTE.ember;
    case 'accent':  return PALETTE.gold;
    default:        return PALETTE.rule;
  }
}

function renderLayoutSlot(
  slide: PptxGenJS.Slide,
  slot: LayoutSlotSpec,
  cell: { x: number; y: number; w: number; h: number },
) {
  const kind = slot.kind ?? 'card';
  const padX = kind === 'plain' ? 0 : 0.25;
  const padY = kind === 'plain' ? 0 : 0.25;

  if (kind === 'card') {
    slide.addShape('roundRect', {
      x: cell.x, y: cell.y, w: cell.w, h: cell.h,
      fill: { color: PALETTE.inkSoft },
      line: { color: variantBorder(slot.variant), width: slot.variant && slot.variant !== 'default' ? 2 : 1 },
      rectRadius: 0.12,
    });
  } else if (kind === 'codeblock') {
    slide.addShape('roundRect', {
      x: cell.x, y: cell.y, w: cell.w, h: cell.h,
      fill: { color: PALETTE.ink },
      line: { color: PALETTE.rule, width: 1 },
      rectRadius: 0.08,
    });
  }

  const innerX = cell.x + padX;
  const innerW = cell.w - padX * 2;
  let cy = cell.y + padY;

  if (kind === 'codeblock') {
    if (slot.codeLanguage) {
      slide.addText(slot.codeLanguage.toUpperCase(), {
        x: innerX, y: cy, w: innerW, h: 0.25,
        fontFace: 'Inter', fontSize: 9, bold: true,
        color: PALETTE.goldSoft, align: 'right', charSpacing: 4,
      });
      cy += 0.28;
    }
    slide.addText(slot.code ?? '', {
      x: innerX, y: cy, w: innerW, h: cell.h - (cy - cell.y) - padY,
      fontFace: 'Consolas', fontSize: 11,
      color: PALETTE.foreground, valign: 'top',
    });
    return;
  }

  if (slot.eyebrow) {
    slide.addText(slot.eyebrow.toUpperCase(), {
      x: innerX, y: cy, w: innerW, h: 0.28,
      fontFace: 'Inter', fontSize: 9, bold: true,
      color: PALETTE.gold, charSpacing: 5,
    });
    cy += 0.32;
  }
  if (slot.title) {
    slide.addText(slot.title, {
      x: innerX, y: cy, w: innerW, h: 0.45,
      fontFace: 'Ubuntu', fontSize: 18, bold: true,
      color: PALETTE.cream, valign: 'top',
    });
    cy += 0.5;
  }
  if (slot.body) {
    const bodyH = Math.max(0.4, cell.h - (cy - cell.y) - padY - (slot.bullets?.length ? 0.5 + slot.bullets.length * 0.3 : 0));
    slide.addText(slot.body, {
      x: innerX, y: cy, w: innerW, h: bodyH,
      fontFace: 'Inter', fontSize: 12,
      color: PALETTE.foreground, valign: 'top',
    });
    cy += bodyH + 0.1;
  }
  if (slot.bullets?.length) {
    slide.addText(
      slot.bullets.map(b => ({ text: b, options: { bullet: { code: '2022' } } })),
      {
        x: innerX, y: cy, w: innerW, h: cell.h - (cy - cell.y) - padY,
        fontFace: 'Inter', fontSize: 11,
        color: PALETTE.foreground, valign: 'top', paraSpaceAfter: 4,
      },
    );
  }
}

/**
 * Dispatcher — picks a renderer by `slide.slideType`. Unknown types fall
 * through to the generic header so a future slide type still produces a
 * legible page.
 */
function renderSlide(pptx: PptxGenJS, slide: PptxGenJS.Slide, spec: SlideSpec) {
  // Solid noir background on every slide — the deck's signature.
  slide.background = { color: PALETTE.ink };

  switch (spec.slideType) {
    case SlideType.TitleSlide:
    case SlideType.MiddleTitleSlide:
      return renderTitleOrMiddle(pptx, slide, spec);
    case SlideType.KeywordSlide:
      return renderKeyword(pptx, slide, spec);
    case SlideType.CapsuleListSlide:
      return renderCapsuleList(pptx, slide, spec);
    case SlideType.StepTimelineSlide:
    case SlideType.FocusTimelineSlide:
    case SlideType.AdvanceStepSlide:
      // Focus + Advance are cinematic carousels in the live deck — flatten
      // into the same static step list. Final state of a carousel is "all
      // steps visible", which is exactly what the timeline renderer does.
      return renderStepTimeline(pptx, slide, spec);
    case SlideType.ImageSlide:
      return renderImage(pptx, slide, spec);
    case SlideType.QrMeetingSlide:
      return renderQrMeeting(pptx, slide, spec);
    case SlideType.SectionDividerSlide:
      return renderSectionDivider(pptx, slide, spec);
    case SlideType.MetricGridSlide:
      return renderMetricGrid(pptx, slide, spec);
    case SlideType.TableSlide:
      return renderTable(pptx, slide, spec);
    case SlideType.CodeBlockSlide:
      return renderCodeBlock(pptx, slide, spec);
    case SlideType.BoxDiagramSlide:
    case SlideType.ERDiagramSlide:
      return renderDiagram(pptx, slide, spec);
    case SlideType.LayoutSlide:
      return renderLayout(pptx, slide, spec);
    default:
      addHeader(pptx, slide, spec.content);
  }
}

/**
 * Public entry point — generates the .pptx and triggers a browser
 * download. Returns the resolved filename for the caller to surface a
 * toast or analytics event.
 */
export async function exportDeckToPptx(): Promise<string> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 inches — same 16:9 ratio as the deck
  pptx.title = deck.deckName ?? 'Deck';
  pptx.author = (typeof deck.presenter === 'string' ? deck.presenter : '') || 'Riseup Asia LLC';
  pptx.company = 'Riseup Asia LLC';

  // Footer master with slide-number badge + brand byline. Every slide
  // inherits this so the audience can cite "slide 7 of 24" without us
  // hand-rolling the chrome per page.
  pptx.defineSlideMaster({
    title: 'NOIR_GOLD_MASTER',
    background: { color: PALETTE.ink },
    objects: [
      { text: {
          text: deck.deckName ?? '',
          options: {
            x: 0.6, y: 7.05, w: 8.0, h: 0.3,
            fontFace: 'Inter', fontSize: 9,
            color: PALETTE.muted, charSpacing: 4,
          },
      } },
    ],
    slideNumber: {
      x: 12.5, y: 7.05, w: 0.6, h: 0.3,
      fontFace: 'Inter', fontSize: 9, color: PALETTE.gold, align: 'right',
    },
  });

  for (const spec of linearSlides) {
    const slide = pptx.addSlide({ masterName: 'NOIR_GOLD_MASTER' });
    renderSlide(pptx, slide, spec);
  }

  const safeName = (deck.deckName ?? 'deck').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  const filename = `${safeName}-handout.pptx`;
  await pptx.writeFile({ fileName: filename });
  return filename;
}
