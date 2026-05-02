import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Hot path: SlideDeckPage is what `/N` (the canonical deck route) renders,
// and `/` redirects to it. Keep it eagerly imported so the first paint after
// initial chunk download has zero extra round-trip.
import SlideDeckPage from "./pages/SlideDeckPage";
import NotFound from "./pages/NotFound.tsx";
// Off-hot-path pages: route-level lazy chunks. Each is a separate vendor-bag,
// so a presenter who only opens `/3` never downloads the builder, style-guide,
// motion-demo, theme-preview, or release-checklist trees.
const PresenterPage          = lazy(() => import("./pages/PresenterPage"));
const BuilderPage            = lazy(() => import("./pages/BuilderPage"));
const StyleGuidePage         = lazy(() => import("./pages/StyleGuidePage"));
const SettingsPage           = lazy(() => import("./pages/SettingsPage"));
const HandoutPage            = lazy(() => import("./pages/HandoutPage"));
const MotionDemoPage         = lazy(() => import("./pages/MotionDemoPage"));
const ClickRevealAuditPage   = lazy(() => import("./pages/ClickRevealAuditPage"));
const ThemePreviewPage       = lazy(() => import("./pages/ThemePreviewPage"));
const ImagePlacementPage     = lazy(() => import("./pages/ImagePlacementPage"));
const PreviewDiagnosticsPage = lazy(() => import("./pages/PreviewDiagnosticsPage"));
const ReleaseChecklistPage   = lazy(() => import("./pages/ReleaseChecklistPage"));
const ReleaseIndexPage      = lazy(() => import("./pages/ReleaseIndexPage"));
const AnalyticsPage         = lazy(() => import("./pages/AnalyticsPage"));
import { PresenterWebcamProvider } from "./slides/components/usePresenterWebcam";
import { BrandStripAuditOverlay } from "./slides/components/BrandStripAuditOverlay";
import { BrandStripDebugOverlay } from "./slides/components/BrandStripDebugOverlay";
import { ConstraintInspectorPanel } from "./slides/components/ConstraintInspectorPanel";
import { AlignmentGuideOverlay } from "./slides/components/AlignmentGuideOverlay";
import { ContractIssuesOverlay } from "./slides/components/ContractIssuesOverlay";
import { RuntimeImageQAOverlay } from "./slides/components/RuntimeImageQAOverlay";
import { BrokenAssetOverlay } from "./slides/components/BrokenAssetOverlay";
import { RuntimeErrorOverlay, RuntimeErrorBoundary } from "./components/RuntimeErrorOverlay";
import { BlankScreenFallback } from "./components/BlankScreenFallback";

/**
 * Lazy-route fallback. Token-themed transparent shell so the brief
 * chunk-fetch flicker between routes blends with the deck chrome
 * instead of flashing white. No spinner — sub-second on the LAN, and
 * a spinner would be more visually disruptive than the blank frame.
 */
