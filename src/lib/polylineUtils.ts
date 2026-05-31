import { decode, encode } from '@googlemaps/polyline-codec';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Represents a single segment of a route (between two consecutive points)
 */
export interface RouteSegment {
  index: number; // Segment index (0 = first segment)
  startPoint: LatLng; // Starting coordinate
  endPoint: LatLng; // Ending coordinate
  distance: number; // Distance in kilometers
  bearing: number; // Bearing in degrees (0-360)
  midpoint: LatLng; // Midpoint of the segment
}

/**
 * Complete route with decoded points and segments
 */
export interface RouteWithSegments {
  points: LatLng[]; // All decoded points
  segments: RouteSegment[]; // All segments between points
  totalDistance: number; // Total route distance in kilometers
  pointCount: number; // Total number of points
  segmentCount: number; // Total number of segments
}

/**
 * Decodes Google encoded polyline to array of lat/lng coordinates
 */
export function decodePolyline(encodedPolyline: string): LatLng[] {
  const decoded = decode(encodedPolyline, 5);
  return decoded.map(([lat, lng]) => ({ lat, lng }));
}

/**
 * Encodes array of lat/lng coordinates to Google encoded polyline
 */
export function encodePolyline(points: LatLng[]): string {
  const coordinates: [number, number][] = points.map(p => [p.lat, p.lng]);
  return encode(coordinates, 5);
}

/**
 * Calculates time between each point based on total duration
 */
export function calculateTimePerPoint(
  totalDurationMinutes: number,
  numberOfPoints: number
): number {
  // Return time in milliseconds per point
  return (totalDurationMinutes * 60 * 1000) / numberOfPoints;
}

/**
 * Format time in hours and minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Calculates distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) *
      Math.cos(point2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates bearing between two points (degrees 0-360)
 */
export function calculateBearing(point1: LatLng, point2: LatLng): number {
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const lat1 = point1.lat * (Math.PI / 180);
  const lat2 = point2.lat * (Math.PI / 180);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculates midpoint between two points
 */
export function calculateMidpoint(point1: LatLng, point2: LatLng): LatLng {
  const lat1 = point1.lat * (Math.PI / 180);
  const lon1 = point1.lng * (Math.PI / 180);
  const lat2 = point2.lat * (Math.PI / 180);
  const lon2 = point2.lng * (Math.PI / 180);
  
  const Bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
  const By = Math.cos(lat2) * Math.sin(lon2 - lon1);
  
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt(
      (Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By
    )
  );
  const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
  
  return {
    lat: (lat3 * 180) / Math.PI,
    lng: (lon3 * 180) / Math.PI,
  };
}

/**
 * Main function: Decodes polyline and extracts all segments with detailed info
 * This is the primary function to use for getting route segments
 */
export function decodePolylineWithSegments(
  encodedPolyline: string
): RouteWithSegments {
  // Decode the polyline to get all points
  const points = decodePolyline(encodedPolyline);
  
  // Generate segments from consecutive points
  const segments: RouteSegment[] = [];
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    const distance = calculateDistance(startPoint, endPoint);
    const bearing = calculateBearing(startPoint, endPoint);
    const midpoint = calculateMidpoint(startPoint, endPoint);
    
    segments.push({
      index: i,
      startPoint,
      endPoint,
      distance,
      bearing,
      midpoint,
    });
    
    totalDistance += distance;
  }
  
  return {
    points,
    segments,
    totalDistance,
    pointCount: points.length,
    segmentCount: segments.length,
  };
}

/**
 * Process multiple routes at once
 * Useful for batch decoding and segment extraction
 */
export interface RouteInput {
  routeId?: string;
  routeName?: string;
  encodedPolyline: string;
}

export interface RouteOutput {
  routeId?: string;
  routeName?: string;
  data: RouteWithSegments;
}

export function decodeMultipleRoutes(
  routes: RouteInput[]
): RouteOutput[] {
  return routes.map(route => ({
    routeId: route.routeId,
    routeName: route.routeName,
    data: decodePolylineWithSegments(route.encodedPolyline),
  }));
}

/**
 * Get segment by index from decoded route
 * Convenient for accessing specific segments
 */
export function getSegment(
  route: RouteWithSegments,
  segmentIndex: number
): RouteSegment | null {
  return route.segments[segmentIndex] ?? null;
}

/**
 * Filter segments by distance range (in kilometers)
 */
export function filterSegmentsByDistance(
  route: RouteWithSegments,
  minKm: number,
  maxKm: number
): RouteSegment[] {
  return route.segments.filter(
    seg => seg.distance >= minKm && seg.distance <= maxKm
  );
}

/**
 * Sort segments by distance (ascending or descending)
 */
export function sortSegmentsByDistance(
  segments: RouteSegment[],
  ascending: boolean = true
): RouteSegment[] {
  return [...segments].sort((a, b) =>
    ascending ? a.distance - b.distance : b.distance - a.distance
  );
}
