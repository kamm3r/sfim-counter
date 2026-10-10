import { describe, it, expect } from 'vitest';
import { scoreEvent, computeFrihetspriset, computeUngdomspokalen } from './scoring.js';
import type { EventDetail, Organization } from './types.js';

function makeOrg(id: number, name: string, short: string): Organization {
	return { Id: id, Name: name, NameShort: short };
}

function makeAlloc(
	orgId: number,
	orgName: string,
	result: string | null,
	name = 'A Athlete',
	attempts: { Line1: string | null; Line2: string | null }[] = [],
	notInCompetition = false
) {
	return {
		NotInCompetition: notInCompetition,
		Id: 0,
		AllocId: 0,
		Position: 0,
		Number: '',
		Result: result,
		SeuraCUPPoints: 0,
		Wind: '',
		Attempts: attempts,
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
	name: string; category: 'Track' | 'Field' | 'Relay';
	group?: string; id?: number;
results: {
		orgId: number;
		orgName: string;
		result: string | null;
		name?: string;
		attempts?: { Line1: string | null; Line2: string | null }[];
		notInCompetition?: boolean;
	}[];
}): EventDetail {
	const allocs = overrides.results.map((r) => makeAlloc(
		r.orgId,
		r.orgName,
		r.result,
		r.name,
		r.attempts,
		r.notInCompetition,
	));
	const round = {
		Id: 0,
		RoundTypeCategory: 'Final',
		Name: 'Final',
		EventId: 0,
		Heats: [{ Id: 0, Index: 0, Wind: '', Allocations: allocs }],
		Status: 'Finished',
		TotalResults: [] as any[],
	};

	return {
		Enrollments: [],
		EventCategory: overrides.category,
		RootName: '',
		RootId: 0,
		Id: overrides.id ?? 0,
		Name: overrides.name,
		BeginDateTimeWithTZ: '',
		Gender: '',
		Rounds: [round],
		Group: overrides.group ?? 'M',
	};
}

