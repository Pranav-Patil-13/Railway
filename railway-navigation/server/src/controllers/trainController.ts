import { Request, Response, NextFunction } from 'express';
import { Train } from '../models/Train';
import { AppError } from '../utils/AppError';

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

        const trains = await Train.find(query).limit(50); // limit to 50 for performance

        res.status(200).json({
            success: true,
            count: trains.length,
            data: trains
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
