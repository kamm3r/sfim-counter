const TULOSLISTA_PUBLIC_ORIGIN = 'https://live.tuloslista.com';
export const SFIM_RESULTS_SERVICE_URL = 'https://sfimfriidrott.idrott.fi/resultatservice/';
const SFIM_HISTORICAL_ARCHIVE_URL = 'https://www.akilles.fi/friidrott/sfim-resultat/';
const TILASTOPAJA_RESULTS_BASE = 'https://www.tilastopaja.info/fi/db/';

function tilastopajaResults(competitionId: number): string {
	return `${TILASTOPAJA_RESULTS_BASE}tulokset.php?CID=${competitionId}`;
}

function tilastopajaOldResults(logId: number): string {
	return `${TILASTOPAJA_RESULTS_BASE}tulokset_old.php?ulog=${logId}`;
}

export type SfimSourceStatus = 'live' | 'archive' | 'partial' | 'cancelled';

export type SfimSource = {
	year: number;
	competitionId?: number;
	dates?: string;
	venue?: string;
	organizer?: string;
	status: SfimSourceStatus;
	sourceUrl: string;
	resultsUrl?: string;
	additionalResults?: readonly { label: string; url: string }[];
	dataUrl?: string;
	notes?: string;
};

export function getTuloslistaPublicUrl(competitionId: number): string {
	return `${TULOSLISTA_PUBLIC_ORIGIN}/${competitionId}`;
}

