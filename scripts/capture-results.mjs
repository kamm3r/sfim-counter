// Refresh a checked-in final result fixture from Tuloslista's public API.
// Run deliberately: each fixture represents a finalized championship snapshot.
//
//   node scripts/capture-results.mjs 2026           compare, then write if safe
//   node scripts/capture-results.mjs 2026 --force   write even if the capture shrinks
//
// The capture is validated with the app's own payload checks and compared with
// the existing fixture. A capture with fewer events or scored rows is refused
// unless --force is given, and the file is replaced atomically.
import { readFile, rename, writeFile } from 'node:fs/promises';
import { isEventDetail } from '../src/lib/validation.ts';
import { PINNED_ARCHIVES } from '../src/lib/archives.ts';

const args = process.argv.slice(2);
const force = args.includes('--force');
const year = Number(args.find((arg) => !arg.startsWith('--')) ?? 2026);
const competitionId = PINNED_ARCHIVES.find((archive) => archive.year === year)?.competitionId;
if (!competitionId) throw new Error(`Add ${year} to src/lib/archives.ts first. Pinned years: ${PINNED_ARCHIVES.map((archive) => archive.year).join(', ')}`);
const base = 'https://cached-public-api.tuloslista.com/live/v1';
const fixtureUrl = new URL(`../src/lib/sfim-${year}.fixture.json`, import.meta.url);

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
		if (!isEventDetail(event, id)) throw new Error(`Event ${id}: invalid result payload`);
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

// A finalized event has a final round with at least one recorded result.
function resultRows(event) {
	return event.Rounds
		.filter((round) => round.RoundTypeCategory === 'Final')
		.flatMap((round) => round.TotalResults.length ? round.TotalResults : round.Heats.flatMap((heat) => heat.Allocations))
		.filter((allocation) => /\d/.test(allocation.Result ?? ''));
}

const unfinished = events.filter((event) => resultRows(event).length === 0);
if (unfinished.length > 0) {
	console.warn(`No final results yet for ${unfinished.length} event(s): ${unfinished.map((event) => event.Name).join(', ')}`);
}

let previous = [];
try {
	previous = JSON.parse(await readFile(fixtureUrl, 'utf8'));
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}

const capturedIds = new Set(events.map((event) => event.Id));
const removed = previous.filter((event) => !capturedIds.has(event.Id));
const previousIds = new Set(previous.map((event) => event.Id));
const added = events.filter((event) => !previousIds.has(event.Id));
const rowCount = (list) => list.reduce((total, event) => total + resultRows(event).length, 0);
const previousRows = rowCount(previous);
const capturedRows = rowCount(events);

console.log(`Existing fixture: ${previous.length} events, ${previousRows} result rows`);
console.log(`New capture:      ${events.length} events, ${capturedRows} result rows`);
if (added.length) console.log(`Added events:   ${added.map((event) => event.Name).join(', ')}`);
if (removed.length) console.log(`Removed events: ${removed.map((event) => event.Name).join(', ')}`);

const shrinks = removed.length > 0 || capturedRows < previousRows || unfinished.length > 0;
if (shrinks && !force) {
	console.error('Refusing to replace the fixture with a less complete capture. Re-run with --force to overwrite anyway.');
	process.exit(1);
}

// Write beside the fixture, then rename, so an interrupted run never leaves a truncated file.
const tempUrl = new URL(`${fixtureUrl.href}.tmp`);
await writeFile(tempUrl, JSON.stringify(events));
await rename(tempUrl, fixtureUrl);
console.log(`Captured ${events.length} events for ${year}`);