describe('scoreEvent — senior events (group M)', () => {
	it('uses the official relay classification and junior result-point limit', () => {
		const event = makeEvent({
			name: '4x100m viesti', category: 'Relay', group: 'M17',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '45.45' },
				{ orgId: 2, orgName: 'Club B', result: '49.00' },
				{ orgId: 3, orgName: 'Club C', result: '50.00' },
				{ orgId: 4, orgName: 'Club D', result: '51.00' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')).toMatchObject({
			performanceClass: 'A',
			resultPoints: 3,
			totalPoints: 6,
		});
		expect(results.find((r) => r.club.Name === 'Club D')).toMatchObject({
			performanceClass: 'none',
			resultPoints: 0,
			totalPoints: 0,
		});
	});

	it('uses placement 7/5/4/3/2/1 for senior events', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '11.00' },
				{ orgId: 2, orgName: 'Club B', result: '11.50' },
				{ orgId: 3, orgName: 'Club C', result: '12.00' },
			],
		});

		const results = scoreEvent(event);
		const valid = results.filter((r) => r.isValid);
		expect(valid[0].placementPoints).toBe(7);
		expect(valid[1].placementPoints).toBe(5);
		expect(valid[2].placementPoints).toBe(4);
	});

	it('gives result points SM=15/M=10/A=5 regardless of placement', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '10.10' },
				{ orgId: 2, orgName: 'Club B', result: '13.00' },
			],
		});

		const results = scoreEvent(event);
		const a = results.find((r) => r.club.Name === 'Club A')!;
		const b = results.find((r) => r.club.Name === 'Club B')!;

		expect(a.performanceClass).toBe('SM');
		expect(a.resultPoints).toBe(15);
		expect(a.totalPoints).toBe(7 + 15);

		expect(b.performanceClass).toBe('none');
		expect(b.resultPoints).toBe(0);
		expect(b.totalPoints).toBe(5);
	});

	it('scores field events correctly', () => {
		const event = makeEvent({
			name: 'längd', category: 'Field', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '7.50' },
				{ orgId: 2, orgName: 'Club B', result: '6.00' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')!.placement).toBe(1);
		expect(results.find((r) => r.club.Name === 'Club B')!.placement).toBe(2);
	});

	it('uses the next-best mark to resolve equal horizontal field results', () => {
		const event = makeEvent({
			name: 'längd', category: 'Field', group: 'M',
			results: [
				{
					orgId: 1,
					orgName: 'Club A',
					result: '6.00',
					attempts: [
						{ Line1: '6.00', Line2: null },
						{ Line1: '5.50', Line2: null },
					],
				},
				{
					orgId: 2,
					orgName: 'Club B',
					result: '6.00',
					attempts: [
						{ Line1: '6.00', Line2: null },
						{ Line1: '5.40', Line2: null },
					],
				},
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')).toMatchObject({ placement: 1, tieCount: 1 });
		expect(results.find((r) => r.club.Name === 'Club B')).toMatchObject({ placement: 2, tieCount: 1 });
	});

	it('uses attempts at the best height for equal vertical field results', () => {
		const event = makeEvent({
			name: 'Korkeus', category: 'Field', group: 'N',
			results: [
				{
					orgId: 1,
					orgName: 'Club A',
					result: '162',
					attempts: [
						{ Line1: '157', Line2: 'o' },
						{ Line1: '162', Line2: 'o' },
						{ Line1: '167', Line2: 'xxx' },
					],
				},
				{
					orgId: 2,
					orgName: 'Club B',
					result: '162',
					attempts: [
						{ Line1: '157', Line2: 'o' },
						{ Line1: '162', Line2: 'xo' },
						{ Line1: '167', Line2: 'xxx' },
					],
				},
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')).toMatchObject({ placement: 1, tieCount: 1 });
		expect(results.find((r) => r.club.Name === 'Club B')).toMatchObject({ placement: 2, tieCount: 1 });
	});

	it('marks invalid results as not valid', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '11.00' },
				{ orgId: 2, orgName: 'Club B', result: 'DNS' },
				{ orgId: 3, orgName: 'Club C', result: 'DQ' },
			],
		});

		expect(scoreEvent(event).filter((r) => r.isValid)).toHaveLength(1);
	});

	it('scores senior relays with placement points and the A result bonus', () => {
		const event = makeEvent({
			name: '4x100 m', category: 'Relay', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '42.50' },
				{ orgId: 2, orgName: 'Club B', result: '43.00' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')!.placementPoints).toBe(7);
		expect(results.find((r) => r.club.Name === 'Club A')!.resultPoints).toBe(5);
	});

	it('handles ties by splitting placement points equally', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '11.00' },
				{ orgId: 2, orgName: 'Club B', result: '11.50' },
				{ orgId: 3, orgName: 'Club C', result: '11.50' },
				{ orgId: 4, orgName: 'Club D', result: '12.00' },
			],
		});

		const results = scoreEvent(event);
		const b = results.find((r) => r.club.Name === 'Club B')!;
		const c = results.find((r) => r.club.Name === 'Club C')!;

		expect(b.placement).toBe(2);
		expect(c.placement).toBe(2);
		expect(b.placementPoints).toBe((5 + 4) / 2);
		expect(c.placementPoints).toBe(b.placementPoints);
	});

	it('does not award a result-class bonus for an over-limit sprint wind', () => {
		const event = makeEvent({ name: '100 m', category: 'Track', group: 'M', results: [
			{ orgId: 1, orgName: 'Club A', result: '10.95' },
		] });
		event.Rounds[0].Heats[0].Allocations[0].Wind = '+2,1';
		const result = scoreEvent(event)[0];
		expect(result.placementPoints).toBe(7);
		expect(result.performanceClass).toBe('none');
		expect(result.resultPoints).toBe(0);
	});

	it('uses the best wind-legal jump for result-class points', () => {
		const event = makeEvent({ name: 'N Pituus', category: 'Field', group: 'N', results: [
			{ orgId: 1, orgName: 'Club A', result: '5.72', attempts: [
				{ Line1: '5.72', Line2: '+2,2' },
				{ Line1: '5.62', Line2: '+1,7' },
			] },
		] });
		event.Rounds[0].Heats[0].Allocations[0].Wind = '+2,2';
		const result = scoreEvent(event)[0];
		expect(result.placementPoints).toBe(7);
		expect(result.performanceClass).toBe('none');
	});
});

