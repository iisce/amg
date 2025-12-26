'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WORKSPACE_LOCATION, getDirectionsUrl } from '@/lib/constants/location';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Navigation, Car, PersonStanding } from 'lucide-react';

declare global {
	interface Window {
		google: typeof google;
		initMap: () => void;
		__googleMapsLoading?: boolean;
		__googleMapsCallbacks?: (() => void)[];
	}
}

interface DistanceInfo {
	driving?: {
		distance: string;
		duration: string;
	};
	walking?: {
		distance: string;
		duration: string;
	};
}

interface GoogleMapProps {
	className?: string;
	showDistanceCalculator?: boolean;
}

// Singleton loader for Google Maps API
function loadGoogleMapsApi(apiKey: string): Promise<void> {
	return new Promise((resolve, reject) => {
		// Already loaded
		if (window.google?.maps) {
			resolve();
			return;
		}

		// Currently loading - add to callback queue
		if (window.__googleMapsLoading) {
			window.__googleMapsCallbacks = window.__googleMapsCallbacks || [];
			window.__googleMapsCallbacks.push(() => resolve());
			return;
		}

		// Check if script already exists in DOM
		const existingScript = document.querySelector(
			'script[src*="maps.googleapis.com/maps/api/js"]'
		);
		if (existingScript) {
			// Script exists but not loaded yet, wait for it
			window.__googleMapsCallbacks = window.__googleMapsCallbacks || [];
			window.__googleMapsCallbacks.push(() => resolve());
			return;
		}

		// Start loading
		window.__googleMapsLoading = true;
		window.__googleMapsCallbacks = [];

		const script = document.createElement('script');
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&callback=initMap`;
		script.async = true;
		script.defer = true;

		window.initMap = () => {
			window.__googleMapsLoading = false;
			resolve();
			// Call all waiting callbacks
			window.__googleMapsCallbacks?.forEach((cb) => cb());
			window.__googleMapsCallbacks = [];
		};

		script.onerror = () => {
			window.__googleMapsLoading = false;
			reject(new Error('Failed to load Google Maps'));
		};

		document.head.appendChild(script);
	});
}

export function GoogleMap({
	className = '',
	showDistanceCalculator = true,
}: GoogleMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<google.maps.Map | null>(null);
	const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
		null
	);
	const [isLoaded, setIsLoaded] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
	const [isCalculating, setIsCalculating] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);

	// Load Google Maps script
	useEffect(() => {
		const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

		if (!apiKey) {
			setLoadError('Google Maps API key not configured');
			return;
		}

		loadGoogleMapsApi(apiKey)
			.then(() => setIsLoaded(true))
			.catch((err) => setLoadError(err.message));
	}, []);

	// Initialize map
	useEffect(() => {
		if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

		const { lat, lng } = WORKSPACE_LOCATION.coordinates;

		// Create map
		const map = new google.maps.Map(mapRef.current, {
			center: { lat, lng },
			zoom: 16,
			mapId: 'AMG_WORKSPACE_MAP', // Required for Advanced Markers
			disableDefaultUI: false,
			zoomControl: true,
			mapTypeControl: false,
			streetViewControl: true,
			fullscreenControl: true,
			styles: [
				{
					featureType: 'poi.business',
					stylers: [{ visibility: 'simplified' }],
				},
			],
		});

		mapInstanceRef.current = map;

		// Create custom marker element
		const markerContent = document.createElement('div');
		markerContent.className = 'custom-marker';
		markerContent.innerHTML = `
			<div style="
				background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
				padding: 8px 12px;
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0,0,0,0.3);
				display: flex;
				align-items: center;
				gap: 6px;
				color: white;
				font-weight: 600;
				font-size: 14px;
				white-space: nowrap;
			">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
					<circle cx="12" cy="10" r="3"/>
				</svg>
				AMG WorkSpace
			</div>
			<div style="
				width: 0;
				height: 0;
				border-left: 10px solid transparent;
				border-right: 10px solid transparent;
				border-top: 10px solid #4f46e5;
				margin: 0 auto;
			"></div>
		`;

		// Create Advanced Marker
		const marker = new google.maps.marker.AdvancedMarkerElement({
			map,
			position: { lat, lng },
			content: markerContent,
			title: WORKSPACE_LOCATION.name,
		});

		markerRef.current = marker;

		// Add info window
		const infoWindow = new google.maps.InfoWindow({
			content: `
				<div style="padding: 8px; max-width: 250px;">
					<h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 16px;">
						${WORKSPACE_LOCATION.name}
					</h3>
					<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">
						${WORKSPACE_LOCATION.formattedAddress}
					</p>
				</div>
			`,
		});

		marker.addListener('click', () => {
			infoWindow.open({
				anchor: marker,
				map,
			});
		});
	}, [isLoaded]);

	// Get user location and calculate distance
	const calculateDistance = useCallback(() => {
		if (!window.google?.maps) return;

		setIsCalculating(true);
		setLocationError(null);

		if (!navigator.geolocation) {
			setLocationError('Geolocation is not supported by your browser');
			setIsCalculating(false);
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const origin = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setUserLocation(origin);

				const service = new google.maps.DistanceMatrixService();
				const destination = WORKSPACE_LOCATION.coordinates;

				try {
					// Get driving distance
					const drivingResult = await service.getDistanceMatrix({
						origins: [origin],
						destinations: [destination],
						travelMode: google.maps.TravelMode.DRIVING,
						unitSystem: google.maps.UnitSystem.METRIC,
					});

					// Get walking distance
					const walkingResult = await service.getDistanceMatrix({
						origins: [origin],
						destinations: [destination],
						travelMode: google.maps.TravelMode.WALKING,
						unitSystem: google.maps.UnitSystem.METRIC,
					});

					const distanceData: DistanceInfo = {};

					if (drivingResult.rows[0]?.elements[0]?.status === 'OK') {
						distanceData.driving = {
							distance:
								drivingResult.rows[0].elements[0].distance.text,
							duration:
								drivingResult.rows[0].elements[0].duration.text,
						};
					}

					if (walkingResult.rows[0]?.elements[0]?.status === 'OK') {
						distanceData.walking = {
							distance:
								walkingResult.rows[0].elements[0].distance.text,
							duration:
								walkingResult.rows[0].elements[0].duration.text,
						};
					}

					setDistanceInfo(distanceData);
				} catch (error) {
					console.error('Error calculating distance:', error);
					setLocationError('Failed to calculate distance');
				}

				setIsCalculating(false);
			},
			(error) => {
				setIsCalculating(false);
				switch (error.code) {
					case error.PERMISSION_DENIED:
						setLocationError(
							'Location access denied. Please enable location permissions.'
						);
						break;
					case error.POSITION_UNAVAILABLE:
						setLocationError('Location information unavailable.');
						break;
					case error.TIMEOUT:
						setLocationError(
							'Location request timed out. Please try again.'
						);
						break;
					default:
						setLocationError(
							'An error occurred getting your location.'
						);
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 300000, // Cache for 5 minutes
			}
		);
	}, []);

	if (loadError) {
		return (
			<Card className={className}>
				<CardContent className='p-6'>
					<div className='flex flex-col items-center justify-center h-64 text-center text-muted-foreground'>
						<MapPin className='h-12 w-12 mb-4 opacity-50' />
						<p className='font-medium mb-2'>Map unavailable</p>
						<p className='text-sm'>{loadError}</p>
						<Button
							variant='outline'
							className='mt-4'
							asChild
						>
							<a
								href={getDirectionsUrl()}
								target='_blank'
								rel='noopener noreferrer'
							>
								Open in Google Maps
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={className}>
			{/* Map Container - Full Width */}
			<div className='relative overflow-hidden border -mx-6 md:-mx-6'>
				{!isLoaded && <Skeleton className='absolute inset-0 z-10' />}
				<div
					ref={mapRef}
					className='w-full h-75 md:h-100 lg:h-125 min-h-75'
				/>
			</div>

			{/* Distance Calculator */}
			{showDistanceCalculator && (
				<div className='mt-4'>
					{!distanceInfo && !isCalculating && (
						<Button
							variant='outline'
							onClick={calculateDistance}
							className='w-full'
							disabled={!isLoaded}
						>
							<Navigation className='mr-2 h-4 w-4' />
							Calculate Distance from My Location
						</Button>
					)}

					{isCalculating && (
						<div className='flex items-center justify-center gap-2 py-3 text-muted-foreground'>
							<div className='animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent' />
							<span>Getting your location...</span>
						</div>
					)}

					{locationError && (
						<div className='text-sm text-destructive text-center py-2'>
							{locationError}
						</div>
					)}

					{distanceInfo && (
						<div className='grid grid-cols-2 gap-3 mt-2'>
							{distanceInfo.driving && (
								<Card>
									<CardContent className='p-3 flex items-center gap-3'>
										<div className='p-2 rounded-full bg-primary/10'>
											<Car className='h-4 w-4 text-primary' />
										</div>
										<div>
											<p className='text-sm font-medium'>
												{distanceInfo.driving.duration}
											</p>
											<p className='text-xs text-muted-foreground'>
												{distanceInfo.driving.distance}{' '}
												by car
											</p>
										</div>
									</CardContent>
								</Card>
							)}
							{distanceInfo.walking && (
								<Card>
									<CardContent className='p-3 flex items-center gap-3'>
										<div className='p-2 rounded-full bg-primary/10'>
											<PersonStanding className='h-4 w-4 text-primary' />
										</div>
										<div>
											<p className='text-sm font-medium'>
												{distanceInfo.walking.duration}
											</p>
											<p className='text-xs text-muted-foreground'>
												{distanceInfo.walking.distance}{' '}
												walking
											</p>
										</div>
									</CardContent>
								</Card>
							)}
							{userLocation && (
								<div className='col-span-2'>
									<Button
										asChild
										className='w-full'
									>
										<a
											href={getDirectionsUrl(
												userLocation
											)}
											target='_blank'
											rel='noopener noreferrer'
										>
											<Navigation className='mr-2 h-4 w-4' />
											Get Turn-by-Turn Directions
										</a>
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
