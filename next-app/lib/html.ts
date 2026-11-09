/** Escapes text for use inside HTML. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only web addresses are allowed as links. Anything else (like javascript:) becomes empty. */
export function safeUrl(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}
