/** Next's internal URL can use the bind address (0.0.0.0); Host is the address the browser opened. */
export function isSameOrigin(origin: string | null, requestUrl: string, host: string | null): boolean {
  if (origin === null) return true;
  try {
    const url = new URL(requestUrl);
    const expected = host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
    return origin === expected;
  } catch { return false; }
}
