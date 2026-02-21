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
        const params = searchQuery ? { search: searchQuery } : {};
        const { data } = await api.get('/trains', { params });
        return data;
    },

    getByNumber: async (trainNumber: string) => {
        const { data } = await api.get(`/trains/${trainNumber}`);
        return data;
    }
};
