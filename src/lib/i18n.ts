import { writable } from 'svelte/store';

export type Locale = 'sv' | 'fi' | 'en';
export const LOCALES: readonly Locale[] = ['sv', 'fi', 'en'];
export const locale = writable<Locale>('sv');

const STORAGE_KEY = 'sfim-language';
const localeTags: Record<Locale, string> = { sv: 'sv-FI', fi: 'fi-FI', en: 'en-GB' };

export function isLocale(value: unknown): value is Locale {
	return value === 'sv' || value === 'fi' || value === 'en';
}

export function setLocale(next: Locale): void {
	locale.set(next);
	if (typeof document !== 'undefined') {
		document.documentElement.lang = next;
		try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Storage may be disabled. */ }
	}
}

export function initializeLocale(): void {
	if (typeof document === 'undefined') return;
	let saved: string | null = null;
	try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
	setLocale(isLocale(saved) ? saved : 'sv');
}

const sv = {
	language: 'Språk', brand: 'SFIM / POÄNG', scoreAndResults: 'SFIM / Poäng & resultat',
	championship: 'SFIM i friidrott {year}', competition: 'Tävling {id}', federation: 'Svenska Finlands Idrottsförbund', archiveDate: 'Datum enligt arkivkällan',
	archiveNav: 'Årsarkiv ↓', heroLine1: 'Vem leder?', heroLine2: 'Kolla poängen.',
	heroIntro: 'Följ Frihetspriset och Ungdomspokalen gren för gren. Se föreningskampen medan tävlingen pågår och öppna resultatprotokollen även efteråt.',
	fromTrack: 'Från bana till tabell', scoringFormula: 'Placering + resultatklass = föreningens poäng.',
	heroNote: 'Beräknade livepoäng märks som preliminära. Officiella sluttabeller visas när de finns.',
	openCompetition: '01 / Öppna tävlingen', resultsHere: 'Resultat och poäng här', resultsHereNote: 'Dessa mästerskap har resultat som kan läsas direkt i appen.',
	serviceUnavailable: 'Tävlingstjänsten svarar inte just nu. Sparade SFIM-arkiv kan fortfarande öppnas nedan.',
	noCompetitions: 'Ingen SFIM-tävling med maskinläsbart resultatflöde hittades.', finalArchive: 'Slutresultat / Arkiv', liveProvisional: 'Liveflöde / Preliminärt',
	openResults: 'Öppna poäng och grenresultat', yearByYear: '02 / År för år', sourceArchive: 'Källarkiv',
	archiveIntro: 'Resultatprotokoll finns för äldre år, ibland uppdelade per tävlingsdag. De går att läsa hos källan men har ännu inte importerats till appens poängtabeller.',
	cancelledChampionship: 'Mästerskapet inställt', dateMissing: 'Datum saknas', cancelled: 'Inställt', externalArchive: 'Externt arkiv', partiallyPreserved: 'Delvis bevarat',
	source: 'Källa', results: 'Resultat', day: 'Dag', combinedEvents: 'Mångkamp', notInFrihetspriset: 'Räknas inte i Frihetspriset', footer: 'En fristående prototyp för att följa den svenskfinländska friidrotten.',
	allChampionships: 'Alla mästerskap', championshipArchive: 'Mästerskapsarkiv', ongoingProvisional: 'Pågående tävling · preliminärt',
	officialFinalCalculatedEvents: 'Officiell slutställning · beräknade grenrader', archivedCalculated: 'Arkiverade resultat · beräknade poäng', fetchingResults: 'Hämtar nya resultat',
	liveRefresh: 'Liveflöde · uppdateras var 15:e sekund', refreshNow: 'Uppdatera nu', eventsWithResults: 'Grenar med resultat', resultRows: 'Resultatrader',
	dataSource: 'Datakälla', lastFetched: 'Senast hämtad', savedTuloslista: 'Sparat slutresultat från Tuloslista',
	refreshFailed: 'Flödet kunde inte uppdateras. Senast fungerande resultat visas fortfarande.',
	partialEvents: 'Bara {loaded} av {expected} grenar har laddats. Ställningen är ofullständig och fylls på automatiskt.',
	loadingResults: 'Laddar mästerskapets resultat…', feedFailed: 'Resultatflödet kunde inte laddas', retry: 'Försök igen',
	noResults: 'Inga resultat ännu', noResultsNote: 'Sidan söker automatiskt efter nya grenar var 15:e sekund.',
	clubContest: '01 / Föreningskampen', standings: 'Poängställning', standingsNote: 'Välj en förening för varje placering, klasspoäng och totalsumma.',
	read2026: 'Så läser du 2026:', official2026Note: 'tabellens slutpoäng är arrangörens officiella. Gren- och klubbprotokollen är våra beräkningar från sparade slutresultat. {count} klubbrader skiljer sig; skillnaderna visas öppet och har inte tillskrivits enskilda idrottare.',
	aboutCalculation: 'Om beräkningen ↓', archive2025: '2025-arkiv:', archive2025Note: 'grenresultaten är sparade här. Poängen är beräknade; några toppresultat stämmer med publicerade siffror, men hela arrangörstabellen saknas.',
	everyStart: '02 / Varje start', resultsByEvent: 'Resultat per gren', resultsNote: 'Sök en gren, deltagare eller förening. Öppna grenen för poängraden.',
	methodSources: '03 / Metod & källor', howScored: 'Så räknas poängen',
	frihetRule: 'Senior: placering 7 / 5 / 4 / 3 / 2 / 1. Resultatklass SM +15, M +10 eller A +5 oavsett placering. Junior: placering 3 / 2 / 1 och A-klass +3 för de tre främsta.',
	youthRule: 'Endast juniorgrenar. Placering 7 / 5 / 4 / 3 / 2 / 1; A-klass ger +5 oavsett placering. Vid delad placering delas placeringspoängen.',
	originalResults: 'Tuloslista originalresultat', sfiReport2025: 'SFI:s rapport 2025', resultsService: 'SFIM resultatservice', rules2026: 'Tävlingsregler 2026',
	seniorJunior: 'Seniorer + juniorer', juniorClasses: 'Juniorklasserna', officialTable: 'Officiell tabell', leader: 'Ledare', leadMargin: 'Före tvåan', behindLeader: 'Efter ledaren', winner: 'Vinnare', place: 'Plats', tiedPlace: 'delad plats', aheadOf: '+{points} före {club}', biggestPoints: 'Största poängen', showAllClubResults: 'Visa alla {count}', showFewer: 'Visa färre', pickClub: 'Välj en förening i tavlan · detaljerna visas bredvid', allDays: 'Alla dagar', allClasses: 'Alla klasser', eventsShown: '{shown} av {total} grenar', showAllResults: 'Alla {count} resultat', hideResults: 'Dölj resultat', noPointsInTrophy: 'Inga poäng i den här pokalen.', calculatedNote: 'Grenpoängen är beräknade från resultaten.', eventWinners: 'Grensegrare', topTen: 'Topp 10', allClubs: 'Alla föreningar', pointsLegend: 'Poäng',
	showScoringResults: 'Visa alla poänggivande resultat', points: 'poäng', showFullTable: 'Visa hela tabellen · {count} föreningar', noPoints: 'Inga poäng registrerade ännu.',
	searchPlaceholder: 'Sök gren, deltagare eller förening', filterClass: 'Filtrera klass', all: 'Alla', senior: 'Senior', junior: 'Junior',
	eventCount: '{shown} av {total} grenar · klicka för resultat och poäng per deltagare', resultCount: 'resultat', eventsInDay: '{count} grenar',
	class: 'Klass', placementShort: 'plac.', classShort: 'klass', athleteClub: 'Deltagare / förening', result: 'Resultat',
	noSearchResults: 'Ingen gren eller deltagare matchar sökningen.',
	closeProtocol: 'Stäng poängprotokoll', clubProtocol: 'Poängprotokoll / förening', countedResults: '{count} poänggivande resultat',
	officialFinal: 'officiellt slutresultat', calculatedStanding: 'beräknad ställning', publishedTotal: 'Publicerad total', totalPoints: 'Poäng totalt',
	organizerTable: 'Arrangörens tabell', dayByDay: 'Dag för dag / officiellt mot beräknat', friday: 'Fredag', saturday: 'Lördag',
	official: 'officiellt', calculated: 'beräknat', eventAthlete: 'Gren / deltagare', placing: 'Placering',
	eventRowsSum: 'Summa av grenraderna', unallocatedDifference: 'Skillnad mot arrangörens tabell · ej fördelad på deltagare',
	unknownError: 'Okänt fel vid hämtning av resultat.'
} as const;

