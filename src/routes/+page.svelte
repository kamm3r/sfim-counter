<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { getCompetitions, isSfiMComp } from '$lib/api.js';
	import { getSfimCounterSources, SFIM_SOURCES, type SfimSource } from '$lib/sfim-sources.js';
	import { archiveLinkLabel, fill, formatDate, getCopy, locale } from '$lib/i18n.js';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	type CounterCompetition = { id: number; name: string; organization: string; dateLabel: string; venue: string; year: number; source?: SfimSource };
	const compQuery = createQuery(() => ({ queryKey: ['competitions'], queryFn: getCompetitions }));
	let copy = $derived(getCopy($locale));
	let sfimComps = $derived.by(() => {
		const competitions = new Map<number, CounterCompetition>();
		for (const source of getSfimCounterSources()) {
			if (source.competitionId === undefined) continue;
			competitions.set(source.competitionId, {
				id: source.competitionId, name: fill(copy.championship, { year: source.year }),
				organization: source.organizer ?? copy.federation,
				dateLabel: source.dates ?? copy.archiveDate, venue: source.venue ?? '', year: source.year, source
			});
		}
		for (const comp of (compQuery.data ?? []).filter(isSfiMComp)) {
			const known = competitions.get(comp.Id);
			competitions.set(comp.Id, {
				id: comp.Id, name: comp.Name, organization: comp.OrganizationName,
				dateLabel: known?.dateLabel ?? formatDate(comp.Date, $locale),
				venue: comp.Stadion?.Name ?? known?.venue ?? '', year: new Date(comp.Date).getFullYear(), source: known?.source
			});
		}
		return [...competitions.values()].sort((a, b) => b.year - a.year);
	});
	let historicalSources = $derived(SFIM_SOURCES.filter((source) => source.competitionId === undefined));
</script>

<svelte:head>
	<title>{copy.brand} — {copy.resultsHere}</title>
	<meta name="description" content={copy.heroIntro} />
</svelte:head>

<div class="app-shell">
	<header class="bg-[#15354b] text-white">
		<div class="site-width flex min-h-16 items-center justify-between gap-3 border-b border-white/20 py-3"><a href="/" class="display-font text-xl font-bold tracking-wide">SFIM <span class="font-medium text-[#f2b74c]">/</span> {copy.brand.split(' / ')[1]}</a><div class="flex items-center gap-4"><a href="#arkiv" class="hidden text-xs font-semibold text-[#d8e4e6] hover:text-white sm:inline">{copy.archiveNav}</a><LanguageSwitcher /></div></div>
		<div class="site-width grid gap-8 pb-12 pt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:pb-16 lg:pt-16">
			<div><p class="eyebrow text-[#f2b74c]">{copy.heroKicker}</p><h1 class="display-font mt-4 max-w-4xl text-[4rem] font-bold leading-[.86] tracking-[.005em] sm:text-[6rem] xl:text-[7rem]">{copy.heroLine1}<br /><span class="text-[#f2b74c]">{copy.heroLine2}</span></h1><p class="mt-7 max-w-xl text-base leading-7 text-[#d8e4e6]">{copy.heroIntro}</p></div>
			<div class="border-t-2 border-[#f2b74c] pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0"><p class="eyebrow text-[#a9c5cc]">{copy.fromTrack}</p><p class="display-font mt-2 text-3xl font-semibold leading-tight">{copy.scoringFormula}</p><p class="mt-3 text-sm leading-6 text-[#bbd0d5]">{copy.heroNote}</p></div>
		</div>
		<div class="h-2 bg-[#c64f3d]"></div>
	</header>

	<main class="site-width pb-20">
		<section class="pt-12" aria-labelledby="available-heading"><div class="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p class="eyebrow text-[#c64f3d]">{copy.openCompetition}</p><h2 id="available-heading" class="section-heading mt-1">{copy.resultsHere}</h2></div><p class="max-w-sm text-sm text-[#607782]">{copy.resultsHereNote}</p></div>
			{#if compQuery.error}<div class="mb-5 border-l-4 border-[#d69a36] bg-[#fff1cf] px-4 py-3 text-sm">{copy.serviceUnavailable}</div>{/if}
			{#if sfimComps.length === 0}<div class="border border-[#d9dedb] bg-white p-8 text-sm text-[#607782]">{copy.noCompetitions}</div>{:else}
				<div class="grid gap-4 md:grid-cols-2">
					{#each sfimComps as comp}
						<a href="/competition/{comp.id}" class="group flex min-h-64 flex-col justify-between border border-[#d9dedb] bg-white p-5 transition-colors hover:border-[#27778a] hover:bg-[#eef3f2] sm:p-6">
							<div class="flex items-start justify-between gap-3"><p class="eyebrow text-[#c64f3d]">{comp.source?.status === 'archive' ? copy.finalArchive : copy.liveProvisional}</p><ArrowUpRight class="h-5 w-5 text-[#27778a] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
							<div><span class="score-number block text-[4rem] font-bold leading-none text-[#d9dedb]">{comp.year}</span><h3 class="display-font mt-1 text-[2.2rem] font-bold leading-none">{comp.source ? fill(copy.championship, { year: comp.year }) : comp.name}</h3><p class="mt-2 text-sm text-[#607782]">{comp.dateLabel}{comp.venue ? ` · ${comp.venue}` : ''}</p><p class="mt-1 text-xs text-[#607782]">{comp.organization}</p><p class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#27778a]">{copy.openResults} <ArrowRight class="h-4 w-4" /></p></div>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<section id="arkiv" class="scroll-mt-6 pt-16" aria-labelledby="archive-heading"><div class="mb-5"><p class="eyebrow text-[#c64f3d]">{copy.yearByYear}</p><h2 id="archive-heading" class="section-heading mt-1">{copy.sourceArchive}</h2><p class="mt-3 max-w-2xl text-sm leading-6 text-[#607782]">{copy.archiveIntro}</p></div>
			<div class="border border-[#d9dedb] bg-white">
				{#each historicalSources as source}
					<div class="grid gap-2 border-b border-[#e4e8e5] px-4 py-3 last:border-b-0 sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-4 sm:px-6">
						<span class="score-number text-2xl font-bold">{source.year}</span>
						<div><p class="text-sm font-semibold">{source.venue ?? (source.status === 'cancelled' ? copy.cancelledChampionship : fill(copy.championship, { year: source.year }))}</p><p class="text-xs text-[#607782]">{source.dates ?? copy.dateMissing} · {source.status === 'cancelled' ? copy.cancelled : source.status === 'archive' ? copy.externalArchive : copy.partiallyPreserved}</p></div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[#27778a]">
							<a href={source.sourceUrl} target="_blank" rel="noreferrer" class="hover:underline">{copy.source} ↗</a>
							{#if source.resultsUrl}
								<a href={source.resultsUrl} target="_blank" rel="noreferrer" class="hover:underline">{source.additionalResults?.some((result) => result.label.startsWith('Dag')) ? `${copy.day} 1 ↗` : `${copy.results} ↗`}</a>
							{/if}
							{#each source.additionalResults ?? [] as result}
								<a href={result.url} target="_blank" rel="noreferrer" class="hover:underline">{archiveLinkLabel(result.label, $locale)} ↗</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
	<footer class="bg-[#15354b] py-8 text-[#c5d7dc]"><div class="site-width flex flex-wrap items-center justify-between gap-3"><span class="display-font text-xl font-bold text-white">{copy.brand}</span><span class="text-xs">{copy.footer}</span></div></footer>
</div>
