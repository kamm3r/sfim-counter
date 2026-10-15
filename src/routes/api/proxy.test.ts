import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './[...path]/+server.js';

afterEach(() => vi.unstubAllGlobals());

function request(path: string, query = ''): RequestEvent {
	const url = new URL(`http://localhost/api/${path}${query}`);
	return { params: { path }, url, request: new Request(url) } as unknown as RequestEvent;
}

describe('Tuloslista proxy', () => {
	it('rejects paths outside the read-only result API', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		expect((await GET(request('//other.example/private'))).status).toBe(404);
		expect((await GET(request('live/v1/admin'))).status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards the supported result endpoint to the fixed origin without query strings', async () => {
		const fetchMock = vi.fn(async () => Response.json({}));
		vi.stubGlobal('fetch', fetchMock);
		const response = await GET(request('live/v1/results/19929/123', '?t=1'));
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toContain('s-maxage=10');
		expect(fetchMock).toHaveBeenCalledWith(
			'https://cached-public-api.tuloslista.com/live/v1/results/19929/123',
			expect.objectContaining({ headers: { accept: 'application/json' }, redirect: 'manual', signal: expect.any(AbortSignal) })
		);
	});

	it('refuses to pass through non-JSON upstream content', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('<script>alert(1)</script>', { headers: { 'content-type': 'text/html' } })));
		const response = await GET(request('live/v1/competition'));
		expect(response.status).toBe(502);
		expect(response.headers.get('content-type')).toBe('application/json');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(await response.text()).not.toContain('<script>');
	});

	it('reports an upstream timeout as a gateway timeout', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timed out', 'TimeoutError'); }));
		expect((await GET(request('live/v1/competition'))).status).toBe(504);
	});

	it('does not cache upstream errors', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => Response.json({}, { status: 503 })));
		const response = await GET(request('live/v1/competition'));
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});
});
