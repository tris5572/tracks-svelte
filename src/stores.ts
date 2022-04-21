import { writable } from 'svelte/store';
import * as L from 'leaflet';

export const track = writable<L.LatLng[]>([
	new L.LatLng(36.0, 139.4),
	new L.LatLng(35.8, 139.8),
	new L.LatLng(35.5, 139.2),
]);

export const draggingTrack = writable<L.LatLng[]>();
