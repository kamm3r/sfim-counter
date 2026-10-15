import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getResults } from './api.js';
import { saveResultsSnapshot } from './result-storage.js';
import { createResultsRefresher } from './result-refresh.js';
import type { EventDetail } from './types.js';

vi.mock('./api.js', () => ({ getResults: vi.fn() }));
vi.mock('./result-storage.js', () => ({ saveResultsSnapshot: vi.fn() }));
const event = (Id: number): EventDetail => ({ Id, Name: 'M 100m', Group: 'M', EventCategory: 'Track', BeginDateTimeWithTZ: '', Rounds: [] });
beforeEach(() => vi.resetAllMocks());

describe('competition refresh ownership', () => {
	it('saves concurrent requests under their original competition ids', async () => {
		let finishFirst!: (results: EventDetail[]) => void;
		vi.mocked(getResults).mockImplementation(async (id) => id === 1
			? new Promise((resolve) => { finishFirst = resolve; }) : [event(20)]);
		const getPrevious = vi.fn(() => undefined);
		const refresh = createResultsRefresher(getPrevious);
		const first = refresh(1);
		await refresh(2);
		finishFirst([event(10)]);
		await first;
		expect(saveResultsSnapshot).toHaveBeenNthCalledWith(1, 2, [event(20)]);
		expect(saveResultsSnapshot).toHaveBeenNthCalledWith(2, 1, [event(10)]);
		expect(getPrevious.mock.calls).toEqual([[2], [1]]);
	});

	it('does not let one competition confirm another competition’s removals', async () => {
		vi.mocked(getResults).mockResolvedValue([event(1)]);
		const refresh = createResultsRefresher(() => [event(1), event(2)]);
		await expect(refresh(1)).rejects.toThrow('next refresh');
		await expect(refresh(2)).rejects.toThrow('next refresh');
		expect(saveResultsSnapshot).not.toHaveBeenCalled();
		await expect(refresh(1)).resolves.toEqual([event(1)]);
		expect(saveResultsSnapshot).toHaveBeenCalledWith(1, [event(1)]);
	});

	it('does not replace browser snapshots with pinned archives', async () => {
		vi.mocked(getResults).mockResolvedValue([event(1)]);
		const previous = vi.fn(() => [event(2)]);
		await createResultsRefresher(previous)(19929);
		expect(previous).not.toHaveBeenCalled();
		expect(saveResultsSnapshot).not.toHaveBeenCalled();
	});
});
