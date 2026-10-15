import { describe, expect, it } from 'vitest';
import { createRefreshGuard, RefreshRejectedError } from './refresh-guard.js';
import type { EventDetail } from './types.js';

const events = (...ids: number[]) => ids.map((Id) => ({ Id, Rounds: [] }) as unknown as EventDetail);

function recordedEvent(id: number, result: string | null = '10.80'): EventDetail {
	return {
		...events(id)[0],
		Rounds: [{ Name: 'Final', RoundTypeCategory: 'Final', Heats: [], TotalResults: [
			{ Id: 1, Name: 'Runner', Result: result, NotInCompetition: false, Organization: { Id: 1, Name: 'Club', NameShort: 'Club' } },
		] }],
	};
}

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

	it('requires a new confirmation after an empty refresh interrupts a removal', () => {
		const check = createRefreshGuard();
		expect(() => check(events(1, 2), events(1))).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2), [])).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2), events(1))).toThrow(RefreshRejectedError);
		expect(() => check(events(1, 2), events(1))).not.toThrow();
	});

	it('never replaces recorded results with empty rounds or start lists', () => {
		for (const blank of [events(1)[0], recordedEvent(1, null), recordedEvent(1, '  ')]) {
			const check = createRefreshGuard();
			expect(() => check([recordedEvent(1)], [blank])).toThrow(RefreshRejectedError);
			expect(() => check([recordedEvent(1)], [blank])).toThrow(RefreshRejectedError);
		}
	});

	it('requires confirmation when one event loses results, and resets on recovery', () => {
		const check = createRefreshGuard();
		const previous = [recordedEvent(1), recordedEvent(2)];
		const partial = [events(1)[0], recordedEvent(2)];
		expect(() => check(previous, partial)).toThrow(RefreshRejectedError);
		expect(() => check(previous, previous)).not.toThrow();
		expect(() => check(previous, partial)).toThrow(RefreshRejectedError);
		expect(() => check(previous, partial)).not.toThrow();
	});

	it('does not treat a corrected non-result as missing results', () => {
		expect(() => createRefreshGuard()([recordedEvent(1)], [recordedEvent(1, 'DQ')])).not.toThrow();
	});
});
