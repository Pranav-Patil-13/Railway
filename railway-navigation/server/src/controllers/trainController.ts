import { Request, Response, NextFunction } from 'express';
import { Train } from '../models/Train';
import { AppError } from '../utils/AppError';
import { resolveStationCodes as resolveStationCodesFromService, getLiveTrainStatus as fetchLiveTrainStatus } from '../services/trainService';


export const getTrains = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search && typeof search === 'string') {
            // Use text search if text index matches, or regex for train number
            query = {
                $or: [
                    { trainNumber: { $regex: search, $options: 'i' } },
                    { trainName: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const trains = await Train.find(query).limit(50);

        res.status(200).json({
            success: true,
            count: trains.length,
            data: trains
        });
    } catch (error) {
        next(error);
    }
};

// ─── Route Search ────────────────────────────────────────────────────
// Finds trains where BOTH from and to stations appear in the stops
// array, with the "from" stop appearing BEFORE the "to" stop.
// Matches against: station codes in stops[], source field, destination field.

export const searchRoutes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { from, to } = req.query;

        if (!from && !to) {
            return next(new AppError('At least one of "from" or "to" query parameters is required.', 400));
        }

        const fromInput = (from as string || '').trim();
        const toInput = (to as string || '').trim();

        // Step 0: Resolve station names to station codes using the Station collection.
        // User may type "Chalisgaon" or "CSN" — we need to handle both.
        const resolveStationCodes = async (input: string): Promise<string[]> => {
            return await resolveStationCodesFromService(input);
        };

        const fromCodes = await resolveStationCodes(fromInput);
        const toCodes = await resolveStationCodes(toInput);

        // Step 1: Build a MongoDB query that finds trains containing
        // any of the resolved station codes in their stops.
        const conditions: any[] = [];

        if (fromInput) {
            conditions.push({
                $or: [
                    { 'stops.stationCode': { $in: fromCodes } },
                    { source: { $regex: fromInput, $options: 'i' } },
                ]
            });
        }

        if (toInput) {
            conditions.push({
                $or: [
                    { 'stops.stationCode': { $in: toCodes } },
                    { destination: { $regex: toInput, $options: 'i' } },
                ]
            });
        }

        const query = conditions.length > 1 ? { $and: conditions } : conditions[0];
        const trains = await Train.find(query).limit(100).lean();

        // Helper to check if a station code matches any of the resolved codes
        const matchesCodes = (stationCode: string, codes: string[]): boolean => {
            return codes.some(c => stationCode.toUpperCase() === c.toUpperCase());
        };

        // Step 2: Post-filter to ensure "from" appears BEFORE "to" in the route
        const results = trains.filter((train) => {
            const stops = train.stops;

            let fromIndex = -1;
            if (fromInput) {
                fromIndex = stops.findIndex((s: any) => matchesCodes(s.stationCode, fromCodes));
                if (fromIndex === -1 && train.source.toUpperCase().includes(fromInput.toUpperCase())) {
                    fromIndex = 0;
                }
                if (fromIndex === -1) return false;
            }

            let toIndex = -1;
            if (toInput) {
                const searchStart = fromInput ? fromIndex + 1 : 0;
                for (let i = searchStart; i < stops.length; i++) {
                    if (matchesCodes(stops[i].stationCode, toCodes)) {
                        toIndex = i;
                        break;
                    }
                }
                if (toIndex === -1 && train.destination.toUpperCase().includes(toInput.toUpperCase())) {
                    toIndex = stops.length - 1;
                    if (fromInput && toIndex <= fromIndex) return false;
                }
                if (toIndex === -1) return false;
            }

            if (fromInput && toInput) {
                return fromIndex < toIndex;
            }
            return true;
        });

        // Step 3: Enrich results with matched stop info
        const enrichedResults = results.map((train) => {
            const stops = train.stops;
            let fromStopIndex = -1;
            let toStopIndex = -1;

            if (fromInput) {
                fromStopIndex = stops.findIndex((s: any) => matchesCodes(s.stationCode, fromCodes));
                if (fromStopIndex === -1 && train.source.toUpperCase().includes(fromInput.toUpperCase())) {
                    fromStopIndex = 0;
                }
            }

            if (toInput) {
                const searchStart = fromStopIndex >= 0 ? fromStopIndex + 1 : 0;
                for (let i = searchStart; i < stops.length; i++) {
                    if (matchesCodes(stops[i].stationCode, toCodes)) {
                        toStopIndex = i;
                        break;
                    }
                }
                if (toStopIndex === -1 && train.destination.toUpperCase().includes(toInput.toUpperCase())) {
                    toStopIndex = stops.length - 1;
                }
            }

            return {
                ...train,
                matchedRoute: {
                    fromStopIndex,
                    toStopIndex,
                    fromStation: fromStopIndex >= 0 ? stops[fromStopIndex].stationCode : null,
                    toStation: toStopIndex >= 0 ? stops[toStopIndex].stationCode : null,
                    stopsInBetween: (fromStopIndex >= 0 && toStopIndex >= 0)
                        ? toStopIndex - fromStopIndex - 1
                        : null,
                }
            };
        });

        res.status(200).json({
            success: true,
            count: enrichedResults.length,
            query: {
                from: fromInput || null,
                to: toInput || null,
                resolvedFromCodes: fromInput ? fromCodes : [],
                resolvedToCodes: toInput ? toCodes : [],
            },
            data: enrichedResults,
        });
    } catch (error) {
        next(error);
    }
};

export const getTrainByNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trainNumber = req.params.trainNumber;
        const train = await Train.findOne({ trainNumber });

        if (!train) {
            return next(new AppError(`Train not found with number of ${trainNumber}`, 404));
        }

        res.status(200).json({
            success: true,
            data: train
        });
    } catch (error) {
        next(error);
    }
};

export const getLiveStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trainNumber = String(req.params.trainNumber);
        let { date } = req.query; // Expecting YYYYMMDD

        if (!date) {
            // Default to today if no date provided
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            date = `${yyyy}${mm}${dd}`;
        }

        const dateStr = Array.isArray(date) ? String(date[0]) : String(date);
        const liveData = await fetchLiveTrainStatus(trainNumber, dateStr as string);

        // The API returns its own status, wrap it or return directly
        // Some RapidAPI return errors gracefully in JSON, so we forward it
        res.status(200).json({
            success: true,
            data: liveData
        });
    } catch (error) {
        next(new AppError('Failed to fetch live train status, ensure the RapidAPI Key is valid and subscribed.', 500));
    }
};
