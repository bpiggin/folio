import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import * as auth from './auth';
import * as gmail from './gmail';
import type { MessageSummary } from './gmail';

type Status = 'idle' | 'loading' | 'refreshing' | 'loadingMore';

type Store = {
  /** undefined while restoring the session on launch. */
  account: auth.Account | null | undefined;
  messages: MessageSummary[];
  status: Status;
  error: string | null;
  hasMore: boolean;
  /** Most recently archived message, for the undo toast. */
  lastArchived: MessageSummary | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  archive: (id: string) => void;
  undoArchive: () => void;
  dismissUndo: () => void;
  find: (id: string) => MessageSummary | undefined;
};

const Ctx = createContext<Store | null>(null);

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<auth.Account | null | undefined>(undefined);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastArchived, setLastArchived] = useState<MessageSummary | null>(null);
  const pageToken = useRef<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  // Ids archived in this session; filtered out of refreshes that race the API.
  const archived = useRef(new Set<string>());

  const handleError = useCallback((e: unknown) => {
    if (e instanceof auth.AuthError) {
      setAccount(null);
      setMessages([]);
      return;
    }
    setError(message(e));
  }, []);

  const load = useCallback(
    async (mode: 'loading' | 'refreshing') => {
      setStatus(mode);
      setError(null);
      try {
        const page = await gmail.listInbox();
        pageToken.current = page.nextPageToken;
        setHasMore(!!page.nextPageToken);
        setMessages(page.messages.filter((m) => !archived.current.has(m.id)));
      } catch (e) {
        handleError(e);
      } finally {
        setStatus('idle');
      }
    },
    [handleError]
  );

  const start = useCallback(
    (acct: auth.Account | null) => {
      setAccount(acct);
      if (acct) load('loading');
    },
    [load]
  );

  useEffect(() => {
    auth.restoreSession().then(start);
  }, [start]);

  const loadMore = useCallback(async () => {
    if (status !== 'idle' || !pageToken.current) return;
    setStatus('loadingMore');
    try {
      const page = await gmail.listInbox(pageToken.current);
      pageToken.current = page.nextPageToken;
      setHasMore(!!page.nextPageToken);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...page.messages.filter((m) => !seen.has(m.id) && !archived.current.has(m.id))];
      });
    } catch (e) {
      handleError(e);
    } finally {
      setStatus('idle');
    }
  }, [status, handleError]);

  const archive = useCallback(
    (id: string) => {
      const msg = messages.find((m) => m.id === id);
      archived.current.add(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (msg) setLastArchived(msg);
      gmail.archive(id).catch((e) => {
        archived.current.delete(id);
        if (msg) setMessages((prev) => [...prev, msg].sort((a, b) => b.date - a.date));
        setLastArchived(null);
        handleError(e);
      });
    },
    [messages, handleError]
  );

  const undoArchive = useCallback(() => {
    const msg = lastArchived;
    if (!msg) return;
    setLastArchived(null);
    archived.current.delete(msg.id);
    setMessages((prev) => [...prev, msg].sort((a, b) => b.date - a.date));
    gmail.unarchive(msg.id).catch(handleError);
  }, [lastArchived, handleError]);

  const value = useMemo<Store>(
    () => ({
      account,
      messages,
      status,
      error,
      hasMore,
      lastArchived,
      signIn: async () => {
        setError(null);
        try {
          const acct = await auth.signIn();
          if (acct) start(acct);
        } catch (e) {
          setError(message(e));
        }
      },
      signOut: async () => {
        await auth.signOut().catch(() => {});
        setAccount(null);
        setMessages([]);
      },
      refresh: () => load('refreshing'),
      loadMore,
      archive,
      undoArchive,
      dismissUndo: () => setLastArchived(null),
      find: (id) => messages.find((m) => m.id === id),
    }),
    [account, messages, status, error, hasMore, lastArchived, load, start, loadMore, archive, undoArchive]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
