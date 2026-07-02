export type PassDirection = 'blue-to-green' | 'green-to-blue';

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
