# Polyline Tracker

A powerful web application for visualizing, animating, and editing route polylines with real-time trip simulation and comprehensive route management capabilities.

## ✨ Features

### 🎬 Trip Animation
- **Multi-Trip Support**: Manage up to 10 simultaneous trip animations
- **Speed Controls**: Adjustable animation speeds (1x, 2x, 3x, 5x, 10x, 20x)
- **Real-time Progress**: Track trip progress with visual indicators and time estimates
- **Interactive Controls**: Start, stop, and reset trip animations
- **Color-Coded Routes**: Each trip has a unique color for easy identification

### ✏️ Route Editing Mode
- **Create New Routes**: Design custom routes by clicking points on the map
- **Edit Existing Routes**: Modify any route by adding or removing points
- **Dual Edit Modes**:
  - **Add Points Mode**: Click to add individual points, click markers to delete
  - **Select Area Mode**: Drag to select multiple points in a rectangular area for bulk deletion
- **Visual Feedback**: 
  - Selected points highlighted in red
  - Real-time selection box with dashed border
  - Point counter with selection status
- **Polyline Encoding**: Generate Google-encoded polylines from your custom routes
- **Database Integration**: Save new routes or update existing ones directly to Supabase

### 🗺️ Map Features
- **Interactive Map**: Leaflet/OpenStreetMap integration with zoom and pan controls
- **Point Visualization**: All route points displayed as markers
- **Current Location Indicators**: Track active trip positions in real-time
- **Focus Controls**: Focus on individual trips or view all trips at once
- **Click-to-Highlight**: Click coordinates in the list to highlight and center them on the map

### 📊 Data Management
- **Route Database**: Store and manage routes in Supabase
- **Trip Tracking**: Persist trip state in the `current_locations` table
- **Real-time Updates**: Live synchronization between UI and database

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Get Supabase credentials from your [Supabase project settings](https://supabase.com/dashboard)**

### 3. Set Up Database

Run the SQL schema from `database-schema.sql` in your Supabase SQL editor to create the required tables:
- `master_routes` - Stores route data with encoded polylines
- `current_locations` - Tracks active trip states

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📖 Usage Guide

### Creating a Trip
1. Select a route from the dropdown
2. Choose animation speed
3. Click "Create Trip"
4. Use Start/Stop/Reset controls to manage the trip

### Editing Routes

#### Enter Edit Mode
1. Click "✏️ Enter Edit Mode" button
2. Choose to create a new route or edit an existing one

#### Create New Route
1. Enter a route name
2. Click "➕ Create New Route"
3. Switch between **Add Points** and **Select Area** modes:
   - **Add Points**: Click map to add points, click markers to delete
   - **Select Area**: Click and drag to select points in an area, then delete selected points
4. Click "🧮 Calculate Encoded Polyline" to generate the polyline string
5. Review the generated polyline
6. Click "💾 Save to Database" to store the route

#### Edit Existing Route
1. Select a route from the dropdown
2. Click "✏️ Edit Route"
3. Add or remove points using the editing tools
4. Generate and save the updated polyline

### Map Interactions
- **Zoom**: Use the +/- buttons or scroll wheel
- **Pan**: Click and drag (disabled during area selection)
- **Focus**: Click a trip's colored indicator to center the map on it
- **Highlight Point**: Click a coordinate in the point list to highlight it on the map

## 🗄️ Database Schema

### `master_routes` Table
```sql
CREATE TABLE master_routes (
  idx SERIAL PRIMARY KEY,
  id UUID DEFAULT gen_random_uuid(),
  route_number VARCHAR(50) NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  origin_city VARCHAR(100),
  destination_city VARCHAR(100),
  total_distance_km VARCHAR(50),
  estimated_duration_minutes INTEGER DEFAULT 210,
  encoded_polyline VARCHAR(10000) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `current_locations` Table
```sql
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
```

## 🛠️ Tech Stack

- **React 19** - UI framework with hooks
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and dev server
- **Leaflet** - Interactive map library
- **React Leaflet** - React components for Leaflet
- **OpenStreetMap** - Map tiles
- **Supabase** - PostgreSQL database and real-time backend
- **@googlemaps/polyline-codec** - Encoding/decoding polylines

## 🎨 UI Components

- Custom confirmation dialogs (no browser popups)
- Responsive sidebar with trip management
- Color-coded trip indicators
- Real-time progress bars
- Interactive map controls
- Scrollable coordinate lists

## 📦 Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
