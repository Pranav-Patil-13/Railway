import { api } from './api';
import type { Station } from '../types/Station';

export const getStationByCode = async (code: string): Promise<Station | null> => {
    try {
        const response = await api.get(`/stations/${code}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching station by code:', error);
        return null;
    }
};
