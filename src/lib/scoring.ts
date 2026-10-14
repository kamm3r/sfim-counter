import type {
	EventDetail,
	ScoredResult,
	ClubScore,
	ClubEventScore,
	TrophyResult,
	Allocation,
	Attempt,
	PerformanceClass,
	Round,
} from './types.js';
import { classifyResult, isCentimetreEvent, isCombinedEvent, isJuniorGroup, normalizeEventName } from './classification.js';

const INVALID_RESULTS = new Set(['DNS', 'DQ', 'DNF', 'DSQ', 'NH', 'NM', '']);

type FieldTieBreaker = {
	marks: number[];
	// Vertical events only: attempts at the last cleared height and failures
	// up to and including it (World Athletics TR 26.8).
	misses: number;
	attempts: number;
	vertical: boolean;
};

type RankedAllocation = {
	allocation: Allocation;
	heatWind: string | null;
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

function classificationValue(event: EventDetail, entry: RankedAllocation, parsedValue: number | null): number | null {
	if (parsedValue === null) return null;
	const eventKey = normalizeEventName(event.Name);
	if (!WIND_EVENTS.has(eventKey)) return parsedValue;

	// Sprint and hurdle rows may only carry the heat's wind reading.
	const wind = parseWind(entry.allocation.Wind) ?? parseWind(entry.heatWind);
	const isJump = eventKey === 'longJump' || eventKey === 'tripleJump';
	// A missing reading is treated as legal: the feed omits wind for some rows.
	if (!isJump) return wind === null || wind <= WIND_LIMIT ? parsedValue : null;
	if (wind !== null && wind <= WIND_LIMIT) return parsedValue;

	// A wind-assisted winning jump still determines placing, but not the result class.
	// A lower, wind-legal attempt can independently meet the classification mark.
	const windedMarks = (entry.allocation.Attempts ?? [])
		.map((attempt) => ({ wind: parseWind(attempt.Line2), mark: parseFieldResult(attempt.Line1, event.Name) }))
		.filter((attempt): attempt is { wind: number; mark: number } => attempt.wind !== null && attempt.mark !== null);
	if (wind === null && windedMarks.length === 0) return parsedValue;
	const legalMarks = windedMarks.filter((attempt) => attempt.wind <= WIND_LIMIT).map((attempt) => attempt.mark);
	return legalMarks.length > 0 ? Math.max(...legalMarks) : null;
}

function parseFinishTimeToMs(value: string | null | undefined): number | null {
	const trimmed = value?.trim() ?? '';
	if (trimmed === '') return null;
	const colonParts = trimmed.split(':');
	if (colonParts.length >= 2) {
		const leading = colonParts.slice(0, -1);
		const secondsPart = colonParts.at(-1)!;
		if (!leading.every((part) => /^\d+$/.test(part)) || !/^\d{1,2}(?:[.,]\d+)?$/.test(secondsPart)) return null;
		const seconds = Number(secondsPart.replace(',', '.'));
		if (seconds >= 60 || leading.slice(1).some((part) => Number(part) >= 60)) return null;
		const minutes = leading.reduce((total, part) => total * 60 + Number(part), 0);
		return minutes * 60000 + Math.round(seconds * 1000);
	}

	// Tuloslista writes longer times as minutes.seconds,hundredths (e.g. 2.05,32).
	const minuteFormat = trimmed.match(/^(\d+)[.,](\d{1,2})[.,](\d{1,2})$/);
	if (minuteFormat) {
		const [, minutes, seconds, fraction] = minuteFormat;
		if (+seconds >= 60) return null;
		return (+minutes * 60 + +seconds) * 1000 + +fraction.padEnd(2, '0') * 10;
	}

	if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
	return Math.round(Number(trimmed.replace(',', '.')) * 1000);
}

function parseFieldResult(value: string | null | undefined, eventName: string): number | null {
	const cleaned = value?.trim().replace(',', '.') ?? '';
	if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
	const num = Number(cleaned);

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
	if (!vertical) return { marks, misses: 0, attempts: 0, vertical };

	const countFailures = (attempt: Attempt) => (String(attempt.Line2 ?? '').toLowerCase().match(/x/g) ?? []).length;
	const clearedHeights = attempts
		.filter((attempt) => String(attempt.Line2 ?? '').toLowerCase().includes('o'))
		.map((attempt) => parseFieldResult(attempt.Line1, eventName))
		.filter((height): height is number => height !== null);
	const bestClearedHeight = Math.max(...clearedHeights, 0);
	const bestHeight = attempts.find(
		(attempt) => parseFieldResult(attempt.Line1, eventName) === bestClearedHeight
	);
	const attemptsAtBest = bestHeight ? countFailures(bestHeight) + 1 : 0;
	// Failures above the last cleared height do not separate tied athletes.
	const misses = attempts
		.filter((attempt) => (parseFieldResult(attempt.Line1, eventName) ?? Infinity) <= bestClearedHeight)
		.reduce((total, attempt) => total + countFailures(attempt), 0);
	return { marks, misses, attempts: attemptsAtBest, vertical };
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

	// Horizontal ties stay tied once every valid mark has been compared
	// (World Athletics TR 25.22); fouls do not separate athletes.
	const length = Math.max(a.marks.length, b.marks.length);
	for (let i = 0; i < length; i++) {
		const aMark = a.marks[i] ?? 0;
		const bMark = b.marks[i] ?? 0;
		if (aMark !== bMark) return bMark - aMark;
	}
	return 0;
}

// Official ranks are used only when every valid result in the event has one;
// otherwise the whole event is ranked by marks, so the order stays consistent.
function sortResults(results: InternalScoredResult[]): InternalScoredResult[] {
	if (results.some((result) => result.officialRank === null)) {
		for (const result of results) result.officialRank = null;
	}
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

function hasResults(round: Round): boolean {
	return Boolean(round.TotalResults?.length) || round.Heats.some((heat) => heat.Allocations.length > 0);
}

// Scores one stage only. Without a final, the latest round with results gives
// provisional standings; earlier rounds would count the same athletes again.
function getAllocations(event: EventDetail): { entries: RankedAllocation[]; eventWideRanks: boolean } {
	const finals = event.Rounds.filter((r) => r.RoundTypeCategory === 'Final');
	const latest = event.Rounds.filter(hasResults).at(-1);
	const rounds = finals.length ? finals : latest ? [latest] : [];

	const entries = rounds.flatMap((round): RankedAllocation[] => {
		const heatWindById = new Map<number, string | null>();
		for (const heat of round.Heats) {
			for (const allocation of heat.Allocations) heatWindById.set(allocation.Id, heat.Wind ?? null);
		}
		const heatEntries = round.Heats.flatMap((heat) => heat.Allocations.map((allocation) => ({ allocation, heatWind: heat.Wind ?? null })));
		if (!round.TotalResults?.length) return heatEntries;

		// The combined list can lag behind the heats. Heat rows it is missing
		// are added, and the event is then ranked by marks (see sortResults).
		const summarized = new Set(round.TotalResults.map((allocation) => allocation.Id));
		return [
			...round.TotalResults.map((allocation) => ({ allocation, heatWind: heatWindById.get(allocation.Id) ?? null })),
			...heatEntries.filter((entry) => !summarized.has(entry.allocation.Id)),
		];
	});

	// Ranks in separate preliminary heats are heat-local, not event-wide.
	const eventWideRanks = finals.length > 0 || rounds.every((round) => Boolean(round.TotalResults?.length) || round.Heats.length <= 1);
	return { entries, eventWideRanks };
}

export function scoreEvent(event: EventDetail): ScoredResult[] {
	const { entries, eventWideRanks } = getAllocations(event);
	const group = event.Group || event.Name;
	const ageClass = isJuniorGroup(group) ? 'junior' : 'senior';
	const gender = getGender(group);

	const scored: InternalScoredResult[] = entries.map((entry) => {
		const a = entry.allocation;
		const parsedValue = parseResult(a.Result, event.Name, event.EventCategory);
		const isValid = !a.NotInCompetition && parsedValue !== null && parsedValue !== -1 && parsedValue !== 0;

		return {
			athleteName: a.Name,
			club: a.Organization,
			result: a.Result ?? '',
			fieldTieBreaker: getFieldTieBreaker(event.Name, a.Attempts ?? []),
			officialRank: eventWideRanks && Number.isInteger(a.ResultRank) && (a.ResultRank ?? 0) > 0 ? a.ResultRank! : null,
			classificationValue: classificationValue(event, entry, parsedValue),
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

// Tuloslista uses Id 0 for clubs without a registry entry, so those are kept
// apart by name rather than merged into one club.
function clubKey(club: ScoredResult['club']): string {
	return club.Id > 0 ? `id:${club.Id}` : `name:${club.Name.trim().toLowerCase()}`;
}

function addClubPoints(clubs: Map<string, ClubScore>, event: EventDetail, results: ScoredResult[]): void {
	for (const result of results) {
		if (!result.isValid || result.totalPoints <= 0) continue;
		const key = clubKey(result.club);
		const existing = clubs.get(key);
		if (existing) {
			existing.totalPoints += result.totalPoints;
			existing.events.push(toClubEventScore(event, result));
		} else {
			clubs.set(key, {
				club: result.club,
				totalPoints: result.totalPoints,
				events: [toClubEventScore(event, result)],
			});
		}
	}
}

// Split placement points (e.g. 16 / 3) leave floating-point noise in sums.
function samePoints(a: number, b: number): boolean {
	return Math.abs(a - b) < 1e-9;
}

// Competition ranking for the club table: equal totals share a position and
// the next club skips accordingly (1, 2, 2, 4).
export function clubPositions(rankings: { totalPoints: number }[]): number[] {
	return rankings.map((club, index) => {
		let first = index;
		while (first > 0 && samePoints(rankings[first - 1].totalPoints, club.totalPoints)) first--;
		return first + 1;
	});
}

function finishTrophy(trophy: TrophyResult['trophy'], clubs: Map<string, ClubScore>, eventBreakdown: TrophyResult['eventBreakdown']): TrophyResult {
	return {
		trophy,
		rankings: [...clubs.values()].sort((a, b) =>
			samePoints(a.totalPoints, b.totalPoints) ? a.club.Name.localeCompare(b.club.Name) : b.totalPoints - a.totalPoints),
		eventBreakdown,
	};
}

// Single scoring seam for the live view and historical archive. Both trophies
// share the same parsed result, rank and performance class for each athlete.
export function computeChampionship(events: EventDetail[]): { frihetspriset: TrophyResult; ungdomspokalen: TrophyResult } {
	const frihetClubs = new Map<string, ClubScore>();
	const youthClubs = new Map<string, ClubScore>();
	const frihetEvents: TrophyResult['eventBreakdown'] = [];
	const youthEvents: TrophyResult['eventBreakdown'] = [];

	for (const event of events) {
		const results = scoreEvent(event);
		// Combined events keep their placings but award no Frihetspriset points,
		// so the event breakdown matches the club totals.
		const frihetResults = isCombinedEvent(event.Name)
			? results.map((result) => ({ ...result, placementPoints: 0, resultPoints: 0, totalPoints: 0 }))
			: results;
		frihetEvents.push({ eventName: event.Name, eventId: event.Id, results: frihetResults });
		addClubPoints(frihetClubs, event, frihetResults);
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
