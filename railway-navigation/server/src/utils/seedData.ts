import fs from 'fs';
import path from 'path';
import { Station } from '../models/Station';
import { Train } from '../models/Train';

export const seedStationsIfEmpty = async () => {
    try {
        const count = await Station.countDocuments();
        if (count > 0) {
            console.log(`✅ Stations already seeded (${count} stations)`);
            return;
        }

        console.log('🌱 Database is empty. Seeding stations...');

        // Try multiple possible paths to accommodate dev (ts-node) and prod (dist)
        const possiblePaths = [
            path.resolve(process.cwd(), 'src/scripts/data/stations.json'),
            path.resolve(process.cwd(), 'server/src/scripts/data/stations.json'),
            path.resolve(process.cwd(), 'dist/scripts/data/stations.json'), // Just in case it was copied
            path.resolve(__dirname, '../scripts/data/stations.json'),
        ];

        let jsonPath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                jsonPath = p;
                break;
            }
        }

        if (!jsonPath) {
            console.warn('⚠️ stations.json not found. Skipping auto-seed.');
            return;
        }

        const stations = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`📦 Loading ${stations.length} stations from ${jsonPath}...`);

        const operations = stations.map((s: { code: string; name: string }) => ({
            updateOne: {
                filter: { code: s.code },
                update: { $set: { code: s.code, name: s.name } },
                upsert: true,
            }
        }));

        await Station.bulkWrite(operations, { ordered: false });
        console.log('✅ Successfully seeded stations to database.');
    } catch (error) {
        console.error('❌ Error seeding stations:', error);
    }
};
