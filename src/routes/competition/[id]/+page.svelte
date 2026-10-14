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
	import type { ClubScore, EventDetail } from '$lib/types.js';
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import ClubModal from '$lib/components/ClubModal.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { locale, getCopy, fill, formatDate, formatTime, translateEventName } from '$lib/i18n.js';
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

	// Only the club name is kept, so an open club view follows each refresh.
	let selectedClubName = $state<string | null>(null);
	let selectedTrophy = $state<'frihetspriset' | 'ungdomspokalen'>('frihetspriset');
	let selectedClub = $derived(selectedClubName === null ? null : ((selectedTrophy === 'frihetspriset' ? frihetspriset : ungdomspokalen)?.rankings.find((entry) => entry.club.Name === selectedClubName) ?? null));
	function openClub(club: ClubScore, trophy: 'frihetspriset' | 'ungdomspokalen') { selectedClubName = club.club.Name; selectedTrophy = trophy; }

	let eventIdToMeta = $derived(eventsListQuery.data ? new Map(Object.entries(eventsListQuery.data).flatMap(([date, entries]) => entries.map((event) => [event.EventId, { date, name: event.EventName }]))) : new Map<number, { date: string; name: string }>());
	let eventsWithMeta = $derived(events.map((event) => {
		const meta = eventIdToMeta.get(event.Id);
		return { ...event, date: meta?.date ?? (event.BeginDateTimeWithTZ ? formatDate(event.BeginDateTimeWithTZ, $locale) : ''), displayName: translateEventName(meta?.name ?? event.Name, $locale) };
	}).sort((a, b) => a.BeginDateTimeWithTZ.localeCompare(b.BeginDateTimeWithTZ)));

	function formatUpdatedAt(timestamp: number | undefined): string { return timestamp ? formatTime(timestamp, $locale) : '—'; }
	function errorMessage(error: unknown): string { return error instanceof Error ? error.message : copy.unknownError; }
	async function refreshNow() { await Promise.all([resultsQuery.refetch(), eventsListQuery.refetch()]); }
</script>

<svelte:head>
	<title>{competitionName} · SFIM</title>
	<meta name="description" content={copy.heroIntro} />
</svelte:head>

