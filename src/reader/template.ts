import type { Theme } from '../lib/theme';
import { ICONS, READABILITY_JS } from './assets.generated';

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

export type ReaderMessage =
  | { type: 'archiving' } // button tapped; the celebration is playing
  | { type: 'archive' } // celebration done; archive and leave
  | { type: 'ready'; mode: 'reader' | 'original' };

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
  --hairline: ${t.hairline}; --surface: ${t.surface};
  --inset-top: ${insets.top}px; --inset-bottom: ${insets.bottom}px;
  color-scheme: ${t.scheme};
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); }
body {
  /* Same stack as Substack: the phone's own sans-serif, already on the device. */
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 18px; line-height: 1.6;
  -webkit-font-smoothing: antialiased; overflow-wrap: break-word; word-wrap: break-word;
  -webkit-tap-highlight-color: transparent;
}
.sheet { padding: calc(var(--inset-top) + 36px) 22px calc(var(--inset-bottom) + 40px); max-width: 720px; margin: 0 auto; }

/* Masthead */
.masthead { margin-bottom: 28px; }
.sender { font-size: 13px; font-weight: 700; color: var(--muted); margin: 0 0 10px; }
h1.subject { font-weight: 700; font-size: 28px; line-height: 1.2; letter-spacing: -.015em; margin: 0 0 12px; text-wrap: balance; }
.meta { font-size: 13px; color: var(--muted); margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; }
.meta > * + *::before { content: '·'; display: inline-block; margin: 0 .5em; color: var(--faint); text-decoration: none; }
.meta .link {
  appearance: none; border: 0; background: none; padding: 0; font: inherit; color: var(--muted);
  text-decoration: underline; text-decoration-color: var(--faint); text-underline-offset: 3px; cursor: pointer;
}
.rule { height: 1px; background: var(--hairline); border: 0; margin: 24px 0 0; }

/* Reader-mode article typography */
#article > :first-child { margin-top: 0 !important; }
#article p { margin: 0 0 1.1em; }
#article h1, #article h2, #article h3, #article h4 { font-weight: 700; line-height: 1.25; letter-spacing: -.01em; margin: 1.6em 0 .55em; }
#article h1 { font-size: 1.4em; } #article h2 { font-size: 1.25em; } #article h3 { font-size: 1.1em; } #article h4 { font-size: 1em; }
#article a { text-decoration: underline; text-decoration-thickness: 1px; text-decoration-color: var(--faint); text-underline-offset: 3px; }
#article img, #article video, #article svg { max-width: 100% !important; height: auto !important; border-radius: 4px; display: block; margin: 1.2em auto; }
#article figure { margin: 1.6em 0; }
#article figcaption { font-size: 13px; line-height: 1.45; color: var(--muted) !important; text-align: center; margin-top: -.4em; }
#article blockquote { margin: 1.4em 0; padding: 0 0 0 1em; border-left: 2px solid var(--text); color: var(--muted) !important; }
#article ul, #article ol { padding-left: 1.3em; margin: 0 0 1.1em; }
#article li { margin: .3em 0; }
#article hr { border: 0; height: 1px; background: var(--hairline); margin: 2.2em 0; }
#article pre, #article code { font-family: ui-monospace, 'Roboto Mono', monospace; font-size: .85em; background: var(--surface) !important; border-radius: 4px; }
#article code { padding: .1em .3em; }
#article pre { padding: 14px; overflow-x: auto; white-space: pre-wrap; }
#article [style*="font-family"], #article font { font-family: inherit !important; }
#article * { color: inherit !important; background-color: transparent !important; max-width: 100%; }

/* Original-format view: the email's own HTML, isolated in a shadow root and scaled to fit.
   In dark mode its colours are remapped by script (see darken), images untouched. */
#original { margin: 0 -8px; }

