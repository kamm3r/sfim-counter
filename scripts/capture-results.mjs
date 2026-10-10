// Refresh a checked-in final result fixture from Tuloslista's public API.
// Run deliberately: each fixture represents a finalized championship snapshot.
import { writeFile } from 'node:fs/promises';

const year = Number(process.argv[2] ?? 2026);
const competitionId = { 2025: 17448, 2026: 19929 }[year];
if (!competitionId) throw new Error('Supported years: 2025, 2026');
const base = 'https://cached-public-api.tuloslista.com/live/v1';
const indexResponse = await fetch(`${base}/competition/${competitionId}`);
if (!indexResponse.ok) throw new Error(`Competition ${competitionId}: HTTP ${indexResponse.status}`);
const index = await indexResponse.json();
const ids = [...new Set(Object.values(index).flat().map((round) => round.EventId))];
if (ids.length === 0) throw new Error(`Competition ${competitionId} has no events to capture`);

const events = [];
for (let offset = 0; offset < ids.length; offset += 6) {
	const batch = await Promise.all(ids.slice(offset, offset + 6).map(async (id) => {
		const response = await fetch(`${base}/results/${competitionId}/${id}`);
		if (!response.ok) throw new Error(`Event ${id}: HTTP ${response.status}`);
		const event = await response.json();
		if (event.Id !== id || !Array.isArray(event.Rounds)) throw new Error(`Event ${id}: invalid result payload`);
		return {
			Id: event.Id,
			Name: event.Name,
			Group: event.Group,
			EventCategory: event.EventCategory,
			BeginDateTimeWithTZ: event.BeginDateTimeWithTZ,
			Rounds: event.Rounds.map((round) => ({
				RoundTypeCategory: round.RoundTypeCategory,
				Name: round.Name,
				TotalResults: round.TotalResults?.map(compactAllocation) ?? [],
				Heats: round.Heats.map((heat) => ({
					Wind: heat.Wind,
					Allocations: heat.Allocations.map(compactAllocation),
				})),
			})),
		};
	}));
	events.push(...batch);
}

function compactAllocation(allocation) {
	return {
		Id: allocation.Id,
		Name: allocation.Name,
		Organization: allocation.Organization,
		Result: allocation.Result,
		ResultRank: allocation.ResultRank,
		NotInCompetition: allocation.NotInCompetition,
		Wind: allocation.Wind,
		Attempts: allocation.Attempts,
	};
}

await writeFile(new URL(`../src/lib/sfim-${year}.fixture.json`, import.meta.url), JSON.stringify(events));
console.log(`Captured ${events.length} events for ${year}`);
