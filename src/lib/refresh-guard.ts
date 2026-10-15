import type { EventDetail } from './types.js';
import { roundHasResults } from './scoring.js';

// Not retried: a retry would immediately "confirm" the removal it rejected.
export class RefreshRejectedError extends Error {
	name = 'RefreshRejectedError';
}

const eventHasResults = (event: EventDetail) => event.Rounds.some(roundHasResults);

// Missing events or cleared result lists must be confirmed by the next refresh.
// A wholly empty catalog or loss of every recorded result never replaces the
// last good standings or browser snapshot.
export function createRefreshGuard() {
	let pendingRemoval: string | null = null;

	return function checkRefresh(previous: EventDetail[] | undefined, next: EventDetail[]): void {
		const prev = previous ?? [];
		const nextById = new Map(next.map((event) => [event.Id, event]));
		const missing = prev.map((event) => event.Id).filter((id) => !nextById.has(id)).sort((a, b) => a - b);
		const cleared = prev.filter((event) => eventHasResults(event) &&
			nextById.has(event.Id) && !eventHasResults(nextById.get(event.Id)!))
			.map((event) => event.Id).sort((a, b) => a - b);
		if (missing.length === 0 && cleared.length === 0) {
			pendingRemoval = null;
			return;
		}
		if (next.length === 0) {
			pendingRemoval = null;
			throw new RefreshRejectedError('The latest refresh returned no events; keeping the previous standings.');
		}
		if (prev.some(eventHasResults) && !next.some(eventHasResults)) {
			pendingRemoval = null;
			throw new RefreshRejectedError('The latest refresh returned no result rows; keeping the previous standings.');
		}

		const removal = JSON.stringify({ missing, cleared });
		if (pendingRemoval === removal) {
			pendingRemoval = null;
			return;
		}
		pendingRemoval = removal;
		throw new RefreshRejectedError(`${missing.length} event(s) are missing and ${cleared.length} event(s) lost their results; keeping the previous standings until the next refresh confirms the change.`);
	};
}
