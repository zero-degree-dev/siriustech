import { describe, expect, it } from 'vitest';
import { isSameOrigin } from '@/shared/api/same-origin';

describe('API origin validation behind the Next.js bind address', () => {
  it.each(['localhost:3000', '127.0.0.1:3000', '192.168.1.10:3000'])(
    'accepts the browser host %s even when Next binds to 0.0.0.0', host => {
      expect(isSameOrigin(`http://${host}`, 'http://0.0.0.0:3000/api/chat/sessions', host)).toBe(true);
    },
  );
  it.each(['https://evil.example', 'http://localhost:3001', 'null', 'https://localhost:3000', ''])('rejects foreign or invalid Origin %s', origin => {
    expect(isSameOrigin(origin, 'http://0.0.0.0:3000/api/chat/sessions', 'localhost:3000')).toBe(false);
  });
  it('allows clients without an Origin header', () => {
    expect(isSameOrigin(null, 'http://localhost:3000/api/services', 'localhost:3000')).toBe(true);
  });
});
