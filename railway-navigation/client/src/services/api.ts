import axios from 'axios';

// Get base URL from env OR fallback for local dev
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const TrainService = {
    getAll: async (searchQuery?: string) => {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;

        const { data } = await api.get('/trains', { params });
        return data;
    },

    searchRoutes: async (from?: string, to?: string) => {
        const params: any = {};
        if (from) params.from = from;
        if (to) params.to = to;

        const { data } = await api.get('/trains/routes', { params });
        return data;
    },

    getByNumber: async (trainNumber: string) => {
        const { data } = await api.get(`/trains/${trainNumber}`);
        return data;
    },

    getLiveStatus: async (trainNumber: string, date?: string) => {
        const params: any = {};
        if (date) params.date = date;
        const { data } = await api.get(`/trains/${trainNumber}/live`, { params });
        return data;
    },

    getReservationChart: async (trainNumber: string, date: string) => {
        const { data } = await api.get(`/trains/${trainNumber}/charts`, { params: { date } });
        return data;
    }
};

export const StationService = {
    search: async (query: string) => {
        const { data } = await api.get('/stations/search', { params: { q: query } });
        return data;
    }
};
