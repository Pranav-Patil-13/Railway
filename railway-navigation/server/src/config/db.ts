import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URL || process.env.DATABASE_URL || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MongoDB connection string must be defined in the .env file or environment variables (MONGO_URL, DATABASE_URL, MONGO_URI)');
        }

        const conn = await mongoose.connect(mongoURI, {
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Don't exit process, let it try to handle health checks
    }
};
