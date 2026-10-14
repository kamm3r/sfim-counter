import type { EventDetail } from './types.js';
import { isEventDetail } from './validation.js';

const STORAGE_PREFIX = 'sfim-counter:results:';

type StoredResults = {
	savedAt: number;
	events: EventDetail[];
};

function getStorageKey(compId: number): string {
	return `${STORAGE_PREFIX}${compId}`;
}

export function getCachedResults(compId: number): StoredResults | null {
	if (typeof window === 'undefined') return null;

	try {
		const raw = window.localStorage.getItem(getStorageKey(compId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { savedAt?: unknown; events?: unknown };
		if (typeof parsed?.savedAt !== 'number' || !Array.isArray(parsed.events)) return null;
		const events: unknown[] = parsed.events;
		if (!events.every((event) => isEventDetail(event))) return null;
		return { savedAt: parsed.savedAt, events: events as EventDetail[] };
	} catch {
		return null;
	}
}

export function saveResultsSnapshot(compId: number, events: EventDetail[]): void {
	if (typeof window === 'undefined' || events.length === 0) return;

	try {
		const previous = getCachedResults(compId)?.events ?? [];
		const merged = new Map(previous.map((event) => [event.Id, event]));
		for (const event of events) merged.set(event.Id, event);

		const snapshot: StoredResults = {
			savedAt: Date.now(),
			events: [...merged.values()]
		};
		window.localStorage.setItem(getStorageKey(compId), JSON.stringify(snapshot));
	} catch {
		// A full/disabled browser storage should never prevent the live view.
	}
}
