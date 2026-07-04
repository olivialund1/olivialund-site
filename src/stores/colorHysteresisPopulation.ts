import { writable } from 'svelte/store';

export interface PopulationPoint {
	id: number;
	tippingPoint: number;
}

export interface ColorHysteresisPopulation {
	count: number;
	points: PopulationPoint[];
}

export const colorHysteresisPopulation = writable<ColorHysteresisPopulation | null>(null);
