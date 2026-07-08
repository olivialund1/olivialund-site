<script lang="ts">
	const THEORIES = [
		{ value: 'sharp-boundary', label: 'Sharp boundary, just hidden' },
		{ value: 'gap', label: 'No boundary, just a gap' },
		{ value: 'overlap', label: 'The categories simply overlap' },
	] as const;

	type Theory = (typeof THEORIES)[number]['value'];

	interface PollResults {
		total: number;
		counts: Record<string, number>;
	}

	// No persistence across visits — the poll always starts at the voting
	// buttons on load, and a vote only affects `selected`/`results` for the
	// current page view.
	let selected = $state<Theory | null>(null);
	let results = $state<PollResults | null>(null);

	async function vote(theory: Theory) {
		selected = theory;
		try {
			await fetch('/.netlify/functions/color-hysteresis-poll-vote', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ theory }),
			});
		} catch {
			// Non-critical: still attempt the results fetch below even if this
			// vote failed to land.
		}
		await fetchResults();
	}

	async function fetchResults() {
		try {
			const response = await fetch('/.netlify/functions/color-hysteresis-poll-results');
			if (!response.ok) return;
			results = await response.json();
		} catch {
			// Results endpoint not available yet — falls back to its own loading
			// state below.
		}
	}
</script>

{#if !selected}
	<div class="poll-options">
		{#each THEORIES as theory (theory.value)}
			<button type="button" class="poll-option" onclick={() => vote(theory.value)}>
				{theory.label}
			</button>
		{/each}
	</div>
{:else if !results}
	<p class="loading">Loading results…</p>
{:else}
	<div class="poll-results">
		{#each THEORIES as theory (theory.value)}
			{@const count = results.counts[theory.value] ?? 0}
			{@const pct = results.total > 0 ? (count / results.total) * 100 : 0}
			<div class="poll-result">
				<div class="poll-result-header">
					<span class="poll-result-label"
						>{theory.label}{#if selected === theory.value}<span
									class="poll-result-star"
									aria-label="your pick">★</span
								>{/if}</span
					>
					<span class="poll-result-count">{count}</span>
				</div>
				<div class="poll-bar-track">
					<div class="poll-bar-fill" class:poll-bar-selected={selected === theory.value} style={`width: ${pct}%`}
					></div>
				</div>
			</div>
		{/each}
	</div>
	<p class="poll-total">Based on {results.total} {results.total === 1 ? 'vote' : 'votes'}</p>
{/if}

<style>
	.loading {
		color: rgb(var(--gray));
		font-style: italic;
	}

	.poll-options {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	.poll-option {
		padding: 0.85em 1.25em;
		border: 1px solid rgba(var(--gray-light), 1);
		border-radius: 8px;
		background: transparent;
		color: var(--text-primary);
		font-family: inherit;
		font-size: 1rem;
		text-align: left;
		cursor: pointer;
		transition: 0.15s ease;
	}

	.poll-option:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.poll-results {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.poll-result-header {
		display: flex;
		justify-content: space-between;
		gap: 1em;
		margin-bottom: 0.35em;
		font-size: 0.95rem;
	}

	.poll-result-label {
		color: var(--text-primary);
	}

	.poll-result-star {
		display: inline-block;
		margin-left: 0.4em;
		color: var(--accent);
		font-style: normal;
	}

	.poll-result-count {
		color: rgb(var(--gray));
		font-variant-numeric: tabular-nums;
	}

	.poll-bar-track {
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: rgba(var(--gray-light), 1);
		overflow: hidden;
	}

	.poll-bar-fill {
		height: 100%;
		background: rgb(var(--gray));
		border-radius: 4px;
	}

	.poll-bar-selected {
		background: var(--accent);
	}

	.poll-total {
		margin-top: 1em;
		color: rgb(var(--gray));
		font-size: 0.9rem;
		text-align: center;
	}
</style>
