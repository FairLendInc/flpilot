"use client";

import mapboxgl from "mapbox-gl";
import type * as React from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { cn } from "@/lib/utils";

export type LatLng = {
	lat: number;
	lng: number;
};

export type ViewportBounds = {
	minLat: number;
	maxLat: number;
	minLng: number;
	maxLng: number;
};

export type ListingMapProps<T extends LatLng> = {
	items: readonly T[];
	renderPopup: (item: T) => React.ReactNode;
	onViewportChange?: (bounds: ViewportBounds) => void;
	initialCenter?: { lat: number; lng: number };
	initialZoom?: number;
	className?: string;
	containerClassName?: string;
	style?: React.CSSProperties;
	mapClassName?: string;
};

type ManagedMarker = {
	marker: mapboxgl.Marker;
	popup?: mapboxgl.Popup;
	root?: Root;
};

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 }; // Toronto
const DEFAULT_ZOOM = 4;

function toBounds(map: mapboxgl.Map): ViewportBounds {
	const bounds = map.getBounds();
	if (!bounds) {
		return {
			minLat: -90,
			maxLat: 90,
			minLng: -180,
			maxLng: 180,
		};
	}
	return {
		minLat: bounds.getSouth(),
		maxLat: bounds.getNorth(),
		minLng: bounds.getWest(),
		maxLng: bounds.getEast(),
	};
}

export function ListingMap<T extends LatLng>({
	items,
	renderPopup,
	onViewportChange,
	initialCenter = DEFAULT_CENTER,
	// initialZoom = DEFAULT_ZOOM,
	className,
	containerClassName,
	style,
	mapClassName,
}: ListingMapProps<T>) {
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<mapboxgl.Map | null>(null);
	const markersRef = useRef<ManagedMarker[]>([]);
	const [isMapLoaded, setIsMapLoaded] = useState(false);
	const hasSetInitialViewRef = useRef(false);
	const preventFitBoundsRef = useRef(false);

	// Initialize map
	useEffect(() => {
		if (!mapContainerRef.current) return;

		// biome-ignore lint/style/noNonNullAssertion: Dont care
		mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: "mapbox://styles/mapbox/streets-v12",
			center: [initialCenter.lng, initialCenter.lat],
			zoom: DEFAULT_ZOOM,
		});

		mapRef.current = map;

		// Add navigation controls
		map.addControl(new mapboxgl.NavigationControl(), "top-right");

		map.on("load", () => {
			setIsMapLoaded(true);

			// Notify parent of initial viewport
			if (onViewportChange) {
				const bounds = toBounds(map);
				onViewportChange(bounds);
			}
		});

		// Update viewport bounds when map movement ends
		map.on("moveend", () => {
			if (onViewportChange) {
				const bounds = toBounds(map);
				onViewportChange(bounds);
			}
		});

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, [initialCenter.lat, initialCenter.lng, onViewportChange]);

	// Update markers when items change
	useEffect(() => {
		if (!(mapRef.current && isMapLoaded)) return;

		// Clear existing markers
		for (const { marker, popup, root } of markersRef.current) {
			marker.remove();
			popup?.remove();
			// Defer unmount to avoid race condition with React rendering
			if (root) {
				queueMicrotask(() => root.unmount());
			}
		}
		markersRef.current = [];

		// Add new markers
		for (const item of items) {
			// Create popup using React
			const popupContainer = document.createElement("div");
			const root = createRoot(popupContainer);
			root.render(renderPopup(item));

			const popup = new mapboxgl.Popup({
				offset: 25,
				closeButton: true,
				closeOnClick: false,
			}).setDOMContent(popupContainer);

			// Create custom marker element
			const markerElement = document.createElement("div");
			markerElement.className = "custom-marker";
			markerElement.style.cursor = "pointer";

			const pinElement = document.createElement("div");
			pinElement.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
      `;
			markerElement.appendChild(pinElement);

			// Add hover effects
			markerElement.addEventListener("mouseenter", () => {
				pinElement.style.transform = "scale(1.2)";
				pinElement.style.backgroundColor = "#1d4ed8";
			});

			markerElement.addEventListener("mouseleave", () => {
				pinElement.style.transform = "scale(1)";
				pinElement.style.backgroundColor = "#3b82f6";
			});

			const marker = new mapboxgl.Marker(markerElement)
				.setLngLat([item.lng, item.lat])
				.setPopup(popup)
				.addTo(mapRef.current as mapboxgl.Map);

			markersRef.current.push({ marker, popup, root });
		}

		// Fit map to show all markers if there are any (only on initial load)
		if (items.length > 0 && !hasSetInitialViewRef.current) {
			if (preventFitBoundsRef.current) {
				preventFitBoundsRef.current = false; // Reset for next time
			} else {
				const bounds = new mapboxgl.LngLatBounds();
				for (const item of items) {
					if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
						bounds.extend([item.lng, item.lat]);
					}
				}

				if (!bounds.isEmpty()) {
					mapRef.current.fitBounds(bounds, {
						// padding: { top: 20, bottom: 20, left: 20, right: 20 },
						maxZoom: 12,
						duration: 3000,
					});
					hasSetInitialViewRef.current = true;
				}
			}
		}
	}, [items, isMapLoaded, renderPopup]);

	return (
		<div
			className={cn("relative h-full w-full md:h-[80vh]", containerClassName)}
		>
			<div
				className={cn("h-full w-full rounded-xl", mapClassName, className)}
				ref={mapContainerRef}
				style={style}
			/>
		</div>
	);
}
