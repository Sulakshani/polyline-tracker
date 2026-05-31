# Polyline Calculation Algorithm (How This Project Works)

This document explains how polyline data is processed and animated in this project.

## 1) What a polyline is in this app

A route is stored as a **Google encoded polyline string** in the database (`master_routes.encoded_polyline`).

In runtime, the app converts that string into an ordered list of points:

- Point format: `{ lat: number, lng: number }`
- Route format: `LatLng[]` (an array of points)

So the app always works with two forms:

1. **Compressed string** for storage/transmission
2. **Decoded coordinates array** for drawing and animation

---

## 2) Decode algorithm used by the app

Source: `src/lib/polylineUtils.ts`

The app decodes with:

- `decode(encodedPolyline, 5)` from `@googlemaps/polyline-codec`
- Precision `5` means values are scaled by \(10^5\)

### Decode flow

1. Read encoded string from DB.
2. Fix escaped backslashes if needed (`\\\\` -> `\\`) in `App.tsx`.
3. Call `decodePolyline(encoded)`.
4. Convert tuple pairs `[lat, lng]` into objects `{ lat, lng }`.
5. Use resulting array for rendering and trip movement.

### Why precision = 5?

Google polyline commonly uses 5 decimal places. That gives ~meter-level coordinate precision and matches most map route datasets.

---

## 3) Encode algorithm used by the app

Source: `src/lib/polylineUtils.ts`

When user edits points, the app stores them back as encoded polyline:

1. Collect edited points (`LatLng[]`).
2. Convert objects into coordinate tuples `[lat, lng]`.
3. Call `encode(coordinates, 5)`.
4. Save resulting string to `master_routes.encoded_polyline`.

This happens when:

- User clicks **Generate Polyline** (`generatePolyline`)
- Then user clicks **Save to Database** (`saveToDatabase`)

---

## 4) Trip animation algorithm (point-by-point movement)

Source: `src/App.tsx` (`createTrip`, `startAnimation`)

After decoding, a trip moves by incrementing the current point index over time.

## Inputs

- `decodedPoints.length = N`
- `estimatedDurationMinutes = D`
- `speedMultiplier = S` (1, 2, 3, 5, 10, 20)

## Time step formula

The app computes time per point as:

$$
\text{timePerPointMs} = \frac{D \times 60 \times 1000}{N}
$$

Then adjusts by speed:

$$
\text{adjustedIntervalMs} = \frac{\text{timePerPointMs}}{S}
$$

So higher speed multiplier means smaller interval and faster movement.

## Runtime loop

Every `adjustedIntervalMs`:

1. `index = index + 1`
2. If index is beyond last point: stop animation
3. Read current point `decodedPoints[index]`
4. Compute progress:

$$
\text{progress\%} = \left(\frac{\text{index}}{N-1}\right) \times 100
$$

5. Update DB (`current_locations`) with:
   - `current_point_index`
   - `current_latitude`
   - `current_longitude`
   - `progress_percentage`
   - `is_animating`
6. Update local React state so UI marker moves

That is why movement looks like snapping from point to point (discrete stepping), not continuous interpolation.

---

## 5) Insert-between algorithm (route editing)

Source: `src/App.tsx` (`handleMapClick`, `distanceToSegment`)

When edit mode is `insert`, user clicks near the route. The app inserts a point into the **nearest segment**.

## Segment search

For every consecutive pair:

- Segment \(i\): `points[i] -> points[i+1]`
- Compute distance from clicked point to that segment
- Pick segment with minimum distance
- Insert at index `i + 1`

## Distance-to-segment math

Using local planar approximation with:

- `x = lng`, `y = lat`

Given segment endpoints \((x_1, y_1)\), \((x_2, y_2)\) and click \((x, y)\):

1. Compute projection parameter:

$$
\text{param} = \frac{(x-x_1)(x_2-x_1) + (y-y_1)(y_2-y_1)}{(x_2-x_1)^2 + (y_2-y_1)^2}
$$

2. Clamp to segment:

- if `param < 0` -> nearest point is start
- if `param > 1` -> nearest point is end
- else -> nearest point is projected point on the segment

3. Return Euclidean distance to that nearest point.

This is the core geometric algorithm that decides _where_ insertion should happen.

---

## 6) Move-point algorithm (drag editing)

Source: `src/App.tsx` (`handlePointDrag*`)

In `move` mode:

1. Start drag -> store dragged index
2. During drag -> update that point’s lat/lng
3. Updates are throttled with `requestAnimationFrame` to reduce render cost
4. On drag end -> final point position is committed

This changes the points array directly, and the polyline redraws immediately from updated points.

---

## 7) Data consistency model

The app keeps route/trip data consistent through this pipeline:

1. **DB encoded polyline** -> decode -> **UI points array**
2. UI edits points array -> encode -> **DB encoded polyline**
3. Trip simulation uses decoded points + timed index progression
4. DB `current_locations` mirrors the active point for each trip

So encoded strings are the persistence format, while point arrays are the execution format.

---

## 8) Complexity summary

- Decode/Encode: proportional to number of points \(O(N)\)
- Animation tick work: \(O(1)\) per interval
- Insert-between click: checks all segments, \(O(N)\)
- Move drag update: \(O(1)\) point update (plus React render cost)

---

## 9) Practical notes

- This project currently animates by **index stepping**, not distance-uniform speed.
- If point spacing is uneven, visual speed can look uneven across the route.
- To get smoother constant-speed motion, future improvement would be interpolation by path distance instead of fixed point index increments.
