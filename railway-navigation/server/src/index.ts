import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import trainRoutes from './routes/trainRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app: Express = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// HTTP request logger middleware for node.js
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Mount routers
app.use('/api/trains', trainRoutes);

// Base route handler
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Railway Navigation API' });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const rootPath = path.resolve();
    app.use(express.static(path.join(rootPath, 'client/dist')));

    // Catch-all route to handle React Router routes
    app.get('/:path*', (req: Request, res: Response) => {
        // Don't intercept API routes
        if (!req.url.startsWith('/api')) {
            res.sendFile(path.join(rootPath, 'client/dist', 'index.html'));
        }
    });
}

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
