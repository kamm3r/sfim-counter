<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { initializeLocale } from '$lib/i18n.js';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30 }
		}
	});

	let { children } = $props();
	onMount(initializeLocale);
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
