-- Create current_locations table for tracking active trip animations
CREATE TABLE current_locations (
  trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES master_routes(id) ON DELETE CASCADE,
  route_name VARCHAR(255) NOT NULL,
  current_point_index INTEGER NOT NULL DEFAULT 0,
  current_latitude DECIMAL(10, 8) NOT NULL,
  current_longitude DECIMAL(11, 8) NOT NULL,
  total_points INTEGER NOT NULL,
  speed_multiplier INTEGER NOT NULL DEFAULT 1,
  is_animating BOOLEAN NOT NULL DEFAULT false,
  progress_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_current_locations_trip_id ON current_locations(trip_id);
CREATE INDEX idx_current_locations_is_animating ON current_locations(is_animating);

-- Enable Row Level Security (RLS)
ALTER TABLE current_locations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Enable all operations for current_locations" ON current_locations
  FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_current_locations_updated_at
  BEFORE UPDATE ON current_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
