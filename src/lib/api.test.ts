import { afterEach, describe, expect, it, vi } from 'vitest';
import { getResults } from './api.js';

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
