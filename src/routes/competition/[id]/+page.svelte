<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { page } from '$app/stores';
	import { getEvents, getResults, getCompetitionDetails } from '$lib/api.js';
	import { getCachedResults, saveResultsSnapshot } from '$lib/result-storage.js';
	import { getPinnedArchive } from '$lib/archives.js';
	import { createRefreshGuard, RefreshRejectedError } from '$lib/refresh-guard.js';
	import { computeChampionship } from '$lib/scoring.js';
	import { reconcileOfficial2026, SFIM_2026_OFFICIAL_SOURCES } from '$lib/official-standings.js';
	import { getTuloslistaPublicUrl, SFIM_RESULTS_SERVICE_URL, SFIM_SOURCES } from '$lib/sfim-sources.js';
	import type { EventDetail } from '$lib/types.js';
	import Standings from '$lib/components/Standings.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import ClubDialog from '$lib/components/ClubDialog.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { clubEntries, type Trophy } from '$lib/club-entries.js';
	import { locale, getCopy, fill, formatDate, formatTime, formatPoints, translateEventName } from '$lib/i18n.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';

	const REFRESH_INTERVAL_MS = 15_000;
	let compId = $derived(Number($page.params.id));
	let copy = $derived(getCopy($locale));
	let source = $derived(SFIM_SOURCES.find((entry) => entry.competitionId === compId));
	let archive = $derived(getPinnedArchive(compId));
	let isArchivedEventFeed = $derived(archive !== undefined);
	let hasOfficialStandings = $derived(archive?.hasOfficialStandings ?? false);

	let detailsQuery = createQuery(() => ({
		queryKey: ['comp-details', compId],
		queryFn: () => getCompetitionDetails(compId),
		enabled: !isArchivedEventFeed,
		staleTime: 60_000
	}));
	let eventsListQuery = createQuery(() => ({
		queryKey: ['comp-events', compId],
		queryFn: () => getEvents(compId),
		enabled: !isArchivedEventFeed,
		refetchInterval: isArchivedEventFeed ? false : REFRESH_INTERVAL_MS,
		refetchIntervalInBackground: false
	}));
	const queryClient = useQueryClient();
	const checkRefresh = createRefreshGuard();
	let resultsQuery = createQuery(() => ({
		queryKey: ['comp-results', compId],
		queryFn: async () => {
			const results = await getResults(compId);
			if (!isArchivedEventFeed) {
				checkRefresh(queryClient.getQueryData<EventDetail[]>(['comp-results', compId]), results);
				saveResultsSnapshot(compId, results);
			}
			return results;
		},
		// A restored snapshot keeps its original save time, so "last fetched" stays honest.
		initialData: () => isArchivedEventFeed ? undefined : getCachedResults(compId)?.events,
		initialDataUpdatedAt: () => isArchivedEventFeed ? undefined : getCachedResults(compId)?.savedAt,
		refetchInterval: isArchivedEventFeed ? false : REFRESH_INTERVAL_MS,
		// Hidden tabs stop polling; returning to the tab refreshes immediately.
		refetchIntervalInBackground: false,
		retry: (failureCount, error) => !(error instanceof RefreshRejectedError) && failureCount < 3,
		refetchOnWindowFocus: true
	}));

	let events = $derived(resultsQuery.data ?? []);
	let eventDates = $derived(new Map(events.map((event) => [event.Id, event.BeginDateTimeWithTZ])));
	let championship = $derived(events.length ? computeChampionship(events) : null);
	let frihetspriset = $derived(championship ? (hasOfficialStandings ? reconcileOfficial2026(championship.frihetspriset) : championship.frihetspriset) : null);
	let ungdomspokalen = $derived(championship ? (hasOfficialStandings ? reconcileOfficial2026(championship.ungdomspokalen) : championship.ungdomspokalen) : null);
	let competitionName = $derived(source ? fill(copy.championship, { year: source.year }) : detailsQuery.data?.Competition.Name ?? fill(copy.competition, { id: compId }));
	let organizationName = $derived(detailsQuery.data?.Competition.Organization ?? source?.organizer ?? '');
	let catalogEvents = $derived(Object.values(eventsListQuery.data ?? {}).flat());
	// A pinned archive is the complete final feed, so its own size is the expected count.
	let expectedEventCount = $derived(isArchivedEventFeed ? new Set(events.map((event) => event.Id)).size : new Set(catalogEvents.map((event) => event.EventId)).size);
	let loadedEventCount = $derived(new Set(events.map((event) => event.Id)).size);
	let validResultCount = $derived(championship?.frihetspriset.eventBreakdown.reduce((total, event) => total + event.results.filter((result) => result.isValid).length, 0) ?? 0);
	let unresolvedClubs = $derived((frihetspriset?.rankings ?? []).filter((club) => club.officialAdjustment !== 0).length + (ungdomspokalen?.rankings ?? []).filter((club) => club.officialAdjustment !== 0).length);

	// Only how the club was picked is kept, so an open club view follows each refresh.
	let dialogMatch = $state<{ name?: string; id?: number } | null>(null);
	let dialogTrophy = $state<Trophy>('frihetspriset');
	let trophies = $derived({ frihetspriset, ungdomspokalen });
	let dialogEntries = $derived(dialogMatch ? clubEntries(trophies, dialogMatch) : {});
	let sourceUrls = $derived(hasOfficialStandings ? SFIM_2026_OFFICIAL_SOURCES : undefined);
	function openClubByName(name: string, trophy: Trophy) { dialogMatch = { name }; dialogTrophy = trophy; }
	function openClubById(id: number, name: string) {
		const entries = clubEntries(trophies, { id, name });
		dialogMatch = { id, name: entries.frihetspriset?.club.club.Name ?? entries.ungdomspokalen?.club.club.Name ?? name };
		dialogTrophy = entries.frihetspriset ? 'frihetspriset' : 'ungdomspokalen';
	}

	let eventIdToMeta = $derived(eventsListQuery.data ? new Map(Object.entries(eventsListQuery.data).flatMap(([date, entries]) => entries.map((event) => [event.EventId, { date, name: event.EventName }]))) : new Map<number, { date: string; name: string }>());
	let eventsWithMeta = $derived(events.map((event) => {
		const meta = eventIdToMeta.get(event.Id);
		return { ...event, date: meta?.date ?? (event.BeginDateTimeWithTZ ? formatDate(event.BeginDateTimeWithTZ, $locale) : ''), displayName: translateEventName(meta?.name ?? event.Name, $locale) };
	}).sort((a, b) => a.BeginDateTimeWithTZ.localeCompare(b.BeginDateTimeWithTZ)));

	let frihetWinners = $derived(new Map((championship?.frihetspriset.eventBreakdown ?? []).map((event) => [event.eventId, event.results.find((result) => result.isValid && result.placement === 1)])));
	let tickerText = $derived(eventsWithMeta.flatMap((event) => {
		const winner = frihetWinners.get(event.Id);
		return winner ? [`${event.displayName}: ${winner.athleteName} ${winner.result}`.toUpperCase()] : [];
	}).join('   ◆   '));
	let leaders = $derived([['frihetspriset', 'Frihetspriset', frihetspriset], ['ungdomspokalen', 'Ungdomspokalen', ungdomspokalen]] as const);

	function formatUpdatedAt(timestamp: number | undefined): string { return timestamp ? formatTime(timestamp, $locale) : '—'; }
	function errorMessage(error: unknown): string { return error instanceof Error ? error.message : copy.unknownError; }
	async function refreshNow() { await Promise.all([resultsQuery.refetch(), eventsListQuery.refetch()]); }
