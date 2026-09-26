import type { Theme } from '../lib/theme';
import { READABILITY_JS } from './readability.generated';

export type ReaderPayload = {
  subject: string;
  from: string;
  fromEmail: string;
  date: string;
  body: {
    kind: 'html' | 'text';
    data: string;
    charset: string;
    inline: Record<string, { mimeType: string; data: string }>;
  };
};

export type ReaderMessage = { type: 'archive' } | { type: 'ready'; mode: 'reader' | 'original' };

/** JSON that is safe to drop inside a <script> element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function css(t: Theme, insets: { top: number; bottom: number }) {
  return `
:root {
  --bg: ${t.bg}; --text: ${t.text}; --muted: ${t.muted}; --faint: ${t.faint};
  --hairline: ${t.hairline}; --accent: ${t.accent}; --on-accent: ${t.onAccent}; --surface: ${t.surface};
  --inset-top: ${insets.top}px; --inset-bottom: ${insets.bottom}px;
  color-scheme: ${t.scheme};
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
body {
  font-family: 'Newsreader', Georgia, 'Noto Serif', serif;
  font-size: 20px; line-height: 1.62; font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased; overflow-wrap: break-word; word-wrap: break-word;
  -webkit-tap-highlight-color: transparent;
}
.sheet { padding: calc(var(--inset-top) + 36px) 22px calc(var(--inset-bottom) + 40px); max-width: 720px; margin: 0 auto; }

/* Masthead */
.masthead { margin-bottom: 30px; }
.sender {
  font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 600;
  letter-spacing: .06em; text-transform: uppercase; color: var(--accent); margin: 0 0 12px;
}
h1.subject {
  font-family: 'Newsreader', Georgia, serif; font-weight: 600; font-size: 31px; line-height: 1.16;
  letter-spacing: -.012em; margin: 0 0 14px; text-wrap: balance;
}
.meta { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: var(--muted); margin: 0; }
.rule { height: 1px; background: var(--hairline); border: 0; margin: 26px 0 0; }

/* Reader-mode article typography */
#article { font-size: 20px; }
#article > :first-child { margin-top: 0 !important; }
#article p { margin: 0 0 1.05em; }
#article h1, #article h2, #article h3, #article h4 {
  font-family: 'Newsreader', Georgia, serif; font-weight: 600; line-height: 1.22;
  letter-spacing: -.008em; margin: 1.6em 0 .55em;
}
#article h1 { font-size: 1.45em; } #article h2 { font-size: 1.3em; } #article h3 { font-size: 1.14em; } #article h4 { font-size: 1em; }
#article a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: 3px; }
#article img, #article video, #article svg { max-width: 100% !important; height: auto !important; border-radius: 6px; display: block; margin: 1.2em auto; }
#article figure { margin: 1.6em 0; }
#article figcaption { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; line-height: 1.45; color: var(--muted); text-align: center; margin-top: -.4em; }
#article blockquote { margin: 1.4em 0; padding: 0 0 0 1em; border-left: 2px solid var(--accent); color: var(--muted); font-style: italic; }
#article ul, #article ol { padding-left: 1.3em; margin: 0 0 1.05em; }
#article li { margin: .3em 0; }
#article hr { border: 0; height: 1px; background: var(--hairline); margin: 2.2em 0; }
#article pre, #article code { font-family: ui-monospace, 'Roboto Mono', monospace; font-size: .8em; background: var(--surface); border-radius: 4px; }
#article code { padding: .1em .3em; }
#article pre { padding: 14px; overflow-x: auto; white-space: pre-wrap; }
#article table { max-width: 100% !important; width: auto !important; border-collapse: collapse; }
#article td, #article th { width: auto !important; padding: 0 !important; vertical-align: top; }
#article [style*="font-family"], #article font { font-family: inherit !important; }
#article * { color: inherit !important; background-color: transparent !important; max-width: 100%; }
#article a, #article a * { color: var(--accent) !important; }

