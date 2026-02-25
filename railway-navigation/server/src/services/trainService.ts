import { Train } from '../models/Train';
import { Station } from '../models/Station';
import axios from 'axios';

export const resolveStationCodes = async (input: string): Promise<string[]> => {
    if (!input) return [];

    // 1. Check for code in brackets (e.g. "Nashik Road (NK)")
    const bracketMatch = input.match(/\(([^)]+)\)/);
    if (bracketMatch) {
        const codeInside = bracketMatch[1].toUpperCase().trim();
        const station = await Station.findOne({ code: codeInside }).lean();
        if (station) return [station.code];
        return [codeInside];
    }

    // 2. Exact code match
    const exactCode = await Station.findOne({ code: input.toUpperCase().trim() }).lean();
    if (exactCode) return [exactCode.code];

    // 3. Name match
    let byName = await Station.find({
        name: { $regex: input.trim(), $options: 'i' }
    }).select('code').limit(20).lean();

    // 4. Special case for Nashik/Nasik if no results
    if (byName.length === 0 && input.toLowerCase().includes('nashik')) {
        byName = await Station.find({
            name: { $regex: input.toLowerCase().replace('nashik', 'nasik').trim(), $options: 'i' }
        }).select('code').limit(20).lean();
    }

    if (byName.length > 0) return byName.map((s: any) => s.code);

    return [input.toUpperCase().trim()];
};

export const searchTrainsByRoute = async (fromInput?: string, toInput?: string) => {
    const fromCodes = fromInput ? await resolveStationCodes(fromInput) : [];
    const toCodes = toInput ? await resolveStationCodes(toInput) : [];

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
    if (!query) return [];

    const trains = await Train.find(query).limit(10).lean();

    const matchesCodes = (stationCode: string, codes: string[]): boolean => {
        return codes.some(c => stationCode.toUpperCase() === c.toUpperCase());
    };

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

    return results;
};

export const getLiveTrainStatus = async (trainNumber: string, dateStr: string) => {
    try {
        const options = {
            method: 'GET',
            url: 'https://indian-railway-irctc.p.rapidapi.com/api/trains/v1/train/status',
            params: {
                departure_date: dateStr, // Format: YYYYMMDD
                isH5: 'true',
                client: 'web',
                train_number: trainNumber
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPID_API_KEY,
                'X-RapidAPI-Host': 'indian-railway-irctc.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('Error fetching live train status from RapidAPI:', error);
        throw error;
    }
};
