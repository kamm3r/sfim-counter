<script lang="ts">
	import { getCopy, locale, LOCALES, setLocale } from '$lib/i18n.js';

	const names = { sv: 'Svenska', fi: 'Suomi', en: 'English' };
	let copy = $derived(getCopy($locale));
</script>

<div class="flex items-center gap-2" role="group" aria-label={copy.language}>
	<span class="hidden text-[.65rem] font-semibold text-[#a9c5cc] lg:inline">{copy.language}</span>
	<div class="flex border border-white/35 p-0.5">
		{#each LOCALES as option}
			<button
				type="button"
				lang={option}
				aria-label={names[option]}
				aria-pressed={$locale === option}
				title={names[option]}
				onclick={() => setLocale(option)}
				class={$locale === option
					? 'min-w-9 bg-[#f2b74c] px-1.5 py-1 text-[.7rem] font-bold tracking-wide text-[#15354b] focus-visible:z-10 sm:min-w-10'
					: 'min-w-9 px-1.5 py-1 text-[.7rem] font-bold tracking-wide text-white transition-colors hover:bg-white/15 focus-visible:z-10 sm:min-w-10'}
			>
				{option.toUpperCase()}
			</button>
		{/each}
	</div>
</div>
