import { AuthError, getAccessToken } from './auth';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export type MessageSummary = {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  /** Milliseconds since epoch. */
  date: number;
};

type Header = { name: string; value: string };

type MessagePart = {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers?: Header[];
  body?: { size: number; data?: string; attachmentId?: string };
  parts?: MessagePart[];
};

type RawMessage = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: MessagePart;
};

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const token = await getAccessToken(retried);
  const res = await fetch(API + path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    if (!retried) return request<T>(path, init, true);
    throw new AuthError('Signed out');
  }
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message ?? '';
    } catch {}
    throw new Error(detail || `Gmail request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function header(part: MessagePart | undefined, name: string): string {
  const lower = name.toLowerCase();
  return part?.headers?.find((h) => h.name.toLowerCase() === lower)?.value ?? '';
}

/** `"Jane Doe" <jane@x.com>` → { name: 'Jane Doe', email: 'jane@x.com' } */
export function parseAddress(value: string): { name: string; email: string } {
  const match = value.match(/^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/);
  if (match) {
    const email = match[2].trim();
    return { name: match[1]?.trim() || email, email };
  }
  return { name: value.trim(), email: value.trim() };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function toSummary(m: RawMessage): MessageSummary {
  const from = parseAddress(header(m.payload, 'From'));
  return {
    id: m.id,
    threadId: m.threadId,
    from: from.name,
    fromEmail: from.email,
    subject: header(m.payload, 'Subject') || '(no subject)',
    // Snippets pad with invisible preheader characters; strip them.
    snippet: decodeEntities(m.snippet ?? '')
      .replace(/[͏​-‍⁠﻿­]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
    date: Number(m.internalDate ?? 0),
  };
}

export async function listInbox(
  pageToken?: string
): Promise<{ messages: MessageSummary[]; nextPageToken?: string }> {
  const params = new URLSearchParams({ labelIds: 'INBOX', maxResults: '30' });
  if (pageToken) params.set('pageToken', pageToken);
  const list = await request<{ messages?: { id: string }[]; nextPageToken?: string }>(
    `/messages?${params}`
  );
  const ids = list.messages?.map((m) => m.id) ?? [];
  const metadata = '&metadataHeaders=From&metadataHeaders=Subject';
  const raw = await Promise.all(
    ids.map((id) => request<RawMessage>(`/messages/${id}?format=metadata${metadata}`))
  );
  const messages = raw.map(toSummary).sort((a, b) => b.date - a.date);
  return { messages, nextPageToken: list.nextPageToken };
}

export async function archive(id: string): Promise<void> {
  await request(`/messages/${id}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
  });
}

export async function unarchive(id: string): Promise<void> {
  await request(`/messages/${id}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addLabelIds: ['INBOX'] }),
  });
}

/** Body data stays base64url-encoded; the reader WebView decodes it with the right charset. */
export type MessageBody = {
  kind: 'html' | 'text';
  data: string;
  charset: string;
  /** Inline images referenced as `cid:` URLs, keyed by Content-ID. */
  inline: Record<string, { mimeType: string; data: string }>;
};

export type FullMessage = MessageSummary & { to: string; body: MessageBody };

function walk(part: MessagePart, visit: (p: MessagePart) => void) {
  visit(part);
  part.parts?.forEach((p) => walk(p, visit));
}

function charsetOf(part: MessagePart): string {
  const m = header(part, 'Content-Type').match(/charset="?([^";\s]+)"?/i);
  return m ? m[1] : 'utf-8';
}

async function partData(messageId: string, part: MessagePart): Promise<string> {
  if (part.body?.data) return part.body.data;
  if (part.body?.attachmentId) {
    const att = await request<{ data: string }>(
      `/messages/${messageId}/attachments/${part.body.attachmentId}`
    );
    return att.data;
  }
  return '';
}

const MAX_INLINE_BYTES = 8 * 1024 * 1024;

/**
 * Fetches the complete message. Unlike the Gmail app there is no ~100KB
 * clipping: the API always returns the full body.
 */
export async function getMessage(id: string): Promise<FullMessage> {
  const m = await request<RawMessage>(`/messages/${id}?format=full`);
  const payload = m.payload!;

  let html: MessagePart | undefined;
  let text: MessagePart | undefined;
  const images: MessagePart[] = [];
  walk(payload, (p) => {
    const isAttachment = /attachment/i.test(header(p, 'Content-Disposition'));
    if (p.mimeType === 'text/html' && !isAttachment && !html) html = p;
    else if (p.mimeType === 'text/plain' && !isAttachment && !text) text = p;
    else if (p.mimeType.startsWith('image/') && header(p, 'Content-ID')) images.push(p);
  });

  const chosen = html ?? text;
  const body: MessageBody = {
    kind: html ? 'html' : 'text',
    data: chosen ? await partData(id, chosen) : '',
    charset: chosen ? charsetOf(chosen) : 'utf-8',
    inline: {},
  };

  if (html) {
    let budget = MAX_INLINE_BYTES;
    const wanted = images.filter((p) => {
      const cid = header(p, 'Content-ID').replace(/[<>]/g, '');
      const size = p.body?.size ?? 0;
      if (!body.data || size > budget) return false;
      budget -= size;
      return cid.length > 0;
    });
    const loaded = await Promise.all(
      wanted.map(async (p) => {
        try {
          return [header(p, 'Content-ID').replace(/[<>]/g, ''), p.mimeType, await partData(id, p)] as const;
        } catch {
          return null;
        }
      })
    );
    for (const entry of loaded) {
      if (entry) body.inline[entry[0]] = { mimeType: entry[1], data: entry[2] };
    }
  }

  return { ...toSummary(m), to: header(payload, 'To'), body };
}
