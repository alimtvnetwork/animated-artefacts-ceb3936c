import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getInitialTheme, setActiveDeckSlug } from "./slides/themes";
import { registerCustomThemesOnBoot } from "./slides/themeManifest";
import { applyPresetSettings, getPresetSettings } from "./slides/presetSettings";
import { deck, allSlides, useSoftAssetFailures, deckTheme, activeDeckSlug } from "./slides/loader";
import { preloadDeckAssets } from "./slides/preload";
import {
  assertDeclaredAssetFiles,
  reportDeclaredAssetFiles,
  probeDeclaredImageDecode,
} from "./slides/assetRegistry";
import { markVerificationPassFinished } from "./slides/brokenAssetReport";
import { runRuntimeImageQA, logRuntimeImageQAReport } from "./slides/runtimeImageQA";

type PreviewBootState = { markMainLoaded?: () => void; markRendered?: () => void };
const previewBoot = (window as unknown as { __previewBoot__?: PreviewBootState }).__previewBoot__;
previewBoot?.markMainLoaded?.();

// Apply the theme before first paint. Resolution order (see getInitialTheme):
// `?theme=<id>` URL param > `?testMode=1` deck-declared theme > localStorage > default.
// `?testMode=1` makes screenshot diffs / contrast audits fully reproducible.
// Hydrate user-imported custom themes BEFORE we resolve the initial theme so
// a saved custom-id selection doesn't fall back to DEFAULT_THEME.
registerCustomThemesOnBoot();
// Register the active deck slug so subsequent setTheme() calls pin the
// chosen theme against THIS deck — re-opening it later will restore the
// same theme automatically (per-deck pin > global slot > default).
setActiveDeckSlug(activeDeckSlug);
applyTheme(getInitialTheme(deckTheme, activeDeckSlug));
// Same idea for the preset settings (title scale, rule thickness/color, body
// font) — stamp the CSS vars on <html> before React paints.
applyPresetSettings(getPresetSettings());

// Boot-time asset preload (spec 25). Synchronously injects `<link rel=preload>`
// for brand chrome + slide #1 assets so the first paint never waits on them;
// defers the rest of the deck to `requestIdleCallback` so later slides land
// instantly when the user navigates.
preloadDeckAssets(deck, allSlides);

const rootEl = document.getElementById("root")!;

/**
 * Render a fatal error overlay (no React) when the strict asset loader
 * refuses to boot. We deliberately avoid mounting `<App />` on this path
 * so the user can never reach a half-broken deck where some sounds /
 * QRs / brand chrome silently 404. The message is a `<pre>` block of the
 * aggregated error text the registry produced — same shape as slug-level
 * boot errors so the surface reads consistently.
 *
 * Why DOM-direct (not React): React's tree might itself depend on the
 * assets (BrandHeader logo, etc.). Bypassing it guarantees the overlay
 * paints even if a downstream component would crash on the missing URL.
 */
function renderFatalAssetError(err: Error): void {
  rootEl.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = [
    'min-height: 100vh',
    'background: hsl(0 0% 5%)',
    'color: hsl(42 100% 96%)',
    'padding: 48px',
    'font-family: ui-monospace, SFMono-Regular, Menlo, monospace',
    'font-size: 13px',
    'line-height: 1.55',
    'overflow: auto',
  ].join(';');
  const heading = document.createElement('h1');
  heading.textContent = 'Strict asset loader: deck refused to boot';
  heading.style.cssText = 'color: hsl(40 88% 50%); font-size: 18px; margin: 0 0 16px; font-family: Ubuntu, system-ui, sans-serif; letter-spacing: 0.01em;';
  const sub = document.createElement('p');
  sub.textContent = 'One or more files declared in deck.assets are unreachable. Fix them and reload.';
  sub.style.cssText = 'color: hsl(42 25% 75%); margin: 0 0 24px;';
  const pre = document.createElement('pre');
  pre.textContent = err.message;
  pre.style.cssText = 'white-space: pre-wrap; background: hsl(0 0% 7%); border: 1px solid hsl(14 80% 57% / 0.5); border-radius: 6px; padding: 18px; margin: 0;';
  wrap.append(heading, sub, pre);
  rootEl.append(wrap);
  console.error('[deck] Strict asset loader refused boot:', err);
}

