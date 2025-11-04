// "use client"

// import React, { useEffect, useRef, useState } from "react"

// import { type MortgageListing } from "../archive/mortgageview"
// import { type FilterState } from "../types/mortgage"
// import { FilterBar } from "./filter-bar"
// import { Button } from "@heroui/button"
// import { Card, CardBody } from "@heroui/card"
// import { Slider } from "@heroui/slider"
// import { Icon } from "@iconify/react"
// import mapboxgl from "mapbox-gl"
// import "mapbox-gl/dist/mapbox-gl.css"
// import Image from "next/image"
// import { cn } from "lib/utils"
// import { Switch } from "components/ui/switch"

// // Expand map bounds by a small buffer (in km) to avoid excluding jittered points at the edges
// function expandBoundsWithKmBuffer(bounds: mapboxgl.LngLatBounds, bufferKm: number) {
//   const center = bounds.getCenter()
//   const latBufferDeg = bufferKm / 110.574 // approx km per degree latitude
//   const lngBufferDeg = bufferKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))
//   return {
//     minLat: bounds.getSouth() - latBufferDeg,
//     maxLat: bounds.getNorth() + latBufferDeg,
//     minLng: bounds.getWest() - lngBufferDeg,
//     maxLng: bounds.getEast() + lngBufferDeg,
//   }
// }

// interface MapViewProps {
//   filters: FilterState
//   isMobile: boolean
//   listings: MortgageListing[]
//   onFiltersChangeAction: (filters: FilterState) => void
//   includeFilterBar?: boolean
//   classNames?: {
//     mapContainer?: string
//     mapView?: string
//     mapContent?: string
//     radiusFilterCard?: string
//     mapCard?: string
//     mapViewFooter?: string
//   }
//   mapViewInlineStyles?: React.CSSProperties
// }

// interface MapListingPin {
//   id: string
//   latitude: number
//   longitude: number
//   listing: MortgageListing
// }

// export function MapView({
//   filters,
//   listings,
//   onFiltersChangeAction,
//   isMobile,
//   includeFilterBar = true,
//   classNames,
//   mapViewInlineStyles,
// }: MapViewProps) {
//   const mapContainerRef = useRef<HTMLDivElement>(null)
//   const mapRef = useRef<mapboxgl.Map | null>(null)
//   const markersRef = useRef<mapboxgl.Marker[]>([])
//   const radiusMarkerRef = useRef<mapboxgl.Marker | null>(null)
//   const radiusCircleRef = useRef<string | null>(null)
//   const latestFiltersRef = useRef<FilterState>(filters)
//   const onFiltersChangeRef = useRef(onFiltersChangeAction)
//   const isRadiusModeRef = useRef(false)
//   const [selectedRegions, setSelectedRegions] = useState<string[]>(filters.selectedRegions || [])
//   const [isMapLoaded, setIsMapLoaded] = useState(false)
//   const [isRadiusMode, setIsRadiusMode] = useState(false)
//   const [radiusKm, setRadiusKm] = useState(filters.radiusFilter?.radiusKm || 10)
//   const preventFitBoundsRef = useRef(false)

//   // Convert listings to map pins
//   const mapPins: MapListingPin[] = listings
//     .filter((listing) => listing.lat && listing.lng && listing.lat !== 0 && listing.lng !== 0)
//     .map((listing) => ({
//       id: listing.id,
//       latitude: listing.lat,
//       longitude: listing.lng,
//       listing,
//     }))

//   // Initialize map
//   useEffect(() => {
//     if (!mapContainerRef.current) return

//     mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

//     const map = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [-79.3832, 43.6532], // Toronto center as default
//       zoom: 4,
//     })

//     mapRef.current = map

//     // Add navigation controls
//     map.addControl(new mapboxgl.NavigationControl(), "top-right")

//     // Add custom radius pin control
//     class RadiusPinControl {
//       private map: mapboxgl.Map | undefined
//       private container: HTMLDivElement | undefined
//       private button: HTMLButtonElement | undefined

//       onAdd(map: mapboxgl.Map) {
//         this.map = map
//         this.container = document.createElement("div")
//         this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group"

//         this.button = document.createElement("button")
//         this.button.className = "mapboxgl-ctrl-icon"
//         this.button.type = "button"
//         this.button.title = "Add Radius Filter Pin"
//         this.button.innerHTML = `
//           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//             <circle cx="12" cy="12" r="10"/>
//             <circle cx="12" cy="12" r="3" fill="currentColor"/>
//           </svg>
//         `

