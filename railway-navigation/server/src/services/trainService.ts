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
        const apiKey = process.env.RAPID_API_KEY;

        if (!apiKey) {
            console.error('CRITICAL: RAPID_API_KEY is missing in environment variables.');
            throw new Error('RapidAPI Key is not configured. Please check your .env file.');
        }

        // Calculate startDay based on dateStr (YYYYMMDD) and today's date
        let startDay = 0;
        if (dateStr && dateStr.length === 8) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const inputDate = new Date(year, month, day);

            const today = new Date();
            const todayIST = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const todayMidnight = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());

            const diffTime = todayMidnight.getTime() - inputDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            startDay = diffDays > 0 ? diffDays : 0;
            if (startDay > 4) startDay = 4;
        }

        const options = {
            method: 'GET',
            url: 'https://irctc1.p.rapidapi.com/api/v1/liveTrainStatus',
            params: {
                trainNo: trainNumber,
                startDay: startDay.toString()
            },
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        const rawData = response.data?.data;

        // If data cannot be parsed reliably, return raw response or error structure
        if (!rawData) {
            return { error: 'Invalid response from train status API', body: null };
        }

        // If train is not running today, return early to let frontend handle it gracefully
        if (rawData.is_run_day === false) {
            return {
                error: null,
                body: {
                    train_status_message: rawData.new_message || rawData.title || 'Train is not running today.',
                    current_station: '',
                    time_of_availability: '',
                    stations: [],
                    terminated: false
                }
            };
        }

        // Combine previous and upcoming stations for complete timeline
        const previous = rawData.previous_stations || [];
        const upcoming = rawData.upcoming_stations || [];
        const allRawStations: any[] = [];

        for (const s of previous) {
            if (s.station_code) allRawStations.push(s);
        }
        for (const s of upcoming) {
            if (s.station_code) allRawStations.push(s);
        }

        // Map to legacy format expected by the frontend
        const mappedStations = allRawStations.map((s: any) => ({
            stationName: s.station_name,
            stationCode: s.station_code,
            distance: s.distance_from_source || 0,
            dayCount: (s.a_day !== undefined && s.a_day !== null) ? s.a_day : (s.day || 1),
            arrivalTime: s.sta || '--',
            departureTime: s.std || '--',
            actual_arrival_time: s.eta || '--',
            actual_departure_time: s.etd || '--'
        }));

        let train_status_message = rawData.new_message || rawData.title || 'Train status available';
        if (rawData.current_location_info && rawData.current_location_info.length > 0) {
            train_status_message = rawData.current_location_info[0].message || train_status_message;
        }

        // Create matching body payload
        const transform = {
            error: null,
            body: {
                train_status_message: train_status_message,
                current_station: rawData.current_station_code || rawData.next_station_code || '',
                time_of_availability: rawData.update_time || rawData.status_as_of || 'Updated recently',
                stations: mappedStations,
                terminated: rawData.at_dstn || false
            }
        };

        return transform;
    } catch (error: any) {
        if (error.response) {
            console.error('RapidAPI Error Response:', {
                status: error.response.status,
                data: error.response.data
            });

            if (error.response.status === 401 || error.response.status === 403) {
                console.error('RapidAPI Authentication Failed: The API key might be invalid or expired.');
            }
        } else if (error.request) {
            console.error('RapidAPI No Response:', error.request);
        } else {
            console.error('RapidAPI Setup Error:', error.message);
        }

        throw error;
    }
};
