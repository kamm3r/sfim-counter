import { describe, expect, it } from 'vitest';
import { computeChampionship } from './scoring.js';
import type { EventDetail, TrophyResult } from './types.js';
import snapshot2025 from './sfim-2025.fixture.json';
import snapshot2026 from './sfim-2026.fixture.json';

// Locks the calculated scores before any published totals are applied. The
// organizer reconciliation tests overwrite club totals, so on their own they
// cannot catch a change in how individual athletes are scored. Any intended
// scoring change must update these snapshots deliberately (vitest -u).
const archives = [
	['2025', snapshot2025],
	['2026', snapshot2026],
] as const;

function calculatedTotals(trophy: TrophyResult): Record<string, number> {
	return Object.fromEntries(trophy.rankings.map((club) => [club.club.Name, club.totalPoints]));
}

function athleteAwards(trophy: TrophyResult): string[] {
	return trophy.eventBreakdown.flatMap((event) => event.results
		.filter((result) => result.isValid)
		.map((result) => [
			event.eventName,
			result.athleteName,
			result.club.Name,
			result.result,
			`#${result.placement}${result.tieCount > 1 ? `=${result.tieCount}` : ''}`,
			result.performanceClass,
			`${result.placementPoints}+${result.resultPoints}`,
		].join(' | ')));
}

describe.each(archives)('%s calculated scores', (_, events) => {
	const championship = computeChampionship(events as unknown as EventDetail[]);

	it.each(['frihetspriset', 'ungdomspokalen'] as const)('keeps %s club totals', (trophy) => {
		expect(calculatedTotals(championship[trophy])).toMatchSnapshot();
	});

	it.each(['frihetspriset', 'ungdomspokalen'] as const)('keeps every %s athlete award', (trophy) => {
		expect(athleteAwards(championship[trophy])).toMatchSnapshot();
	});
});