//         this.button.onclick = () => {
//           addRadiusPin()
//         }

//         this.container.appendChild(this.button)
//         return this.container
//       }

//       onRemove() {
//         if (this.container?.parentNode) {
//           this.container.parentNode.removeChild(this.container)
//         }
//         this.map = undefined
//       }
//     }

//     // Note: radius control retained but could be hidden when viewport filter is active
//     const radiusControl = new RadiusPinControl()
//     map.addControl(radiusControl, "top-left")

//     map.on("load", () => {
//       setIsMapLoaded(true)

//       // Add click handler for region selection only
//       map.on("click", (e) => {
//         if (!isRadiusModeRef.current) {
//           // Handle region selection in normal mode
//           const features = map.queryRenderedFeatures(e.point, {
//             layers: ["admin-1-boundary"], // State/province boundaries
//           })

//           if (features.length > 0) {
//             const region = features[0]?.properties?.name
//             if (region) {
//               setSelectedRegions((prev) => {
//                 const isSelected = prev.includes(region as string)
//                 const newRegions = isSelected ? prev.filter((r) => r !== region) : [...prev, region as string]
//                 const baseFilters = latestFiltersRef.current
//                 const updatedFilters = {
//                   ...baseFilters,
//                   selectedRegions: newRegions,
//                 }
//                 onFiltersChangeRef.current(updatedFilters)
//                 return newRegions
//               })
//             }
//           }
//         }
//       })

//       // Initialize viewport-bounds filter on load
//       const bounds = map.getBounds() as mapboxgl.LngLatBounds | null
//       if (!bounds) return
//       const baseFilters = latestFiltersRef.current
//       const updatedFilters: FilterState = {
//         ...baseFilters,
//         viewportBounds: expandBoundsWithKmBuffer(bounds, 2),
//         // Disable radius filter when using viewport filtering
//         radiusFilter: undefined,
//         useViewportFilter: baseFilters.useViewportFilter ?? true,
//       }
//       onFiltersChangeRef.current(updatedFilters)
//     })

//     // Update filters when map movement ends
//     map.on("moveend", () => {
//       const bounds = map.getBounds() as mapboxgl.LngLatBounds | null
//       if (!bounds) return
//       const baseFilters = latestFiltersRef.current
//       const updatedFilters: FilterState = {
//         ...baseFilters,
//         viewportBounds: expandBoundsWithKmBuffer(bounds, 2),
//         radiusFilter: undefined,
//         useViewportFilter: baseFilters.useViewportFilter ?? true,
//       }
//       onFiltersChangeRef.current(updatedFilters)
//     })

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove()
//         mapRef.current = null
//       }
//     }
//   }, [])

//   // Keep a ref of latest filters for map event handlers
//   useEffect(() => {
//     latestFiltersRef.current = filters
//   }, [filters])

//   // Keep a ref of the latest onFiltersChangeAction and isRadiusMode
//   useEffect(() => {
//     onFiltersChangeRef.current = onFiltersChangeAction
//   }, [onFiltersChangeAction])

//   useEffect(() => {
//     isRadiusModeRef.current = isRadiusMode
//   }, [isRadiusMode])

//   // Update radius circle when radiusKm changes
//   useEffect(() => {
//     if (filters.radiusFilter?.enabled && filters.radiusFilter.centerLat && filters.radiusFilter.centerLng) {
//       updateRadiusCircle(radiusKm)
//     }
//   }, [radiusKm])

//   // Update markers when listings change
//   useEffect(() => {
//     if (!mapRef.current || !isMapLoaded) return

//     // Clear existing markers
//     markersRef.current.forEach((marker) => marker.remove())
//     markersRef.current = []

//     // Add new markers
//     mapPins.forEach((pin) => {
//       // Create popup content
//       const popupContent = `
//         <div class="p-3 min-w-[200px] bg-card rounded-lg">
//           <h3 class="font-semibold text-sm mb-2">${pin.listing.title}</h3>
//           <p class="text-xs text-foreground mb-1">${pin.listing.addressObj["postalCode"]}</p>
//           <div class="flex justify-between text-xs">
//             <span>${pin.listing.ltv}% LTV</span>
//             <span>${pin.listing.interestRate}% APR</span>
//           </div>
//           <div class="mt-2 text-xs font-medium">
//             $${pin.listing.loanAmount.toLocaleString()} Principal Loan
//           </div>
//           <Image src="${pin.listing.propertyImage}" alt="${pin.listing.title}" class="mt-2 rounded-lg" />
//         </div>
//       `

