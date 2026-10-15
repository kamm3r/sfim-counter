<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { getCompetitions, isSfiMComp } from '$lib/api.js';
	import { getSfimCounterSources, SFIM_SOURCES, type SfimSource } from '$lib/sfim-sources.js';
	import { archiveLinkLabel, fill, formatDate, getCopy, locale } from '$lib/i18n.js';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
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
	let heroAnswer = $derived.by(() => {
		const answer = copy.heroLine2.toUpperCase();
		const split = answer.lastIndexOf(' ');
		return split < 0 ? [answer, ''] : [answer.slice(0, split), answer.slice(split + 1)];
	});
	let historicalSources = $derived(SFIM_SOURCES.filter((source) => source.competitionId === undefined));
</script>

<svelte:head>
	<title>{copy.brand} — {copy.resultsHere}</title>
	<meta name="description" content={copy.heroIntro} />
</svelte:head>

<div class="min-h-screen bg-white">
	<header class="sw-wrap bg-[var(--led-bg)] pb-12 pt-5">
		<nav class="flex items-center justify-between gap-4">
			<a href="/" class="led text-[18px]">■ {copy.brand}</a>
			<div class="flex items-center gap-6"><a href="#arkiv" class="hidden text-sm font-medium text-[#8a7a50] transition-colors hover:text-[var(--amber)] sm:inline">{copy.archiveNav}</a><LanguageSwitcher tone="led" /></div>
		</nav>
		<div class="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end">
			<!-- Three fixed rows in every language: question, then the answer broken before its last word.
			     Sized to the column so the widest row (WHO'S LEADING?, ~8.8em in Doto) always fits on one line. -->
			<div class="[container-type:inline-size]">
				<h1 class="led m-0 text-[min(6.6rem,calc(100cqi/9))] leading-[1] [&>span]:block [&>span]:whitespace-nowrap">
					<span>{copy.heroLine1.toUpperCase()}</span>
					<span class="led-green">{heroAnswer[0]}</span>
					<span class="led-green">{heroAnswer[1]}</span>
				</h1>
			</div>
			<div class="border-t-2 border-dashed border-[#3a2a00] pt-5 lg:border-l-2 lg:border-t-0 lg:pl-6 lg:pt-0">
				<p class="m-0 text-[16px] leading-7 text-[#d8cfb8]">{copy.heroIntro}</p>
				<p class="led mt-5 text-[18px]">{copy.scoringFormula.toUpperCase()}</p>
				<p class="mt-2 text-[13px] leading-6 text-[#8a7a50]">{copy.heroNote}</p>
			</div>
		</div>
	</header>
	<div class="h-1.5 bg-[var(--red)]"></div>

	<main class="sw-wrap pb-24">
		<section aria-labelledby="available-heading">
			<div class="sw-section"><h2 id="available-heading">{copy.resultsHere}</h2><p>{copy.resultsHereNote}</p></div>
			{#if compQuery.error}<p class="sw-note warn">{copy.serviceUnavailable}</p>{/if}
			{#if sfimComps.length === 0}
				<p class="mt-6 text-[var(--mute)]">{copy.noCompetitions}</p>
			{:else}
				<div class="mt-2">
					{#each sfimComps as comp, index}
						<a href="/competition/{comp.id}" class="sw-rise group grid items-end gap-x-8 gap-y-2 border-b border-[var(--rule)] py-6 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto]" style:--d="{index * 80}ms">
							<span class="num text-[clamp(4rem,9vw,7.5rem)] font-black leading-[.8] tracking-[-.06em] transition-colors group-hover:text-[var(--red)]">{comp.year}</span>
							<span class="min-w-0">
								<span class="sw-cap block {comp.source?.status === 'archive' ? 'text-[var(--red)]' : 'text-black'}">{comp.source?.status === 'archive' ? copy.finalArchive : `● ${copy.liveProvisional}`}</span>
								<span class="mt-1 block text-[clamp(1.4rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-.035em]">{comp.source ? fill(copy.championship, { year: comp.year }) : comp.name}</span>
								<span class="block text-[var(--mute)]">{comp.dateLabel}{comp.venue ? ` · ${comp.venue}` : ''} · {comp.organization}</span>
							</span>
							<span class="inline-flex items-center gap-2 font-bold transition-transform group-hover:translate-x-1">{copy.openResults} <ArrowRight class="h-4 w-4" /></span>
						</a>
					{/each}
				</div>
			{/if}
		</section>

		<section id="arkiv" class="scroll-mt-6" aria-labelledby="archive-heading">
			<div class="sw-section"><h2 id="archive-heading">{copy.sourceArchive}</h2><p>{copy.archiveIntro}</p></div>
			<div class="mt-2">
				{#each historicalSources as source}
					<div class="grid gap-2 border-b border-[var(--rule)] py-3 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
						<span class="num text-2xl font-black tracking-[-.04em]">{source.year}</span>
						<div class="min-w-0"><p class="m-0 font-semibold">{source.venue ?? (source.status === 'cancelled' ? copy.cancelledChampionship : fill(copy.championship, { year: source.year }))}</p><p class="m-0 text-xs text-[var(--mute)]">{source.dates ?? copy.dateMissing} · {source.status === 'cancelled' ? copy.cancelled : source.status === 'archive' ? copy.externalArchive : copy.partiallyPreserved}</p></div>
						<div class="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
							<a href={source.sourceUrl} target="_blank" rel="noreferrer" class="sw-link">{copy.source} ↗</a>
							{#if source.resultsUrl}<a href={source.resultsUrl} target="_blank" rel="noreferrer" class="sw-link">{source.additionalResults?.some((result) => result.label.startsWith('Dag')) ? `${copy.day} 1 ↗` : `${copy.results} ↗`}</a>{/if}
							{#each source.additionalResults ?? [] as result}<a href={result.url} target="_blank" rel="noreferrer" class="sw-link">{archiveLinkLabel(result.label, $locale)} ↗</a>{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</main>
	<footer class="sw-wrap flex flex-wrap justify-between gap-4 border-t border-black py-6 text-[var(--mute)]"><span>{copy.brand}</span><span>{copy.footer}</span></footer>
</div>