/* End of message */
.end { margin-top: 56px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.dots { color: var(--faint); letter-spacing: .6em; font-size: 12px; }
.archive { appearance: none; border: 0; background: none; padding: 8px; cursor: pointer; }
.archive .disc {
  position: relative; width: 64px; height: 64px; border-radius: 50%; background: var(--text); color: var(--bg);
  display: grid; place-items: center; transition: transform .12s ease;
}
.archive .disc > span { grid-area: 1 / 1; display: grid; place-items: center; transition: opacity .2s ease, transform .34s cubic-bezier(.3, 1.5, .5, 1); }
.archive .disc svg { width: 30px; height: 30px; }
.archive .icon-check { opacity: 0; transform: scale(.4) rotate(-25deg); }
.archive:active .disc { transform: scale(.92); }

/* Archived: the disc pops, the box gives way to a check, and a soft ring ripples out. */
.archive.done .disc { animation: pop .46s cubic-bezier(.3, 1.4, .5, 1); }
.archive.done .icon-archive { opacity: 0; transform: scale(.6) translateY(-5px); }
.archive.done .icon-check { opacity: 1; transform: none; transition-delay: .08s; }
.archive .disc::after { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid var(--text); opacity: 0; pointer-events: none; }
.archive.done .disc::after { animation: ring .75s cubic-bezier(.2, .6, .3, 1); }
@keyframes pop { 0% { transform: scale(.88); } 45% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes ring { 0% { opacity: .45; transform: scale(1); } 100% { opacity: 0; transform: scale(2); } }

/* Sparkles drifting up from the bottom of the screen. */
.sparkles { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 10; }
.spark {
  position: absolute; bottom: -16px; color: var(--text); opacity: 0;
  animation: rise var(--dur) cubic-bezier(.15, .6, .35, 1) var(--delay) forwards;
}
.spark svg { display: block; width: 100%; height: 100%; }
.spark.dot { border-radius: 50%; background: var(--text); }
@keyframes rise {
  0% { opacity: 0; transform: translate(0, 0) scale(.3) rotate(0deg); }
  18% { opacity: var(--o); }
  60% { opacity: calc(var(--o) * .8); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--r)); }
}
@media (prefers-reduced-motion: reduce) {
  .archive.done .disc, .archive.done .disc::after { animation: none; }
}
[hidden] { display: none !important; }
`;
}

// The archive button's little celebration: pop + check, sparkles rising from the
// bottom of the screen, then the app is told to archive and go back.
const ARCHIVE_JS = String.raw`
(function () {
  var button = document.getElementById('archive');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SPARKLE = __SPARKLE__;
  function post(msg) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

  function sparkle() {
    var layer = document.createElement('div');
    layer.className = 'sparkles';
    var w = window.innerWidth, h = window.innerHeight;
    for (var i = 0; i < 18; i++) {
      var star = i % 3 !== 2; // two stars for every dot
      var el = document.createElement('span');
      el.className = star ? 'spark' : 'spark dot';
      if (star) el.innerHTML = SPARKLE;
      var size = star ? 7 + Math.random() * 9 : 3 + Math.random() * 3;
      el.style.cssText =
        'left:' + (w * (0.06 + Math.random() * 0.88)).toFixed(0) + 'px;' +
        'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;' +
        '--dx:' + ((Math.random() - 0.5) * 70).toFixed(0) + 'px;' +
        '--dy:' + (-(0.28 + Math.random() * 0.45) * h).toFixed(0) + 'px;' +
        '--r:' + ((Math.random() - 0.5) * 200).toFixed(0) + 'deg;' +
        '--o:' + (0.35 + Math.random() * 0.55).toFixed(2) + ';' +
        '--dur:' + (850 + Math.random() * 500).toFixed(0) + 'ms;' +
        '--delay:' + (Math.random() * 240).toFixed(0) + 'ms';
      layer.appendChild(el);
    }
    document.body.appendChild(layer);
  }

  button.addEventListener('click', function () {
    if (button.classList.contains('done')) return;
    button.classList.add('done');
    button.setAttribute('aria-label', 'Archived');
    post({ type: 'archiving' });
    if (!reduceMotion) sparkle();
    setTimeout(function () { post({ type: 'archive' }); }, reduceMotion ? 250 : 700);
  });
})();
`;

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
  var readingTime = document.getElementById('reading-time');

  function setReadingTime(text) {
    var words = (text.match(/\S+/g) || []).length;
    readingTime.textContent = Math.max(1, Math.round(words / 230)) + ' min read';
  }
  // Wait for layout to settle before telling the app it can fade the page in.
  function ready(mode) {
    requestAnimationFrame(function () { requestAnimationFrame(function () { post({ type: 'ready', mode: mode }); }); });
  }

  if (P.body.kind === 'text') {
    var linked = escapeHtml(source).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1">$1</a>');
    articleEl.innerHTML = linked.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(function (para) {
      return para.trim() ? '<p>' + para.trim().replace(/\n/g, '<br>') + '</p>' : '';
    }).join('');
    toggle.hidden = true;
    setReadingTime(source);
    ready('reader');
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
      '<style>:host{display:block} .wrap{padding:8px;overflow:hidden;background:#fff;color:#000} img{max-width:100%;height:auto} a{word-break:break-word}</style>' +
      '<div class="wrap"><div class="body" style="' + bodyStyle.replace(/"/g, '&quot;') + (bg ? ';background:' + bg : '') + '">' + doc.body.innerHTML + '</div></div>';
    var inner = root.querySelector('.body');
    if (document.documentElement.classList.contains('dark')) darken(root);
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

  // Dark mode for the original layout, one-way like Dark Reader: light backgrounds
  // become dark and dark text becomes light, keeping each colour's hue. Colours that
  // already suit a dark page (a navy header, white text on it) are left alone.
  // Images are untouched.
  function darken(root) {
    var LO = 17 / 255, HI = 237 / 255;
    function flip(value, isBackground) {
      var m = value && value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      var c = m[1].split(',').map(parseFloat);
      if (c.length === 4 && c[3] === 0) return null;
      var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0, d = max - min;
      if (d) {
        s = d / (1 - Math.abs(2 * l - 1));
        h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60; if (h < 0) h += 360;
      }
      if (isBackground) {
        if (l > 0.5) l = LO + (1 - l) * (HI - LO);
      } else {
        if (l < 0.5) l = LO + (1 - l) * (HI - LO);
        l = Math.max(l, 0.68); // keep coloured text (links) readable on a dark page
      }
      var a = c.length === 4 ? c[3] : 1;
      return 'hsla(' + h.toFixed(1) + ',' + (s * 100).toFixed(1) + '%,' + (l * 100).toFixed(1) + '%,' + a + ')';
    }
    var props = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
    var els = Array.prototype.slice.call(root.querySelectorAll('*'));
    // Read everything first, then write, so inherited colours aren't flipped twice.
    var updates = els.map(function (el) {
      var cs = getComputedStyle(el);
      return props.map(function (prop) { return flip(cs.getPropertyValue(prop), prop !== 'color'); });
    });
    els.forEach(function (el, i) {
      props.forEach(function (prop, j) { if (updates[i][j]) el.style.setProperty(prop, updates[i][j], 'important'); });
    });
  }

  var mode;
  function show(next) {
    mode = next;
    articleEl.hidden = mode !== 'reader';
    originalEl.hidden = mode !== 'original';
    if (mode === 'original') buildOriginal();
    toggle.textContent = mode === 'reader' ? 'View original' : 'Reader view';
  }
  toggle.addEventListener('click', function () { show(mode === 'reader' ? 'original' : 'reader'); });
  // Offer the other view only when the reader version is more than a scrap.
  if (!(article && article.content && article.length >= fullLength * 0.2)) toggle.hidden = true;
  show(readerOk ? 'reader' : 'original');
  setReadingTime(readerOk ? articleEl.textContent : doc.body.textContent);
  ready(mode);
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
<style>${css(theme, insets)}</style>
</head>
<body>
<main class="sheet">
  <header class="masthead">
    <p class="sender">${esc(payload.from)}</p>
    <h1 class="subject">${esc(payload.subject)}</h1>
    <p class="meta"><span>${esc(payload.date)}</span><span id="reading-time"></span><button class="link" id="toggle" type="button"></button></p>
    <hr class="rule">
  </header>
  <article id="article"></article>
  <section id="original" hidden></section>
  <footer class="end">
    <div class="dots">• • •</div>
    <button class="archive" id="archive" type="button" aria-label="Archive">
      <span class="disc"><span class="icon-archive">${ICONS.archive}</span><span class="icon-check">${ICONS.check}</span></span>
    </button>
  </footer>
</main>
<script>window.__PAYLOAD = ${scriptJson(payload)};</script>
<script>${READABILITY_JS.replace(/<\/script/gi, '<\\/script')}</script>
<script>
${ARCHIVE_JS.replace('__SPARKLE__', JSON.stringify(ICONS.sparkle))}
${RENDER_JS}
</script>
</body>
</html>`;
}
