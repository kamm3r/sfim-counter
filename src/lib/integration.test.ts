import { describe, it, expect } from 'vitest';
import { computeFrihetspriset, computeUngdomspokalen, scoreEvent } from './scoring.js';
import type { EventDetail, Organization } from './types.js';

function makeOrg(id: number, name: string, short: string): Organization {
	return { Id: id, Name: name, NameShort: short };
}

function makeAlloc(orgId: number, orgName: string, result: string, name = 'A Athlete') {
	return {
		NotInCompetition: false,
		Id: 0,
		AllocId: 0,
		Position: 0,
		Number: '',
		Result: result,
		SeuraCUPPoints: 0,
		Wind: '',
		Attempts: [],
		TeamName: '',
		TeamId: 0,
		Name: name,
		Firstname: '',
		Surname: '',
		Organization: makeOrg(orgId, orgName, orgName),
		Athletes: [],
	};
}

function makeEvent(overrides: Partial<EventDetail> & {
	name: string;
	category: 'Track' | 'Field' | 'Relay';
	id?: number;
	group?: string;
	results: { orgId: number; orgName: string; result: string; name?: string }[];
}): EventDetail {
	const allocs = overrides.results.map((r) => makeAlloc(r.orgId, r.orgName, r.result, r.name));
	return {
		Enrollments: [],
		EventCategory: overrides.category,
		RootName: '',
		RootId: 0,
		Id: overrides.id ?? 0,
		Name: overrides.name,
		BeginDateTimeWithTZ: '',
		Gender: '',
		Rounds: [{
			Id: 0,
			RoundTypeCategory: 'Final',
			Name: 'Final',
			EventId: 0,
			Heats: [{ Id: 0, Index: 0, Wind: '', Allocations: allocs }],
			Status: 'Finished',
			TotalResults: [],
		}],
		Group: overrides.group ?? 'M',
	};
}

function claw(orgId: number, result: string, name?: string) {
	return { orgId, orgName: `Club ${orgId}`, result, name };
}

describe('Frihetspriset integration', () => {
	it('combines senior and junior events into one leaderboard', () => {
		const events = [
			makeEvent({
				name: '100 m', category: 'Track', group: 'M',
				results: [
					claw(1, '10.50'),
					claw(2, '11.00'),
					claw(3, '12.00'),
				],
			}),
			makeEvent({
				name: '100 m', category: 'Track', group: 'P15',
				results: [
					claw(1, '12.50'),
					claw(2, '13.00'),
				],
			}),
		];

		const result = computeFrihetspriset(events);
		expect(result.trophy).toBe('frihetspriset');

		const club1 = result.rankings.find((c) => c.club.Name === 'Club 1')!;
		const club2 = result.rankings.find((c) => c.club.Name === 'Club 2')!;
		const club3 = result.rankings.find((c) => c.club.Name === 'Club 3')!;

		expect(club1).toBeDefined();
		expect(club2).toBeDefined();
		expect(club3).toBeDefined();

		expect(club1.events).toHaveLength(2);
		expect(club2.events).toHaveLength(2);
		expect(club3.events).toHaveLength(1);

		expect(club1.totalPoints).toBeGreaterThan(club2.totalPoints);
		expect(club2.totalPoints).toBeGreaterThan(club3.totalPoints);
	});

	it('produces structured output matching the expected format', () => {
		const events: EventDetail[] = [];
		const result = computeFrihetspriset(events);

		expect(result).toHaveProperty('trophy', 'frihetspriset');
		expect(result).toHaveProperty('rankings');
		expect(result).toHaveProperty('eventBreakdown');
		expect(Array.isArray(result.rankings)).toBe(true);
		expect(Array.isArray(result.eventBreakdown)).toBe(true);
	});

	it('total points are summed across events for each club', () => {
		const events = [
			makeEvent({
				name: '100 m', category: 'Track', group: 'M',
				results: [
					claw(1, '10.50'),
					claw(2, '11.00'),
				],
			}),
			makeEvent({
				name: 'längd', category: 'Field', group: 'M',
				results: [
					claw(2, '7.00'),
					claw(1, '6.50'),
				],
			}),
		];

		const result = computeFrihetspriset(events);
		const club1 = result.rankings.find((c) => c.club.Name === 'Club 1')!;
		const club2 = result.rankings.find((c) => c.club.Name === 'Club 2')!;

		const pointsClub1 = scoreEvent(events[0]).find((r) => r.club.Name === 'Club 1')!.totalPoints
			+ scoreEvent(events[1]).find((r) => r.club.Name === 'Club 1')!.totalPoints;
		const pointsClub2 = scoreEvent(events[0]).find((r) => r.club.Name === 'Club 2')!.totalPoints
			+ scoreEvent(events[1]).find((r) => r.club.Name === 'Club 2')!.totalPoints;

		expect(club1.totalPoints).toBe(pointsClub1);
		expect(club2.totalPoints).toBe(pointsClub2);
	});

	it('uses junior scoring for junior group events', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				claw(1, '12.50'),
				claw(2, '13.00'),
				claw(3, '14.00'),
			],
		});

		const scored = scoreEvent(event);
		expect(scored.find((r) => r.placement === 1)!.placementPoints).toBe(3);
		expect(scored.find((r) => r.placement === 2)!.placementPoints).toBe(2);
		expect(scored.find((r) => r.placement === 3)!.placementPoints).toBe(1);
	});
});

describe('Frihetspriset event eligibility', () => {
	it('does not count combined events', () => {
		const result = computeFrihetspriset([
			makeEvent({
				name: 'M 10-ottelu',
				category: 'Field',
				group: 'M',
				results: [{ orgId: 1, orgName: 'Club 1', result: '7000' }],
			}),
			makeEvent({
				name: '100 m',
				category: 'Track',
				group: 'M',
				results: [{ orgId: 1, orgName: 'Club 1', result: '10.95' }],
			}),
		]);

		const club = result.rankings.find((entry) => entry.club.Name === 'Club 1')!;
		expect(club.totalPoints).toBe(12);
		expect(club.events).toHaveLength(1);
		expect(result.eventBreakdown).toHaveLength(2);
	});
});

describe('Ungdomspokalen integration', () => {
	it('filters to junior-only events', () => {
		const events = [
			makeEvent({
				name: '100 m', category: 'Track', group: 'M',
				results: [claw(1, '10.50')],
			}),
			makeEvent({
				name: '100 m', category: 'Track', group: 'P15',
				results: [claw(2, '12.50')],
			}),
			makeEvent({
				name: '100 m', category: 'Track', group: 'H17',
				results: [claw(3, '11.50')],
			}),
		];

		const result = computeUngdomspokalen(events);
		const clubNames = result.rankings.map((c) => c.club.Name);
		expect(clubNames).toEqual(['Club 2', 'Club 3']);
	});

	it('produces structured output matching the expected format', () => {
		const events: EventDetail[] = [];
		const result = computeUngdomspokalen(events);

		expect(result).toHaveProperty('trophy', 'ungdomspokalen');
		expect(result).toHaveProperty('rankings');
		expect(result).toHaveProperty('eventBreakdown');
	});
});
