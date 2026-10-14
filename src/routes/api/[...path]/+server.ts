import type { RequestEvent } from '@sveltejs/kit';

const API_ORIGIN = 'https://cached-public-api.tuloslista.com';
const UPSTREAM_TIMEOUT_MS = 10_000;
// Live viewers poll every 15 seconds; a short shared CDN cache lets them reuse
// one upstream request instead of each invoking the function.
const SUCCESS_CACHE_CONTROL = 'public, max-age=0, s-maxage=10, stale-while-revalidate=5';

function jsonError(status: number, message: string): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			'content-type': 'application/json',
			'cache-control': 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
}

export async function GET({ params, request }: RequestEvent) {
	const path = params.path ?? '';
	// Only expose the three read-only Tuloslista endpoints used by this app.
	// Reject absolute/protocol-relative paths so this cannot become an open proxy.
	if (!/^live\/v1\/(?:competition(?:\/\d+(?:\/properties)?)?|results\/\d+\/\d+)$/.test(path)) {
		return jsonError(404, 'Not found');
	}
	// The app never sends query strings, so none are forwarded upstream.
	const target = new URL(`/${path}`, API_ORIGIN);

	let res: Response;
	try {
		res = await fetch(target.toString(), {
			headers: { 'accept': 'application/json' },
			redirect: 'manual',
			signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)])
		});
	} catch (error) {
		const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
		return jsonError(timedOut ? 504 : 502, timedOut ? 'Upstream request timed out' : 'Upstream request failed');
	}

	// Only JSON is passed through, so upstream HTML can never render under this origin.
	if (!(res.headers.get('content-type') ?? '').toLowerCase().includes('json')) {
		await res.body?.cancel();
		return jsonError(502, `Unexpected upstream response (${res.status})`);
	}

	return new Response(res.body, {
		status: res.status,
		statusText: res.statusText,
		headers: {
			'content-type': 'application/json',
			'cache-control': res.ok ? SUCCESS_CACHE_CONTROL : 'no-store',
			'x-content-type-options': 'nosniff'
		}
	});
}