describe('scoreEvent — junior events (group P15/H17)', () => {
	it('uses placement 3/2/1 for junior events', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.50' },
				{ orgId: 2, orgName: 'Club B', result: '13.00' },
				{ orgId: 3, orgName: 'Club C', result: '14.00' },
				{ orgId: 4, orgName: 'Club D', result: '15.00' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')!.placementPoints).toBe(3);
		expect(results.find((r) => r.club.Name === 'Club B')!.placementPoints).toBe(2);
		expect(results.find((r) => r.club.Name === 'Club C')!.placementPoints).toBe(1);
		expect(results.find((r) => r.club.Name === 'Club D')!.placementPoints).toBe(0);
	});

	it('gives result points A=3 only for top 3 in junior events', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.00' },
				{ orgId: 2, orgName: 'Club B', result: '12.10' },
				{ orgId: 3, orgName: 'Club C', result: '12.20' },
			],
		});

		const results = scoreEvent(event);
		const a = results.find((r) => r.club.Name === 'Club A')!;
		expect(a.performanceClass).toBe('A');
		expect(a.resultPoints).toBe(3);
	});

	it('gives 0 result points for 4th+ place in junior events even with A class', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.00' },
				{ orgId: 2, orgName: 'Club B', result: '12.10' },
				{ orgId: 3, orgName: 'Club C', result: '12.20' },
				{ orgId: 4, orgName: 'Club D', result: '12.30' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club D')!.resultPoints).toBe(0);
	});

	it('gives no result points to a non-A junior result', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.31' },
			],
		});

		const results = scoreEvent(event);
		const a = results.find((r) => r.club.Name === 'Club A')!;
		expect(a.performanceClass).toBe('none');
		expect(a.resultPoints).toBe(0);
	});

	it('scores junior relays with 3/2/1 placement', () => {
		const event = makeEvent({
			name: '4x100 m', category: 'Relay', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '52.00' },
				{ orgId: 2, orgName: 'Club B', result: '53.00' },
				{ orgId: 3, orgName: 'Club C', result: '54.00' },
				{ orgId: 4, orgName: 'Club D', result: '55.00' },
			],
		});

		const results = scoreEvent(event);
		expect(results.find((r) => r.club.Name === 'Club A')!.placementPoints).toBe(3);
		expect(results.find((r) => r.club.Name === 'Club B')!.placementPoints).toBe(2);
		expect(results.find((r) => r.club.Name === 'Club C')!.placementPoints).toBe(1);
		expect(results.find((r) => r.club.Name === 'Club D')!.placementPoints).toBe(0);
	});
});

describe('computeFrihetspriset', () => {
	it('aggregates points across all events (both senior and junior)', () => {
		const events = [
			makeEvent({
				name: '100 m', category: 'Track', group: 'M',
				results: [
					{ orgId: 1, orgName: 'Club A', result: '10.50' },
				],
			}),
			makeEvent({
				name: '100 m', category: 'Track', group: 'P15',
				results: [
					{ orgId: 1, orgName: 'Club A', result: '12.50' },
				],
			}),
		];

		const result = computeFrihetspriset(events);
		const clubA = result.rankings.find((c) => c.club.Name === 'Club A')!;
		expect(clubA.events).toHaveLength(2);
		expect(clubA.totalPoints).toBeGreaterThan(0);
		expect(clubA.events[0]).toMatchObject({
			eventName: '100 m',
			placement: 1,
			placementPoints: 7,
			points: 17
		});
		expect(clubA.events[0].points).toBe(clubA.events[0].placementPoints + clubA.events[0].resultPoints);
	});

	it('excludes 7th+ place with no classification (zero total)', () => {
		const events = [
			makeEvent({
				name: '100 m', category: 'Track', group: 'M',
				results: Array.from({ length: 8 }, (_, i) => ({
					orgId: i + 1,
					orgName: `Club ${String.fromCharCode(65 + i)}`,
					result: `${11 + i}.00`,
				})),
			}),
		];

		const result = computeFrihetspriset(events);
		expect(result.rankings.filter((c) => c.totalPoints > 0)).toHaveLength(6);
	});

	it('returns empty for no events', () => {
		const result = computeFrihetspriset([]);
		expect(result.rankings).toHaveLength(0);
		expect(result.trophy).toBe('frihetspriset');
	});
});