// These are source records, not assumed machine-readable fixtures. Only entries
// with a competitionId and dataUrl can currently be loaded directly by the app.
export const SFIM_SOURCES: readonly SfimSource[] = [
	{
		year: 2026,
		competitionId: 19929,
		dates: '10–11.7.2026',
		venue: 'Pedersöre (Bennäs)',
		organizer: 'IK Falken',
		status: 'archive',
		sourceUrl: SFIM_RESULTS_SERVICE_URL,
		resultsUrl: getTuloslistaPublicUrl(19929),
		dataUrl: 'https://cached-public-api.tuloslista.com/live/v1/competition/19929',
		notes: 'Final event results are pinned locally; the trophy rankings use the organizer’s published final tables.'
	},
	{
		year: 2025,
		competitionId: 17448,
		dates: '28–29.6.2025',
		venue: 'Sibbo (Nickby)',
		organizer: 'IF Sibbo-Vargarna',
		status: 'archive',
		sourceUrl: 'https://sfi.idrott.fi/sara-wiss-forsvarade-sitt-masterskap-i-hogklassig-final/',
		resultsUrl: getTuloslistaPublicUrl(17448),
		dataUrl: 'https://cached-public-api.tuloslista.com/live/v1/competition/17448',
		notes: 'Final event results are pinned locally. Trophy totals are calculated from those results, with published benchmarks where available.'
	},
	{
		year: 2024,
		dates: '13–14.7.2024',
		venue: 'Nedervetil',
		organizer: 'IF Åsarna',
		status: 'archive',
		sourceUrl: 'https://kilpailukalenteri.fi/?cs=16&nid=34204',
		resultsUrl: getTuloslistaPublicUrl(15477),
		additionalResults: [{ label: 'Tilastopaja', url: tilastopajaResults(100701) }],
		notes: 'Complete results are available externally; the cached Tuloslista JSON record is no longer available.'
	},
	{
		year: 2023,
		dates: '8–9.7.2023',
		venue: 'Åbo (Paavo Nurmi Stadion)',
		organizer: 'Åbo IFK / Pargas IF',
		status: 'archive',
		sourceUrl: 'https://kilpailukalenteri.fi/?cs=16&nid=32664',
		resultsUrl: getTuloslistaPublicUrl(13354),
		additionalResults: [{ label: 'Tilastopaja', url: tilastopajaResults(95032) }],
		notes: 'Complete results are available externally; the cached Tuloslista JSON record is no longer available.'
	},
	{
		year: 2022,
		dates: '19–21.8.2022',
		venue: 'Mariehamn (Baltic Friidrottsarena)',
		organizer: 'IF Åland',
		status: 'archive',
		sourceUrl: 'https://sfim2022.ax/samtliga-resultat-fran-sfim-2022/',
		resultsUrl: 'https://sfim2022.ax/app/uploads/sites/144/2022/08/complete-results-final.pdf',
		dataUrl: 'https://data.opentrack.run/en-gb/x/2022/ALA/sfim/',
		notes: 'OpenTrack/PDF source; no Tuloslista event was found.'
	},
	{
		year: 2021,
		dates: '10–11.7.2021',
		venue: 'Närpes',
		organizer: 'IF Kraft',
		status: 'archive',
		sourceUrl: 'https://sfi.idrott.fi/sfim-i-narpes-10-11-7-seniorer/',
		resultsUrl: getTuloslistaPublicUrl(9630),
		additionalResults: [{ label: 'Tilastopaja', url: tilastopajaResults(82839) }],
		notes: 'Complete results are available externally on Tuloslista and Tilastopaja; no cached JSON record was found.'
	},
	{
		year: 2020,
		status: 'cancelled',
		sourceUrl: 'https://sfi.idrott.fi/sfim-i-friidrott-skjuts-fram-till-2021/',
		notes: 'Cancelled because of the COVID-19 pandemic.'
	},
	{
		year: 2019,
		dates: '6–7.7.2019',
		venue: 'Karis',
		organizer: 'IF Raseborg',
		status: 'archive',
		sourceUrl: 'https://sfi.idrott.fi/friidrott/tavling/sfi-masterskap/',
		resultsUrl: tilastopajaResults(71355),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2018,
		dates: '7–8.7.2018',
		venue: 'Jakobstad',
		status: 'archive',
		sourceUrl: SFIM_HISTORICAL_ARCHIVE_URL,
		resultsUrl: tilastopajaResults(46982),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2017,
		dates: '12–13.8.2017',
		venue: 'Borgå',
		organizer: 'Borgå Akilles',
		status: 'archive',
		sourceUrl: 'https://www.kilpailukalenteri.fi/?cs=16&nid=20494',
		resultsUrl: tilastopajaResults(40221),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2016,
		dates: '16–17.7.2016',
		venue: 'Esbo (Alberga)',
		organizer: 'Esbo IF',
		status: 'archive',
		sourceUrl: 'https://www.kilpailukalenteri.fi/?cs=16&nid=18071',
		resultsUrl: tilastopajaResults(31000),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2015,
		dates: '11–12.7.2015',
		venue: 'Nedervetil',
		status: 'archive',
		sourceUrl: 'https://yle.fi/a/7-953202',
		resultsUrl: tilastopajaResults(21720),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2014,
		dates: '18–19.7.2014',
		venue: 'Bennäs',
		status: 'archive',
		sourceUrl: 'https://fsg.idrott.fi/app/uploads/sites/46/2019/08/verskamhetsberaettelse-2014.pdf',
		resultsUrl: tilastopajaResults(11489),
		notes: 'Complete championship results are available in Tilastopaja.'
	},
	{
		year: 2013,
		dates: '19–20.7.2013',
		venue: 'Helsingfors',
		status: 'archive',
		sourceUrl: 'https://yle.fi/a/7-685747',
		resultsUrl: tilastopajaOldResults(22278),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(22287) }],
		notes: 'Tilastopaja preserves separate results sheets for 19 and 20 July.'
	},
	{
		year: 2012,
		dates: '7–9.9.2012',
		venue: 'Mariehamn (Wiklöf Holding Arena)',
		organizer: 'IF Åland',
		status: 'archive',
		sourceUrl: 'https://yle.fi/a/7-530715',
		resultsUrl: tilastopajaOldResults(20682),
		additionalResults: [{ label: 'Dag 2–3', url: tilastopajaOldResults(20694) }],
		notes: 'Tilastopaja preserves separate sheets for 7 and 8–9 September; the original IF Åland URL is offline.'
	},
	{
		year: 2011,
		dates: '29–30.7.2011',
		venue: 'Kristinestad',
		status: 'archive',
		sourceUrl: 'https://www.nyan.ax/sport/alandska-framgangar-i-sfi-masterskapen/',
		resultsUrl: tilastopajaOldResults(18108),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(18112) }],
		notes: 'Tilastopaja preserves separate results sheets for 29 and 30 July.'
	},
	{
		year: 2010,
		dates: '16–17.7.2010',
		venue: 'Nykarleby',
		status: 'archive',
		sourceUrl: 'https://www.nyan.ax/sport/tre-guld-och-tre-alandska-rekord-for-hanna-wiss-i-sfim/',
		resultsUrl: tilastopajaOldResults(15799),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(15801) }],
		notes: 'Tilastopaja preserves separate results sheets for 16 and 17 July.'
	},
	{
		year: 2009,
		dates: '7–8.8.2009',
		venue: 'Lovisa',
		status: 'archive',
		sourceUrl: 'https://yle.fi/a/7-336024',
		resultsUrl: tilastopajaOldResults(13931),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(13949) }],
		notes: 'Tilastopaja preserves separate results sheets for 7 and 8 August.'
	},
	{
		year: 2008,
		dates: '8–9.8.2008',
		venue: 'Sibbo',
		status: 'archive',
		sourceUrl: 'https://epaper.nyan.ax/earkiv/2008/08-11/page19.pdf',
		resultsUrl: tilastopajaOldResults(11900),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(11909) }],
		notes: 'Tilastopaja preserves separate results sheets for 8 and 9 August.'
	},
	{
		year: 2007,
		dates: '10–11.8.2007',
		venue: 'Vasa',
		status: 'archive',
		sourceUrl: 'https://epaper.nyan.ax/earkiv/2007/08-13/full.pdf',
		resultsUrl: tilastopajaOldResults(10039),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(10040) }],
		notes: 'Tilastopaja preserves separate results sheets for 10 and 11 August.'
	},
	{
		year: 2006,
		dates: '11–12.8.2006',
		venue: 'Gamlakarleby (Kokkola)',
		organizer: 'Gamlakarleby IF',
		status: 'archive',
		sourceUrl: 'https://gamlakarlebyif.fi/gif-historik-1906/',
		resultsUrl: tilastopajaOldResults(8156),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(8162) }],
		notes: 'Tilastopaja preserves separate results sheets for 11 and 12 August.'
	},
	{
		year: 2005,
		dates: '29–30.7.2005',
		venue: 'Karis',
		organizer: 'Karis IK',
		status: 'archive',
		sourceUrl: 'https://gardbergcenter.hembygd.fi/Site/Data/278/Files/Lokalarkivet/Foreningar/Karis_Idrottsklubb.pdf',
		resultsUrl: tilastopajaOldResults(6264),
		additionalResults: [
			{ label: 'Dag 2', url: tilastopajaOldResults(6269) },
			{ label: 'Mångkamp', url: tilastopajaOldResults(6276) }
		],
		notes: 'Tilastopaja preserves separate 29–30 July results and a 23–24 July combined-events sheet from Vasa.'
	},
	{
		year: 2004,
		dates: '23–24.7.2004',
		venue: 'Närpes',
		status: 'archive',
		sourceUrl: 'https://www.tilastopaja.info/fi/db/kilpailut.php?Kausi=2004',
		resultsUrl: tilastopajaOldResults(4316),
		additionalResults: [{ label: 'Dag 2', url: tilastopajaOldResults(4331) }],
		notes: 'Tilastopaja preserves separate results sheets for 23 and 24 July.'
	},
	{
		year: 2003,
		dates: '11–12.7.2003',
		venue: 'Hangö',
		status: 'archive',
		sourceUrl: 'https://kraftsport.nu/arkiv/tidigare03.htm',
		resultsUrl: tilastopajaOldResults(2325),
		notes: 'Tilastopaja preserves a single results sheet covering both days.'
	},
	{
		year: 2002,
		dates: '26–28.7.2002',
		venue: 'Borgå',
		status: 'archive',
		sourceUrl: 'https://kraftsport.nu/arkiv/tidigare.htm',
		resultsUrl: tilastopajaOldResults(844),
		notes: 'Tilastopaja preserves a single results sheet covering all three days.'
	}
];

export function getSfimCounterSources(): SfimSource[] {
	return SFIM_SOURCES.filter((source) => source.competitionId !== undefined);
}
