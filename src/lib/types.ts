export interface Trip {
  trip_id: string;
  route_id: string;
  route_name: string;
  current_point_index: number;
  current_latitude: number;
  current_longitude: number;
  total_points: number;
  speed_multiplier: number;
  is_animating: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface TripWithRoute {
  trip: Trip;
  decodedPoints: Array<{ lat: number; lng: number }>;
  routeData: any; // MasterRoute type
}
