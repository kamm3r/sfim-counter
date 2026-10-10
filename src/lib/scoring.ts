import type {
	EventDetail,
	ScoredResult,
	ClubScore,
	ClubEventScore,
	TrophyResult,
	Allocation,
	PerformanceClass,
} from './types.js';
import { classifyResult, isCentimetreEvent, isCombinedEvent, isJuniorGroup, normalizeEventName } from './classification.js';

const INVALID_RESULTS = new Set(['DNS', 'DQ', 'DNF', 'DSQ', 'NH', 'NM', '']);

type FieldTieBreaker = {
	marks: number[];
	misses: number;
	attempts: number;
	vertical: boolean;
};

type InternalScoredResult = ScoredResult & {
	fieldTieBreaker: FieldTieBreaker;
	officialRank: number | null;
	classificationValue: number | null;
};

const WIND_LIMIT = 2;
const WIND_EVENTS = new Set(['100m', '200m', '80mhack', '100mhack', '110mhack', 'longJump', 'tripleJump']);

function parseWind(value: string | null | undefined): number | null {
	if (!value || !/^[+-]?\d+(?:[.,]\d+)?$/.test(value.trim())) return null;
	return Number(value.replace(',', '.'));
}

function classificationValue(event: EventDetail, allocation: Allocation, parsedValue: number | null): number | null {
	if (parsedValue === null) return null;
	const eventKey = normalizeEventName(event.Name);
	if (!WIND_EVENTS.has(eventKey) || (parseWind(allocation.Wind) ?? 0) <= WIND_LIMIT) return parsedValue;
	if (eventKey !== 'longJump' && eventKey !== 'tripleJump') return null;

	// A wind-assisted winning jump still determines placing, but not the result class.
	// A lower, wind-legal attempt can independently meet the classification mark.
	const legalMarks = (allocation.Attempts ?? [])
		.filter((attempt) => {
			const wind = parseWind(attempt.Line2);
			return wind !== null && wind <= WIND_LIMIT;
		})
		.map((attempt) => parseFieldResult(attempt.Line1, event.Name))
		.filter((mark): mark is number => mark !== null);
	return legalMarks.length > 0 ? Math.max(...legalMarks) : null;
}

function parseFinishTimeToMs(value: string | null | undefined): number | null {
	const trimmed = value?.trim() ?? '';
	if (trimmed === '') return null;
	const colonParts = trimmed.split(':');
	if (colonParts.length >= 2 && colonParts.every((part) => /^\d+(?:[.,]\d+)?$/.test(part))) {
		const seconds = Number(colonParts.at(-1)!.replace(',', '.'));
		const minutes = colonParts.slice(0, -1).reduce((total, part) => total * 60 + Number(part), 0);
		return minutes * 60000 + Math.round(seconds * 1000);
	}

	const minuteFormat = trimmed.match(/^(\d+)[.,](\d{1,2})[.,](\d{1,2})$/);
	if (minuteFormat) {
		const [, minutes, seconds, hundredths] = minuteFormat;
		return (+minutes * 60 + +seconds) * 1000 + +hundredths * 10;
	}

	const num = Number(trimmed.replace(',', '.'));
	return Number.isFinite(num) ? Math.round(num * 1000) : null;
}

function parseFieldResult(value: string | null | undefined, eventName: string): number | null {
	const cleaned = value?.trim().replace(',', '.') ?? '';
	const num = Number(cleaned);
	if (!Number.isFinite(num)) return null;

	// Tuloslista reports high jump and pole vault in centimetres (e.g. 162 or
	// 445), while the other field events are normally reported in metres.
	if (isCentimetreEvent(eventName)) return Math.round(num < 10 ? num * 100 : num);
	return Math.round(num > 100 ? num : num * 100);
}

function getFieldTieBreaker(eventName: string, attempts: NonNullable<Allocation['Attempts']>): FieldTieBreaker {
	const vertical = isCentimetreEvent(eventName);
	const marks = attempts
		.map((attempt) => parseFieldResult(attempt.Line1, eventName))
		.filter((mark): mark is number => mark !== null)
		.sort((a, b) => b - a);
	const misses = attempts.reduce((total, attempt) => {
		const line1 = String(attempt.Line1 ?? '').trim().toLowerCase();
		const line2 = String(attempt.Line2 ?? '').trim().toLowerCase();
		const statusMisses = (line2.match(/x/g) ?? []).length;
		return total + statusMisses + (line2 === '' && (line1 === '' || line1 === '-' || line1.includes('x')) ? 1 : 0);
	}, 0);

	if (vertical) {
		const clearedHeights = attempts
			.filter((attempt) => String(attempt.Line2 ?? '').toLowerCase().includes('o'))
			.map((attempt) => parseFieldResult(attempt.Line1, eventName))
			.filter((height): height is number => height !== null);
		const bestClearedHeight = Math.max(...clearedHeights, 0);
		const bestHeight = attempts.find(
			(attempt) => parseFieldResult(attempt.Line1, eventName) === bestClearedHeight
		);
		const attemptsAtBest = bestHeight
			? (String(bestHeight.Line2 ?? '').match(/x/g) ?? []).length + 1
			: 0;
		return { marks, misses, attempts: attemptsAtBest, vertical };
	}

	return { marks, misses, attempts: attempts.length, vertical };
}

