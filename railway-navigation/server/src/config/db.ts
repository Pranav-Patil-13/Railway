import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGO_URI must be defined in the .env file');
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
