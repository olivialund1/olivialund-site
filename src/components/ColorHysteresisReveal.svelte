<script lang="ts">
	import { colorHysteresisResults, type ColorHysteresisResults } from '../stores/colorHysteresisResults';
	import ColorHysteresisResultsChart from './ColorHysteresisResultsChart.svelte';

	interface Stats {
		count: number;
		avgForwardSwitch: number;
		avgBackwardSwitch: number;
	}

	let results = $state<ColorHysteresisResults | null>(null);
	let stats = $state<Stats | null>(null);
	let statsRequested = $state(false);

	colorHysteresisResults.subscribe((value) => {
		results = value;
		if (value && !statsRequested) {
			statsRequested = true;
			syncResult(value);
		}
	});

	// Waits for this session's own result to be submitted before fetching the
	// aggregate, so the average shown reflects it. The personal switch-point
	// chart above doesn't wait on any of this — it renders the moment
	// `results` is set.
	async function syncResult(result: ColorHysteresisResults) {
		await submitResult(result);
		await fetchStats();
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

	async function fetchStats() {
		try {
			const response = await fetch('/.netlify/functions/color-hysteresis-stats');
			if (!response.ok) return;
			const data: Stats = await response.json();
			if (data.count >= 10) {
				stats = data;
			}
		} catch {
			// Aggregate endpoint not available yet — reveal falls back to the
			// "not enough data" state below.
		}
	}
</script>

{#if !results}
	<p>Placeholder reveal copy — switch points and the running average will appear here.</p>
{:else}
	<ColorHysteresisResultsChart {results} />

	{#if stats}
		<p>
			Across {stats.count} runs so far, the average switch point is shade {stats.avgForwardSwitch.toFixed(
				1,
			)} on the first pass and shade {stats.avgBackwardSwitch.toFixed(1)} on the second pass.
		</p>
	{:else}
		<p class="not-enough-data">Not enough data yet — check back once more people have run the experiment.</p>
	{/if}
{/if}

<style>
	.not-enough-data {
		color: rgb(var(--gray));
		font-style: italic;
	}
</style>
