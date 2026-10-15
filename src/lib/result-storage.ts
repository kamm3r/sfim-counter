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

	// Callers save only complete, validated refreshes, so the snapshot is
	// replaced outright: events removed upstream must not reappear offline.
	try {
		const snapshot: StoredResults = { savedAt: Date.now(), events };
		window.localStorage.setItem(getStorageKey(compId), JSON.stringify(snapshot));
	} catch {
		// A full/disabled browser storage should never prevent the live view.
	}
}
