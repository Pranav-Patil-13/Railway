# Railway Navigation Web Application

A modern, SaaS-style full-stack application for railway navigation, offering train searching, route visualization, and real-time scheduling tracking (prepared for WebSocket integration).

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide Icons, React Router.
- **Backend**: Node.js, Express, TypeScript, Mongoose (MongoDB).
- **Tooling**: Concurrently, Nodemon, ESLint.

## Architecture Highlights
- **Premium Design System**: Centralized CSS variables for custom colors, spacing, and SaaS-grade UI states.
- **Scalable Folder Structure**: Separation of concerns (`src/controllers`, `src/services`, `src/components`).
- **Resilient API Handling**: Centralized Error handlers on the backend, graceful state components (loading, error, empty) on the frontend.
- **Deployment Ready**: Modular environments and ready-script mappings meant for Render, Railway, or VPS.
- **Optimized Data Retrieval**: MongoDB text indexes and compound indexes for rapid query performance.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or an Atlas connection URI

### Installation

1. Clone the repository and install all dependencies:
   ```bash
   npm run install:all
   ```

2. Environment setup:
   - Create `.env` in the `server` folder based on `server/.env.example`
   - Create `.env` in the `client` folder based on `client/.env.example`

### Running the Application

To run both the React client and Express server concurrently in development mode:
```bash
npm run dev
```

The frontend will start at `http://localhost:5173`
The backend will start at `http://localhost:5000`

### Building for Production
```bash
npm run build
npm start
```