type Copy = { [K in keyof typeof sv]: string };

const fi: Copy = {
	language: 'Kieli', brand: 'SFIM / PISTEET', scoreAndResults: 'SFIM / Pisteet ja tulokset',
	championship: 'SFIM yleisurheilu {year}', competition: 'Kilpailu {id}', federation: 'Suomenruotsalainen urheiluliitto', archiveDate: 'Päivämäärä arkistolähteen mukaan',
	archiveNav: 'Vuosittainen arkisto ↓', heroLine1: 'Kuka johtaa?', heroLine2: 'Katso pisteet.',
	heroIntro: 'Seuraa Frihetspriset- ja Ungdomspokalen-pistekilpailuja laji lajilta. Näe seurojen tilanne kilpailun aikana ja palaa tuloksiin myöhemmin.',
	fromTrack: 'Kentältä pistetaulukkoon', scoringFormula: 'Sijoitus + tulosluokka = seuran pisteet.',
	heroNote: 'Lasketut live-pisteet merkitään alustaviksi. Viralliset lopputaulukot näytetään, kun ne ovat saatavilla.',
	openCompetition: '01 / Avaa kilpailu', resultsHere: 'Tulokset ja pisteet täällä', resultsHereNote: 'Näiden mestaruuskilpailujen tuloksia voi tarkastella suoraan sovelluksessa.',
	serviceUnavailable: 'Tulospalvelu ei vastaa juuri nyt. Tallennetut SFIM-arkistot voi silti avata alta.',
	noCompetitions: 'Koneellisesti luettavia SFIM-tuloksia ei löytynyt.', finalArchive: 'Lopputulokset / Arkisto', liveProvisional: 'Live-tulokset / Alustava',
	openResults: 'Avaa pisteet ja lajitulokset', yearByYear: '02 / Vuosi vuodelta', sourceArchive: 'Lähdearkisto',
	archiveIntro: 'Vanhempien vuosien tulosluettelot ovat luettavissa lähdesivustoilla, joskus kilpailupäivittäin. Niitä ei ole vielä tuotu sovelluksen pistetaulukoihin.',
	cancelledChampionship: 'Mestaruuskilpailu peruttu', dateMissing: 'Päivämäärä puuttuu', cancelled: 'Peruttu', externalArchive: 'Ulkoinen arkisto', partiallyPreserved: 'Säilynyt osittain',
	source: 'Lähde', results: 'Tulokset', day: 'Päivä', combinedEvents: 'Moniottelu', notInFrihetspriset: 'Ei lasketa Frihetspriset-pisteisiin', footer: 'Itsenäinen prototyyppi suomenruotsalaisen yleisurheilun seuraamiseen.',
	allChampionships: 'Kaikki mestaruuskilpailut', championshipArchive: 'Mestaruusarkisto', ongoingProvisional: 'Käynnissä oleva kilpailu · alustava',
	officialFinalCalculatedEvents: 'Virallinen loppusijoitus · lasketut lajipisteet', archivedCalculated: 'Arkistoidut tulokset · lasketut pisteet', fetchingResults: 'Haetaan uusia tuloksia',
	liveRefresh: 'Live-tulokset · päivittyy 15 sekunnin välein', refreshNow: 'Päivitä nyt', eventsWithResults: 'Lajit, joissa on tuloksia', resultRows: 'Tuloksia',
	dataSource: 'Tietolähde', lastFetched: 'Viimeksi haettu', savedTuloslista: 'Tallennetut lopputulokset Tuloslistasta',
	refreshFailed: 'Tuloksia ei voitu päivittää. Viimeksi toimineet tulokset näytetään edelleen.',
	partialEvents: 'Vain {loaded}/{expected} lajia on ladattu. Tilanne on keskeneräinen ja päivittyy automaattisesti.',
	loadingResults: 'Ladataan mestaruuskilpailun tuloksia…', feedFailed: 'Tuloksia ei voitu ladata', retry: 'Yritä uudelleen',
	noResults: 'Ei tuloksia vielä', noResultsNote: 'Sivu tarkistaa uudet lajitulokset automaattisesti 15 sekunnin välein.',
	clubContest: '01 / Seurojen pistekilpailu', standings: 'Pistetilanne', standingsNote: 'Valitse seura nähdäksesi sijoituspisteet, tulosluokkapisteet ja yhteispisteet.',
	read2026: 'Näin luet vuotta 2026:', official2026Note: 'taulukon loppupisteet ovat järjestäjän viralliset. Laji- ja seurakohtaiset erittelyt ovat omia laskelmiamme tallennetuista lopputuloksista. {count} seuran pistemäärä poikkeaa; erot näkyvät avoimesti eikä niitä ole kohdistettu yksittäisille urheilijoille.',
	aboutCalculation: 'Tietoa laskennasta ↓', archive2025: 'Vuoden 2025 arkisto:', archive2025Note: 'lajitulokset on tallennettu tänne. Pisteet on laskettu; osa kärkisijoista vastaa julkaistuja lukuja, mutta koko järjestäjän taulukkoa ei ole saatavilla.',
	everyStart: '02 / Jokainen suoritus', resultsByEvent: 'Tulokset lajeittain', resultsNote: 'Hae lajia, urheilijaa tai seuraa. Avaa laji nähdäksesi pisteet.',
	methodSources: '03 / Menetelmä ja lähteet', howScored: 'Näin pisteet lasketaan',
	frihetRule: 'Aikuiset: sijoituspisteet 7 / 5 / 4 / 3 / 2 / 1. Tulosluokasta SM +15, M +10 tai A +5 sijoituksesta riippumatta. Nuoret: sijoituspisteet 3 / 2 / 1 ja A-luokasta +3 kolmelle parhaalle.',
	youthRule: 'Vain nuorten lajit. Sijoituspisteet 7 / 5 / 4 / 3 / 2 / 1; A-luokasta +5 sijoituksesta riippumatta. Jaetussa sijoituksessa sijoituspisteet jaetaan.',
	originalResults: 'Alkuperäiset tulokset Tuloslistassa', sfiReport2025: 'SFI:n raportti 2025', resultsService: 'SFIM-tulospalvelu', rules2026: 'Kilpailusäännöt 2026',
	seniorJunior: 'Aikuiset + nuoret', juniorClasses: 'Nuorten sarjat', officialTable: 'Virallinen taulukko', leader: 'Johdossa', leadMargin: 'Ero kakkoseen', behindLeader: 'Ero johtajaan', winner: 'Voittaja', place: 'Sija', tiedPlace: 'jaettu sija', aheadOf: '+{points} ennen seuraa {club}', biggestPoints: 'Suurimmat pisteet', showAllClubResults: 'Näytä kaikki {count}', showFewer: 'Näytä vähemmän', pickClub: 'Valitse seura taulusta · tiedot näkyvät vieressä', allDays: 'Kaikki päivät', allClasses: 'Kaikki sarjat', eventsShown: '{shown}/{total} lajia', showAllResults: 'Kaikki {count} tulosta', hideResults: 'Piilota tulokset', noPointsInTrophy: 'Ei pisteitä tässä kilpailussa.', calculatedNote: 'Lajipisteet on laskettu tuloksista.', eventWinners: 'Lajivoittajat', topTen: 'Top 10', allClubs: 'Kaikki seurat', pointsLegend: 'Pisteet',
	showScoringResults: 'Näytä kaikki pisteitä tuoneet tulokset', points: 'pistettä', showFullTable: 'Näytä koko taulukko · {count} seuraa', noPoints: 'Pisteitä ei ole vielä kirjattu.',
	searchPlaceholder: 'Hae lajia, urheilijaa tai seuraa', filterClass: 'Suodata sarja', all: 'Kaikki', senior: 'Aikuiset', junior: 'Nuoret',
	eventCount: '{shown}/{total} lajia · avaa laji nähdäksesi tulokset ja urheilijakohtaiset pisteet', resultCount: 'tulosta', eventsInDay: '{count} lajia',
	class: 'Luokka', placementShort: 'sij.', classShort: 'luokka', athleteClub: 'Urheilija / seura', result: 'Tulos',
	noSearchResults: 'Hakuun sopivaa lajia tai urheilijaa ei löytynyt.',
	closeProtocol: 'Sulje piste-erittely', clubProtocol: 'Piste-erittely / seura', countedResults: '{count} pisteitä tuonutta tulosta',
	officialFinal: 'virallinen lopputulos', calculatedStanding: 'laskettu tilanne', publishedTotal: 'Julkaistut pisteet', totalPoints: 'Pisteet yhteensä',
	organizerTable: 'Järjestäjän taulukko', dayByDay: 'Päivittäin / virallinen ja laskettu', friday: 'Perjantai', saturday: 'Lauantai',
	official: 'virallinen', calculated: 'laskettu', eventAthlete: 'Laji / urheilija', placing: 'Sijoitus',
	eventRowsSum: 'Lajipisteiden summa', unallocatedDifference: 'Ero järjestäjän taulukkoon · ei kohdistettu urheilijoille',
	unknownError: 'Tuntematon virhe tuloksia haettaessa.'
};

