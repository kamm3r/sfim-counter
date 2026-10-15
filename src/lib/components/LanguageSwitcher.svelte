<script lang="ts">
	import { getCopy, locale, LOCALES, setLocale } from '$lib/i18n.js';

	const names = { sv: 'Svenska', fi: 'Suomi', en: 'English' };
	let { tone = 'light' }: { tone?: 'light' | 'led' } = $props();
	let copy = $derived(getCopy($locale));
</script>

<div class="flex items-center gap-1" role="group" aria-label={copy.language}>
	{#each LOCALES as option}
		<button
			type="button"
			lang={option}
			aria-label={names[option]}
			aria-pressed={$locale === option}
			title={names[option]}
			onclick={() => setLocale(option)}
			class="px-1.5 py-1 text-[13px] font-bold transition-colors {tone === 'led'
				? ($locale === option ? 'led' : 'led led-dim hover:text-[var(--amber)]')
				: ($locale === option ? 'text-black' : 'text-[var(--mute)] hover:text-black')}"
		>
			{option.toUpperCase()}
		</button>
	{/each}
</div>