//       const popup = new mapboxgl.Popup({
//         offset: 25,
//         // className:"bg-card",
//         closeButton: true,
//         closeOnClick: false,
//       }).setHTML(popupContent)

//       // Create custom marker element
//       const markerElement = document.createElement("div")
//       markerElement.className = "custom-marker"
//       markerElement.style.cursor = "pointer"

//       const pinElement = document.createElement("div")
//       pinElement.style.cssText = `
//         width: 24px;
//         height: 24px;
//         background-color: #3b82f6;
//         border: 2px solid white;
//         border-radius: 50%;
//         box-shadow: 0 2px 4px rgba(0,0,0,0.3);
//         transition: all 0.2s ease;
//       `
//       markerElement.appendChild(pinElement)

//       // Add hover effects
//       markerElement.addEventListener("mouseenter", () => {
//         pinElement.style.transform = "scale(1.2)"
//         pinElement.style.backgroundColor = "#1d4ed8"
//       })

//       markerElement.addEventListener("mouseleave", () => {
//         pinElement.style.transform = "scale(1)"
//         pinElement.style.backgroundColor = "#3b82f6"
//       })

//       const marker = new mapboxgl.Marker(markerElement)
//         .setLngLat([pin.longitude, pin.latitude])
//         .setPopup(popup)
//         .addTo(mapRef.current!)

//       markersRef.current.push(marker)
//     })

//     // Fit map to show all markers if there are any
//     if (mapPins.length > 0 && !filters.viewportBounds) {
//       if (preventFitBoundsRef.current) {
//         preventFitBoundsRef.current = false // Reset for next time
//       } else {
//         const bounds = new mapboxgl.LngLatBounds()
//         mapPins.forEach((pin) => {
//           bounds.extend([pin.longitude, pin.latitude])
//         })

//         mapRef.current.fitBounds(bounds, {
//           padding: { top: 80, bottom: 80, left: 80, right: 80 },
//           maxZoom: 12,
//         })
//       }
//     }
//   }, [mapPins, isMapLoaded, filters.viewportBounds])

//   const handleRegionClick = (region: string) => {
//     setSelectedRegions((prev) => {
//       const isSelected = prev.includes(region)
//       const newRegions = isSelected ? prev.filter((r) => r !== region) : [...prev, region]

//       // Update filters to include selected regions
//       const updatedFilters = {
//         ...filters,
//         selectedRegions: newRegions,
//       }
//       onFiltersChangeAction(updatedFilters)

//       return newRegions
//     })
//   }

//   const addRadiusPin = () => {
//     if (!mapRef.current) return

//     // Get current map center as default position
//     const center = mapRef.current.getCenter()
//     setRadiusCenter(center.lng, center.lat)
//     setIsRadiusMode(true)
//   }

//   const setRadiusCenter = (lng: number, lat: number) => {
//     if (!mapRef.current) return

//     // Remove existing radius marker and circle
//     if (radiusMarkerRef.current) {
//       radiusMarkerRef.current.remove()
//     }
//     if (radiusCircleRef.current) {
//       if (mapRef.current.getSource(radiusCircleRef.current)) {
//         mapRef.current.removeLayer(radiusCircleRef.current)
//         mapRef.current.removeLayer(radiusCircleRef.current + "-border")
//         mapRef.current.removeSource(radiusCircleRef.current)
//       }
//     }

//     // Create draggable radius marker
//     const markerElement = document.createElement("div")
//     markerElement.className = "radius-center-marker"
//     markerElement.style.cursor = "grab"

//     const pinElement = document.createElement("div")
//     pinElement.style.cssText = `
//       width: 24px;
//       height: 24px;
//       background-color: #ef4444;
//       border: 3px solid white;
//       border-radius: 50%;
//       box-shadow: 0 4px 8px rgba(0,0,0,0.3);
//       transition: all 0.2s ease;
//     `
//     markerElement.appendChild(pinElement)

//     // Add hover effects
//     markerElement.addEventListener("mouseenter", () => {
//       pinElement.style.transform = "scale(1.1)"
//       markerElement.style.cursor = "grab"
//     })

//     markerElement.addEventListener("mouseleave", () => {
//       pinElement.style.transform = "scale(1)"
//     })

//     markerElement.addEventListener("mousedown", () => {
//       markerElement.style.cursor = "grabbing"
//     })

//     markerElement.addEventListener("mouseup", () => {
//       markerElement.style.cursor = "grab"
//     })

//     radiusMarkerRef.current = new mapboxgl.Marker({
//       element: markerElement,
//       draggable: true,
//     })
//       .setLngLat([lng, lat])
//       .addTo(mapRef.current)

