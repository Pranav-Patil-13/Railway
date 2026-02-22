import { Request, Response, NextFunction } from 'express';
import { Station } from '../models/Station';

// GET /api/stations/search?q=cha
// Returns stations matching the query (by name or code), limited to 10 results.
// Optimised for autocomplete — fast, lightweight responses.

export const searchStations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.trim().length < 1) {
            return res.status(200).json({ success: true, data: [] });
        }

        const query = q.trim();

        // Use regex for partial matching on both name and code
        // This gives us "starts with" and "contains" behavior
        const stations = await Station.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { code: { $regex: `^${query}`, $options: 'i' } },
            ]
        })
            .select('code name')
            .limit(10)
            .lean();

        // Sort results: exact code matches first, then starts-with name, then contains
        const upperQuery = query.toUpperCase();
        stations.sort((a, b) => {
            const aCodeExact = a.code.toUpperCase() === upperQuery ? 0 : 1;
            const bCodeExact = b.code.toUpperCase() === upperQuery ? 0 : 1;
            if (aCodeExact !== bCodeExact) return aCodeExact - bCodeExact;

            const aNameStarts = a.name.toUpperCase().startsWith(upperQuery) ? 0 : 1;
            const bNameStarts = b.name.toUpperCase().startsWith(upperQuery) ? 0 : 1;
            if (aNameStarts !== bNameStarts) return aNameStarts - bNameStarts;

            return a.name.localeCompare(b.name);
        });

        res.status(200).json({
            success: true,
            count: stations.length,
            data: stations,
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/stations/:code
// Returns a specific station by its code, including coordinate locations if available
export const getStationByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid station code' });
        }

        const station = await Station.findOne({ code: code.toUpperCase() }).lean();

        if (!station) {
            return res.status(404).json({ success: false, message: 'Station not found' });
        }

        res.status(200).json({
            success: true,
            data: station,
        });
    } catch (error) {
        next(error);
    }
};
