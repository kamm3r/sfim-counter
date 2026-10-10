import { describe, expect, it } from 'vitest';
import {
	getSfimSource,
	getSfimCounterSources,
	getTuloslistaPublicUrl,
	SFIM_SOURCES
} from './sfim-sources.js';

describe('SFIM source registry', () => {
	it('keeps the years in descending order without duplicates', () => {
		expect(SFIM_SOURCES.map((source) => source.year)).toEqual(
			[...SFIM_SOURCES].map((source) => source.year).sort((a, b) => b - a)
		);
		expect(new Set(SFIM_SOURCES.map((source) => source.year)).size).toBe(SFIM_SOURCES.length);
	});

	it('preserves the public Tuloslista links', () => {
		expect(getTuloslistaPublicUrl(19929)).toBe('https://live.tuloslista.com/19929');
		expect(getSfimSource(2026)?.resultsUrl).toBe('https://live.tuloslista.com/19929');
		expect(getSfimSource(2025)?.resultsUrl).toBe('https://live.tuloslista.com/17448');
		expect(getSfimSource(2024)?.resultsUrl).toBe('https://live.tuloslista.com/15477');
		expect(getSfimSource(2023)?.resultsUrl).toBe('https://live.tuloslista.com/13354');
	});

	it('keeps machine-readable competition IDs for the in-app counter', () => {
		expect(getSfimCounterSources().map((source) => source.competitionId)).toEqual([19929, 17448]);
		expect(getSfimCounterSources().every((source) => source.dataUrl)).toBe(true);
	});

	it('marks the cancelled 2020 championship explicitly', () => {
		expect(getSfimSource(2020)?.status).toBe('cancelled');
		expect(getSfimSource(2020)?.resultsUrl).toBeUndefined();
	});

	it('links every held championship from 2002 onward to event results', () => {
		for (let year = 2002; year <= 2026; year++) {
			const source = getSfimSource(year);
			expect(source, `Missing source for ${year}`).toBeDefined();
			if (year === 2020) continue;
			expect(source?.resultsUrl, `Missing results for ${year}`).toMatch(/^https:\/\//);
			expect(source?.status).toBe('archive');
		}
	});

	it('keeps each available competition-day sheet reachable from the archive', () => {
		for (const year of [2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005, 2004]) {
			const source = getSfimSource(year);
			expect(source?.additionalResults?.some((result) => result.label.startsWith('Dag'))).toBe(true);
			expect(source?.resultsUrl).toContain('tilastopaja.info');
		}
		expect(getSfimSource(2021)?.resultsUrl).toBe('https://live.tuloslista.com/9630');
		expect(getSfimSource(2003)?.resultsUrl).toContain('ulog=2325');
		expect(getSfimSource(2002)?.resultsUrl).toContain('ulog=844');
	});
});