<div class="app-shell">
	<header class="bg-[#15354b] text-white">
		<div class="site-width flex min-h-16 items-center justify-between gap-4 border-b border-white/20 py-3">
			<a href="/" class="flex items-center gap-2 text-sm font-semibold text-[#d8e4e6] hover:text-white"><ArrowLeft class="h-4 w-4" /> {copy.allChampionships}</a>
			<div class="flex items-center gap-4"><span class="eyebrow hidden text-[#a9c5cc] sm:inline">{copy.scoreAndResults}</span><LanguageSwitcher /></div>
		</div>
		<div class="site-width grid gap-7 pb-8 pt-8 lg:grid-cols-[1fr_auto] lg:items-end lg:pb-10">
			<div>
					<p class="eyebrow text-[#f2b74c]">{isArchivedEventFeed ? copy.championshipArchive : copy.ongoingProvisional}</p>
				<h1 class="display-font mt-2 text-[3.5rem] font-bold leading-[.88] tracking-[.01em] sm:text-[5.2rem]">{competitionName}</h1>
				<p class="mt-4 text-sm text-[#c5d7dc]">{source?.dates ?? ''}{source?.venue ? ` · ${source.venue}` : ''}{organizationName ? ` · ${organizationName}` : ''}</p>
			</div>
			<div class="flex flex-col items-start gap-3 lg:items-end">
				<span class="inline-flex items-center gap-2 border border-[#7a99a5] px-3 py-2 text-xs font-semibold text-[#e5eff0]"><span class={isArchivedEventFeed ? 'h-2 w-2 rounded-full bg-[#f2b74c]' : 'h-2 w-2 animate-pulse rounded-full bg-[#72ccad]'}></span>{hasOfficialStandings ? copy.officialFinalCalculatedEvents : isArchivedEventFeed ? copy.archivedCalculated : resultsQuery.isFetching ? copy.fetchingResults : copy.liveRefresh}</span>
				{#if !isArchivedEventFeed}<button type="button" onclick={refreshNow} disabled={resultsQuery.isFetching} class="inline-flex items-center gap-2 text-xs font-semibold text-[#f2b74c] hover:text-white disabled:opacity-50"><RotateCw class="h-3.5 w-3.5" /> {copy.refreshNow}</button>{/if}
			</div>
		</div>
	</header>

	<main class="site-width pb-20">
		<div class="grid grid-cols-2 border-x border-b border-[#d9dedb] bg-white sm:grid-cols-3">
				<div class="border-b border-r border-[#d9dedb] px-4 py-3 sm:border-b-0 sm:px-5 sm:py-4"><p class="eyebrow text-[#607782]">{copy.eventsWithResults}</p><p class="score-number mt-1 text-3xl font-bold leading-none">{loadedEventCount}<span class="text-lg font-medium text-[#7b9298]"> / {expectedEventCount || '—'}</span></p></div>
				<div class="border-b border-[#d9dedb] px-4 py-3 sm:border-b-0 sm:border-r sm:px-5 sm:py-4"><p class="eyebrow text-[#607782]">{copy.resultRows}</p><p class="score-number mt-1 text-3xl font-bold leading-none">{validResultCount}</p></div>
				<div class="col-span-2 px-4 py-2 sm:col-span-1 sm:px-5 sm:py-4"><p class="eyebrow text-[#607782]">{isArchivedEventFeed ? copy.dataSource : copy.lastFetched}</p><p class="mt-1 text-sm font-semibold sm:leading-8">{isArchivedEventFeed ? copy.savedTuloslista : formatUpdatedAt(resultsQuery.dataUpdatedAt)}</p></div>
		</div>

			{#if resultsQuery.error && events.length > 0}<div class="mt-5 border-l-4 border-[#d69a36] bg-[#fff1cf] p-4 text-sm">{copy.refreshFailed} <span class="block text-xs text-[#607782]">{errorMessage(resultsQuery.error)}</span></div>{/if}
			{#if expectedEventCount > 0 && loadedEventCount > 0 && loadedEventCount < expectedEventCount}<div class="mt-5 border-l-4 border-[#d69a36] bg-[#fff1cf] p-4 text-sm">{fill(copy.partialEvents, { loaded: loadedEventCount, expected: expectedEventCount })}</div>{/if}

		{#if resultsQuery.isPending}
				<div class="py-24 text-center text-sm text-[#607782]" role="status">{copy.loadingResults}</div>
		{:else if resultsQuery.error && events.length === 0}
				<div class="mt-8 border border-[#d9dedb] bg-white p-8 text-center"><h2 class="section-heading">{copy.feedFailed}</h2><p class="mt-3 text-sm text-[#607782]">{errorMessage(resultsQuery.error)}</p><button type="button" onclick={refreshNow} class="mt-5 bg-[#15354b] px-5 py-2 text-sm font-semibold text-white">{copy.retry}</button></div>
		{:else if events.length === 0}
				<div class="mt-8 border border-[#d9dedb] bg-white p-8 text-center"><h2 class="section-heading">{copy.noResults}</h2><p class="mt-3 text-sm text-[#607782]">{copy.noResultsNote}</p></div>
		{:else}
			<section id="standings" class="scroll-mt-6 pt-10">
					<div class="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p class="eyebrow text-[#c64f3d]">{copy.clubContest}</p><h2 class="section-heading mt-1">{copy.standings}</h2></div><p class="max-w-sm text-sm text-[#607782]">{copy.standingsNote}</p></div>
				<div class="grid items-start gap-5 lg:grid-cols-2">
					{#if frihetspriset}<Leaderboard title="Frihetspriset" variant="frihet" rankings={frihetspriset.rankings} onclubclick={(club) => openClub(club, 'frihetspriset')} sourceUrl={hasOfficialStandings ? SFIM_2026_OFFICIAL_SOURCES.frihetspriset : undefined} />{/if}
					{#if ungdomspokalen}<Leaderboard title="Ungdomspokalen" variant="youth" rankings={ungdomspokalen.rankings} onclubclick={(club) => openClub(club, 'ungdomspokalen')} sourceUrl={hasOfficialStandings ? SFIM_2026_OFFICIAL_SOURCES.ungdomspokalen : undefined} />{/if}
				</div>
					{#if hasOfficialStandings}<div class="mt-5 flex flex-wrap items-start justify-between gap-3 border-l-4 border-[#27778a] bg-[#e8f1f1] p-4 text-sm"><p class="max-w-3xl"><strong>{copy.read2026}</strong> {fill(copy.official2026Note, { count: unresolvedClubs })}</p><a href="#sa-raknas-poangen" class="shrink-0 font-semibold text-[#27778a] underline-offset-4 hover:underline">{copy.aboutCalculation}</a></div>{/if}
					{#if archive?.year === 2025}<div class="mt-5 border-l-4 border-[#d69a36] bg-[#fff1cf] p-4 text-sm"><strong>{copy.archive2025}</strong> {copy.archive2025Note}</div>{/if}
			</section>

				<section id="results" class="scroll-mt-6 pt-14"><div class="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p class="eyebrow text-[#c64f3d]">{copy.everyStart}</p><h2 class="section-heading mt-1">{copy.resultsByEvent}</h2></div><p class="max-w-sm text-sm text-[#607782]">{copy.resultsNote}</p></div><EventList events={eventsWithMeta} frihetBreakdown={championship?.frihetspriset.eventBreakdown ?? []} youthBreakdown={championship?.ungdomspokalen.eventBreakdown ?? []} /></section>

				<section id="sa-raknas-poangen" class="scroll-mt-6 pt-14"><p class="eyebrow text-[#c64f3d]">{copy.methodSources}</p><h2 class="section-heading mt-1">{copy.howScored}</h2><div class="mt-5 grid gap-px border border-[#d9dedb] bg-[#d9dedb] md:grid-cols-2"><div class="bg-white p-5 sm:p-6"><h3 class="display-font text-2xl font-bold">Frihetspriset</h3><p class="mt-2 text-sm leading-6 text-[#465f6a]">{copy.frihetRule}</p></div><div class="bg-white p-5 sm:p-6"><h3 class="display-font text-2xl font-bold">Ungdomspokalen</h3><p class="mt-2 text-sm leading-6 text-[#465f6a]">{copy.youthRule}</p></div></div><div class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[#27778a]"><a class="inline-flex items-center gap-1 hover:underline" href={getTuloslistaPublicUrl(compId)} target="_blank" rel="noreferrer">{copy.originalResults} <ArrowUpRight class="h-4 w-4" /></a><a class="inline-flex items-center gap-1 hover:underline" href={source?.sourceUrl ?? SFIM_RESULTS_SERVICE_URL} target="_blank" rel="noreferrer">{source?.year === 2025 ? copy.sfiReport2025 : copy.resultsService} <ArrowUpRight class="h-4 w-4" /></a><a class="inline-flex items-center gap-1 hover:underline" href="https://sfi.idrott.fi/app/uploads/sites/26/2026/01/2026-tavlingsregler-for-sfi-masterskap-i-friidrott-1-1.pdf" target="_blank" rel="noreferrer">{copy.rules2026} <ArrowUpRight class="h-4 w-4" /></a></div></section>
		{/if}
	</main>
</div>

{#if selectedClub}<ClubModal club={selectedClub} trophy={selectedTrophy} eventDates={eventDates} sourceUrl={hasOfficialStandings ? SFIM_2026_OFFICIAL_SOURCES[selectedTrophy] : undefined} onclose={() => selectedClubName = null} />{/if}
