import { getApiConfig } from '@/shared/config/server';
import { isSameOrigin } from '@/shared/api/same-origin';

// A narrow same-origin proxy. Provider credentials never pass through this route.
async function proxy(req: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const route = path.join('/');
  const allowed = (req.method === 'GET' && (route === 'services' || /^services\/[a-z0-9-]+$/.test(route) || route === 'chat/messages' || route === 'health'))
    || (req.method === 'POST' && ['requests', 'chat/sessions', 'chat/messages'].includes(route))
    || (req.method === 'DELETE' && route === 'chat/session');
  if (!allowed) return Response.json({ message: 'Not found' }, { status: 404 });
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if (!isSameOrigin(origin, req.url, req.headers.get('host'))) return Response.json({ message: 'Forbidden origin' }, { status: 403 });
  }
  try {
    const { baseUrl } = getApiConfig();
    const target = new URL(`/api/${route}`, baseUrl);
    target.search = new URL(req.url).search;
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const auth = req.headers.get('authorization');
    if (auth && route.startsWith('chat/')) headers.set('Authorization', auth);
    let body: string | undefined;
    if (req.method === 'POST') {
      // Enforce the body cap while reading, including chunked requests.
      const reader = req.body?.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (reader) {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > 32768) { await reader.cancel(); return Response.json({ message: 'Payload too large' }, { status: 413 }); }
          chunks.push(chunk.value);
        }
      }
      body = Buffer.concat(chunks).toString('utf8');
    }
    const response = await fetch(target, { method: req.method, headers, body, cache: 'no-store', signal: AbortSignal.any([req.signal, AbortSignal.timeout(55000)]) });
    const responseHeaders = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    const retryAfter = response.headers.get('retry-after');
    if (retryAfter) responseHeaders.set('Retry-After', retryAfter);
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch { return Response.json({ message: 'Сервер временно недоступен' }, { status: 503 }); }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
