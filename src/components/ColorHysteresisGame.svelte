<script lang="ts">
	import { colorHysteresisResults } from '../stores/colorHysteresisResults';
	import { colorForIndex, type PassDirection } from '../lib/colorHysteresis';

	type Phase = 'intro' | 'playing' | 'transition' | 'complete';

	interface Props {
		shades?: number;
	}

	let { shades = 50 }: Props = $props();

	type Response = 'blue' | 'green';

	let phase = $state<Phase>('intro');
	let passIndex = $state<0 | 1>(0);
	let shadeIndex = $state(0);
	let responses = $state<Response[]>([]);

	let directionFirst = $state<PassDirection>('blue-to-green');
	let blueOnLeft = $state(true);

	let forwardSwitch = $state<number | null>(null);
	let backwardSwitch = $state<number | null>(null);

	const currentDirection = $derived<PassDirection>(
		passIndex === 0
			? directionFirst
			: directionFirst === 'blue-to-green'
				? 'green-to-blue'
				: 'blue-to-green',
	);

	const currentColor = $derived(colorForIndex(currentDirection, shadeIndex, shades));

	function start() {
		directionFirst = Math.random() < 0.5 ? 'blue-to-green' : 'green-to-blue';
		blueOnLeft = Math.random() < 0.5;
		passIndex = 0;
		shadeIndex = 0;
		responses = [];
		phase = 'playing';
	}

	function computeSwitchIndex(resp: Response[]): number {
		const first = resp[0];
		for (let i = 1; i < resp.length; i++) {
			if (resp[i] !== first) return i;
		}
		return resp.length;
	}

	function respond(value: Response) {
		responses.push(value);
		if (shadeIndex < shades - 1) {
			shadeIndex += 1;
			return;
		}

		const switchIndex = computeSwitchIndex(responses);
		if (passIndex === 0) {
			forwardSwitch = switchIndex;
			phase = 'transition';
		} else {
			backwardSwitch = switchIndex;
			phase = 'complete';
			colorHysteresisResults.set({
				shades,
				forwardSwitch: forwardSwitch!,
				backwardSwitch: switchIndex,
				directionFirst,
			});
		}
	}

	function continueToPass2() {
		passIndex = 1;
		shadeIndex = 0;
		responses = [];
		phase = 'playing';
	}
</script>

<div
	class="stimulus"
	class:stimulus-bare={phase === 'playing'}
	style={phase === 'playing' ? `background-color: ${currentColor}` : ''}
>
	{#if phase === 'intro'}
		<button type="button" class="response-button" onclick={start}>Start</button>
	{:else if phase === 'transition'}
		<p class="stimulus-message">
			Placeholder transition copy — halfway there. The sequence will now run in the opposite
			direction.
		</p>
		<button type="button" class="response-button" onclick={continueToPass2}>Continue</button>
	{:else if phase === 'complete'}
		<p class="stimulus-message">All done — see your results below.</p>
	{/if}
</div>

{#if phase === 'playing'}
	<div class="responses" style={`flex-direction: ${blueOnLeft ? 'row' : 'row-reverse'}`}>
		<button type="button" class="response-button" onclick={() => respond('blue')}>Blue</button>
		<button type="button" class="response-button" onclick={() => respond('green')}>Green</button>
	</div>
{/if}

<style>
	.stimulus {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		aspect-ratio: 3 / 2;
		height: 60vh;
		max-width: 100%;
		margin: 0 auto;
		border: 1px solid rgba(var(--gray-light), 1);
		border-radius: 12px;
		background-color: rgba(var(--gray-light), 30%);
		padding: 1em;
		box-sizing: border-box;
	}

	.stimulus-bare {
		border: none;
		background-color: transparent;
		padding: 0;
	}

	.stimulus-message {
		max-width: 30em;
		margin: 0;
		color: rgb(var(--gray));
		text-align: center;
		font-style: italic;
	}

	.responses {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.response-button {
		padding: 0.75em 2.5em;
		border: none;
		border-radius: 8px;
		background: rgb(var(--black));
		color: var(--bg);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}

	@media (max-width: 720px) {
		.stimulus {
			height: 48vh;
		}
	}
</style>