</script>

<svelte:head>
	<title>{competitionName} · SFIM</title>
	<meta name="description" content={copy.heroIntro} />
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="sw-wrap bg-[var(--led-bg)] pb-9 pt-5">
		<nav class="flex flex-wrap items-center justify-between gap-4">
			<a href="/" class="led led-dim inline-flex items-center gap-2 text-[17px] transition-colors hover:text-[var(--amber)]"><ArrowLeft class="h-4 w-4" /> {copy.allChampionships.toUpperCase()}</a>
			<div class="flex items-center gap-6">
				<span class="hidden gap-5 text-sm font-medium text-[#8a7a50] md:flex"><a class="hover:text-[var(--amber)]" href="#standings">{copy.standings}</a><a class="hover:text-[var(--amber)]" href="#results">{copy.resultsByEvent}</a><a class="hover:text-[var(--amber)]" href="#sa-raknas-poangen">{copy.howScored}</a></span>
				<LanguageSwitcher tone="led" />
			</div>
		</nav>

		<p class="led mt-12 text-[17px] {isArchivedEventFeed ? '' : 'led-red'}">● {(hasOfficialStandings ? copy.officialFinalCalculatedEvents : isArchivedEventFeed ? copy.archivedCalculated : resultsQuery.isFetching ? copy.fetchingResults : copy.liveRefresh).toUpperCase()}</p>
		<h1 class="led m-0 mt-3 text-[clamp(2.2rem,5.4vw,4.8rem)] leading-[1.02]">{competitionName.toUpperCase()}</h1>
		<p class="led led-dim mt-3 text-[16px]">{[source?.dates, source?.venue, organizationName].filter(Boolean).join(' · ').toUpperCase()}</p>

		<div class="mt-9 grid gap-8 border-t-2 border-dashed border-[#3a2a00] pt-6 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
			<dl class="m-0 grid grid-cols-2 gap-x-6 gap-y-3 self-start lg:grid-cols-1">
				<div><dt class="led led-dim text-[14px]">{copy.eventsWithResults.toUpperCase()}</dt><dd class="led led-white m-0 text-[26px]">{loadedEventCount}<span class="led-dim">/{expectedEventCount || '—'}</span></dd></div>
				<div><dt class="led led-dim text-[14px]">{copy.resultRows.toUpperCase()}</dt><dd class="led led-white m-0 text-[26px]">{validResultCount}</dd></div>
				<div class="col-span-2 lg:col-span-1"><dt class="led led-dim text-[14px]">{(isArchivedEventFeed ? copy.dataSource : copy.lastFetched).toUpperCase()}</dt><dd class="led led-white m-0 text-[17px]">{(isArchivedEventFeed ? copy.savedTuloslista : formatUpdatedAt(resultsQuery.dataUpdatedAt)).toUpperCase()}</dd></div>
				{#if !isArchivedEventFeed}<button type="button" onclick={refreshNow} disabled={resultsQuery.isFetching} class="led col-span-2 inline-flex items-center gap-2 justify-self-start text-[16px] transition-opacity disabled:opacity-40 lg:col-span-1"><RotateCw class="h-4 w-4" /> {copy.refreshNow.toUpperCase()}</button>{/if}
			</dl>
			{#each leaders as [key, title, trophy]}
				{@const top = trophy?.rankings[0]}
				{@const second = trophy?.rankings[1]}
				{#if top}
					<button type="button" class="group block border-dashed border-[#3a2a00] text-left lg:border-l-2 lg:pl-6" onclick={() => openClubByName(top.club.Name, key)}>
						<span class="led block text-[17px]">{title.toUpperCase()} · {(isArchivedEventFeed ? copy.winner : copy.leader).toUpperCase()}</span>
						<span class="led led-white mt-1 block truncate text-[clamp(1.5rem,2.6vw,2.4rem)] uppercase">{top.club.Name}</span>
						<span class="led led-green num block text-[clamp(4.5rem,9vw,8rem)] leading-[.85]">{formatPoints(top.totalPoints, $locale)}</span>
						{#if second}<span class="led led-dim block text-[15px] transition-colors group-hover:text-[var(--amber)]">{fill(copy.aheadOf, { points: formatPoints(top.totalPoints - second.totalPoints, $locale), club: second.club.Name }).toUpperCase()}</span>{/if}
					</button>
				{/if}
			{/each}
		</div>
	</header>

	{#if tickerText}
		<div class="led-ticker" aria-label={copy.eventWinners} style:--dur="{Math.max(60, tickerText.length / 6)}s"><div class="led">{tickerText}   ◆   {tickerText}   ◆   </div></div>
	{/if}

	<main class="sw-wrap pb-24">
		{#if resultsQuery.error && events.length > 0}<p class="sw-note warn">{copy.refreshFailed} <span class="sw-mute block text-xs">{errorMessage(resultsQuery.error)}</span></p>{/if}
		{#if expectedEventCount > 0 && loadedEventCount > 0 && loadedEventCount < expectedEventCount}<p class="sw-note warn">{fill(copy.partialEvents, { loaded: loadedEventCount, expected: expectedEventCount })}</p>{/if}

		{#if resultsQuery.isPending}
			<p class="py-24 text-center text-[var(--mute)]" role="status">{copy.loadingResults}</p>
		{:else if resultsQuery.error && events.length === 0}
			<div class="sw-section"><h2>{copy.feedFailed}</h2></div>
			<p class="mt-4 text-[var(--mute)]">{errorMessage(resultsQuery.error)}</p>
			<button type="button" onclick={refreshNow} class="sw-btn mt-5">{copy.retry}</button>
		{:else if events.length === 0}
			<div class="sw-section"><h2>{copy.noResults}</h2><p>{copy.noResultsNote}</p></div>
		{:else}
			<section id="standings" class="scroll-mt-6">
				<div class="sw-section"><h2>{copy.standings}</h2><p>{copy.pickClub}</p></div>
				<div class="mt-6"><Standings {trophies} {eventDates} {sourceUrls} onopen={openClubByName} /></div>
				{#if hasOfficialStandings}<p class="sw-note"><strong>{copy.read2026}</strong> {fill(copy.official2026Note, { count: unresolvedClubs })} <a href="#sa-raknas-poangen">{copy.aboutCalculation}</a></p>{/if}
				{#if archive?.year === 2025}<p class="sw-note warn"><strong>{copy.archive2025}</strong> {copy.archive2025Note}</p>{/if}
			</section>

			<section id="results" class="scroll-mt-6">
				<div class="sw-section"><h2>{copy.resultsByEvent}</h2><p><span class="pt-fp">+n</span> Frihetspriset · <span class="pt-up">+n</span> Ungdomspokalen</p></div>
				<EventList events={eventsWithMeta} frihetBreakdown={championship?.frihetspriset.eventBreakdown ?? []} youthBreakdown={championship?.ungdomspokalen.eventBreakdown ?? []} onclub={openClubById} />
			</section>

			<section id="sa-raknas-poangen" class="scroll-mt-6">
				<div class="sw-section"><h2>{copy.howScored}</h2><p>{copy.methodSources.replace(/^\d+ \/ /, '')}</p></div>
				<div class="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2">
					<div class="border-t border-black pt-3"><h3 class="m-0 text-[22px] font-extrabold tracking-[-.03em]">Frihetspriset</h3><p class="mt-2 max-w-xl leading-6">{copy.frihetRule}</p></div>
					<div class="border-t border-black pt-3"><h3 class="m-0 text-[22px] font-extrabold tracking-[-.03em]">Ungdomspokalen</h3><p class="mt-2 max-w-xl leading-6">{copy.youthRule}</p></div>
				</div>
				<div class="mt-8 flex flex-wrap gap-x-6 gap-y-2">
					<a class="sw-link inline-flex items-center gap-1" href={getTuloslistaPublicUrl(compId)} target="_blank" rel="noreferrer">{copy.originalResults} <ArrowUpRight class="h-4 w-4" /></a>
					<a class="sw-link inline-flex items-center gap-1" href={source?.sourceUrl ?? SFIM_RESULTS_SERVICE_URL} target="_blank" rel="noreferrer">{source?.year === 2025 ? copy.sfiReport2025 : copy.resultsService} <ArrowUpRight class="h-4 w-4" /></a>
					<a class="sw-link inline-flex items-center gap-1" href="https://sfi.idrott.fi/app/uploads/sites/26/2026/01/2026-tavlingsregler-for-sfi-masterskap-i-friidrott-1-1.pdf" target="_blank" rel="noreferrer">{copy.rules2026} <ArrowUpRight class="h-4 w-4" /></a>
				</div>
			</section>
		{/if}
	</main>

	<footer class="sw-wrap flex flex-wrap justify-between gap-4 border-t border-black py-6 text-[var(--mute)]"><span>{copy.brand}</span><span>{copy.footer}</span></footer>
</div>

{#if dialogMatch && (dialogEntries.frihetspriset || dialogEntries.ungdomspokalen)}
	<ClubDialog entries={dialogEntries} trophy={dialogTrophy} {eventDates} {sourceUrls} onclose={() => dialogMatch = null} />
{/if}
