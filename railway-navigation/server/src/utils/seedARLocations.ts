import { Station } from '../models/Station';

export const seedARLocations = async () => {
    const stationCode = 'NASHIK01';

    // Check if it already has locations to avoid unnecessary writes
    const existing = await Station.findOne({ code: stationCode });
    if (existing && existing.get('locations.platform_mid')) {
        console.log(`✅ AR locations for ${stationCode} already seeded.`);
        return;
    }

    const locationsMap = new Map();
    locationsMap.set('platform_start', { x: 0, z: 0 });
    locationsMap.set('platform_mid', { x: 10, z: 0 });
    locationsMap.set('coach_B2', { x: 25, z: 15 });

    try {
        await Station.findOneAndUpdate(
            { code: stationCode },
            {
                $set: {
                    code: stationCode,
                    name: 'Nashik Road (Test AR)',
                    locations: locationsMap
                }
            },
            { upsert: true, new: true, returnDocument: 'after' }
        );
        console.log(`🌱 Successfully seeded AR locations for station ${stationCode}`);
    } catch (error) {
        console.error('❌ Error seeding AR locations:', error);
    }
};
