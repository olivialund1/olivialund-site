export type PassDirection = 'blue-to-green' | 'green-to-blue';

// Fixed number of shades used by the experiment. Not stored per-row in the
// database, so this is the single source of truth shared by the game, the
// personal chart, and any server-side aggregate queries that need to
// canonicalize forward_switch/backward_switch onto the same axis.
export const SHADES = 50;

// Aggregate/population views always render their real numbers regardless of
// sample size. This threshold is only for soft "still collecting data"
// caveat text alongside those views, not a gate on whether they render.
export const MIN_SAMPLE_SIZE = 10;

// Lightness and chroma held constant so hue is the only varying dimension,
// isolating hue as the sole categorization cue.
export const HUE_BLUE = 258;
export const HUE_GREEN = 142;
export const LIGHTNESS = 0.65;
export const CHROMA = 0.15;

export function colorForIndex(direction: PassDirection, index: number, shades: number): string {
	const t = shades > 1 ? index / (shades - 1) : 0;
	const progress = direction === 'blue-to-green' ? t : 1 - t;
	const hue = HUE_BLUE + (HUE_GREEN - HUE_BLUE) * progress;
	return `oklch(${LIGHTNESS * 100}% ${CHROMA} ${hue})`;
}

/**
 * Converts a pass-relative switch index (position within that pass's own
 * viewing order) into a canonical index on the fixed blue(0)->green(last)
 * axis, so switch points from opposite-direction passes can be compared
 * and plotted on the same scale.
 */
export function toCanonicalIndex(direction: PassDirection, passRelativeIndex: number, shades: number): number {
	return direction === 'blue-to-green' ? passRelativeIndex : shades - 1 - passRelativeIndex;
}

/**
 * A player's tipping point: the midpoint between their two canonicalized
 * switch points. Single source of truth so every view that needs "this
 * player's tipping point" (the personal chart's markers, the population
 * strip, the median comparison) derives it the same way instead of each
 * re-deriving canonical forward/backward independently.
 */
export function personalTippingPoint(
	directionFirst: PassDirection,
	forwardSwitch: number,
	backwardSwitch: number,
	shades: number,
): number {
	const backwardDirection: PassDirection = directionFirst === 'blue-to-green' ? 'green-to-blue' : 'blue-to-green';
	const canonicalForward = toCanonicalIndex(directionFirst, forwardSwitch, shades);
	const canonicalBackward = toCanonicalIndex(backwardDirection, backwardSwitch, shades);
	return (canonicalForward + canonicalBackward) / 2;
}
