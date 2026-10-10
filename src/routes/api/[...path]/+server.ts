import type { RequestEvent } from '@sveltejs/kit';

const API_ORIGIN = 'https://cached-public-api.tuloslista.com';

export async function GET({ params, url }: RequestEvent) {
	const path = params.path ?? '';
	// Only expose the three read-only Tuloslista endpoints used by this app.
	// Reject absolute/protocol-relative paths so this cannot become an open proxy.
	if (!/^live\/v1\/(?:competition(?:\/\d+(?:\/properties)?)?|results\/\d+\/\d+)$/.test(path)) {
		return new Response('Not found', { status: 404 });
	}
	const target = new URL(`/${path}`, API_ORIGIN);
	target.search = url.search;

	const res = await fetch(target.toString(), {
		headers: { 'accept': 'application/json' },
		redirect: 'manual'
	});

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: {
			'content-type': res.headers.get('content-type') ?? 'application/json',
			'cache-control': 'no-store'
		}
	});
}
