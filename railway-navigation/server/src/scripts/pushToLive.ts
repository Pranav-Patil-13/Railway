import mongoose from 'mongoose';
import { Train } from '../models/Train';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const main = async () => {
    const remoteURI = process.argv[2];
    if (!remoteURI || !remoteURI.startsWith('mongo')) {
        console.error("❌ Usage: npx tsx src/scripts/pushToLive.ts <RENDER_MONGO_URL>");
        console.error("Example: npx tsx src/scripts/pushToLive.ts mongodb+srv://username:password@cluster0.mongodb.net/railway-navigation");
        process.exit(1);
    }

    try {
        console.log("1️⃣  Connecting to Local DB to extract trains...");
        const localURI = process.env.MONGO_URI || "mongodb://localhost:27017/railway-navigation";
        await mongoose.connect(localURI);

        // Use lean() for faster read and less memory
        const allTrains = await Train.find({}).lean();
        console.log(`✅ Extracted ${allTrains.length} active trains from Mac.`);
        await mongoose.disconnect();

        if (allTrains.length === 0) {
            console.log("No trains found locally. Aborting.");
            process.exit(0);
        }

        // Clean Mongo objects
        const cleanedTrains = allTrains.map((t: any) => {
            delete t._id;
            delete t.__v;
            return t;
        });

        console.log("\n2️⃣  Connecting to Live Railway Cloud DB...");
        await mongoose.connect(remoteURI);
        console.log("✅ Connected securely to Railway!");

        console.log("\n3️⃣  Pushing trains to Cloud (this takes about 15 seconds)...");
        // Clear old ones just in case there are partials
        await Train.deleteMany({});

        // Insert in chunks to avoid overwhelming the network
        let total = 0;
        const CHUNK_SIZE = 500;

        for (let i = 0; i < cleanedTrains.length; i += CHUNK_SIZE) {
            const chunk = cleanedTrains.slice(i, i + CHUNK_SIZE);
            await Train.insertMany(chunk);
            total += chunk.length;
            console.log(`   🚀 Uploaded ${total} / ${cleanedTrains.length} ...`);
        }

        console.log("\n🎉 Database Transfer 100% Complete! Your live app now has all 5,000+ trains!");

    } catch (err: any) {
        console.error("\n❌ Error during transfer:");
        console.error(err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
}

main();
