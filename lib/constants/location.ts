// AMG Workspace Location Configuration
export const WORKSPACE_LOCATION = {
	name: 'AMG WorkSpace',
	address: {
		street: 'Festac Tower, 22 Rd',
		area: 'Festac Town',
		city: 'Lagos',
		postalCode: '102102',
		state: 'Lagos',
		country: 'Nigeria',
	},
	// Exact coordinates from Google Maps
	coordinates: {
		lat: 6.4650909,
		lng: 3.2850825,
	},
	// Google Maps Place ID
	placeId: '0x103b89d04bf36dfd:0x6e2e2166eeab57b4',
	// Full formatted address for display
	formattedAddress:
		'AMG WorkSpace, Festac Tower, 22 Rd, Festac Town, Lagos 102102, Lagos',
	// URL-encoded address for Google Maps links
	encodedAddress:
		'AMG+WorkSpace+Festac+Tower+22+Rd+Festac+Town+Lagos+102102+Nigeria',
} as const;

// Office Geofence Polygon - defines the boundary for check-in
// Roughly 50m radius around the workspace
export const OFFICE_POLYGON: { lat: number; lng: number }[] = [
	{ lat: 6.4655, lng: 3.2845 }, // North-West
	{ lat: 6.4655, lng: 3.2856 }, // North-East
	{ lat: 6.4646, lng: 3.2856 }, // South-East
	{ lat: 6.4646, lng: 3.2845 }, // South-West
];

// Check-in radius in meters (fallback for distance-based check)
export const CHECKIN_RADIUS_METERS = 100;

// Business hours configuration
export const BUSINESS_HOURS = {
	weekdays: { open: 9, close: 18 }, // Mon-Fri: 9am - 6pm
	saturday: { open: 11, close: 16 }, // Sat: 11am - 4pm
	sunday: null, // Closed
} as const;

// Check if user is within office polygon using ray-casting algorithm
export function isPointInPolygon(
	point: { lat: number; lng: number },
	polygon: { lat: number; lng: number }[]
): boolean {
	let inside = false;
	const { lat: x, lng: y } = point;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].lat,
			yi = polygon[i].lng;
		const xj = polygon[j].lat,
			yj = polygon[j].lng;

		const intersect =
			yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

		if (intersect) inside = !inside;
	}

	return inside;
}

// Calculate distance between two coordinates in meters using Haversine formula
export function getDistanceFromLatLng(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	const R = 6371e3; // Earth's radius in meters
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lng2 - lng1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c;
}

// Check if user is within check-in range (polygon or radius)
export function isWithinCheckInRange(userLocation: {
	lat: number;
	lng: number;
}): boolean {
	// First check polygon
	if (isPointInPolygon(userLocation, OFFICE_POLYGON)) {
		return true;
	}

	// Fallback to radius check
	const distance = getDistanceFromLatLng(
		userLocation.lat,
		userLocation.lng,
		WORKSPACE_LOCATION.coordinates.lat,
		WORKSPACE_LOCATION.coordinates.lng
	);

	return distance <= CHECKIN_RADIUS_METERS;
}

// Check if current time is within business hours
export function isWithinBusinessHours(): {
	isOpen: boolean;
	message: string;
	nextOpen?: string;
} {
	const now = new Date();
	const day = now.getDay(); // 0 = Sunday, 6 = Saturday
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const currentTime = hours + minutes / 60;

	// Sunday - Closed
	if (day === 0) {
		return {
			isOpen: false,
			message: 'AMG Workspace is closed on Sundays',
			nextOpen: 'Monday 9:00 AM',
		};
	}

	// Saturday
	if (day === 6) {
		const { open, close } = BUSINESS_HOURS.saturday;
		if (currentTime < open) {
			return {
				isOpen: false,
				message: `Opens at ${open}:00 AM today`,
				nextOpen: `${open}:00 AM`,
			};
		}
		if (currentTime >= close) {
			return {
				isOpen: false,
				message: 'AMG Workspace is now closed',
				nextOpen: 'Monday 9:00 AM',
			};
		}
		return { isOpen: true, message: 'Open until 4:00 PM' };
	}

	// Weekdays (Mon-Fri)
	const { open, close } = BUSINESS_HOURS.weekdays;
	if (currentTime < open) {
		return {
			isOpen: false,
			message: `Opens at ${open}:00 AM today`,
			nextOpen: `${open}:00 AM`,
		};
	}
	if (currentTime >= close) {
		const nextDay = day === 5 ? 'Saturday' : 'tomorrow';
		const nextTime = day === 5 ? '11:00 AM' : '9:00 AM';
		return {
			isOpen: false,
			message: 'AMG Workspace is now closed',
			nextOpen: `${nextDay} ${nextTime}`,
		};
	}

	return { isOpen: true, message: 'Open until 6:00 PM' };
}

// Google Maps URLs
export const getDirectionsUrl = (origin?: { lat: number; lng: number }) => {
	const destination = `${WORKSPACE_LOCATION.coordinates.lat},${WORKSPACE_LOCATION.coordinates.lng}`;
	if (origin) {
		return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}`;
	}
	return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
};

export const getMapSearchUrl = () => {
	return `https://www.google.com/maps/search/?api=1&query=${WORKSPACE_LOCATION.encodedAddress}`;
};
