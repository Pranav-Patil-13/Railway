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

// API Home/Status
app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Railway Navigation API' });
});

// Centralized error handler (must be after routes)
app.use(errorHandler);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const rootPath = path.resolve();
    // If we're started from the server directory, the client is one level up
    const distPath = path.basename(rootPath) === 'server'
        ? path.join(rootPath, '..', 'client/dist')
        : path.join(rootPath, 'client/dist');

    app.use(express.static(distPath));

    // Final catch-all for SPA routes (replaces app.get('*'))
    app.use((req: Request, res: Response) => {
        // Only serve index.html for non-API requests
        if (!req.url.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
