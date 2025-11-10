"use client";

import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LngLatLike } from "mapbox-gl";

// Compute destination point from start point, bearing and distance on WGS84
function destinationPoint(
	longitude: number,
	latitude: number,
	distanceMeters: number,
	bearingDegrees: number
): [number, number] {
	const earthRadiusMeters = 6371000;
	const angularDistance = distanceMeters / earthRadiusMeters;
	const bearing = (bearingDegrees * Math.PI) / 180;
	const lat1 = (latitude * Math.PI) / 180;
	const lon1 = (longitude * Math.PI) / 180;

	const sinLat1 = Math.sin(lat1);
	const cosLat1 = Math.cos(lat1);
	const sinAngular = Math.sin(angularDistance);
	const cosAngular = Math.cos(angularDistance);

	const sinLat2 =
		sinLat1 * cosAngular + cosLat1 * sinAngular * Math.cos(bearing);
	const lat2 = Math.asin(sinLat2);
	const y = Math.sin(bearing) * sinAngular * cosLat1;
	const x = cosAngular - sinLat1 * sinLat2;
	const lon2 = lon1 + Math.atan2(y, x);

	// Normalize lon to -180..+180
	const lonDeg = (((lon2 * 180) / Math.PI + 540) % 360) - 180;
	const latDeg = (lat2 * 180) / Math.PI;
	return [lonDeg, latDeg];
}

// Create a GeoJSON polygon approximating a geodesic circle
function createGeodesicCircle(
	longitude: number,
	latitude: number,
	radiusMeters: number,
	steps = 128
) {
	const coordinates: [number, number][] = [];
	let firstCoord: [number, number] | null = null;
	for (let i = 0; i < steps; i += 1) {
		const bearing = (i / steps) * 360;
		const coord = destinationPoint(longitude, latitude, radiusMeters, bearing);
		if (i === 0) firstCoord = coord;
		coordinates.push(coord);
	}
	// Close the ring
	if (firstCoord) coordinates.push(firstCoord);
	return {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: [coordinates],
				},
				properties: {},
			},
		],
	} as GeoJSON.FeatureCollection;
}

type MapProps = {
	latitude: number;
	longitude: number;
	zoom: number;
	wrapperClassName: string;
};
const InnerPropertyMap = ({ latitude, longitude, zoom }: MapProps) => {
	const mapContainerRef = useRef<HTMLDivElement>(null);

	// Generate a small random offset for privacy (between -0.0005 and 0.0005 degrees)
	// This is roughly 25-50 meters depending on location
	const randomizeCoordinate = useCallback((coord: number): number => {
		const offset = (Math.random() - 0.5) * 0.00001; // Random value between -0.0005 and 0.0005
		return coord + offset;
	}, []);

	// Apply privacy offset to coordinates
	const [lt, setLt] = useState(latitude);
	const [lng, setLng] = useState(longitude);
	const [offsetLt, setOffsetLt] = useState(randomizeCoordinate(latitude));
	const [offsetLng, setOffsetLng] = useState(randomizeCoordinate(longitude));

	const mlat = latitude.valueOf();
	const mlng = longitude.valueOf();
	console.log("mlng, mlat", mlng, mlat);
	const popupRef = useRef<mapboxgl.Popup | null>(null);

	// Update offset values when latitude/longitude props change
	useEffect(() => {
		setLt(latitude);
		setLng(longitude);
		setOffsetLt(randomizeCoordinate(latitude));
		setOffsetLng(randomizeCoordinate(longitude));
	}, [latitude, longitude, randomizeCoordinate]);

	useEffect(() => {
		mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

		const map = new mapboxgl.Map({
			container: mapContainerRef.current as HTMLDivElement,
			center: [offsetLng, offsetLt] as LngLatLike, // Use offset coordinates for centering
			zoom,
			//   style: 'mapbox://styles/mapbox/streets-v11'
		});

		// Draw a geodesic circle (fixed physical radius) at the true location
		map.on("load", () => {
			const sourceId = "location-radius-source";
			const fillLayerId = "location-radius-fill";
			const outlineLayerId = "location-radius-outline";

			const radiusMeters = 750; // adjust as desired (e.g., 50m)
			const circleData = createGeodesicCircle(lng, lt, radiusMeters);

			if (map.getSource(sourceId)) {
				const src = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
				src.setData(circleData);
			} else {
				map.addSource(sourceId, {
					type: "geojson",
					data: circleData,
				});
			}

			if (!map.getLayer(fillLayerId)) {
				map.addLayer({
					id: fillLayerId,
					type: "fill",
					source: sourceId,
					paint: {
						"fill-color": "#3b82f6",
						"fill-opacity": 0.2,
					},
				});
			}

			if (!map.getLayer(outlineLayerId)) {
				map.addLayer({
					id: outlineLayerId,
					type: "line",
					source: sourceId,
					paint: {
						"line-color": "#3b82f6",
						"line-width": 2,
						"line-opacity": 0.6,
					},
				});
			}
		});

		// Create Street View URL
		// const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lt},${lng}`;

		// Create popup with Street View link
		// const popup = new mapboxgl.Popup({
		//   closeOnClick: false,
		//   anchor: "bottom",
		//   offset: [0, -10],
		//   maxWidth: "300px",
		//   focusAfterOpen: false,
		// }).setLngLat([lng, lt] as LngLatLike).setHTML(`
		//     <div style="text-align: center;">
		//       <h3 style="margin-bottom: 8px;">Location</h3>
		//       <a href="${streetViewUrl}" target="_blank" rel="noopener noreferrer"
		//          style="display: inline-block; padding: 8px 16px; background: #4285f4; color: white;
		//                 text-decoration: none; border-radius: 4px; font-size: 14px;">
		//         Open Street View
		//       </a>
		//     </div>
		//   `);

		// popupRef.current = popup;

		// // Add popup after map loads
		// map.on("load", () => {
		//   popup.addTo(map);
		// });

		// // Update popup position on move
		// map.on("move", () => {
		//   popup.setLngLat([lng, lt] as LngLatLike);
		// });

		return () => {
			if (popupRef.current) {
				popupRef.current.remove();
			}
			map.remove();
		};
	}, [lng, lt, zoom, offsetLng, offsetLt]);

	return (
		<div>
			<div className="sidebar">
				{/* Longitude: {lng} | Latitude: {lt} | Zoom: {zoom} */}
				{/* <p>Center Point not representative of exact location, this is a privacy feature</p> */}
			</div>
			<div
				className="map-container relative aspect-10/9 w-full rounded-lg"
				data-testid="listing-map"
				ref={mapContainerRef}
			/>
		</div>
	);
};

// Wrapper component that matches the expected PropertyMap interface
export type PropertyMapProps = {
	location: {
		lat: number;
		lng: number;
	};
	address: {
		street: string;
		city: string;
		state: string;
	};
};

export function PropertyMapComponent({ location }: PropertyMapProps) {
	return (
		<InnerPropertyMap
			latitude={location.lat}
			longitude={location.lng}
			wrapperClassName="w-full h-full"
			zoom={15}
		/>
	);
}

// Export the wrapper as PropertyMap to match barrel exports
export { PropertyMapComponent as PropertyMap };
