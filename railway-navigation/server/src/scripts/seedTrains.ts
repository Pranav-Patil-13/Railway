import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Train } from '../models/Train';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedTrains = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI must be defined in the .env file');
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected.');

        // Read sample data
        const dataPath = path.resolve(__dirname, './data/sampleTrains.json');
        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const trains = JSON.parse(rawData);

        console.log(`📦 Found ${trains.length} trains to seed.\n`);

        let inserted = 0;
        let skipped = 0;

        for (const trainData of trains) {
            try {
                await Train.create(trainData);
                console.log(`  ✅ Inserted: ${trainData.trainNumber} — ${trainData.trainName}`);
                inserted++;
            } catch (err: any) {
                if (err.code === 11000) {
                    // Duplicate key — train already exists
                    console.log(`  ⏭️  Skipped (duplicate): ${trainData.trainNumber} — ${trainData.trainName}`);
                    skipped++;
                } else {
                    console.error(`  ❌ Failed: ${trainData.trainNumber} — ${err.message}`);
                }
            }
        }

        console.log(`\n🎉 Seeding complete! Inserted: ${inserted}, Skipped: ${skipped}`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB disconnected.');
    }
};

seedTrains();
