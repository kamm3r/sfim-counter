import type { CompetitionList, CompetitionProperties, Events, EventDetail } from './types.js';
import { isEventDetail } from './validation.js';
import { getPinnedArchive } from './archives.js';

// Pinned final feeds stay available after Tuloslista retires the old API records.
const ARCHIVE_FIXTURES = import.meta.glob<{ default: unknown }>('./sfim-*.fixture.json');

const TULOSLISTA_API_ORIGIN = 'https://cached-public-api.tuloslista.com';
const TULOSLISTA_API_BASE_URL = `${TULOSLISTA_API_ORIGIN}/live/v1`;

async function fetchJson<T>(url: string): Promise<T> {
	const proxyUrl = url.replace(TULOSLISTA_API_ORIGIN, '/api');
	const res = await fetch(proxyUrl, { cache: 'no-store' });
	if (!res.ok) {
		throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`.trim());
	}
	return res.json() as Promise<T>;
}

export async function getCompetitions(): Promise<CompetitionList[]> {
	return fetchJson<CompetitionList[]>(`${TULOSLISTA_API_BASE_URL}/competition`);
}

export async function getEvents(compId: number): Promise<Events> {
	return fetchJson<Events>(`${TULOSLISTA_API_BASE_URL}/competition/${compId}`);
}

export async function getCompetitionDetails(compId: number): Promise<CompetitionProperties> {
	return fetchJson<CompetitionProperties>(`${TULOSLISTA_API_BASE_URL}/competition/${compId}/properties`);
}

export async function getResults(compId: number): Promise<EventDetail[]> {
	const archive = getPinnedArchive(compId);
	if (archive) {
		const load = ARCHIVE_FIXTURES[`./sfim-${archive.year}.fixture.json`];
		if (!load) throw new Error(`Missing pinned results for ${archive.year}`);
		return (await load()).default as EventDetail[];
	}
	const events = await getEvents(compId);
	const eventIds = [...new Set(Object.values(events).flat().map((e) => e.EventId))];
	if (eventIds.length === 0) return [];

	const results: EventDetail[] = [];
	const failures: Error[] = [];
	for (let i = 0; i < eventIds.length; i += 6) {
		const batch = eventIds.slice(i, i + 6);
		const batchResults = await Promise.all(
			batch.map(async (eventId) => {
				try {
					const event = await fetchJson<unknown>(`${TULOSLISTA_API_BASE_URL}/results/${compId}/${eventId}`);
					if (!isEventDetail(event, eventId)) throw new Error(`Invalid result payload for event ${eventId}`);
					return event;
				} catch (error) {
					failures.push(error instanceof Error ? error : new Error(String(error)));
					return null;
				}
			})
		);
		results.push(...batchResults.filter((result): result is EventDetail => result !== null));
	}

	// An incomplete request must not replace the last good standings with a
	// lower, seemingly valid total. The query layer keeps its previous data on
	// error, while the browser snapshot remains available for a fresh visit.
	if (failures.length > 0) {
		throw new Error(`Only ${results.length} of ${eventIds.length} event results loaded for competition ${compId}: ${failures[0].message}`);
	}

	return results;
}

export function isSfiMComp(comp: CompetitionList): boolean {
	return comp.Name.toLowerCase().includes('sfim');
}