describe('computeUngdomspokalen', () => {
	it('keeps A-class points for strong junior results', () => {
		const event = makeEvent({
			name: '100m', category: 'Track', group: 'M15',
			results: [{ orgId: 1, orgName: 'Club A', result: '11.88' }],
		});

		const result = computeUngdomspokalen([event]);
		expect(result.rankings[0].totalPoints).toBe(12);
	});

	it('splits youth placement points across ties', () => {
		const event = makeEvent({
			name: '100m', category: 'Track', group: 'M15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.00' },
				{ orgId: 2, orgName: 'Club B', result: '12.50' },
				{ orgId: 3, orgName: 'Club C', result: '12.50' },
			],
		});

		const result = computeUngdomspokalen([event]);
		expect(result.rankings.find((club) => club.club.Name === 'Club B')?.totalPoints).toBe(4.5);
		expect(result.rankings.find((club) => club.club.Name === 'Club C')?.totalPoints).toBe(4.5);
	});

	it('only includes junior events', () => {
		const events = [
			makeEvent({ id: 1, name: '100 m', category: 'Track', group: 'M',
				results: [{ orgId: 1, orgName: 'Club A', result: '10.50' }],
			}),
			makeEvent({ id: 2, name: '100 m', category: 'Track', group: 'P15',
				results: [
					{ orgId: 2, orgName: 'Club B', result: '12.50' },
				],
			}),
		];

		const result = computeUngdomspokalen(events);
		expect(result.rankings).toHaveLength(1);
		expect(result.rankings[0].club.Name).toBe('Club B');
	});

	it('uses placement 7/5/4/3/2/1 for Ungdomspokalen', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.00' },
				{ orgId: 2, orgName: 'Club B', result: '13.00' },
				{ orgId: 3, orgName: 'Club C', result: '14.00' },
				{ orgId: 4, orgName: 'Club D', result: '15.00' },
			],
		});

		const result = computeUngdomspokalen([event]);
		const a = result.rankings.find((c) => c.club.Name === 'Club A')!;
		expect(a.totalPoints).toBeGreaterThan(0);
	});

	it('gives A=5 result points in Ungdomspokalen', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'P15',
			results: [
				{ orgId: 1, orgName: 'Club A', result: '12.30' },
			],
		});

		const result = computeUngdomspokalen([event]);
		const a = result.rankings.find((c) => c.club.Name === 'Club A')!;
		expect(a.totalPoints).toBe(12);
	});

	it('does not place null or non-competition results', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [
				{ orgId: 1, orgName: 'Club A', result: null },
				{ orgId: 2, orgName: 'Club B', result: '10.50', notInCompetition: true },
				{ orgId: 3, orgName: 'Club C', result: '10.95' },
			],
		});

		const results = scoreEvent(event);
		expect(results.filter((r) => r.isValid)).toHaveLength(1);
		expect(results.find((r) => r.club.Name === 'Club A')).toMatchObject({
			isValid: false,
			placement: 0,
			totalPoints: 0,
		});
		expect(results.find((r) => r.club.Name === 'Club B')).toMatchObject({
			isValid: false,
			placement: 0,
			totalPoints: 0,
		});
	});

	it('uses final results instead of preliminary heats when both exist', () => {
		const event = makeEvent({
			name: '100 m', category: 'Track', group: 'M',
			results: [{ orgId: 1, orgName: 'Club A', result: '10.50' }],
		});
		event.Rounds.unshift({
			Id: 1,
			RoundTypeCategory: 'Qualification',
			Name: 'Heat 1',
			EventId: event.Id,
			Heats: [{
				Id: 1,
				Index: 0,
				Wind: '',
				Allocations: [makeAlloc(2, 'Club B', '10.00')],
			}],
			Status: 'Finished',
			TotalResults: [],
		});

		const results = scoreEvent(event);
		expect(results.map((r) => r.club.Name)).toEqual(['Club A']);
	});
});
