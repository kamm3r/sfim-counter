import type { EventDetail } from './types.js';

// Not retried: a retry would immediately "confirm" the removal it rejected.
export class RefreshRejectedError extends Error {
	name = 'RefreshRejectedError';
}

// A live refresh that drops previously loaded events is usually a glitch (an
// empty or truncated catalog), not a real schedule change. Such a refresh is
// rejected, so the query keeps the last good standings. If the next refresh
// drops exactly the same events, the change is treated as confirmed. An empty
// catalog never replaces loaded results.
export function createRefreshGuard() {
	let pendingRemoval: string | null = null;

	return function checkRefresh(previous: EventDetail[] | undefined, next: EventDetail[]): void {
		const nextIds = new Set(next.map((event) => event.Id));
		const missing = (previous ?? []).map((event) => event.Id).filter((id) => !nextIds.has(id)).sort((a, b) => a - b);
		if (missing.length === 0) {
			pendingRemoval = null;
			return;
		}
		if (next.length === 0) {
			throw new RefreshRejectedError('The latest refresh returned no events; keeping the previous standings.');
		}

		const removal = missing.join(',');
		if (pendingRemoval === removal) {
			pendingRemoval = null;
			return;
		}
		pendingRemoval = removal;
		throw new RefreshRejectedError(`${missing.length} previously loaded event(s) are missing from the latest refresh; keeping the previous standings until the next refresh confirms the change.`);
	};
}
