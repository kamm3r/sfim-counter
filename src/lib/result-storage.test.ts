import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCachedResults, saveResultsSnapshot } from './result-storage.js';
import type { EventDetail } from './types.js';

afterEach(() => vi.unstubAllGlobals());

function stubStorage() {
	const storage = new Map<string, string>();
	vi.stubGlobal('window', {
		localStorage: {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
		},
	});
}

const event = (id: number): EventDetail => ({
	Id: id, Name: `M ${id}`, Group: 'M', BeginDateTimeWithTZ: '2026-07-10', EventCategory: 'Track', Rounds: [],
});

describe('browser result snapshots', () => {
	it('replaces the previous snapshot so removed events do not return', () => {
		stubStorage();
		saveResultsSnapshot(1, [event(1), event(2)]);
		saveResultsSnapshot(1, [event(2)]);
		expect(getCachedResults(1)?.events.map((e) => e.Id)).toEqual([2]);
	});

	it('keeps the original save time', () => {
		stubStorage();
		vi.spyOn(Date, 'now').mockReturnValue(1_000);
		saveResultsSnapshot(1, [event(1)]);
		vi.spyOn(Date, 'now').mockReturnValue(9_000);
		expect(getCachedResults(1)?.savedAt).toBe(1_000);
	});
});