const en: Copy = {
	language: 'Language', brand: 'SFIM / POINTS', scoreAndResults: 'SFIM / Points & results',
	championship: 'SFIM athletics {year}', competition: 'Competition {id}', federation: 'Finland-Swedish Sports Federation', archiveDate: 'Date from archive source',
	archiveNav: 'Year archive ↓', heroLine1: 'Who’s leading?', heroLine2: 'Check the points.',
	heroIntro: 'Follow Frihetspriset and Ungdomspokalen event by event. Watch the club standings as competition unfolds and revisit the results afterwards.',
	fromTrack: 'From track to table', scoringFormula: 'Placing + performance class = club points.',
	heroNote: 'Calculated live points are marked provisional. Official final tables are shown when available.',
	openCompetition: '01 / Open a competition', resultsHere: 'Results and points here', resultsHereNote: 'These championships have results you can explore directly in the app.',
	serviceUnavailable: 'The results service is unavailable right now. Saved SFIM archives can still be opened below.',
	noCompetitions: 'No SFIM competition with machine-readable results was found.', finalArchive: 'Final results / Archive', liveProvisional: 'Live feed / Provisional',
	openResults: 'Open points and event results', yearByYear: '02 / Year by year', sourceArchive: 'Source archive',
	archiveIntro: 'Older results sheets are available at their sources, sometimes split by competition day. They have not yet been imported into the app’s points tables.',
	cancelledChampionship: 'Championship cancelled', dateMissing: 'Date unavailable', cancelled: 'Cancelled', externalArchive: 'External archive', partiallyPreserved: 'Partially preserved',
	source: 'Source', results: 'Results', day: 'Day', combinedEvents: 'Combined events', notInFrihetspriset: 'Not counted in Frihetspriset', footer: 'An independent prototype for following Finland-Swedish athletics.',
	allChampionships: 'All championships', championshipArchive: 'Championship archive', ongoingProvisional: 'Competition in progress · provisional',
	officialFinalCalculatedEvents: 'Official final standings · calculated event lines', archivedCalculated: 'Archived results · calculated points', fetchingResults: 'Fetching new results',
	liveRefresh: 'Live feed · refreshes every 15 seconds', refreshNow: 'Refresh now', eventsWithResults: 'Events with results', resultRows: 'Result entries',
	dataSource: 'Data source', lastFetched: 'Last fetched', savedTuloslista: 'Saved final results from Tuloslista',
	refreshFailed: 'The feed could not be refreshed. The last working results are still shown.',
	partialEvents: 'Only {loaded} of {expected} events have loaded. The standings are incomplete and will update automatically.',
	loadingResults: 'Loading championship results…', feedFailed: 'Results could not be loaded', retry: 'Try again',
	noResults: 'No results yet', noResultsNote: 'The page automatically checks for new event results every 15 seconds.',
	clubContest: '01 / Club contest', standings: 'Standings', standingsNote: 'Select a club to see each placing, performance-class award, and total.',
	read2026: 'Reading the 2026 table:', official2026Note: 'the final totals are the organizer’s official figures. Event and club breakdowns are our calculations from saved final results. {count} club totals differ; the differences are shown openly and have not been assigned to individual athletes.',
	aboutCalculation: 'About the calculation ↓', archive2025: '2025 archive:', archive2025Note: 'event results are saved here. Points are calculated; some leading totals match published figures, but the complete organizer table is unavailable.',
	everyStart: '02 / Every performance', resultsByEvent: 'Results by event', resultsNote: 'Search for an event, athlete, or club. Open an event to see its points.',
	methodSources: '03 / Method & sources', howScored: 'How points are calculated',
	frihetRule: 'Seniors: placing points 7 / 5 / 4 / 3 / 2 / 1. Performance class SM +15, M +10, or A +5 regardless of placing. Juniors: placing points 3 / 2 / 1 and A-class +3 for the top three.',
	youthRule: 'Junior events only. Placing points 7 / 5 / 4 / 3 / 2 / 1; A-class adds 5 regardless of placing. Placing points are shared for ties.',
	originalResults: 'Original results at Tuloslista', sfiReport2025: 'SFI 2025 report', resultsService: 'SFIM results service', rules2026: '2026 competition rules',
	seniorJunior: 'Seniors + juniors', juniorClasses: 'Junior classes', officialTable: 'Official table', leader: 'Leader', leadMargin: 'Ahead of 2nd', behindLeader: 'Behind the leader', winner: 'Winner', place: 'Place', tiedPlace: 'tied place', aheadOf: '+{points} ahead of {club}', biggestPoints: 'Biggest scores', showAllClubResults: 'Show all {count}', showFewer: 'Show fewer', pickClub: 'Pick a club on the board · details appear alongside', allDays: 'All days', allClasses: 'All classes', eventsShown: '{shown} of {total} events', showAllResults: 'All {count} results', hideResults: 'Hide results', noPointsInTrophy: 'No points in this trophy.', calculatedNote: 'Event points are calculated from the results.', eventWinners: 'Event winners', topTen: 'Top 10', allClubs: 'All clubs', pointsLegend: 'Points',
	showScoringResults: 'Show all point-scoring results', points: 'points', showFullTable: 'Show full table · {count} clubs', noPoints: 'No points recorded yet.',
	searchPlaceholder: 'Search event, athlete, or club', filterClass: 'Filter class', all: 'All', senior: 'Senior', junior: 'Junior',
	eventCount: '{shown} of {total} events · open one for athlete results and points', resultCount: 'results', eventsInDay: '{count} events',
	class: 'Class', placementShort: 'place', classShort: 'class', athleteClub: 'Athlete / club', result: 'Result',
	noSearchResults: 'No event or athlete matches your search.',
	closeProtocol: 'Close points breakdown', clubProtocol: 'Points breakdown / club', countedResults: '{count} point-scoring results',
	officialFinal: 'official final result', calculatedStanding: 'calculated standing', publishedTotal: 'Published total', totalPoints: 'Total points',
	organizerTable: 'Organizer’s table', dayByDay: 'Day by day / official vs calculated', friday: 'Friday', saturday: 'Saturday',
	official: 'official', calculated: 'calculated', eventAthlete: 'Event / athlete', placing: 'Placing',
	eventRowsSum: 'Sum of event lines', unallocatedDifference: 'Difference from organizer’s table · not assigned to athletes',
	unknownError: 'Unknown error while fetching results.'
};

