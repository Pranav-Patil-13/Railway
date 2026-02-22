# AR QR-Based Indoor Navigation - Implementation Plan

## Project Overview

Implement QR-initialized AR indoor navigation for the Railway Navigation web app.

The system will:
1. Allow user to select train and coach.
2. Scan QR code to determine current indoor position.
3. Open AR view in browser.
4. Render directional arrow toward selected coach.
5. Display distance and navigation feedback.

This solution ensures stable indoor positioning without relying on GPS.

---

# Architecture Overview

## Tech Stack

Frontend:
- WebXR (AR session)
- Three.js (3D rendering)
- jsQR (QR scanning)
- WebGL

Backend:
- Node.js (Express)
- MongoDB (Station coordinate data)

---

# Feature Flow

1. User selects Train + Coach.
2. App opens QR Scanner.
3. QR returns `location_id`.
4. Frontend requests station coordinates from backend.
5. Compute direction vector.
6. Start WebXR AR session.
7. Place arrow model on detected floor.
8. Rotate arrow toward destination.

---

# Folder Structure

frontend/
  /ar
    ARSessionManager.js
    ArrowRenderer.js
    DirectionCalculator.js
  /qr
    QRScanner.js
  /services
    stationService.js

backend/
  /routes
    stationRoutes.js
  /models
    StationModel.js

---

# Backend Implementation

## MongoDB Schema Example

{
  station_id: "NASHIK01",
  locations: {
    platform_start: { x: 0, z: 0 },
    platform_mid: { x: 10, z: 0 },
    coach_B2: { x: 25, z: 0 }
  }
}

---

## API Endpoint

GET /api/stations/:stationId

Response:
{
  locations: { ... }
}

---

# QR Code Design

QR Content Format:
{
  "station_id": "NASHIK01",
  "location_id": "platform_mid"
}

---

# Direction Calculation Logic

Given:

current = (x1, z1)
target = (x2, z2)

Compute:

dx = x2 - x1
dz = z2 - z1

angle = atan2(dz, dx)

Distance:
sqrt(dx^2 + dz^2)

---

# AR Implementation (WebXR)

1. Request immersive-ar session.
2. Detect horizontal plane.
3. Place anchor at camera position.
4. Spawn arrow mesh 1 meter ahead.
5. Rotate arrow using computed angle.
6. Update arrow rotation each frame if needed.

---

# UI Enhancements

- Floating coach label
- Distance counter
- Alignment indicator (green when facing correct direction)
- Minimal futuristic UI overlay

---

# Error Handling

- If QR invalid → show retry
- If WebXR unsupported → fallback message
- If AR session fails → show standard map direction

---

# Demo Preparation (Classroom Setup)

Print QR codes representing:
- platform_start
- platform_mid
- exit

Place them at fixed classroom positions.

Ensure consistent lighting.

---

# Future Scalability

Phase 2:
- Multi-anchor path rendering
- Waypoint-based navigation
- Animated glowing path markers

Phase 3:
- BLE beacon support
- Real railway deployment integration

---

# Security Considerations

- Validate QR payload server-side.
- Prevent coordinate tampering.
- Sanitize all API inputs.

---

# Definition of Done

- QR scan returns correct location.
- AR arrow points accurately toward coach.
- Distance displayed correctly.
- Demo runs reliably without drift.
- Works on Chrome Android WebXR-supported devices.