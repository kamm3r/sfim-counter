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
	language: 'Språk', brand: 'SFIM / POÄNG',
	championship: 'SFIM i friidrott {year}', competition: 'Tävling {id}', federation: 'Svenska Finlands Idrottsförbund', archiveDate: 'Datum enligt arkivkällan',
	archiveNav: 'Årsarkiv ↓', heroLine1: 'Vem leder?', heroLine2: 'Kolla poängen.',
	heroIntro: 'Följ Frihetspriset och Ungdomspokalen gren för gren. Se föreningskampen medan tävlingen pågår och öppna resultatprotokollen även efteråt.',
	scoringFormula: 'Placering + resultatklass = föreningens poäng.',
	heroNote: 'Beräknade livepoäng märks som preliminära. Officiella sluttabeller visas när de finns.',
	resultsHere: 'Resultat och poäng här', resultsHereNote: 'Dessa mästerskap har resultat som kan läsas direkt i appen.',
	serviceUnavailable: 'Tävlingstjänsten svarar inte just nu. Sparade SFIM-arkiv kan fortfarande öppnas nedan.',
	noCompetitions: 'Ingen SFIM-tävling med maskinläsbart resultatflöde hittades.', finalArchive: 'Slutresultat / Arkiv', liveProvisional: 'Liveflöde / Preliminärt',
	openResults: 'Öppna poäng och grenresultat', sourceArchive: 'Källarkiv',
	archiveIntro: 'Resultatprotokoll finns för äldre år, ibland uppdelade per tävlingsdag. De går att läsa hos källan men har ännu inte importerats till appens poängtabeller.',
	cancelledChampionship: 'Mästerskapet inställt', dateMissing: 'Datum saknas', cancelled: 'Inställt', externalArchive: 'Externt arkiv', partiallyPreserved: 'Delvis bevarat',
	source: 'Källa', results: 'Resultat', day: 'Dag', combinedEvents: 'Mångkamp', notInFrihetspriset: 'Räknas inte i Frihetspriset', footer: 'En fristående prototyp för att följa den svenskfinländska friidrotten.',
	allChampionships: 'Alla mästerskap',
	officialFinalCalculatedEvents: 'Officiell slutställning · beräknade grenrader', archivedCalculated: 'Arkiverade resultat · beräknade poäng', fetchingResults: 'Hämtar nya resultat',
	liveRefresh: 'Liveflöde · uppdateras var 15:e sekund', refreshNow: 'Uppdatera nu', eventsWithResults: 'Grenar med resultat', resultRows: 'Resultatrader',
	dataSource: 'Datakälla', lastFetched: 'Senast hämtad', savedTuloslista: 'Sparat slutresultat från Tuloslista',
	refreshFailed: 'Flödet kunde inte uppdateras. Senast fungerande resultat visas fortfarande.',
	partialEvents: 'Bara {loaded} av {expected} grenar har laddats. Ställningen är ofullständig och fylls på automatiskt.',
	loadingResults: 'Laddar mästerskapets resultat…', feedFailed: 'Resultatflödet kunde inte laddas', retry: 'Försök igen',
	noResults: 'Inga resultat ännu', noResultsNote: 'Sidan söker automatiskt efter nya grenar var 15:e sekund.',
	standings: 'Poängställning',
	read2026: 'Så läser du 2026:', official2026Note: 'tabellens slutpoäng är arrangörens officiella. Gren- och klubbprotokollen är våra beräkningar från sparade slutresultat. {count} klubbrader skiljer sig; skillnaderna visas öppet och har inte tillskrivits enskilda idrottare.',
	aboutCalculation: 'Om beräkningen ↓', archive2025: '2025-arkiv:', archive2025Note: 'grenresultaten är sparade här. Poängen är beräknade; några toppresultat stämmer med publicerade siffror, men hela arrangörstabellen saknas.',
	resultsByEvent: 'Resultat per gren',
	methodSources: '03 / Metod & källor', howScored: 'Så räknas poängen',
	scoringExamples: 'Tre enkla exempel',
	scoringExampleSenior: 'Herrar, 2:a plats, A-resultat',
	scoringExampleJuniorSecond: 'Flickor 17, 2:a plats, A-resultat',
	scoringExampleJuniorFourth: 'Flickor 17, 4:e plats, A-resultat',
	scoringPartPlace: 'Placering',
	scoringPartBonus: 'Resultatbonus',
	scoringPartTotal: 'Poäng',
	scoringSumUp: 'Alla deltagares poäng läggs ihop per förening. Flest poäng vinner.',
	scoringSenior: 'Seniorer',
	scoringJunior: 'Juniorer 15–17',
	scoringLevelHelp: 'A, M och SM är resultatnivåer.',
	scoringBonusWhen: 'Resultatbonusen gäller oavsett placering – utom för juniorer i Frihetspriset, där bara plats 1–{n} får den.',
	scoringDetails: 'Vad räknar appen med just nu?',
	scoringGroups: 'Junior betyder här 15- och 17-årsklasserna. De räknas i båda pokalerna, med olika poäng. Seniorer räknas bara i Frihetspriset. Stafetter använder egna klassgränser; seniorstafetter har ingen SM-bonus. Mångkamp ger inga Frihetspriset-poäng.',
	scoringTies: 'Vid delad placering delas poängen för de upptagna platserna lika. Två seniorer som delar förstaplatsen får till exempel (7 + 5) / 2 = 6 placeringspoäng var. Resultatbonusen räknas separat för varje deltagare.',
	scoringWind: 'DNS, DNF, diskvalifikation och starter utom tävlan ger inga poäng. För vindkänsliga grenar ger medvind över +2,0 m/s ingen resultatbonus. I längd och tresteg kan ett kortare vindgodkänt hopp ge bonus. Saknas vinduppgift behandlar appen resultatet som vindgodkänt.',
	scoringRounds: 'Finalresultatet räknas när finalen har ett registrerat utfall. Före det används den senaste omgången med resultat, preliminärt. Omgångarna läggs aldrig ihop. Om sammanställningen saknar heatresultat räknas placeringarna fram ur resultaten.',
	scoringRefresh: 'Livepoängen uppdateras var 15:e sekund medan sidan är synlig. Om en uppdatering misslyckas visas de senaste fungerande resultaten.',
	scoringOfficial: 'För 2026 visar topplistan arrangörens officiella slutpoäng. Grenraderna är appens egna beräkningar. En skillnad visas i föreningens protokoll och fördelas inte på enskilda deltagare. För 2025 visas beräknade poäng.',
	scoringLimits: 'Livepoängen är preliminära. De använda klassgränserna bygger på den bevarade SUL-tabellen från 2012 och SFI:s 15-årstabell. Den exakta 2015-upplaga som reglerna hänvisar till har inte kunnat verifieras.',

	originalResults: 'Tuloslista originalresultat', sfiReport2025: 'SFI:s rapport 2025', resultsService: 'SFIM resultatservice', rules2026: 'Tävlingsregler 2026',
	leader: 'Ledare', behindLeader: 'Efter ledaren', winner: 'Vinnare', place: 'Plats', tiedPlace: 'delad plats', aheadOf: '+{points} före {club}', biggestPoints: 'Största poängen', showAllClubResults: 'Visa alla {count}', showFewer: 'Visa färre', pickClub: 'Välj en förening i tavlan · detaljerna visas bredvid', allDays: 'Alla dagar', allClasses: 'Alla klasser', eventsShown: '{shown} av {total} grenar', showAllResults: 'Alla {count} resultat', hideResults: 'Dölj resultat', noPointsInTrophy: 'Inga poäng i den här pokalen.', calculatedNote: 'Grenpoängen är beräknade från resultaten.', eventWinners: 'Grensegrare', pointsLegend: 'Poäng',
	points: 'poäng', showFullTable: 'Visa hela tabellen · {count} föreningar', noPoints: 'Inga poäng registrerade ännu.',
	searchPlaceholder: 'Sök gren, deltagare eller förening', filterClass: 'Filtrera klass', all: 'Alla', senior: 'Senior', junior: 'Junior',
	class: 'Klass', placementShort: 'plac.', classShort: 'klass', athleteClub: 'Deltagare / förening', result: 'Resultat',
	noSearchResults: 'Ingen gren eller deltagare matchar sökningen.',
	closeProtocol: 'Stäng poängprotokoll',
	officialFinal: 'officiellt slutresultat', publishedTotal: 'Publicerad total', totalPoints: 'Poäng totalt',
	organizerTable: 'Arrangörens tabell', friday: 'Fredag', saturday: 'Lördag',
	official: 'officiellt', calculated: 'beräknat', placing: 'Placering',
	eventRowsSum: 'Summa av grenraderna', unallocatedDifference: 'Skillnad mot arrangörens tabell · ej fördelad på deltagare',
	unknownError: 'Okänt fel vid hämtning av resultat.'
} as const;