const copy: Record<Locale, Copy> = { sv, fi, en };
export function getCopy(selected: Locale): Copy { return copy[selected]; }

export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

// Shared placings produce thirds and other repeating fractions. Two decimals are
// shown, and a value that still is not exact is marked as approximate.
export function formatPoints(value: number, selected: Locale): string {
	const rounded = Math.round(value * 100) / 100;
	const formatted = new Intl.NumberFormat(localeTags[selected], { maximumFractionDigits: 2 }).format(rounded);
	return Math.abs(value - rounded) < 1e-9 ? formatted : `≈${formatted}`;
}

export function formatDate(value: string | Date, selected: Locale): string {
	return new Date(value).toLocaleDateString(localeTags[selected], { timeZone: 'Europe/Helsinki' });
}

export function formatDay(value: string, selected: Locale): string {
	return new Date(value).toLocaleDateString(localeTags[selected], { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Europe/Helsinki' });
}

export function formatClock(value: string, selected: Locale): string {
	return new Date(value).toLocaleTimeString(localeTags[selected], { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' });
}

export function formatTime(timestamp: number, selected: Locale): string {
	return new Intl.DateTimeFormat(localeTags[selected], { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp);
}

export function archiveLinkLabel(label: string, selected: Locale): string {
	if (label === 'Mångkamp') return getCopy(selected).combinedEvents;
	return label.replace(/^Dag (?=\d)/, `${getCopy(selected).day} `);
}

type EventTerm = Record<Locale, string>;
const eventTerms: readonly EventTerm[] = [
	{ sv: 'häck', fi: 'aidat', en: 'hurdles' },
	{ sv: 'hinder', fi: 'esteet', en: 'steeplechase' },
	{ sv: 'gång', fi: 'kävely', en: 'race walk' },
	{ sv: 'stafett', fi: 'viesti', en: 'relay' },
	{ sv: 'höjd', fi: 'korkeus', en: 'high jump' },
	{ sv: 'längd', fi: 'pituus', en: 'long jump' },
	{ sv: 'stav', fi: 'seiväs', en: 'pole vault' },
	{ sv: '3-steg', fi: 'kolmiloikka', en: 'triple jump' },
	{ sv: 'kula', fi: 'kuula', en: 'shot put' },
	{ sv: 'diskus', fi: 'kiekko', en: 'discus' },
	{ sv: 'slägga', fi: 'moukari', en: 'hammer throw' },
	{ sv: 'spjut', fi: 'keihäs', en: 'javelin throw' }
];

function eventGroup(group: string, selected: Locale): string {
	return group.split('/').map((part) => {
		const match = /^([A-Z])(15|17)?$/.exec(part);
		if (!match) return part;
		const [, letter, age] = match;
		const female = ['D', 'F', 'N', 'T'].includes(letter);
		if (selected === 'en') return age === '15' ? `${female ? 'Girls' : 'Boys'} U15` : age === '17' ? `${female ? 'Women' : 'Men'} U17` : female ? 'Women' : 'Men';
		if (selected === 'fi') return age === '15' ? `${female ? 'T' : 'P'}15` : `${female ? 'N' : 'M'}${age ?? ''}`;
		return age === '15' ? `${female ? 'F' : 'P'}15` : `${female ? 'D' : 'H'}${age ?? ''}`;
	}).join(selected === 'en' ? ' / ' : '/');
}

export function translateEventName(name: string, selected: Locale): string {
	const match = /^([A-Z](?:15|17)?(?:\/[A-Z](?:15|17)?)?)\s+(.+)$/.exec(name.trim());
	if (!match) return name;
	const [, group, rawTerm] = match;
	const normalized = rawTerm.toLocaleLowerCase('fi-FI').replace(/\s+/g, ' ').trim();
	const found = eventTerms.find(({ sv, fi }) => [sv, fi].some((alias) => normalized === alias || normalized.endsWith(` ${alias}`)));
	if (!found) return `${eventGroup(group, selected)} ${rawTerm}`;
	const suffix = normalized.endsWith(found.sv) ? found.sv : found.fi;
	const distance = normalized.slice(0, -suffix.length).trim();
	const event = distance ? `${distance.replace(/4x100m/i, '4×100m')} ${found[selected]}` : found[selected];
	return `${eventGroup(group, selected)} ${event}`;
}
