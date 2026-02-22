import { Station } from '../models/Station';

export const seedARLocations = async () => {
    const stationCode = 'NASHIK01';

    // Check if already seeded (check for a facility key to detect new schema)
    const existing = await Station.findOne({ code: stationCode });
    if (existing && existing.get('locations.ticket_counter')) {
        console.log(`✅ AR locations for ${stationCode} already seeded (v2 with facilities).`);
        return;
    }

    const locationsMap = new Map();

    // Platform reference points
    locationsMap.set('platform_start', { x: 0, z: 0 });
    locationsMap.set('platform_mid', { x: 10, z: 0 });
    locationsMap.set('platform_end', { x: 50, z: 0 });

    // Coach locations (along the platform)
    locationsMap.set('coach_S1', { x: 5, z: 2 });
    locationsMap.set('coach_S2', { x: 10, z: 2 });
    locationsMap.set('coach_S3', { x: 15, z: 2 });
    locationsMap.set('coach_S4', { x: 20, z: 2 });
    locationsMap.set('coach_B1', { x: 25, z: 2 });
    locationsMap.set('coach_B2', { x: 30, z: 2 });
    locationsMap.set('coach_B3', { x: 35, z: 2 });
    locationsMap.set('coach_A1', { x: 40, z: 2 });
    locationsMap.set('coach_A2', { x: 45, z: 2 });

    // Station facility locations
    locationsMap.set('ticket_counter', { x: -5, z: 15 });
    locationsMap.set('main_gate', { x: -10, z: 25 });
    locationsMap.set('exit', { x: -8, z: 30 });
    locationsMap.set('waiting_room', { x: 5, z: 12 });
    locationsMap.set('washroom', { x: 15, z: 10 });
    locationsMap.set('food_stall', { x: 20, z: 12 });
    locationsMap.set('water_cooler', { x: 12, z: 8 });

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
        console.log(`🌱 Successfully seeded AR locations (v2) for station ${stationCode}`);
    } catch (error) {
        console.error('❌ Error seeding AR locations:', error);
    }
};
