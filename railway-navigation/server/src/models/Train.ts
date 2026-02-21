import mongoose, { Schema, Document } from 'mongoose';

export interface ITrainStop {
    stationCode: string;
    arrival: string;
    departure: string;
}

export interface ITrain extends Document {
    trainNumber: string;
    trainName: string;
    source: string;
    destination: string;
    runningDays: string[];
    stops: ITrainStop[];
}

const TrainStopSchema: Schema = new Schema({
    stationCode: { type: String, required: true },
    arrival: { type: String, required: true },
    departure: { type: String, required: true },
}, { _id: false });

const TrainSchema: Schema = new Schema({
    trainNumber: { type: String, required: true, unique: true, index: true },
    trainName: { type: String, required: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    runningDays: { type: [String], required: true },
    stops: { type: [TrainStopSchema], required: true },
}, { timestamps: true });

// Text index on trainName
TrainSchema.index({ trainName: 'text' });

// Compound index on source + destination
TrainSchema.index({ source: 1, destination: 1 });

// Index on stops.stationCode for route-based lookups
TrainSchema.index({ 'stops.stationCode': 1 });

export const Train = mongoose.model<ITrain>('Train', TrainSchema);
