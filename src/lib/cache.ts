import { Directory, File, Paths } from 'expo-file-system';

import { FullMessage, getMessage, MessageSummary } from './gmail';

// Everything lives in the app's private documents directory:
//   folio/inbox.json          last known inbox, shown instantly on launch
//   folio/messages/<id>.json  full message bodies, prefetched in the background
const root = new Directory(Paths.document, 'folio');
const bodies = new Directory(root, 'messages');

function ensureDirs() {
  if (!bodies.exists) bodies.create({ intermediates: true, idempotent: true });
}

const bodyFile = (id: string) => new File(bodies, `${id}.json`);

type InboxSnapshot = { account: string; messages: MessageSummary[]; nextPageToken?: string };

export function readInbox(account: string): InboxSnapshot | null {
  try {
    const file = new File(root, 'inbox.json');
    if (!file.exists) return null;
    const snap = JSON.parse(file.textSync()) as InboxSnapshot;
    return snap.account === account ? snap : null;
  } catch {
    return null;
  }
}

export function writeInbox(snap: InboxSnapshot) {
  try {
    ensureDirs();
    new File(root, 'inbox.json').write(JSON.stringify(snap));
  } catch {}
}

export async function readMessage(id: string): Promise<FullMessage | null> {
  try {
    const file = bodyFile(id);
    return file.exists ? (JSON.parse(await file.text()) as FullMessage) : null;
  } catch {
    return null;
  }
}

function writeMessage(m: FullMessage) {
  try {
    ensureDirs();
    bodyFile(m.id).write(JSON.stringify(m));
  } catch {}
}

/** Cached copy if we have one, otherwise fetch (and cache) it. */
export async function loadMessage(id: string): Promise<FullMessage> {
  const cached = await readMessage(id);
  if (cached) return cached;
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;
  return fetchAndStore(id);
}

const pending = new Map<string, Promise<FullMessage>>();

function fetchAndStore(id: string): Promise<FullMessage> {
  const p = getMessage(id)
    .then((m) => {
      writeMessage(m);
      return m;
    })
    .finally(() => pending.delete(id));
  pending.set(id, p);
  return p;
}

const queue: string[] = [];
let running = 0;
const CONCURRENCY = 3;

/** Downloads every message that isn't cached yet, a few at a time, in list order. */
export function prefetch(ids: string[]) {
  for (const id of ids) {
    if (!queue.includes(id) && !pending.has(id) && !bodyFile(id).exists) queue.push(id);
  }
  pump();
}

function pump() {
  while (running < CONCURRENCY && queue.length) {
    const id = queue.shift()!;
    if (pending.has(id) || bodyFile(id).exists) continue;
    running++;
    fetchAndStore(id)
      .catch(() => {})
      .finally(() => {
        running--;
        pump();
      });
  }
}

/** Drops cached bodies for messages that are no longer in the inbox. */
export function prune(keep: Set<string>) {
  try {
    if (!bodies.exists) return;
    for (const entry of bodies.list()) {
      const id = entry.name.replace(/\.json$/, '');
      if (entry instanceof File && !keep.has(id) && !pending.has(id)) entry.delete();
    }
  } catch {}
}

export function clearCache() {
  queue.length = 0;
  try {
    if (root.exists) root.delete();
  } catch {}
}