// Strict file-existence check (v0.158): every URL declared in
// deck.assets.{audio,qr,brand} is HEAD-checked before render. Slug
// validation (initAssetRegistry) already ran synchronously in loader.ts;
// this layer enforces that the FILES those slugs point to actually exist.
//
// v0.173 — opt-in soft-fail path. Imported decks (and any deck with
// `assetPolicy.softFail: true`) skip the throw; failures land in the
// BrokenAssetReport store instead and surface via BrokenAssetOverlay.
// Image-decode probing also runs on this path so corrupt-but-200 files
// (e.g. a renamed .pdf served as .png) get caught.
// v0.211 — Mount React IMMEDIATELY, run the asset HEAD probes in parallel.
//
// Before this fix, `createRoot().render(<App/>)` only fired after the async
// HEAD-check chain resolved. On slow networks or cold dev-server starts the
// probes routinely take longer than the 3500ms boot watchdog in index.html,
// which then fires a phantom `blank-root` error overlay even though nothing
// is actually broken — the page was simply blocked on diagnostic fetches.
// Reproduced repeatedly on `/3` (and anywhere else the user happened to
// land first). Mounting React first lets the watchdog clear within a few
// hundred ms; the asset audit still runs and, if it fails in strict mode,
// REPLACES the React tree with the fatal overlay.
createRoot(rootEl).render(<App />);

const fileCheck: Promise<unknown> = useSoftAssetFailures
  ? reportDeclaredAssetFiles(deck)
      .then(() => {
        // HEAD pass complete — drop any cached url-fetch entries the
        // user has since fixed (only entries that re-failed this
        // session retained their cached=false flag).
        markVerificationPassFinished(['url-fetch-failed']);
        return probeDeclaredImageDecode(deck);
      })
      .then(() => {
        // Decode pass complete — same pruning logic for image-decode.
        markVerificationPassFinished(['image-decode-failed']);
      })
  : assertDeclaredAssetFiles(deck);

fileCheck
  .then(() => {
    // Spec 54 — runtime image QA. Fires after the React tree mounts so it
    // never competes with the first paint for sockets. Triggers:
    //   1. Always when `?qa=images` is in the URL (manual one-shot).
    //   2. In dev only, when the user is on /style-guide — the gallery
    //      page IS the reference-asset surface, so a regression there is
    //      what this audit catches.
    // Errors inside the QA loop are swallowed: this is a diagnostic, not
    // a boot blocker.
    const qaParam = new URLSearchParams(window.location.search).get('qa');
    const onStyleGuide = window.location.pathname.startsWith('/style-guide');
    const shouldRun = qaParam === 'images' || (import.meta.env.DEV && onStyleGuide);
    if (shouldRun) {
      // Defer to next idle tick so the first paint always wins the network.
      const fire = () => runRuntimeImageQA().then(logRuntimeImageQAReport).catch(() => {});
      type IdleAPI = (cb: () => void, opts?: { timeout: number }) => void;
      const ric = (window as unknown as { requestIdleCallback?: IdleAPI }).requestIdleCallback;
      if (typeof ric === 'function') ric(fire, { timeout: 2000 });
      else window.setTimeout(fire, 400);
    }
  })
  .catch((err: unknown) => {
    // Strict-mode failure: replace the (already-mounted) React tree with
    // the fatal overlay. In soft-fail mode this branch never runs — the
    // BrokenAssetOverlay surfaces issues without unmounting the app.
    renderFatalAssetError(err instanceof Error ? err : new Error(String(err)));
  });