type Copy = { [K in keyof typeof sv]: string };

const fi: Copy = {
	language: 'Kieli', brand: 'SFIM / PISTEET',
	championship: 'SFIM yleisurheilu {year}', competition: 'Kilpailu {id}', federation: 'Suomenruotsalainen urheiluliitto', archiveDate: 'Päivämäärä arkistolähteen mukaan',
	archiveNav: 'Vuosittainen arkisto ↓', heroLine1: 'Kuka johtaa?', heroLine2: 'Katso pisteet.',
	heroIntro: 'Seuraa Frihetspriset- ja Ungdomspokalen-pistekilpailuja laji lajilta. Näe seurojen tilanne kilpailun aikana ja palaa tuloksiin myöhemmin.',
	scoringFormula: 'Sijoitus + tulosluokka = seuran pisteet.',
	heroNote: 'Lasketut live-pisteet merkitään alustaviksi. Viralliset lopputaulukot näytetään, kun ne ovat saatavilla.',
	resultsHere: 'Tulokset ja pisteet täällä', resultsHereNote: 'Näiden mestaruuskilpailujen tuloksia voi tarkastella suoraan sovelluksessa.',
	serviceUnavailable: 'Tulospalvelu ei vastaa juuri nyt. Tallennetut SFIM-arkistot voi silti avata alta.',
	noCompetitions: 'Koneellisesti luettavia SFIM-tuloksia ei löytynyt.', finalArchive: 'Lopputulokset / Arkisto', liveProvisional: 'Live-tulokset / Alustava',
	openResults: 'Avaa pisteet ja lajitulokset', sourceArchive: 'Lähdearkisto',
	archiveIntro: 'Vanhempien vuosien tulosluettelot ovat luettavissa lähdesivustoilla, joskus kilpailupäivittäin. Niitä ei ole vielä tuotu sovelluksen pistetaulukoihin.',
	cancelledChampionship: 'Mestaruuskilpailu peruttu', dateMissing: 'Päivämäärä puuttuu', cancelled: 'Peruttu', externalArchive: 'Ulkoinen arkisto', partiallyPreserved: 'Säilynyt osittain',
	source: 'Lähde', results: 'Tulokset', day: 'Päivä', combinedEvents: 'Moniottelu', notInFrihetspriset: 'Ei lasketa Frihetspriset-pisteisiin', footer: 'Itsenäinen prototyyppi suomenruotsalaisen yleisurheilun seuraamiseen.',
	allChampionships: 'Kaikki mestaruuskilpailut',
	officialFinalCalculatedEvents: 'Virallinen loppusijoitus · lasketut lajipisteet', archivedCalculated: 'Arkistoidut tulokset · lasketut pisteet', fetchingResults: 'Haetaan uusia tuloksia',
	liveRefresh: 'Live-tulokset · päivittyy 15 sekunnin välein', refreshNow: 'Päivitä nyt', eventsWithResults: 'Lajit, joissa on tuloksia', resultRows: 'Tuloksia',
	dataSource: 'Tietolähde', lastFetched: 'Viimeksi haettu', savedTuloslista: 'Tallennetut lopputulokset Tuloslistasta',
	refreshFailed: 'Tuloksia ei voitu päivittää. Viimeksi toimineet tulokset näytetään edelleen.',
	partialEvents: 'Vain {loaded}/{expected} lajia on ladattu. Tilanne on keskeneräinen ja päivittyy automaattisesti.',
	loadingResults: 'Ladataan mestaruuskilpailun tuloksia…', feedFailed: 'Tuloksia ei voitu ladata', retry: 'Yritä uudelleen',
	noResults: 'Ei tuloksia vielä', noResultsNote: 'Sivu tarkistaa uudet lajitulokset automaattisesti 15 sekunnin välein.',
	standings: 'Pistetilanne',
	read2026: 'Näin luet vuotta 2026:', official2026Note: 'taulukon loppupisteet ovat järjestäjän viralliset. Laji- ja seurakohtaiset erittelyt ovat omia laskelmiamme tallennetuista lopputuloksista. {count} seuran pistemäärä poikkeaa; erot näkyvät avoimesti eikä niitä ole kohdistettu yksittäisille urheilijoille.',
	aboutCalculation: 'Tietoa laskennasta ↓', archive2025: 'Vuoden 2025 arkisto:', archive2025Note: 'lajitulokset on tallennettu tänne. Pisteet on laskettu; osa kärkisijoista vastaa julkaistuja lukuja, mutta koko järjestäjän taulukkoa ei ole saatavilla.',
	resultsByEvent: 'Tulokset lajeittain',
	methodSources: '03 / Menetelmä ja lähteet', howScored: 'Näin pisteet lasketaan',
	scoringExamples: 'Kolme helppoa esimerkkiä',
	scoringExampleSenior: 'Miehet, 2. sija, A-tulos',
	scoringExampleJuniorSecond: 'Tytöt 17, 2. sija, A-tulos',
	scoringExampleJuniorFourth: 'Tytöt 17, 4. sija, A-tulos',
	scoringPartPlace: 'Sijoitus',
	scoringPartBonus: 'Tuloslisä',
	scoringPartTotal: 'Pisteet',
	scoringSumUp: 'Kaikkien urheilijoiden pisteet lasketaan seuroittain yhteen. Eniten pisteitä voittaa.',
	scoringSenior: 'Aikuiset',
	scoringJunior: 'Nuoret 15–17',
	scoringLevelHelp: 'A, M ja SM ovat tulostasoja.',
	scoringBonusWhen: 'Tuloslisä tulee mistä tahansa sijasta – paitsi nuorille Frihetspriset-kilpailussa, jossa sen saavat vain sijat 1–{n}.',
	scoringDetails: 'Mitä sovellus laskee tällä hetkellä?',
	scoringGroups: 'Nuorilla tarkoitetaan tässä 15- ja 17-vuotiaiden sarjoja. Ne lasketaan molempiin kilpailuihin eri pisteillä. Aikuiset lasketaan vain Frihetspriset-kilpailuun. Viesteillä on omat tulosrajansa; aikuisten viesteissä ei ole SM-lisäpisteitä. Moniottelu ei anna Frihetspriset-pisteitä.',
	scoringTies: 'Jaetussa sijoituksessa kyseisten sijojen pisteet jaetaan tasan. Kaksi aikuista jaetulla ykkössijalla saa esimerkiksi (7 + 5) / 2 = 6 sijoituspistettä kumpikin. Tuloksen lisäpisteet lasketaan erikseen jokaiselle urheilijalle.',
	scoringWind: 'DNS, DNF, hylkäys ja kilpailun ulkopuoliset suoritukset eivät anna pisteitä. Tuulen huomioivissa lajeissa yli +2,0 m/s myötätuuli estää tuloksen lisäpisteet. Pituudessa ja kolmiloikassa lyhyempi sallituissa tuulioloissa tehty hyppy voi silti antaa lisäpisteitä. Ilman tuulitietoa sovellus käsittelee tuloksen tuulen osalta sallittuna.',
	scoringRounds: 'Finaali lasketaan, kun siinä on kirjattu tulos tai keskeytys tai muu lopputulos. Sitä ennen käytetään viimeisintä kierrosta, jolla on tuloksia, alustavana tilanteena. Kierroksia ei lasketa yhteen. Jos yhteenvedosta puuttuu erätuloksia, sijoitukset lasketaan tuloksista.',
	scoringRefresh: 'Live-pisteet päivittyvät 15 sekunnin välein, kun sivu on näkyvissä. Jos päivitys epäonnistuu, viimeisimmät toimivat tulokset jäävät näkyviin.',
	scoringOfficial: 'Vuoden 2026 pistetaulukko näyttää järjestäjän viralliset loppupisteet. Lajirivit ovat sovelluksen omia laskelmia. Mahdollinen ero näkyy seuran erittelyssä, eikä sitä kohdisteta yksittäisille urheilijoille. Vuodelta 2025 näytetään lasketut pisteet.',
	scoringLimits: 'Live-pisteet ovat alustavia. Käytetyt tulosrajat perustuvat säilyneeseen SUL:n vuoden 2012 taulukkoon ja SFI:n 15-vuotiaiden taulukkoon. Säännöissä mainittua tarkkaa vuoden 2015 versiota ei ole voitu varmistaa.',

	originalResults: 'Alkuperäiset tulokset Tuloslistassa', sfiReport2025: 'SFI:n raportti 2025', resultsService: 'SFIM-tulospalvelu', rules2026: 'Kilpailusäännöt 2026',
	leader: 'Johdossa', behindLeader: 'Ero johtajaan', winner: 'Voittaja', place: 'Sija', tiedPlace: 'jaettu sija', aheadOf: '+{points} ennen seuraa {club}', biggestPoints: 'Suurimmat pisteet', showAllClubResults: 'Näytä kaikki {count}', showFewer: 'Näytä vähemmän', pickClub: 'Valitse seura taulusta · tiedot näkyvät vieressä', allDays: 'Kaikki päivät', allClasses: 'Kaikki sarjat', eventsShown: '{shown}/{total} lajia', showAllResults: 'Kaikki {count} tulosta', hideResults: 'Piilota tulokset', noPointsInTrophy: 'Ei pisteitä tässä kilpailussa.', calculatedNote: 'Lajipisteet on laskettu tuloksista.', eventWinners: 'Lajivoittajat', pointsLegend: 'Pisteet',
	points: 'pistettä', showFullTable: 'Näytä koko taulukko · {count} seuraa', noPoints: 'Pisteitä ei ole vielä kirjattu.',
	searchPlaceholder: 'Hae lajia, urheilijaa tai seuraa', filterClass: 'Suodata sarja', all: 'Kaikki', senior: 'Aikuiset', junior: 'Nuoret',
	class: 'Luokka', placementShort: 'sij.', classShort: 'luokka', athleteClub: 'Urheilija / seura', result: 'Tulos',
	noSearchResults: 'Hakuun sopivaa lajia tai urheilijaa ei löytynyt.',
	closeProtocol: 'Sulje piste-erittely',
	officialFinal: 'virallinen lopputulos', publishedTotal: 'Julkaistut pisteet', totalPoints: 'Pisteet yhteensä',
	organizerTable: 'Järjestäjän taulukko', friday: 'Perjantai', saturday: 'Lauantai',
	official: 'virallinen', calculated: 'laskettu', placing: 'Sijoitus',
	eventRowsSum: 'Lajipisteiden summa', unallocatedDifference: 'Ero järjestäjän taulukkoon · ei kohdistettu urheilijoille',
	unknownError: 'Tuntematon virhe tuloksia haettaessa.'
};

