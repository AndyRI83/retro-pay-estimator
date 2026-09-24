/**
 * Privacy-preserving GoatCounter integration for Retro Pay Checker.
 *
 * Tracks anonymous page views plus short feature-event names only.
 * Never pass PDF contents, filenames, names, IDs, pay amounts, pay codes,
 * statement dates, or audit results into trackEvent().
 */
const DEFAULT_ENDPOINT = 'https://andyr83.goatcounter.com/count';
const queue = [];
let loading = false;
let loadAttempted = false;

function configuredEndpoint() {
  const candidate = globalThis?.RETRO_ANALYTICS_ENDPOINT || DEFAULT_ENDPOINT;
  return typeof candidate === 'string' && /^https:\/\/[^/]+\.goatcounter\.com\/count\/?$/i.test(candidate.trim())
    ? candidate.trim().replace(/\/$/, '')
    : null;
}

function safePagePath() {
  try { return globalThis.location?.pathname || '/'; } catch { return '/'; }
}

function flush() {
  if (!globalThis?.goatcounter?.count) return;
  while (queue.length) {
    const eventName = queue.shift();
    try {
      globalThis.goatcounter.count({ path: eventName, title: eventName, event: true });
    } catch {
      // Analytics must never interfere with payroll analysis.
    }
  }
}

function ensureLoaded() {
  const endpoint = configuredEndpoint();
  if (!endpoint) return false;
  if (globalThis?.goatcounter?.count) { flush(); return true; }
  if (loading || loadAttempted) return true;
  if (typeof document === 'undefined') return false;

  loadAttempted = true;
  loading = true;

  // no_events prevents GoatCounter from auto-binding click handlers. We send only
  // the intentionally named events below. path strips query strings, and referrer
  // is blank so the tool does not intentionally send the referring page.
  globalThis.goatcounter = {
    ...(globalThis.goatcounter || {}),
    no_events: true,
    path: () => safePagePath(),
    referrer: '',
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = endpoint;
  script.addEventListener('load', () => { loading = false; flush(); });
  script.addEventListener('error', () => { loading = false; queue.length = 0; });
  document.head.appendChild(script);
  return true;
}

export function trackEvent(eventName) {
  if (!configuredEndpoint() || typeof eventName !== 'string' || !eventName.trim()) return false;
  const clean = eventName.trim().replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
  if (!clean) return false;
  queue.push(clean);
  ensureLoaded();
  flush();
  return true;
}

// Importing this module enables the ordinary anonymous pageview count.
ensureLoaded();
