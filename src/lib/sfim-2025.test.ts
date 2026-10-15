import { describe, expect, it } from 'vitest';
import { scoreEvent, computeChampionship } from './scoring.js';
import { getResults } from './api.js';
import type { EventDetail } from './types.js';
import snapshot from './sfim-2025.fixture.json';

const events = snapshot as unknown as EventDetail[];

describe('2025 result-feed regression', () => {
	it('opens the archived event breakdown without requesting the old API', async () => {
		const archived = await getResults(17448);
		expect(archived).toHaveLength(106);
	});

	it('treats Tuloslista T15 girls as juniors in both trophies', () => {
		const event = events.find((item) => item.Name === 'F15 100m')!;
		expect(event.Group).toBe('T15');
		expect(scoreEvent(event).find((result) => result.isValid)?.ageClass).toBe('junior');
		expect(computeChampionship([event]).ungdomspokalen.eventBreakdown).toHaveLength(1);
		expect(computeChampionship([event]).frihetspriset.eventBreakdown).toHaveLength(1);
	});

	it('matches the published 2025 winning and runner-up club totals', () => {
		const frihet = computeChampionship(events).frihetspriset;
		const youth = computeChampionship(events).ungdomspokalen;
		for (const [name, points] of [['HIFK Friidrott', 253], ['IF Sibbo-Vargarna', 180.5]] as const) {
			expect(frihet.rankings.find((club) => club.club.Name === name)?.totalPoints).toBe(points);
		}
		for (const [name, points] of [['Vasa IS', 246], ['IF Sibbo-Vargarna', 134.5]] as const) {
			expect(youth.rankings.find((club) => club.club.Name === name)?.totalPoints).toBe(points);
		}
	});
});
