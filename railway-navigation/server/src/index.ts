import express, { Express, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import trainRoutes from './routes/trainRoutes';
import stationRoutes from './routes/stationRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

console.log('--- Environment Check ---');
console.log('Current Workdir:', process.cwd());
console.log('__dirname:', __dirname);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('------------------------');

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
app.use('/api/stations', stationRoutes);

// API Home/Status
app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Railway Navigation API' });
});

// Centralized error handler (must be after routes)
app.use(errorHandler);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    // Navigate from server/dist to project root then to client/dist
    const distPath = path.resolve(__dirname, '..', '..', 'client', 'dist');

    console.log('Attempting to serve static files from:', distPath);

    app.use(express.static(distPath));

    app.use((req: Request, res: Response) => {
        if (!req.url.startsWith('/api')) {
            const indexPath = path.join(distPath, 'index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error('Failed to send index.html. Path tried:', indexPath);
                    res.status(500).send('Frontend build missing. Please check build logs.');
                }
            });
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
}

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
