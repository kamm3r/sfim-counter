import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { GET } from './[...path]/+server.js';

afterEach(() => vi.unstubAllGlobals());

function request(path: string, query = ''): RequestEvent {
	return { params: { path }, url: new URL(`http://localhost/api/${path}${query}`) } as unknown as RequestEvent;
}

describe('Tuloslista proxy', () => {
	it('rejects paths outside the read-only result API', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		expect((await GET(request('//other.example/private'))).status).toBe(404);
		expect((await GET(request('live/v1/admin'))).status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards the supported result endpoint to the fixed origin', async () => {
		const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		expect((await GET(request('live/v1/results/19929/123', '?t=1'))).status).toBe(200);
		expect(fetchMock).toHaveBeenCalledWith(
			'https://cached-public-api.tuloslista.com/live/v1/results/19929/123?t=1',
			{ headers: { accept: 'application/json' }, redirect: 'manual' }
		);
	});
});