function parseResult(value: string | null | undefined, eventName: string, category: 'Track' | 'Field' | 'Relay'): number | null {
	if (INVALID_RESULTS.has(value?.trim().toUpperCase() ?? '')) return -1;
	if (category === 'Track' || category === 'Relay') return parseFinishTimeToMs(value);
	return parseFieldResult(value, eventName);
}

function getGender(group: string): 'male' | 'female' {
	const upper = group.toUpperCase().trim();
	if (upper.startsWith('M') || upper.startsWith('H') || upper.startsWith('P')) return 'male';
	return 'female';
}

const SENIOR_PLACEMENT_POINTS = [7, 5, 4, 3, 2, 1];
const JUNIOR_PLACEMENT_POINTS = [3, 2, 1];

function getPlacementPointsForPosition(pos: number, points: number[]): number {
	return pos >= 1 && pos <= points.length ? points[pos - 1] : 0;
}

function getAveragePlacementPoints(startPlacement: number, tieCount: number, points: number[]): number {
	if (startPlacement < 1 || tieCount < 1) return 0;
	let total = 0;
	for (let offset = 0; offset < tieCount; offset++) {
		total += getPlacementPointsForPosition(startPlacement + offset, points);
	}
	return total / tieCount;
}

function getFrihetsprisetResultPoints(perfClass: string, ageClass: 'senior' | 'junior', placement: number): number {
	if (ageClass === 'junior') {
		if (perfClass === 'A' && placement <= 3) return 3;
		return 0;
	}
	if (perfClass === 'SM') return 15;
	if (perfClass === 'M') return 10;
	if (perfClass === 'A') return 5;
	return 0;
}

function getUngdomspokalenResultPoints(perfClass: string): number {
	if (perfClass === 'A') return 5;
	return 0;
}

function compareFieldTieBreakers(a: FieldTieBreaker, b: FieldTieBreaker): number {
	if (a.vertical || b.vertical) {
		if (a.attempts !== b.attempts) return a.attempts - b.attempts;
		if (a.misses !== b.misses) return a.misses - b.misses;
		return 0;
	}

	const length = Math.max(a.marks.length, b.marks.length);
	for (let i = 0; i < length; i++) {
		const aMark = a.marks[i] ?? 0;
		const bMark = b.marks[i] ?? 0;
		if (aMark !== bMark) return bMark - aMark;
	}
	if (a.misses !== b.misses) return a.misses - b.misses;
	return a.attempts - b.attempts;
}

function sortResults(results: InternalScoredResult[]): InternalScoredResult[] {
	return [...results].sort((a, b) => {
		if (a.officialRank !== null && b.officialRank !== null) {
			return a.officialRank - b.officialRank;
		}
		const isInvalid = (v: number) => v === -1 || v === 0;
		if (isInvalid(a.parsedValue) && !isInvalid(b.parsedValue)) return 1;
		if (!isInvalid(a.parsedValue) && isInvalid(b.parsedValue)) return -1;
		if (a.category === 'Track' || a.category === 'Relay') return a.parsedValue - b.parsedValue;
		if (a.parsedValue === b.parsedValue) return compareFieldTieBreakers(a.fieldTieBreaker, b.fieldTieBreaker);
		return b.parsedValue - a.parsedValue;
	});
}

function getAllocations(event: EventDetail): Allocation[] {
	const rounds = event.Rounds.filter((r) => r.RoundTypeCategory === 'Final');
	return (rounds.length ? rounds : event.Rounds).flatMap((round) =>
		round.TotalResults?.length ? round.TotalResults : round.Heats.flatMap((heat) => heat.Allocations)
	);
}

