import { writable } from 'svelte/store';

export interface ColorHysteresisStats {
	count: number;
	avgCanonicalForward: number;
	avgCanonicalBackward: number;
	magnitudeGap: number;
	medianTippingPoint: number;
}

export const colorHysteresisStats = writable<ColorHysteresisStats | null>(null);