const en: Copy = {
	language: 'Language', brand: 'SFIM / POINTS',
	championship: 'SFIM athletics {year}', competition: 'Competition {id}', federation: 'Finland-Swedish Sports Federation', archiveDate: 'Date from archive source',
	archiveNav: 'Year archive ↓', heroLine1: 'Who’s leading?', heroLine2: 'Check the points.',
	heroIntro: 'Follow Frihetspriset and Ungdomspokalen event by event. Watch the club standings as competition unfolds and revisit the results afterwards.',
	scoringFormula: 'Placing + performance class = club points.',
	heroNote: 'Calculated live points are marked provisional. Official final tables are shown when available.',
	resultsHere: 'Results and points here', resultsHereNote: 'These championships have results you can explore directly in the app.',
	serviceUnavailable: 'The results service is unavailable right now. Saved SFIM archives can still be opened below.',
	noCompetitions: 'No SFIM competition with machine-readable results was found.', finalArchive: 'Final results / Archive', liveProvisional: 'Live feed / Provisional',
	openResults: 'Open points and event results', sourceArchive: 'Source archive',
	archiveIntro: 'Older results sheets are available at their sources, sometimes split by competition day. They have not yet been imported into the app’s points tables.',
	cancelledChampionship: 'Championship cancelled', dateMissing: 'Date unavailable', cancelled: 'Cancelled', externalArchive: 'External archive', partiallyPreserved: 'Partially preserved',
	source: 'Source', results: 'Results', day: 'Day', combinedEvents: 'Combined events', notInFrihetspriset: 'Not counted in Frihetspriset', footer: 'An independent prototype for following Finland-Swedish athletics.',
	allChampionships: 'All championships',
	officialFinalCalculatedEvents: 'Official final standings · calculated event lines', archivedCalculated: 'Archived results · calculated points', fetchingResults: 'Fetching new results',
	liveRefresh: 'Live feed · refreshes every 15 seconds', refreshNow: 'Refresh now', eventsWithResults: 'Events with results', resultRows: 'Result entries',
	dataSource: 'Data source', lastFetched: 'Last fetched', savedTuloslista: 'Saved final results from Tuloslista',
	refreshFailed: 'The feed could not be refreshed. The last working results are still shown.',
	partialEvents: 'Only {loaded} of {expected} events have loaded. The standings are incomplete and will update automatically.',
	loadingResults: 'Loading championship results…', feedFailed: 'Results could not be loaded', retry: 'Try again',
	noResults: 'No results yet', noResultsNote: 'The page automatically checks for new event results every 15 seconds.',
	standings: 'Standings',
	read2026: 'Reading the 2026 table:', official2026Note: 'the final totals are the organizer’s official figures. Event and club breakdowns are our calculations from saved final results. {count} club totals differ; the differences are shown openly and have not been assigned to individual athletes.',
	aboutCalculation: 'About the calculation ↓', archive2025: '2025 archive:', archive2025Note: 'event results are saved here. Points are calculated; some leading totals match published figures, but the complete organizer table is unavailable.',
	resultsByEvent: 'Results by event',
	methodSources: '03 / Method & sources', howScored: 'How points are calculated',
	scoringExamples: 'Three simple examples',
	scoringExampleSenior: 'Senior men, 2nd place, A result',
	scoringExampleJuniorSecond: 'Girls 17, 2nd place, A result',
	scoringExampleJuniorFourth: 'Girls 17, 4th place, A result',
	scoringPartPlace: 'Placing',
	scoringPartBonus: 'Result bonus',
	scoringPartTotal: 'Points',
	scoringSumUp: 'Every athlete’s points add up for their club. Most points wins.',
	scoringSenior: 'Seniors',
	scoringJunior: 'Juniors 15–17',
	scoringLevelHelp: 'A, M and SM are result levels.',
	scoringBonusWhen: 'The result bonus counts at any place – except for juniors in Frihetspriset, where only places 1–{n} get it.',
	scoringDetails: 'What does the app count today?',
	scoringGroups: 'Juniors here means the 15- and 17-year-old classes. They count towards both trophies, using different points. Seniors count only towards Frihetspriset. Relays have their own result targets; senior relays have no SM bonus. Combined events earn no Frihetspriset points.',
	scoringTies: 'For a tie, the points for the occupied places are shared equally. For example, two seniors tied for first each get (7 + 5) / 2 = 6 placing points. The result bonus is worked out separately for each athlete.',
	scoringWind: 'DNS, DNF, disqualification and guest starts outside the competition earn no points. In wind-sensitive events, a tailwind above +2.0 m/s prevents a result bonus. In long and triple jump, a shorter jump with legal wind can still earn the bonus. When wind is missing, the app treats the result as wind-legal.',
	scoringRounds: 'The final counts once it has a recorded outcome. Until then, the latest round with results gives provisional points. Rounds are never added together. If the overall results list is missing some heat results, places are worked out from the marks instead.',
	scoringRefresh: 'Live points update every 15 seconds while the page is visible. If an update fails, the last good results stay on screen.',
	scoringOfficial: 'For 2026, the standings show the organizer’s official final totals. Event lines are the app’s own calculations. Any difference is shown in the club breakdown and is not assigned to individual athletes. For 2025, the points are calculated.',
	scoringLimits: 'Live points are provisional. The result targets use the surviving SUL 2012 table and SFI’s 15-year-old table. The exact 2015 edition referred to in the rules has not been verified.',

	originalResults: 'Original results at Tuloslista', sfiReport2025: 'SFI 2025 report', resultsService: 'SFIM results service', rules2026: '2026 competition rules',
	leader: 'Leader', behindLeader: 'Behind the leader', winner: 'Winner', place: 'Place', tiedPlace: 'tied place', aheadOf: '+{points} ahead of {club}', biggestPoints: 'Biggest scores', showAllClubResults: 'Show all {count}', showFewer: 'Show fewer', pickClub: 'Pick a club on the board · details appear alongside', allDays: 'All days', allClasses: 'All classes', eventsShown: '{shown} of {total} events', showAllResults: 'All {count} results', hideResults: 'Hide results', noPointsInTrophy: 'No points in this trophy.', calculatedNote: 'Event points are calculated from the results.', eventWinners: 'Event winners', pointsLegend: 'Points',
	points: 'points', showFullTable: 'Show full table · {count} clubs', noPoints: 'No points recorded yet.',
	searchPlaceholder: 'Search event, athlete, or club', filterClass: 'Filter class', all: 'All', senior: 'Senior', junior: 'Junior',
	class: 'Class', placementShort: 'place', classShort: 'class', athleteClub: 'Athlete / club', result: 'Result',
	noSearchResults: 'No event or athlete matches your search.',
	closeProtocol: 'Close points breakdown',
	officialFinal: 'official final result', publishedTotal: 'Published total', totalPoints: 'Total points',
	organizerTable: 'Organizer’s table', friday: 'Friday', saturday: 'Saturday',
	official: 'official', calculated: 'calculated', placing: 'Placing',
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
