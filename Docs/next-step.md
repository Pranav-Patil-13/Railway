You are continuing development of the Railway Navigation Web Application.

The base boilerplate and UI system are already implemented.

Now implement the core functional MVP features as described below.

-------------------------------------------------
PHASE 1: CONNECT FRONTEND TO BACKEND
-------------------------------------------------

1. On the Search page:
   - Create a search form with:
     - Train number input (required)
     - Submit button
   - On submit:
     - Call GET /api/trains/:trainNumber
     - Use Axios from src/services/api.ts
     - Use VITE_API_URL from environment variables

2. Implement full request state handling:
   - loading state (spinner or animated button)
   - error state (error message component)
   - not found state (friendly empty state UI)

3. Do NOT hardcode API URLs.

-------------------------------------------------
PHASE 2: DISPLAY TRAIN DETAILS
-------------------------------------------------

When a train is successfully fetched:

Render a TrainDetailsCard component that shows:

- Train Name
- Train Number
- Source
- Destination
- Running Days (styled badges)
- Stops table:
    - Station Code
    - Arrival
    - Departure

Ensure:
- Clean layout using existing design system
- Proper spacing
- Responsive design
- Professional card styling
- Empty states handled properly

-------------------------------------------------
PHASE 3: DATABASE IMPROVEMENTS
-------------------------------------------------

In backend:

1. Add MongoDB indexing:
   - trainNumber (unique, indexed)
   - trainName (text index)
   - compound index on source + destination

2. Ensure proper error handling in controller:
   - 404 if train not found
   - 500 on server errors

-------------------------------------------------
PHASE 4: SEED SCRIPT
-------------------------------------------------

Create:

server/src/scripts/seedTrains.ts

This script should:

- Read a sample JSON file of train data
- Insert multiple trains into MongoDB
- Avoid duplicate insertions
- Log success/failure clearly

Add npm script:
"seed": "ts-node src/scripts/seedTrains.ts"

-------------------------------------------------
UI REQUIREMENTS
-------------------------------------------------

- Use CSS variables already defined
- Maintain SaaS-grade professional appearance
- Implement loading animation properly
- Keep code clean and modular
- No inline styling hacks
- Follow existing folder structure strictly

-------------------------------------------------
GOAL
-------------------------------------------------

After implementation:

- Searching for a valid train number should display full train details.
- Invalid train number should show clean not-found UI.
- App should feel production-ready, not demo-level.