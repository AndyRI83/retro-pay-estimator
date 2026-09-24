import { trackEvent } from './analytics.mjs';

async function fetchAsFile(url, filename) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${filename}.`);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'application/pdf' });
}

export function downloadFile({ url, filename, eventPrefix = 'document' }) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  trackEvent(`${eventPrefix}-downloaded`);
}

export async function shareFileOrDownload({ url, filename, title, text, eventPrefix = 'document' }) {
  try {
    const file = await fetchAsFile(url, filename);
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title, text, files: [file] });
      trackEvent(`${eventPrefix}-shared`);
      return { mode: 'shared' };
    }
  } catch (error) {
    if (error?.name === 'AbortError') return { mode: 'cancelled' };
    // Fall through to a plain download. Sharing is a convenience, not a dependency.
  }

  downloadFile({ url, filename, eventPrefix });
  return { mode: 'downloaded' };
}

/**
 * Open the PDF normally. This is deliberately not an automatic print() call.
 * The user explicitly chose Print / Save PDF and can use the PDF viewer's own
 * print/save/share controls without Safari immediately searching for a printer.
 */
export function openForPrint({ url, eventPrefix = 'document' }) {
  const opened = window.open(url, '_blank', 'noopener');
  if (opened) {
    trackEvent(`${eventPrefix}-print-view-opened`);
    return true;
  }
  return false;
}
