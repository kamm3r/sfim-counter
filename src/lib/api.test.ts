import { afterEach, describe, expect, it, vi } from 'vitest';
import { getResults } from './api.js';
import { getCachedResults } from './result-storage.js';
import { isEventDetail } from './validation.js';

afterEach(() => vi.unstubAllGlobals());

describe('live result feed integrity', () => {
	it('rejects a partially failed refresh instead of publishing a lower total', async () => {
		const fetchMock = vi.fn(async (url: string) => {
			if (url.endsWith('/competition/12345')) return { ok: true, json: async () => ({ day: [{ EventId: 1 }, { EventId: 2 }] }) };
			if (url.endsWith('/results/12345/1')) return { ok: true, json: async () => ({ Id: 1, Name: 'M 100m', Group: 'M', BeginDateTimeWithTZ: '2026-07-10', EventCategory: 'Track', Rounds: [] }) };
			return { ok: false, status: 503, statusText: 'Service Unavailable' };
		});
		vi.stubGlobal('fetch', fetchMock);
		await expect(getResults(12345)).rejects.toThrow('Only 1 of 2 event results loaded');
	});

	it('rejects malformed event data before it can corrupt the standings', async () => {
		vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/competition/12345')
			? { ok: true, json: async () => ({ day: [{ EventId: 1 }] }) }
			: { ok: true, json: async () => ({ Id: 1, Name: 'M 100m' }) }));
		await expect(getResults(12345)).rejects.toThrow('Invalid result payload for event 1');
	});
});

describe('nested result validation', () => {
	const event = (allocation: Record<string, unknown>) => ({
		Id: 1, Name: 'M 100m', Group: 'M', BeginDateTimeWithTZ: '2026-07-10', EventCategory: 'Track',
		Rounds: [{ Name: 'Final', RoundTypeCategory: 'Final', Heats: [{ Allocations: [allocation] }] }],
	});
	const allocation = { Id: 1, Name: 'A Athlete', Organization: { Id: 1, Name: 'Club A' }, Result: '10.50', NotInCompetition: false };

	it('accepts a well-formed allocation', () => {
		expect(isEventDetail(event(allocation), 1)).toBe(true);
	});

	it.each([
		['a missing allocation id', { ...allocation, Id: undefined }],
		['a null allocation id', { ...allocation, Id: null }],
		['a fractional allocation id', { ...allocation, Id: 1.5 }],
		['a negative allocation id', { ...allocation, Id: -1 }],
		['a missing club', { ...allocation, Organization: null }],
		['a numeric result', { ...allocation, Result: 10.5 }],
		['malformed attempts', { ...allocation, Attempts: [null] }],
	])('rejects %s', (_, invalid) => {
		expect(isEventDetail(event(invalid), 1)).toBe(false);
	});

	it('discards a corrupted browser snapshot', () => {
		const storage = new Map([['sfim-counter:results:1', JSON.stringify({ savedAt: 1, events: [null] })]]);
		vi.stubGlobal('window', { localStorage: { getItem: (key: string) => storage.get(key) ?? null } });
		expect(getCachedResults(1)).toBeNull();
	});
});
