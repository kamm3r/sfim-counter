import type { ClubScore, TrophyResult } from './types.js';

export const SFIM_2026_OFFICIAL_SOURCES = {
	frihetspriset: 'https://drive.google.com/file/d/16MFNQUTpopF8GqOJPgMWXozjxKmJI21X/view',
	ungdomspokalen: 'https://drive.google.com/file/d/1xY0RXx5910PcgcSJ873cOviuj0hC1faq/view',
} as const;

// Transcribed from the final tables linked by the 2026 organizer.
const FRIHETSPRISET_2026: [string, number][] = [
	['Esbo IF', 209], ['Vasa IS', 195], ['HIFK Friidrott', 169],
	['IF Sibbo-Vargarna', 144], ['IF Drott', 118], ['IF Falken', 105],
	['Borgå Akilles', 81], ['IF Nykarlebynejden', 79], ['IF Raseborg', 77],
	['Gamlakarleby IF', 66], ['Malax IF', 60], ['IF Åland', 54],
	['Sjundeå IF', 44], ['IF Åsarna', 36], ['IF VOM', 34], ['IF Fyren', 21],
	['ÅIFK Friidrott', 14], ['IF Femman', 12], ['Larsmo IF', 8],
	['IF Kraft', 4], ['Pargas IF', 2],
];

const UNGDOMSPOKALEN_2026: [string, number][] = [
	['Vasa IS', 271], ['IF Nykarlebynejden', 156], ['IF Drott', 155],
	['IF Sibbo-Vargarna', 140], ['IF Falken', 138], ['Esbo IF', 135],
	['IF Raseborg', 112.5], ['Malax IF', 94], ['Sjundeå IF', 84],
	['IF VOM', 69], ['IF Åland', 69], ['Borgå Akilles', 61.5],
	['HIFK Friidrott', 58], ['IF Åsarna', 56], ['Gamlakarleby IF', 49],
	['IF Fyren', 48], ['Larsmo IF', 32], ['ÅIFK Friidrott', 22],
	['IF Kraft', 15], ['IF Femman', 0], ['Liljendal IK', 0], ['Pargas IF', 0],
];

// The same organizer PDFs also publish daily subtotals. Frihetspriset columns:
// Friday senior, Friday junior, Saturday senior, Saturday junior.
const FRIHET_2026_SPLITS: Record<string, readonly [number, number, number, number]> = {
	'Esbo IF': [82, 22, 75, 30], 'Vasa IS': [61, 49, 33, 52],
	'HIFK Friidrott': [49, 7, 104, 9], 'IF Sibbo-Vargarna': [52, 23, 46, 23],
	'IF Drott': [37, 34, 29, 18], 'IF Falken': [19, 22, 37, 27],
	'Borgå Akilles': [31, 5, 26, 19], 'IF Nykarlebynejden': [6, 40, 11, 22],
	'IF Raseborg': [18, 27, 16, 16], 'Gamlakarleby IF': [12, 12, 35, 7],
	'Malax IF': [7, 14, 17, 22], 'IF Åland': [16, 13, 10, 15],
	'Sjundeå IF': [5, 10, 10, 19], 'IF Åsarna': [0, 11, 11, 14],
	'IF VOM': [6, 16, 0, 12], 'IF Fyren': [0, 15, 0, 6],
	'ÅIFK Friidrott': [4, 0, 0, 10], 'IF Femman': [12, 0, 0, 0],
	'Larsmo IF': [0, 8, 0, 0], 'IF Kraft': [0, 0, 0, 4],
	'Pargas IF': [2, 0, 0, 0],
};

// Ungdomspokalen columns: Friday, Saturday.
const YOUTH_2026_SPLITS: Record<string, readonly [number, number]> = {
	'Vasa IS': [131, 140], 'IF Nykarlebynejden': [95, 61],
	'IF Drott': [90, 65], 'IF Sibbo-Vargarna': [69, 71],
	'IF Falken': [60, 78], 'Esbo IF': [68, 67],
	'IF Raseborg': [70.5, 42], 'Malax IF': [44, 50],
	'Sjundeå IF': [25, 59], 'IF VOM': [42, 27],
	'IF Åland': [32, 37], 'Borgå Akilles': [13.5, 48],
	'HIFK Friidrott': [33, 25], 'IF Åsarna': [25, 31],
	'Gamlakarleby IF': [27, 22], 'IF Fyren': [31, 17],
	'Larsmo IF': [26, 6], 'ÅIFK Friidrott': [0, 22],
	'IF Kraft': [5, 10], 'IF Femman': [0, 0],
	'Liljendal IK': [0, 0], 'Pargas IF': [0, 0],
};

export function official2026Rows(trophy: TrophyResult['trophy']): readonly [string, number][] {
	return trophy === 'frihetspriset' ? FRIHETSPRISET_2026 : UNGDOMSPOKALEN_2026;
}

export function official2026Split(trophy: TrophyResult['trophy'], clubName: string): readonly number[] | undefined {
	return trophy === 'frihetspriset' ? FRIHET_2026_SPLITS[clubName] : YOUTH_2026_SPLITS[clubName];
}

export function calculated2026Split(club: ClubScore, trophy: TrophyResult['trophy'], eventDates: ReadonlyMap<number, string>): number[] {
	const split = trophy === 'frihetspriset' ? [0, 0, 0, 0] : [0, 0];
	for (const entry of club.events) {
		const date = eventDates.get(entry.eventId);
		if (!date?.startsWith('2026-07-10') && !date?.startsWith('2026-07-11')) {
			throw new Error(`Missing 2026 event date for ${entry.eventId}`);
		}
		const day = date.startsWith('2026-07-10') ? 0 : 1;
		const column = trophy === 'frihetspriset' ? day * 2 + (entry.ageClass === 'junior' ? 1 : 0) : day;
		split[column] += entry.points;
	}
	return split;
}

function officialClubName(name: string): string {
	if (name === 'IK Falken') return 'IF Falken';
	if (name === 'IF Åland rf') return 'IF Åland';
	return name;
}

// The published totals are authoritative after the event. Keep the independently
// calculated ledger and its unallocated difference visible; the organizer did not
// publish an athlete-by-athlete points sheet from which to assign that difference.
export function reconcileOfficial2026(calculated: TrophyResult): TrophyResult {
	// Aliases can map two calculated clubs onto one published name; merge them
	// rather than letting the later entry overwrite the earlier one.
	const clubs = new Map<string, ClubScore>();
	for (const entry of calculated.rankings) {
		const name = officialClubName(entry.club.Name);
		const existing = clubs.get(name);
		clubs.set(name, existing
			? { ...existing, totalPoints: existing.totalPoints + entry.totalPoints, events: [...existing.events, ...entry.events] }
			: entry);
	}
	const rankings: ClubScore[] = official2026Rows(calculated.trophy).map(([name, publishedPoints]) => {
		const computed = clubs.get(name);
		const calculatedPoints = computed?.totalPoints ?? 0;
		return {
			club: computed ? { ...computed.club, Name: name } : { Id: 0, Name: name, NameShort: name },
			totalPoints: publishedPoints,
			calculatedPoints,
			officialAdjustment: publishedPoints - calculatedPoints,
			events: computed?.events ?? [],
		};
	});
	return { ...calculated, rankings };
}
