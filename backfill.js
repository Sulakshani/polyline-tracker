import { createClient } from '@supabase/supabase-js';
import pkg from '@googlemaps/polyline-codec';
const { decode } = pkg;
import fs from 'fs';
import path from 'path';

// Read env file
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Copied distance logic from polylineUtils.ts
function calculateDistance(point1, point2) {
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

function decodePolylineWithSegments(encodedPolyline) {
  const decoded = decode(encodedPolyline, 5);
  const points = decoded.map(([lat, lng]) => ({ lat, lng }));
  const segments = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const startPoint = points[i];
    const endPoint = points[i + 1];
    const distance = calculateDistance(startPoint, endPoint);
    
    segments.push({
      index: i,
      startPoint,
      endPoint,
      distance,
    });
  }
  return { points, segments };
}

async function backfill() {
  console.log("Fetching existing master_routes...");
  const { data: routes, error } = await supabase.from('master_routes').select('id, route_name, encoded_polyline');
  
  if (error) {
    console.error("Error fetching routes:", error);
    return;
  }
  
  console.log(`Found ${routes.length} routes. Processing...`);
  
  for (const route of routes) {
    if (!route.encoded_polyline) {
      console.log(`Skipping route ${route.route_name} (no polyline)`);
      continue;
    }
    
    console.log(`Processing route: ${route.route_name}`);
    const decodedData = decodePolylineWithSegments(route.encoded_polyline);
    
    const segmentPayloads = decodedData.segments.map((seg) => {
      const formatUUID = (idx) => `00000000-0000-0000-0000-${String(idx).padStart(12, '0')}`;
      return {
        master_route_id: route.id,
        start_point_type: seg.index === 0 ? "origin" : "stop",
        start_point_id: formatUUID(seg.index),
        end_point_type: seg.index === decodedData.segments.length - 1 ? "destination" : "stop",
        end_point_id: formatUUID(seg.index + 1),
        segment_order: seg.index + 1,
        start_latitude: seg.startPoint.lat,
        start_longitude: seg.startPoint.lng,
        end_latitude: seg.endPoint.lat,
        end_longitude: seg.endPoint.lng,
        distance_km: Math.max(seg.distance, 0.0001), // avoid 0 constraint
        baseline_duration_minutes: 1, // avoid 0 constraint
        baseline_speed_kmh: 40.0,
      };
    });
    
    // First clear existing segments for this route just in case
    await supabase.from("route_segments").delete().eq("master_route_id", route.id);
    
    const chunkSize = 1000;
    for (let i = 0; i < segmentPayloads.length; i += chunkSize) {
      const chunk = segmentPayloads.slice(i, i + chunkSize);
      const { error: segmentsError } = await supabase.from("route_segments").insert(chunk);
      if (segmentsError) {
        console.error(`Error inserting segments for ${route.route_name}:`, segmentsError);
      }
    }
    console.log(`Successfully inserted ${segmentPayloads.length} segments for ${route.route_name}`);
  }
  
  console.log("Backfill complete!");
}

backfill().catch(console.error);