export function scoreEvent(event: EventDetail): ScoredResult[] {
	const allAllocs = getAllocations(event);
	const group = event.Group || event.Name;
	const ageClass = isJuniorGroup(group) ? 'junior' : 'senior';
	const gender = getGender(group);

	const scored: InternalScoredResult[] = allAllocs.map((a) => {
		const parsedValue = parseResult(a.Result, event.Name, event.EventCategory);
		const isValid = !a.NotInCompetition && parsedValue !== null && parsedValue !== -1 && parsedValue !== 0;

		return {
			athleteName: a.Name,
			club: a.Organization,
			result: a.Result ?? '',
			fieldTieBreaker: getFieldTieBreaker(event.Name, a.Attempts ?? []),
			officialRank: Number.isInteger(a.ResultRank) && (a.ResultRank ?? 0) > 0 ? a.ResultRank! : null,
			classificationValue: classificationValue(event, a, parsedValue),
			parsedValue: parsedValue ?? 0,
			category: event.EventCategory,
			ageClass,
			gender,
			placement: 0,
			tieCount: 1,
			placementPoints: 0,
			performanceClass: 'none' as PerformanceClass,
			resultPoints: 0,
			totalPoints: 0,
			isValid,
		};
	});

	const validResults = scored.filter((r) => r.isValid);
	const nonRelayValid = validResults.filter((r) => r.category !== 'Relay');
	const relayValid = validResults.filter((r) => r.category === 'Relay');

	const sortedNonRelay = sortResults(nonRelayValid);
	const sortedRelay = sortResults(relayValid);

	const assignPoints = (arr: typeof scored) => {
		let i = 0;
		while (i < arr.length) {
			const currentValue = arr[i].parsedValue;
			const officialRank = arr[i].officialRank;
			let j = i;
			while (
				j < arr.length &&
				(officialRank !== null
					? arr[j].officialRank === officialRank
					: arr[j].officialRank === null && arr[j].parsedValue === currentValue &&
						(arr[i].category !== 'Field' || compareFieldTieBreakers(arr[i].fieldTieBreaker, arr[j].fieldTieBreaker) === 0))
			) {
				j++;
			}
			const tieCount = j - i;
			const startPlacement = officialRank ?? i + 1;

			const placementPoints = ageClass === 'junior'
				? JUNIOR_PLACEMENT_POINTS
				: SENIOR_PLACEMENT_POINTS;
			const avgPlacementPoints = getAveragePlacementPoints(startPlacement, tieCount, placementPoints);

			for (let k = i; k < j; k++) {
				const r = arr[k];
				r.placement = startPlacement;
				r.tieCount = tieCount;
				r.placementPoints = avgPlacementPoints;

				const perfClass = r.classificationValue === null ? 'none' : classifyResult(
					event.Name,
					r.classificationValue,
					r.gender === 'female',
					r.category,
					event.Group || event.Name
				);
				r.performanceClass = perfClass;
				r.resultPoints = getFrihetsprisetResultPoints(perfClass, ageClass, startPlacement);

				r.totalPoints = r.placementPoints + r.resultPoints;
			}

			i = j;
		}
	};

	assignPoints(sortedNonRelay);
	assignPoints(sortedRelay);

	return scored;
}

function toClubEventScore(event: EventDetail, result: ScoredResult): ClubEventScore {
	return {
		eventId: event.Id,
		eventName: event.Name,
		athleteName: result.athleteName,
		result: result.result,
		placement: result.placement,
		placementPoints: result.placementPoints,
		performanceClass: result.performanceClass,
		resultPoints: result.resultPoints,
		points: result.totalPoints,
		category: result.category,
		ageClass: result.ageClass,
	};
}

function addClubPoints(clubs: Map<number, ClubScore>, event: EventDetail, results: ScoredResult[]): void {
	for (const result of results) {
		if (!result.isValid || result.totalPoints <= 0) continue;
		const existing = clubs.get(result.club.Id);
		if (existing) {
			existing.totalPoints += result.totalPoints;
			existing.events.push(toClubEventScore(event, result));
		} else {
			clubs.set(result.club.Id, {
				club: result.club,
				totalPoints: result.totalPoints,
				events: [toClubEventScore(event, result)],
			});
		}
	}
}

function finishTrophy(trophy: TrophyResult['trophy'], clubs: Map<number, ClubScore>, eventBreakdown: TrophyResult['eventBreakdown']): TrophyResult {
	return {
		trophy,
		rankings: [...clubs.values()].sort((a, b) => b.totalPoints - a.totalPoints),
		eventBreakdown,
	};
}

// Single scoring seam for the live view and historical archive. Both trophies
// share the same parsed result, rank and performance class for each athlete.
export function computeChampionship(events: EventDetail[]): { frihetspriset: TrophyResult; ungdomspokalen: TrophyResult } {
	const frihetClubs = new Map<number, ClubScore>();
	const youthClubs = new Map<number, ClubScore>();
	const frihetEvents: TrophyResult['eventBreakdown'] = [];
	const youthEvents: TrophyResult['eventBreakdown'] = [];

	for (const event of events) {
		const results = scoreEvent(event);
		frihetEvents.push({ eventName: event.Name, eventId: event.Id, results });
		if (!isCombinedEvent(event.Name)) addClubPoints(frihetClubs, event, results);
		if (!isJuniorGroup(event.Group || event.Name)) continue;

		const youthResults = results.map((result) => {
			const placementPoints = getAveragePlacementPoints(result.placement, result.tieCount, SENIOR_PLACEMENT_POINTS);
			const resultPoints = getUngdomspokalenResultPoints(result.performanceClass);
			return { ...result, placementPoints, resultPoints, totalPoints: placementPoints + resultPoints };
		});
		youthEvents.push({ eventName: event.Name, eventId: event.Id, results: youthResults });
		addClubPoints(youthClubs, event, youthResults);
	}

	return {
		frihetspriset: finishTrophy('frihetspriset', frihetClubs, frihetEvents),
		ungdomspokalen: finishTrophy('ungdomspokalen', youthClubs, youthEvents),
	};
}

export function computeFrihetspriset(events: EventDetail[]): TrophyResult {
	return computeChampionship(events).frihetspriset;
}

export function computeUngdomspokalen(events: EventDetail[]): TrophyResult {
	return computeChampionship(events).ungdomspokalen;
}
