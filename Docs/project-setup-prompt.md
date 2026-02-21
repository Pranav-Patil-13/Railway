You are building a production-ready Railway Navigation Web Application.

Tech Stack:
- Frontend: React (Vite) + TypeScript + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB (Mongoose)
- Environment config using dotenv
- REST API architecture
- Prepared for future WebSocket integration

Project Name: railway-navigation

Create full folder structure and boilerplate for both frontend and backend.

-------------------------------------------------
PROJECT STRUCTURE
-------------------------------------------------

railway-navigation/
│
├── client/ (React frontend)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/ (API calls)
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   └── vite.config.ts
│
├── server/ (Express backend)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   ├── models/
│   │   │   └── Train.ts
│   │   ├── routes/
│   │   │   └── trainRoutes.ts
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
│
└── README.md

-------------------------------------------------
BACKEND REQUIREMENTS
-------------------------------------------------

1. Setup Express server with:
   - CORS
   - JSON middleware
   - Error handling middleware

2. MongoDB connection using Mongoose.

3. Create Train model with fields:
   - trainNumber (string, indexed)
   - trainName (string)
   - source (string)
   - destination (string)
   - runningDays (string[])
   - stops (array of objects with stationCode, arrival, departure)

4. Create API endpoints:
   GET /api/trains
   GET /api/trains/:trainNumber

5. Proper TypeScript types.

-------------------------------------------------
FRONTEND REQUIREMENTS
-------------------------------------------------

1. Basic layout with:
   - Navbar
   - Home page
   - Train search page

2. API service file using Axios.

3. Basic search form to fetch trains by number.

4. Clean Tailwind layout.

-------------------------------------------------
CONFIGURATION
-------------------------------------------------

- Setup scripts for:
  - dev
  - build
  - start
- Add nodemon for backend dev
- Add concurrently to run client + server together

-------------------------------------------------
IMPORTANT
-------------------------------------------------

- Use clean scalable architecture.
- Do not skip any configuration file.
- Include installation instructions in README.
- Keep code minimal but production structured.
- Prepare for future features like:
  - Live train tracking
  - WebSocket integration
  - Caching (Redis)

Generate full boilerplate with proper file contents.