//     // Handle marker drag events
//     radiusMarkerRef.current.on("dragstart", () => {
//       preventFitBoundsRef.current = true
//     })

//     radiusMarkerRef.current.on("drag", () => {
//       if (radiusMarkerRef.current) {
//         const lngLat = radiusMarkerRef.current.getLngLat()
//         updateRadiusCirclePosition(lngLat.lng, lngLat.lat)
//       }
//     })

//     radiusMarkerRef.current.on("dragend", () => {
//       if (radiusMarkerRef.current) {
//         const lngLat = radiusMarkerRef.current.getLngLat()
//         updateFiltersWithNewCenter(lngLat.lng, lngLat.lat)
//       }
//     })

//     // Create initial radius circle
//     createRadiusCircle(lng, lat, radiusKm)

//     // Update filters
//     const updatedFilters = {
//       ...filters,
//       radiusFilter: {
//         centerLat: lat,
//         centerLng: lng,
//         radiusKm: radiusKm,
//         enabled: true,
//       },
//     }
//     onFiltersChangeAction(updatedFilters)
//   }

//   const createRadiusCircle = (lng: number, lat: number, radius: number) => {
//     if (!mapRef.current) return

//     const circleId = "radius-circle"
//     radiusCircleRef.current = circleId

//     const coords = createCircleCoordinates([lng, lat], radius)

//     mapRef.current.addSource(circleId, {
//       type: "geojson",
//       data: {
//         type: "Feature",
//         geometry: {
//           type: "Polygon",
//           coordinates: [coords],
//         },
//         properties: {},
//       },
//     })

//     mapRef.current.addLayer({
//       id: circleId,
//       type: "fill",
//       source: circleId,
//       paint: {
//         "fill-color": "#3b82f6",
//         "fill-opacity": 0.1,
//       },
//     })

//     mapRef.current.addLayer({
//       id: circleId + "-border",
//       type: "line",
//       source: circleId,
//       paint: {
//         "line-color": "#3b82f6",
//         "line-width": 2,
//         "line-opacity": 0.8,
//       },
//     })
//   }

//   const updateRadiusCirclePosition = (lng: number, lat: number) => {
//     if (!mapRef.current || !radiusCircleRef.current) return

//     const source = mapRef.current.getSource(radiusCircleRef.current) as mapboxgl.GeoJSONSource
//     if (source) {
//       const coords = createCircleCoordinates([lng, lat], radiusKm)
//       source.setData({
//         type: "Feature",
//         geometry: {
//           type: "Polygon",
//           coordinates: [coords],
//         },
//         properties: {},
//       })
//     }
//   }

//   const updateFiltersWithNewCenter = (lng: number, lat: number) => {
//     const updatedFilters = {
//       ...filters,
//       radiusFilter: {
//         centerLat: lat,
//         centerLng: lng,
//         radiusKm: radiusKm,
//         enabled: true,
//       },
//     }
//     onFiltersChangeAction(updatedFilters)
//   }

//   const updateRadiusCircle = (newRadiusKm: number) => {
//     if (!mapRef.current || !filters.radiusFilter?.enabled || !radiusCircleRef.current) return

//     const { centerLng, centerLat } = filters.radiusFilter

//     // Update the existing circle source without recreating layers
//     const source = mapRef.current.getSource(radiusCircleRef.current) as mapboxgl.GeoJSONSource
//     if (source) {
//       const coords = createCircleCoordinates([centerLng, centerLat], newRadiusKm)
//       source.setData({
//         type: "Feature",
//         geometry: {
//           type: "Polygon",
//           coordinates: [coords],
//         },
//         properties: {},
//       })
//     }

//     // Update filters
//     const updatedFilters = {
//       ...filters,
//       radiusFilter: {
//         ...filters.radiusFilter,
//         radiusKm: newRadiusKm,
//       },
//     }
//     onFiltersChangeAction(updatedFilters)
//   }

//   const createCircleCoordinates = (center: [number, number], radiusKm: number, points = 64): [number, number][] => {
//     const coords: [number, number][] = []
//     const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180))
//     const distanceY = radiusKm / 110.54

//     for (let i = 0; i < points; i++) {
//       const theta = (i / points) * 2 * Math.PI
//       const x = distanceX * Math.cos(theta)
//       const y = distanceY * Math.sin(theta)
//       coords.push([center[0] + x, center[1] + y] as [number, number])
//     }
//     if (coords[0]) coords.push(coords[0]) // Close the polygon
//     return coords
//   }

