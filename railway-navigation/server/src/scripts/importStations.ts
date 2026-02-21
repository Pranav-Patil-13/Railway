import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Station } from '../models/Station';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function importStations() {
    const jsonPath = path.resolve(__dirname, './data/stations.json');

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🏛️  Station Import Tool                      ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ stations.json not found at: ${jsonPath}`);
        console.log('   Run the Python extraction script first.');
        process.exit(1);
    }

    const stations = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📦 Loaded ${stations.length} stations from JSON.\n`);

    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.error('❌ MONGO_URI must be defined in the .env file');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected.\n');

    console.log('⚙️  Preparing bulk operations...');
    const operations = stations.map((s: { code: string; name: string }) => ({
        updateOne: {
            filter: { code: s.code },
            update: { $set: { code: s.code, name: s.name } },
            upsert: true,
        }
    }));

    console.log(`🚀 Executing bulkWrite with ${operations.length} operations...\n`);

    try {
        const result = await Station.bulkWrite(operations, { ordered: false });

        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║     📊  Import Results                          ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  ✅ Inserted:  ${String(result.upsertedCount).padStart(5)}                            ║`);
        console.log(`║  🔄 Updated:   ${String(result.modifiedCount).padStart(5)}                            ║`);
        console.log(`║  📦 Total:     ${String(operations.length).padStart(5)}                            ║`);
        console.log('╚══════════════════════════════════════════════════╝');
    } catch (err: any) {
        console.error('❌ BulkWrite failed:', err.message);
    }

    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected.');
}

importStations();