/* Original-format view: the email's own HTML, isolated in a shadow root and scaled to fit. */
#original { background: #fff; color: #000; border-radius: 10px; overflow: hidden; margin: 0 -10px; }
html.dark #original { box-shadow: 0 0 0 1px var(--hairline); }

/* End of message */
.end { margin-top: 56px; display: flex; flex-direction: column; align-items: center; gap: 22px; font-family: 'Inter', system-ui, sans-serif; }
.fleuron { color: var(--faint); letter-spacing: .6em; font-size: 12px; }
.archive {
  appearance: none; border: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: none; color: var(--text); font: inherit; padding: 8px 24px;
}
.archive .disc {
  width: 68px; height: 68px; border-radius: 50%; background: var(--accent); color: var(--on-accent);
  display: grid; place-items: center; box-shadow: 0 6px 20px -8px var(--accent);
  transition: transform .15s ease;
}
.archive:active .disc { transform: scale(.92); }
.archive .label { font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
.toggle { appearance: none; border: 0; background: none; color: var(--faint); font: 13px/1 'Inter', system-ui, sans-serif; padding: 10px; text-decoration: underline; text-underline-offset: 3px; }
[hidden] { display: none !important; }
`;
}

const ARCHIVE_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="4.5" rx="1.2"/><path d="M5 8.5v9.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5"/><path d="M10 13h4"/></svg>`;

// Runs inside the WebView. Kept as plain ES2017 so it works on any Android System WebView.
const RENDER_JS = String.raw`
(function () {
  var P = window.__PAYLOAD;
  function post(msg) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
  function b64ToBytes(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function decode(data, charset) {
    var bytes = b64ToBytes(data);
    try { return new TextDecoder(charset || 'utf-8').decode(bytes); }
    catch (e) { return new TextDecoder('utf-8').decode(bytes); }
  }
  function b64Std(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return s; }
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var source = P.body.data ? decode(P.body.data, P.body.charset) : '';
  var articleEl = document.getElementById('article');
  var originalEl = document.getElementById('original');
  var toggle = document.getElementById('toggle');

  if (P.body.kind === 'text') {
    var linked = escapeHtml(source).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1">$1</a>');
    articleEl.innerHTML = linked.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(function (para) {
      return para.trim() ? '<p>' + para.trim().replace(/\n/g, '<br>') + '</p>' : '';
    }).join('');
    post({ type: 'ready', mode: 'reader' });
    return;
  }

  // Parse and sanitise the email's HTML once; both views are built from it.
  var doc = new DOMParser().parseFromString(source, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, form, meta[http-equiv], base, link[rel=stylesheet]').forEach(function (n) { n.remove(); });
  doc.querySelectorAll('*').forEach(function (el) {
    for (var i = el.attributes.length - 1; i >= 0; i--) {
      var a = el.attributes[i];
      if (/^on/i.test(a.name) || (/^(href|src)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
    }
  });
  // Inline (cid:) images → data URIs.
  doc.querySelectorAll('img[src^="cid:"]').forEach(function (img) {
    var cid = decodeURIComponent(img.getAttribute('src').slice(4));
    var part = P.body.inline[cid];
    if (part) img.setAttribute('src', 'data:' + part.mimeType + ';base64,' + b64Std(part.data));
  });
  // Tracking pixels only add noise.
  doc.querySelectorAll('img').forEach(function (img) {
    var w = img.getAttribute('width'), h = img.getAttribute('height');
    if ((w === '1' || w === '0') && (h === '1' || h === '0')) img.remove();
  });

  function textLength(root) { return ((root && root.textContent) || '').replace(/\s+/g, ' ').trim().length; }
  var fullLength = textLength(doc.body);

  // Emails are built from layout tables. Turned into plain blocks, each cell keeps
  // its own paragraph when Readability reflows it into a single readable column.
  function unwrapTables(root) {
    root.querySelectorAll('table, thead, tbody, tfoot, tr, td, th, center').forEach(function (el) {
      var div = el.ownerDocument.createElement('div');
      while (el.firstChild) div.appendChild(el.firstChild);
      el.replaceWith(div);
    });
  }

  var article = null;
  try {
    var readerDoc = doc.cloneNode(true);
    unwrapTables(readerDoc);
    article = new Readability(readerDoc, { charThreshold: 200, keepClasses: false }).parse();
  } catch (e) { article = null; }

  // Readability occasionally throws away most of a newsletter (e.g. link roundups).
  // Only trust it when it kept the bulk of the text.
  var readerOk = !!(article && article.content && article.length >= fullLength * 0.45);
  if (article && article.content) {
    articleEl.innerHTML = article.content;
    // Drop the empty spacer elements left behind by the email layout.
    var all = articleEl.querySelectorAll('div, p, span, section');
    for (var i = all.length - 1; i >= 0; i--) {
      var el = all[i];
      if (!el.textContent.trim() && !el.querySelector('img, video, picture, svg, hr')) el.remove();
    }
  }

  var originalBuilt = false;
  function buildOriginal() {
    if (originalBuilt) return;
    originalBuilt = true;
    var root = originalEl.attachShadow({ mode: 'open' });
    var styles = Array.prototype.map.call(doc.querySelectorAll('style'), function (s) { return s.outerHTML; }).join('');
    var bodyStyle = doc.body.getAttribute('style') || '';
    var bg = doc.body.getAttribute('bgcolor');
    root.innerHTML = styles +
      '<style>:host{display:block} .wrap{padding:8px;overflow:hidden} img{max-width:100%;height:auto} a{word-break:break-word}</style>' +
      '<div class="wrap"><div class="body" style="' + bodyStyle.replace(/"/g, '&quot;') + (bg ? ';background:' + bg : '') + '">' + doc.body.innerHTML + '</div></div>';
    var inner = root.querySelector('.body');
    function fit() {
      inner.style.zoom = 1;
      var available = originalEl.clientWidth - 16;
      var needed = inner.scrollWidth;
      if (needed > available + 2) inner.style.zoom = (available / needed).toFixed(4);
    }
    fit();
    root.querySelectorAll('img').forEach(function (img) { if (!img.complete) img.addEventListener('load', fit, { once: true }); });
    window.addEventListener('resize', fit);
  }

  var mode;
  function show(next) {
    mode = next;
    articleEl.hidden = mode !== 'reader';
    originalEl.hidden = mode !== 'original';
    if (mode === 'original') buildOriginal();
    toggle.textContent = mode === 'reader' ? 'View original formatting' : 'View in reader mode';
  }
  toggle.addEventListener('click', function () { show(mode === 'reader' ? 'original' : 'reader'); window.scrollTo(0, 0); });
  // Offer the other view only when the reader version is more than a scrap.
  if (!(article && article.content && article.length >= fullLength * 0.2)) toggle.hidden = true;
  show(readerOk ? 'reader' : 'original');
  post({ type: 'ready', mode: mode });
})();
`;

export function buildReaderHtml(
  payload: ReaderPayload,
  theme: Theme,
  insets: { top: number; bottom: number }
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!doctype html>
<html class="${theme.scheme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
<style>${css(theme, insets)}</style>
</head>
<body>
<main class="sheet">
  <header class="masthead">
    <p class="sender">${esc(payload.from)}</p>
    <h1 class="subject">${esc(payload.subject)}</h1>
    <p class="meta">${esc(payload.date)}</p>
    <hr class="rule">
  </header>
  <article id="article"></article>
  <section id="original" hidden></section>
  <footer class="end">
    <div class="fleuron">• • •</div>
    <button class="archive" id="archive" type="button">
      <span class="disc">${ARCHIVE_ICON}</span>
      <span class="label">Archive</span>
    </button>
    <button class="toggle" id="toggle" type="button"></button>
  </footer>
</main>
<script>window.__PAYLOAD = ${scriptJson(payload)};</script>
<script>${READABILITY_JS.replace(/<\/script/gi, '<\\/script')}</script>
<script>
document.getElementById('archive').addEventListener('click', function () {
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'archive' }));
});
${RENDER_JS}
</script>
</body>
</html>`;
}
