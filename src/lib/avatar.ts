/**
 * Picks the website that best represents a sender, for its favicon:
 * `astralcodexten@substack.com` → `astralcodexten.substack.com`,
 * `news@email.nytimes.com` → `nytimes.com`.
 */
export function senderSite(email: string): string | null {
  const [local, domain] = email.toLowerCase().trim().split('@');
  if (!local || !domain || !domain.includes('.')) return null;
  if (domain === 'substack.com' && !/^(no-?reply|reply|hello|support)$/.test(local)) {
    return `${local}.substack.com`;
  }
  const labels = domain.split('.');
  const n = labels.length;
  // Keep the registrable domain; handle two-part suffixes like co.uk / com.au.
  const keep = n >= 3 && labels[n - 1].length === 2 && labels[n - 2].length <= 3 ? 3 : 2;
  return labels.slice(-keep).join('.');
}

export function avatarUrl(email: string): string | null {
  const site = senderSite(email);
  return site ? `https://www.google.com/s2/favicons?domain=${site}&sz=64` : null;
}