//   const clearRadiusFilter = () => {
//     // Remove radius marker
//     if (radiusMarkerRef.current) {
//       radiusMarkerRef.current.remove()
//       radiusMarkerRef.current = null
//     }

//     // Remove radius circle
//     if (radiusCircleRef.current && mapRef.current) {
//       if (mapRef.current.getSource(radiusCircleRef.current)) {
//         mapRef.current.removeLayer(radiusCircleRef.current)
//         mapRef.current.removeLayer(radiusCircleRef.current + "-border")
//         mapRef.current.removeSource(radiusCircleRef.current)
//       }
//       radiusCircleRef.current = null
//     }

//     // Update filters
//     const updatedFilters = {
//       ...filters,
//       radiusFilter: undefined,
//     }
//     onFiltersChangeAction(updatedFilters)
//     setIsRadiusMode(false)
//   }

//   return (
//     <div id="map-view-container" className={cn("overflow-hidden", classNames?.mapContainer)}>
//       {includeFilterBar && <FilterBar filters={filters} onFiltersChange={onFiltersChangeAction} />}

//       <div id="map-view-content" className={cn("h-full", classNames?.mapContent)}>
//         <Card id="viewport-toggle-card" className="bg-card border-card mb-2">
//           <CardBody>
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <Icon icon="lucide:globe" className="text-primary" />
//                 <span className="font-medium">Geographic filtering</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className="text-muted-foreground text-sm">Off</span>
//                 <Switch
//                   checked={Boolean(filters.useViewportFilter)}
//                   onCheckedChange={(checked) => {
//                     const updatedFilters: FilterState = {
//                       ...filters,
//                       useViewportFilter: Boolean(checked),
//                     }
//                     // When disabling, also clear viewport bounds to re-enable auto-fit
//                     if (!checked) {
//                       delete (updatedFilters as any).viewportBounds
//                     } else if (mapRef.current) {
//                       const b = mapRef.current.getBounds() as mapboxgl.LngLatBounds | null
//                       if (b) {
//                         updatedFilters.viewportBounds = expandBoundsWithKmBuffer(b, 2)
//                       }
//                     }
//                     onFiltersChangeAction(updatedFilters)
//                   }}
//                 />
//                 <span className="text-muted-foreground text-sm">On</span>
//               </div>
//             </div>
//           </CardBody>
//         </Card>
//         {/* Radius Filter Controls */}
//         {filters.radiusFilter?.enabled && (
//           <Card id="radius-filter-card" className="bg-card border-card">
//             <CardBody>
//               <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-2">
//                   <Icon icon="lucide:target" className="text-blue-500" />
//                   <span className="font-medium">Radius Filter Active</span>
//                   <span className="text-sm text-gray-500">
//                     (Drag the red pin to move, use toolbar button to add new)
//                   </span>
//                 </div>

//                 <div className="flex items-center gap-4">
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm">Radius:</span>
//                     <div className="w-32">
//                       <Slider
//                         size="sm"
//                         step={1}
//                         minValue={1}
//                         maxValue={100}
//                         value={radiusKm}
//                         onChange={(value) => {
//                           const newRadius = Array.isArray(value) ? value[0] : value
//                           setRadiusKm(newRadius ?? 0)
//                           if (filters.radiusFilter?.enabled) {
//                             updateRadiusCircle(newRadius ?? 0)
//                           }
//                         }}
//                         classNames={{
//                           track: "bg-default-300",
//                           filler: "bg-blue-500",
//                         }}
//                       />
//                     </div>
//                     <span className="text-sm font-medium">{radiusKm}km</span>
//                   </div>
//                   <Button
//                     size="sm"
//                     color="danger"
//                     variant="light"
//                     onPress={clearRadiusFilter}
//                     startContent={<Icon icon="lucide:x" />}
//                   >
//                     Clear
//                   </Button>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>
//         )}

//         <div
//           ref={mapContainerRef}
//           className={cn("h-full w-full rounded-lg px-2 md:px-0 overflow-hidden", classNames?.mapView)}
//           //calculate height as vh - 4rem
//           style={{
//             height: isMobile ? "calc(70vh - 7rem)" : "calc(100vh - 7rem)",
//             padding: "0px",
//             minHeight: isMobile ? "50vh" : "40vh",
//             maxHeight: isMobile ? "calc(70vh - 7rem)" : "calc(100vh - 7rem)",
//             ...mapViewInlineStyles,
//           }}
//         />
//         {/* </CardBody> */}
//         {/* </div> */}
//       </div>
//     </div>
//   )
// }
