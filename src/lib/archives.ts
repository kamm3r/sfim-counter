// Championships whose final Tuloslista feed is pinned in src/lib/sfim-<year>.fixture.json.
// This is the single list used by the data loader, the competition page and
// scripts/capture-results.mjs. To pin a new year: add it here, then run
// `node scripts/capture-results.mjs <year>`.
export type PinnedArchive = {
	year: number;
	competitionId: number;
	// The organizer's final club tables are transcribed in official-standings.ts.
	hasOfficialStandings: boolean;
};

export const PINNED_ARCHIVES: readonly PinnedArchive[] = [
	{ year: 2026, competitionId: 19929, hasOfficialStandings: true },
	{ year: 2025, competitionId: 17448, hasOfficialStandings: false },
];

export function getPinnedArchive(competitionId: number): PinnedArchive | undefined {
	return PINNED_ARCHIVES.find((archive) => archive.competitionId === competitionId);
}
