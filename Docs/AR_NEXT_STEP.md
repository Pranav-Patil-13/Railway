We need to refactor the QR-based AR navigation flow.

Current behavior:
- When a QR code is scanned, the system automatically navigates to a hardcoded destination (Coach B2).

Required behavior:
1. QR scan should ONLY determine the user's current location (location_id).
2. After scanning, the user must be shown a destination selection screen.
3. The user should be able to select from:
   - Train coaches (based on selected train)
   - Station facilities (e.g., Ticket Counter, Main Gate, Waiting Room, Washroom, Exit)

Functional Requirements:

1. QR Scanner:
   - Extract station_id and location_id from QR payload.
   - Store current location in application state.
   - Do NOT trigger navigation automatically.

2. Destination Selection Screen:
   - If user has already selected a train:
       - Fetch coaches dynamically from train data.
   - Also show common station facilities:
       - ticket_counter
       - main_gate
       - exit
       - waiting_room
       - washroom
   - Present these as selectable options (buttons or cards).

3. Navigation Trigger:
   - Only after the user selects a destination:
       - Fetch destination coordinates from backend.
       - Compute direction vector:
           dx = targetX - currentX
           dz = targetZ - currentZ
           angle = atan2(dz, dx)
       - Start WebXR AR session.
       - Render arrow pointing toward selected destination.

4. Data Model Update:
   Station model should support both:
   - coach locations
   - facility locations

   Example structure:

   {
     station_id: "NASHIK01",
     locations: {
       platform_start: { x: 0, z: 0 },
       coach_B2: { x: 25, z: 0 },
       ticket_counter: { x: -5, z: 10 },
       main_gate: { x: -10, z: 20 }
     }
   }

5. UX Flow Summary:

   Select Train (optional)
   → Scan QR (sets current position)
   → Show Destination Selection UI
   → User selects coach or facility
   → Start AR navigation toward selected target

6. Remove any hardcoded destination logic.
7. Ensure navigation is dynamic and based on user selection.

This must be modular:
- QR logic separate from navigation logic
- Destination selection component reusable
- AR session starts only after explicit user choice