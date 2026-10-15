import { getResults } from './api.js';
import { getPinnedArchive } from './archives.js';
import { createRefreshGuard } from './refresh-guard.js';
import { saveResultsSnapshot } from './result-storage.js';
import type { EventDetail } from './types.js';

// Each request keeps its competition identity across awaits and each competition
// confirms its own removals, even when navigation leaves another fetch in flight.
export function createResultsRefresher(getPrevious: (compId: number) => EventDetail[] | undefined) {
	const guards = new Map<number, ReturnType<typeof createRefreshGuard>>();
	return async (compId: number): Promise<EventDetail[]> => {
		const results = await getResults(compId);
		if (!getPinnedArchive(compId)) {
			const guard = guards.get(compId) ?? guards.set(compId, createRefreshGuard()).get(compId)!;
			guard(getPrevious(compId), results);
			saveResultsSnapshot(compId, results);
		}
		return results;
	};
}
