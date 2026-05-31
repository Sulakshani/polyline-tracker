# Polyline Edit Mode Guide

## Overview
The application now includes a powerful **Polyline Edit Mode** that allows you to create new routes and edit existing routes by adding and deleting coordinate points directly on the map.

## Features

### 1. Toggle Edit Mode
- Click the **"✏️ Enter Edit Mode"** button at the top of the sidebar
- This switches the application from trip animation mode to route editing mode
- Click **"✏️ Exit Edit Mode"** to return to trip animation mode

### 2. Create New Route
When in Edit Mode and no route is being edited:

1. Enter a name for your new route in the "Create New Route" section
2. Click **"➕ Create New Route"**
3. Click anywhere on the map to add coordinate points
4. Points will be connected with a purple polyline
5. Click on any marker to delete that point
6. Once you have at least 2 points, click **"💾 Save Route"**

The new route will be:
- Encoded using Google's polyline encoding algorithm
- Saved to the `master_routes` table in Supabase
- Assigned the next available route number
- Available for trip animation immediately

### 3. Edit Existing Route
When in Edit Mode and no route is being edited:

1. Select a route from the dropdown in the "Edit Existing Route" section
2. Click **"✏️ Edit Route"**
3. The existing route points will be loaded and displayed on the map
4. Click anywhere on the map to add new points
5. Click on any marker to delete that point
6. Click **"💾 Save Route"** to update the route in the database

The updated route will:
- Replace the existing encoded polyline in the database
- Update the `updated_at` timestamp
- Be immediately available for trip animation

### 4. Route Editing Controls

While editing a route:
- **Point List**: View all coordinate points with their lat/lng values
- **Delete Point**: Click the ✕ button next to any point or click the marker on the map
- **Save Route**: Saves the encoded polyline to the database (requires minimum 2 points)
- **🗑️ Clear All Points**: Removes all points and starts over
- **← Back**: Returns to the route selection screen (warns if unsaved changes exist)

## How It Works

### Technical Details

1. **Map Click Handler**: When editing, clicking the map adds a new coordinate point
2. **Polyline Encoding**: Points are converted to Google's encoded polyline format using `@googlemaps/polyline-codec`
3. **Database Update**: Encoded polylines are saved to the `master_routes` table
4. **Visual Feedback**: 
   - Editable routes are shown in purple with larger markers
   - Active trip routes are hidden during edit mode
   - Current points are displayed in a scrollable list

### Database Schema
The encoded polylines are stored in the `master_routes` table:
```sql
encoded_polyline VARCHAR(10000) NOT NULL
```

### Encoding/Decoding
- **Decode**: Converts database polyline → array of {lat, lng} points
- **Encode**: Converts array of {lat, lng} points → database polyline
- Uses precision level 5 for Google Maps compatibility

## Usage Tips

1. **Zoom in** for more precise point placement
2. **Add points gradually** to create smooth routes
3. **Delete mistakes** by clicking markers
4. **Save frequently** when making major changes
5. **Test routes** by exiting edit mode and creating a trip with the new/edited route

## Example Workflow

### Creating a New Route
1. Click "✏️ Enter Edit Mode"
2. Type "Downtown Loop" in the route name field
3. Click "➕ Create New Route"
4. Click points on the map to trace your route
5. Review the point list in the sidebar
6. Click "💾 Save Route"
7. Click "✏️ Exit Edit Mode"
8. Select "Downtown Loop" from the route dropdown
9. Create a trip to test the new route!

### Editing an Existing Route
1. Click "✏️ Enter Edit Mode"
2. Select a route from the "Edit Existing Route" dropdown
3. Click "✏️ Edit Route"
4. Click markers to delete unwanted points
5. Click the map to add new points
6. Click "💾 Save Route"
7. Click "✏️ Exit Edit Mode"

## Safety Features

- **Unsaved changes warning**: Prompts before exiting with unsaved work
- **Confirmation dialogs**: Ask before deleting points or clearing all points
- **Minimum point requirement**: Requires at least 2 points to save a route
- **Database validation**: Ensures data integrity when saving

## Troubleshooting

**Q: I can't see my edited route**
- Make sure you clicked "💾 Save Route" before exiting edit mode
- Refresh the page to reload routes from the database

**Q: Map clicks aren't adding points**
- Verify you're in edit mode (button should say "Exit Edit Mode")
- Make sure you've started creating/editing a route
- Check that you're clicking the map area, not UI elements

**Q: Can't save my route**
- Ensure you have at least 2 points added
- Check the browser console for any error messages
- Verify your Supabase connection is working

---

Enjoy creating and editing your custom routes! 🗺️✨
