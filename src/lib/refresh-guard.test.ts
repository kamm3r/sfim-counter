import { describe, expect, it } from 'vitest';
import { createRefreshGuard, RefreshRejectedError } from './refresh-guard.js';
import type { EventDetail } from './types.js';

const events = (...ids: number[]) => ids.map((Id) => ({ Id }) as EventDetail);

describe('live refresh guard', () => {
	it('accepts refreshes that keep or add events', () => {
		const check = createRefreshGuard();
		expect(() => check(undefined, events(1))).not.toThrow();
		expect(() => check(events(1), events(1, 2))).not.toThrow();
	});

	it('never lets an empty refresh replace loaded results', () => {
		const check = createRefreshGuard();
		expect(() => check(events(1, 2), [])).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2), [])).toThrow(RefreshRejectedError);
	});

	it('accepts a removal only once the next refresh confirms it', () => {
		const check = createRefreshGuard();
		expect(() => check(events(1, 2, 3), events(1))).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2, 3), events(1))).not.toThrow();
	});

	it('starts over when a refresh recovers in between', () => {
		const check = createRefreshGuard();
		expect(() => check(events(1, 2), events(1))).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2), events(1, 2))).not.toThrow();
		expect(() => check(events(1, 2), events(1))).toThrow(RefreshRejectedError);
	});
});
