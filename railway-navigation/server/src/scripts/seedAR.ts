import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Station } from '../models/Station';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/railway-navigation';

const seedAR = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const stationCode = 'NASHIK01';
        const stationName = 'Nashik Road (Test AR)';

        const locationsMap = new Map();
        locationsMap.set('platform_start', { x: 0, z: 0 });
        locationsMap.set('platform_mid', { x: 10, z: 0 });
        locationsMap.set('coach_B2', { x: 25, z: 15 });

        // Upsert the station
        await Station.findOneAndUpdate(
            { code: stationCode },
            {
                code: stationCode,
                name: stationName,
                locations: locationsMap
            },
            { upsert: true, new: true }
        );

        console.log(`Successfully seeded AR locations for station ${stationCode}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding AR data:', error);
        process.exit(1);
    }
};

seedAR();
