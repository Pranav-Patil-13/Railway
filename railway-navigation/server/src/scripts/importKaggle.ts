import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Train } from '../models/Train';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface KaggleTrainRow {
    train_name: string;
    train_number: string;
    source: string;
    destination: string;
}

interface KaggleScheduleRow {
    arrival: string;
    departure: string;
    station_code: string;
    train_number: string;
    day: string;
}

async function importKaggle() {
    const trainsPath = path.resolve(__dirname, './data/kaggle/trains.csv');
    const schedulePath = path.resolve(__dirname, './data/kaggle/Trains schedule.csv');

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🚂  Kaggle Dataset Import Tool               ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    if (!fs.existsSync(trainsPath) || !fs.existsSync(schedulePath)) {
        console.error('❌ Kaggle CSV files not found. Run download_kaggle_data.py first.');
        process.exit(1);
    }

    // 1. Parse Schedule first (group by train number)
    console.log('📄 Parsing Schedule CSV (this may take a moment)...');
    const scheduleContent = fs.readFileSync(schedulePath, 'utf-8');
    const scheduleRows: any[] = parse(scheduleContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    console.log(`📦 Loaded ${scheduleRows.length} schedule entries.`);

    const scheduleMap = new Map<string, any[]>();
    for (const row of scheduleRows) {
        // Handle train number potential variations (remove quotes, trim)
        const tNum = String(row.train_number).padStart(5, '0');
        if (!scheduleMap.has(tNum)) {
            scheduleMap.set(tNum, []);
        }
        scheduleMap.get(tNum)?.push({
            stationCode: row.station_code,
            arrival: row.arrival || '--',
            departure: row.departure || '--',
            day: parseInt(row.day) || 1
        });
    }

    // Sort stops by day then (ideally by arrival time, but we don't have arrival time decimals here)
    // For now we assume they are in order in the CSV or by day.
    for (const [tNum, stops] of scheduleMap.entries()) {
        stops.sort((a, b) => a.day - b.day);
    }

    // 2. Parse Trains file
    console.log('📄 Parsing Trains CSV...');
    const trainsContent = fs.readFileSync(trainsPath, 'utf-8');
    const trainRows: any[] = parse(trainsContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    console.log(`📦 Loaded ${trainRows.length} trains.`);

    // 3. Connect to MongoDB
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.error('❌ MONGO_URI missing');
        process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected.\n');

    // 4. Prepare Operations
    console.log('⚙️  Preparing bulk operations...');
    const operations = [];
    let processed = 0;

    for (const row of trainRows) {
        const tNum = String(row.train_number).padStart(5, '0');
        const stops = scheduleMap.get(tNum);

        if (!stops || stops.length < 2) continue;

        operations.push({
            updateOne: {
                filter: { trainNumber: tNum },
                update: {
                    $set: {
                        trainNumber: tNum,
                        trainName: row.train_name,
                        source: row.source,
                        destination: row.destination,
                        runningDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Default to all days since Kaggle doesn't have it
                        stops: stops.map(s => ({
                            stationCode: s.stationCode,
                            arrival: s.arrival,
                            departure: s.departure
                        }))
                    }
                },
                upsert: true
            }
        });
        processed++;

        // Batch execute every 1000 records to avoid memory/buffer issues
        if (operations.length >= 1000) {
            console.log(`🚀 Executing batch import (${processed} trains)...`);
            await Train.bulkWrite(operations, { ordered: false });
            operations.length = 0;
        }
    }

    // Final batch
    if (operations.length > 0) {
        console.log(`🚀 Executing final batch (${processed} trains)...`);
        await Train.bulkWrite(operations, { ordered: false });
    }

    console.log(`\n🎉 Import complete! Total trains processed: ${processed}`);
    await mongoose.disconnect();
}

importKaggle();
