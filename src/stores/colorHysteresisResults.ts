import { writable } from 'svelte/store';
import type { PassDirection } from '../lib/colorHysteresis';

export type { PassDirection };

export interface ColorHysteresisResults {
	shades: number;
	forwardSwitch: number;
	backwardSwitch: number;
	directionFirst: PassDirection;
}

export const colorHysteresisResults = writable<ColorHysteresisResults | null>(null);
