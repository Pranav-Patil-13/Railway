import mongoose, { Schema, Document } from 'mongoose';

export interface IStation extends Document {
    code: string;
    name: string;
    locations?: Record<string, { x: number; z: number }>;
}

const StationSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true },
    locations: {
        type: Map,
        of: new Schema({
            x: { type: Number, required: true },
            z: { type: Number, required: true }
        }, { _id: false })
    }
}, { timestamps: true });

// Text index on station name for fuzzy search
StationSchema.index({ name: 'text' });

// Regular index on name for regex queries
StationSchema.index({ name: 1 });

export const Station = mongoose.model<IStation>('Station', StationSchema);
