import { clubPositions } from './scoring.js';
import type { ClubScore, TrophyResult } from './types.js';

export type Trophy = TrophyResult['trophy'];
export type ClubEntry = { club: ClubScore; place: number; tied: boolean; leader: ClubScore };

// A club's standing in each trophy, matched by name (standings) or club id (event results).
export function clubEntries(trophies: Record<Trophy, TrophyResult | null>, match: { name?: string; id?: number }): Partial<Record<Trophy, ClubEntry>> {
	const entries: Partial<Record<Trophy, ClubEntry>> = {};
	for (const key of ['frihetspriset', 'ungdomspokalen'] as const) {
		const rankings = trophies[key]?.rankings ?? [];
		const index = rankings.findIndex((entry) => (match.name !== undefined && entry.club.Name === match.name) || (match.id !== undefined && match.id !== 0 && entry.club.Id === match.id));
		if (index < 0) continue;
		const positions = clubPositions(rankings);
		entries[key] = {
			club: rankings[index],
			place: positions[index],
			tied: positions.filter((position) => position === positions[index]).length > 1,
			leader: rankings[0],
		};
	}
	return entries;
}
