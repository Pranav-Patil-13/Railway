import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }

    const response: any = {
        success: false,
        message,
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    // Fallback logging for unexpected errors in production
    if (process.env.NODE_ENV !== 'development' && statusCode === 500) {
        console.error('ERROR 💥:', err);
    }

    res.status(statusCode).json(response);
};
