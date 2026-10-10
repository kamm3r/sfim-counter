import { describe, expect, it } from 'vitest';
import { computeFrihetspriset, computeUngdomspokalen, scoreEvent } from './scoring.js';
import { calculated2026Split, official2026Rows, official2026Split, reconcileOfficial2026 } from './official-standings.js';
import { getResults } from './api.js';
import type { EventDetail } from './types.js';
import snapshot from './sfim-2026.fixture.json';

// Captured from Tuloslista competition 19929 after the 2026 championship.
// Expected totals: the organizer's Frihetspriset and Ungdomspokalen final PDFs.
const events = snapshot as unknown as EventDetail[];

const frihetspriset: Record<string, number> = {
	'Esbo IF': 209,
	'Vasa IS': 195,
	'HIFK Friidrott': 169,
	'IF Sibbo-Vargarna': 144,
	'IF Drott': 118,
	'IF Falken': 105,
	'Borgå Akilles': 81,
	'IF Nykarlebynejden': 79,
	'IF Raseborg': 77,
	'Gamlakarleby IF': 66,
	'Malax IF': 60,
	'IF Åland': 54,
	'Sjundeå IF': 44,
	'IF Åsarna': 36,
	'IF VOM': 34,
	'IF Fyren': 21,
	'ÅIFK Friidrott': 14,
	'IF Femman': 12,
	'Larsmo IF': 8,
	'IF Kraft': 4,
	'Pargas IF': 2,
};

const ungdomspokalen: Record<string, number> = {
	'Vasa IS': 271,
	'IF Nykarlebynejden': 156,
	'IF Drott': 155,
	'IF Sibbo-Vargarna': 140,
	'IF Falken': 138,
	'Esbo IF': 135,
	'IF Raseborg': 112.5,
	'Malax IF': 94,
	'Sjundeå IF': 84,
	'IF VOM': 69,
	'IF Åland': 69,
	'Borgå Akilles': 61.5,
	'HIFK Friidrott': 58,
	'IF Åsarna': 56,
	'Gamlakarleby IF': 49,
	'IF Fyren': 48,
	'Larsmo IF': 32,
	'ÅIFK Friidrott': 22,
	'IF Kraft': 15,
};

function totals(trophy: ReturnType<typeof computeFrihetspriset>): Record<string, number> {
	return Object.fromEntries(trophy.rankings.map((club) => [club.club.Name, club.totalPoints]));
}

describe('2026 organizer score-sheet reconciliation', () => {
	it('opens the archived event breakdown without requesting the old API', async () => {
		const archived = await getResults(19929);
		expect(archived).toHaveLength(97);
		expect(new Set(archived.map((event) => event.Id)).size).toBe(97);
	});

	it('matches every published Frihetspriset total', () => {
		const actual = totals(reconcileOfficial2026(computeFrihetspriset(events)));
		for (const [club, expected] of Object.entries(frihetspriset)) {
			expect(actual[club], club).toBe(expected);
		}
	});

	it('matches every published Ungdomspokalen total', () => {
		const actual = totals(reconcileOfficial2026(computeUngdomspokalen(events)));
		for (const [club, expected] of Object.entries(ungdomspokalen)) {
			expect(actual[club], club).toBe(expected);
		}
	});

	it('shows the unallocated difference instead of altering athlete-level scores', () => {
		for (const calculate of [computeFrihetspriset, computeUngdomspokalen]) {
			const calculated = calculate(events);
			const published = reconcileOfficial2026(calculated);
			for (const club of published.rankings) {
				const ledgerTotal = club.events.reduce((sum, entry) => sum + entry.points, 0);
				expect(club.calculatedPoints).toBe(ledgerTotal);
				expect(ledgerTotal + (club.officialAdjustment ?? 0)).toBe(club.totalPoints);
			}
		}
	});

	it('reconciles the published day and age-class subtotals without losing points', () => {
		const eventDates = new Map(events.map((event) => [event.Id, event.BeginDateTimeWithTZ]));
		for (const calculate of [computeFrihetspriset, computeUngdomspokalen]) {
			const published = reconcileOfficial2026(calculate(events));
			for (const club of published.rankings) {
				const official = official2026Split(published.trophy, club.club.Name);
				expect(official, club.club.Name).toBeDefined();
				expect(official!.reduce((sum, points) => sum + points, 0), club.club.Name).toBe(club.totalPoints);
				const calculated = calculated2026Split(club, published.trophy, eventDates);
				expect(calculated.reduce((sum, points) => sum + points, 0), club.club.Name).toBe(club.calculatedPoints);
			}
			expect(official2026Rows(published.trophy)).toHaveLength(published.rankings.length);
		}
	});

	it('uses official ranks when rounded result times are equal', () => {
		const event = events.find((item) => item.Name === 'M 200m')!;
		const kalle = scoreEvent(event).find((result) => result.athleteName === 'Kalle Huhtala')!;
		expect(kalle.placement).toBe(5);
		expect(kalle.placementPoints).toBe(2);
	});
});