function RouteFallback() {
  return (
    <div
      data-non-empty="true"
      data-route-fallback="true"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'hsl(var(--background))',
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Signals to the index.html boot watchdog that a real route has mounted
 * inside React. Combined with the slide-render confirmation, this makes
 * the watchdog's blank-detection multi-signal instead of relying solely
 * on a DOM scan of #root.
 */
function RouteMountBeacon() {
  const location = useLocation();
  useEffect(() => {
    const w = window as unknown as {
      __previewBoot__?: { markRouteMounted?: (path: string) => void };
    };
    w.__previewBoot__?.markRouteMounted?.(location.pathname + location.search);
    document.documentElement.setAttribute("data-route-mounted", location.pathname);
  }, [location.pathname, location.search]);
  return null;
}

const queryClient = new QueryClient();

/**
 * v0.93+: aliases so deep-link verification URLs feel natural:
 *   /slide/3   → /3   (matches the way humans say "slide 3")
 *   /?slide=3  → /3   (handy for sharing from address-bar autofill)
 *
 * Both preserve the canonical flat `/N` route as the source of truth so
 * SlideDeckPage's URL-sync logic stays single-purpose. Invalid numbers
 * fall through to NotFound via the existing wildcard.
 */
function SlideAliasRedirect() {
  const { slideNumber } = useParams<{ slideNumber: string }>();
  const n = Number(slideNumber);
  if (!Number.isFinite(n) || n < 1) return <Navigate to="/1" replace />;
  return <Navigate to={`/${Math.floor(n)}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* v0.211 — `delayDuration={150}` so chrome/controller tooltips appear
        almost immediately on hover (Radix default is 700ms which felt like
        "no tooltip exists"). `skipDelayDuration={300}` keeps the chain-fast
        feel when the cursor moves between adjacent buttons. */}
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <Sonner />
      {/* v0.189 — visible runtime-error overlay. Catches window.error,
          unhandledrejection, and React render errors so the preview
          never silently goes blank. Mounted FIRST so it paints over
          everything else. Opt-out: `?errorOverlay=off`. */}
      <RuntimeErrorOverlay />
      {/* v0.190 — friendly empty-state when the route mounts but
          renders nothing visible. Yields to RuntimeErrorOverlay when
          a real error is captured. Opt-out: `?blankFallback=off`. */}
      <BlankScreenFallback />
      {/* Boot-time audit receipt: lists every BrandStrip field stripped from
          localStorage / bundled manifests so the user can verify the
          root-cause fix actually ran. Renders nothing when nothing was
          stripped. See `src/slides/loader.ts` → `brandStripAudit`. */}
      <BrandStripAuditOverlay />
      {/* v0.131 — surfaces every per-slide contract violation captured by
          `loader.ts → slideContractIssues` so authors don't have to open
          devtools to find which slide / which content path failed.
          Bottom-LEFT to avoid colliding with the BrandStrip audit
          (bottom-right) and the controller (bottom-center). */}
      <ContractIssuesOverlay />
      {/* v0.162 — runtime image QA: surfaces any reference asset that 404s,
          fails to decode in the browser, or decodes at the wrong dimensions.
          Triggered by `?qa=images` or by the dev-only auto-run on
          /style-guide. The module is layout-free until a failure exists.
          See `src/slides/runtimeImageQA.ts` and spec/slides/54-*. */}
      <RuntimeImageQAOverlay />
      {/* v0.173 — non-fatal broken-asset overlay for imported decks
          (and any deck with `assetPolicy.softFail: true`). Lists which
          declared audio / QR / brand files failed to load or decode so
          the user can fix the URL without being locked out of the
          workspace. Renders nothing when no failures exist. */}
      <BrokenAssetOverlay />
      <RuntimeErrorBoundary>
      <PresenterWebcamProvider>
      <BrowserRouter>
        <RouteMountBeacon />
        {/* Render-time diff between the live SlideStage and the
            SlidePreview (presenter / thumbnail) for the active slide.
            Activates via `?debug=brandstrip` or Ctrl/Cmd+Shift+B. Mounted
            inside the router because it depends on `useLocation`. */}
        <BrandStripDebugOverlay />
        {/* Memory-constraint inspector: lists every rule under
            .lovable/memory/constraints/ and runtime-probes each. The
            no-brand-strip probe blocks contradictory UI rules from
            silently re-enabling the banner. Activates via
            `?debug=constraints` or Ctrl/Cmd+Shift+C. */}
        <ConstraintInspectorPanel />
        {/* Spec 35 — live vertical guides between BrandHeader logo and the
            body grid for pixel-perfect alignment checking. Mount is global
            so the overlay follows the user across every route. Toggled in
            /settings → "Alignment guide". */}
        <AlignmentGuideOverlay />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<SlideDeckPage />} />
          <Route path="/present" element={<PresenterPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/style-guide" element={<StyleGuidePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* v0.119 — printable PDF handout. Mounts every linear slide stacked
              vertically, one per A4-landscape page, with all animations forced
              to final states via `data-export-mode="true"` + the @media print
              animation-killer block in index.css. Append `?print=1` to auto-
              fire the browser's save-as-PDF dialog. */}
          <Route path="/handout" element={<HandoutPage />} />
          {/* v0.137 — visual sanity check that cycles through FadeIn /
              SlideIn / PushIn / StepTimeline so motion variety is
              eyeball-verifiable in one place. */}
          <Route path="/motion-demo" element={<MotionDemoPage />} />
          {/* v0.185 — authoring-time click-reveal dependency inspector. */}
          <Route path="/click-reveal-audit" element={<ClickRevealAuditPage />} />
          {/* v0.186 — instant theme switcher with live typography preview. */}
          <Route path="/theme-preview" element={<ThemePreviewPage />} />
          {/* v0.187 — auto image-placement rule inspector. */}
          <Route path="/image-placement" element={<ImagePlacementPage />} />
          {/* v0.191 — preview health snapshot: bundle, routes, deck, last error. */}
          <Route path="/preview-diagnostics" element={<PreviewDiagnosticsPage />} />
          {/* Per-version immutable release pages. `/release/v1.1.0` reads
              from `src/releases/v1_1_0.ts`; bare `/release` redirects to
              the latest registered snapshot. New versions are added by
              dropping a new file in `src/releases/` and registering it. */}
          <Route path="/release" element={<ReleaseIndexPage />} />
          <Route path="/release/:version" element={<ReleaseChecklistPage />} />
          {/* Window-2 task 24 — local-only rehearsal telemetry review. */}
          <Route path="/analytics" element={<AnalyticsPage />} />
          {/* v0.93 alias: /slide/3 → /3. Pure redirect; SlideDeckPage owns
              the rendering + URL-sync for the canonical flat path. */}
          <Route path="/slide/:slideNumber" element={<SlideAliasRedirect />} />
          <Route path="/:slideNumber" element={<SlideDeckPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </PresenterWebcamProvider>
      </RuntimeErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
