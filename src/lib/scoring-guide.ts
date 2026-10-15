import {
	computeChampionship, SENIOR_PLACEMENT_POINTS, JUNIOR_PLACEMENT_POINTS,
	FRIHET_SENIOR_BONUS, FRIHET_JUNIOR_A_BONUS, YOUTH_A_BONUS,
} from './scoring.js';
import type { EventDetail } from './types.js';

// These examples run through the production scorer so the displayed arithmetic
// follows the implementation. They are illustrative, not competition results.
export const SCORING_EXAMPLES = [
	{ label: 'scoringExampleSenior', group: 'M', mark: '10.95', place: 2 },
	{ label: 'scoringExampleJuniorSecond', group: 'N17', mark: '12.80', place: 2 },
	{ label: 'scoringExampleJuniorFourth', group: 'N17', mark: '12.80', place: 4 },
] as const;

export function scoringExamples() {
	return SCORING_EXAMPLES.map((example) => {
		const event: EventDetail = {
			Id: 1, Name: `${example.group} 100m`, Group: example.group,
			EventCategory: 'Track', BeginDateTimeWithTZ: '',
			Rounds: [{ Name: 'Final', RoundTypeCategory: 'Final', Heats: [{
				Allocations: Array.from({ length: example.place }, (_, index) => ({
					Id: index + 1, Name: `Runner ${index + 1}`, NotInCompetition: false,
					Organization: { Id: index + 1, Name: `Club ${index + 1}`, NameShort: '' },
					Result: (Number(example.mark) - (example.place - index - 1) / 10).toFixed(2),
					Wind: '+1.0', ResultRank: index + 1,
				})),
			}] }],
		};
		const trophies = computeChampionship([event]);
		return {
			...example,
			frihetspriset: trophies.frihetspriset.eventBreakdown[0].results.at(-1)!,
			ungdomspokalen: trophies.ungdomspokalen.eventBreakdown[0]?.results.at(-1),
		};
	});
}

export type GuideBonus = { level: 'A' | 'M' | 'SM'; points: number };
export type GuideRule = { age: 'senior' | 'junior'; placing: number[]; bonuses: GuideBonus[] };

const SIX_PLACES = SENIOR_PLACEMENT_POINTS.length;
const padded = (points: number[]) => Array.from({ length: SIX_PLACES }, (_, index) => points[index] ?? 0);

// The rule cards read the scorer's own tables. Seniors do not count in Ungdomspokalen.
export const TROPHY_RULES = {
	frihetspriset: [
		{ age: 'senior', placing: padded(SENIOR_PLACEMENT_POINTS), bonuses: [
			{ level: 'A', points: FRIHET_SENIOR_BONUS.A },
			{ level: 'M', points: FRIHET_SENIOR_BONUS.M },
			{ level: 'SM', points: FRIHET_SENIOR_BONUS.SM },
		] },
		{ age: 'junior', placing: padded(JUNIOR_PLACEMENT_POINTS), bonuses: [
			{ level: 'A', points: FRIHET_JUNIOR_A_BONUS },
		] },
	],
	ungdomspokalen: [
		{ age: 'junior', placing: padded(SENIOR_PLACEMENT_POINTS), bonuses: [{ level: 'A', points: YOUTH_A_BONUS }] },
	],
} satisfies Record<'frihetspriset' | 'ungdomspokalen', GuideRule[]>;

export const MAX_PLACEMENT_POINTS = SENIOR_PLACEMENT_POINTS[0];
