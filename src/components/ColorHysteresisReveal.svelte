<script lang="ts">
	import { colorHysteresisResults, type ColorHysteresisResults } from '../stores/colorHysteresisResults';
	import { colorHysteresisStats, type ColorHysteresisStats } from '../stores/colorHysteresisStats';
	import { colorHysteresisPopulation, type ColorHysteresisPopulation } from '../stores/colorHysteresisPopulation';
	import ColorHysteresisResultsChart from './ColorHysteresisResultsChart.svelte';

	let results = $state<ColorHysteresisResults | null>(null);
	let statsRequested = $state(false);

	colorHysteresisResults.subscribe((value) => {
		results = value;
		if (value && !statsRequested) {
			statsRequested = true;
			syncResult(value);
		}
	});

	// Waits for this session's own result to be submitted before fetching the
	// aggregate/population data, so both reflect it. The personal switch-point
	// chart above doesn't wait on any of this — it renders the moment
	// `results` is set.
	async function syncResult(result: ColorHysteresisResults) {
		await submitResult(result);
		await Promise.all([fetchStats(), fetchPopulation()]);
	}

	async function submitResult(result: ColorHysteresisResults) {
		try {
			await fetch('/.netlify/functions/color-hysteresis-submit', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(result),
			});
		} catch {
			// Non-critical: still attempt the aggregate fetch below even if this
			// session's own submission failed to land.
		}
	}

	// Aggregate/population views render regardless of sample size — each
	// section shows its own real count ("Sample size: N") rather than hiding
	// behind a threshold. Sparse output at low N is the honest result, not a
	// state to hide.
	async function fetchStats() {
		try {
			const response = await fetch('/.netlify/functions/color-hysteresis-stats');
			if (!response.ok) return;
			const data: ColorHysteresisStats = await response.json();
			colorHysteresisStats.set(data);
		} catch {
			// Aggregate endpoint not available yet — the average-results section
			// falls back to its own loading state.
		}
	}

	async function fetchPopulation() {
		try {
			const response = await fetch('/.netlify/functions/color-hysteresis-population');
			if (!response.ok) return;
			const data: ColorHysteresisPopulation = await response.json();
			colorHysteresisPopulation.set(data);
		} catch {
			// Population endpoint not available yet — the population-strip section
			// falls back to its own loading state.
		}
	}
</script>

{#if !results}
	<p>Placeholder reveal copy — switch points and the running average will appear here.</p>
{:else}
	<ColorHysteresisResultsChart {results} showStartSide />
{/if}
