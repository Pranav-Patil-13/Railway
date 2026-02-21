import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Train } from '../models/Train';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Types ───────────────────────────────────────────────────────────
interface CsvRow {
    trainNumber: string;
    trainName: string;
    source: string;
    destination: string;
    runningDays: string;
    stops: string;
}

interface ParsedStop {
    stationCode: string;
    arrival: string;
    departure: string;
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// ─── CSV Format Docs ─────────────────────────────────────────────────
//
//  CSV columns: trainNumber, trainName, source, destination, runningDays, stops
//
//  runningDays  →  comma-separated:  "Mon,Tue,Wed,Thu,Fri,Sat,Sun"
//  stops        →  pipe-separated entries, each colon-separated:
//                   "STATION:ARRIVAL:DEPARTURE|STATION:ARRIVAL:DEPARTURE|..."
//                   Use "--" for no arrival (source) or no departure (destination).
//
// ─────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: (keyof CsvRow)[] = [
    'trainNumber', 'trainName', 'source', 'destination', 'runningDays', 'stops'
];

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ─────────────────────────────────────────────────────────

function parseStops(stopsStr: string): ParsedStop[] {
    return stopsStr.split('|').map((entry) => {
        const parts = entry.trim().split(':');
        // Handle time values like "16:35" which split into two parts
        // Format: STATION:ARRIVAL:DEPARTURE  (times are HH:MM or --)
        // So "MMCT:--:16:35" splits into ["MMCT", "--", "16", "35"]
        // And "BRC:20:55:21:00" splits into ["BRC", "20", "55", "21", "00"]
        const stationCode = parts[0];

        let arrival: string;
        let departure: string;

        if (parts[1] === '--') {
            arrival = '--';
            // departure is parts[2]:parts[3]
            departure = parts.length >= 4 ? `${parts[2]}:${parts[3]}` : parts[2] || '--';
        } else if (parts.length === 5) {
            // "BRC:20:55:21:00" → arrival=20:55, departure=21:00
            arrival = `${parts[1]}:${parts[2]}`;
            departure = `${parts[3]}:${parts[4]}`;
        } else if (parts.length === 4 && parts[3] === '--') {
            // "NDLS:08:35:--" → arrival=08:35, departure=--
            arrival = `${parts[1]}:${parts[2]}`;
            departure = '--';
        } else {
            arrival = parts[1] || '--';
            departure = parts[2] || '--';
        }

        return { stationCode, arrival, departure };
    });
}

function validateRow(row: CsvRow, lineNum: number): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
        if (!row[field] || row[field].trim() === '') {
            errors.push(`Line ${lineNum}: Missing required field "${field}"`);
        }
    }

    if (errors.length > 0) return { valid: false, errors };

    // Validate running days
    const days = row.runningDays.split(',').map(d => d.trim());
    for (const day of days) {
        if (!VALID_DAYS.includes(day)) {
            errors.push(`Line ${lineNum}: Invalid running day "${day}" (train ${row.trainNumber})`);
        }
    }

    // Validate stops format
    const stopEntries = row.stops.split('|');
    if (stopEntries.length < 2) {
        errors.push(`Line ${lineNum}: Train ${row.trainNumber} must have at least 2 stops (source + destination)`);
    }

    for (const entry of stopEntries) {
        const parts = entry.trim().split(':');
        if (parts.length < 3) {
            errors.push(`Line ${lineNum}: Invalid stop format "${entry}" in train ${row.trainNumber}`);
        }
    }

    return { valid: errors.length === 0, errors };
}

// ─── Main Import Function ────────────────────────────────────────────

async function importTrains() {
    const csvPath = process.argv[2]
        || path.resolve(__dirname, './data/trains.csv');

    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🚂  Railway CSV Import Tool                 ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // ── 1. Read CSV file ─────────────────────────────────────────
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found: ${csvPath}`);
        process.exit(1);
    }
    console.log(`📄 Reading: ${csvPath}`);

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows: CsvRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
    });

    console.log(`📦 Parsed ${rows.length} rows from CSV.\n`);

    if (rows.length === 0) {
        console.log('⚠️  No data rows found in CSV. Exiting.');
        process.exit(0);
    }

    // ── 2. Validate all rows ─────────────────────────────────────
    console.log('🔍 Validating data...');
    const validRows: CsvRow[] = [];
    const allErrors: string[] = [];

    rows.forEach((row, index) => {
        const result = validateRow(row, index + 2); // +2 for 1-indexed + header row
        if (result.valid) {
            validRows.push(row);
        } else {
            allErrors.push(...result.errors);
        }
    });

    if (allErrors.length > 0) {
        console.log(`\n⚠️  Validation errors (${allErrors.length}):`);
        allErrors.forEach(err => console.log(`   ${err}`));
    }

    console.log(`✅ Valid rows: ${validRows.length} / ${rows.length}\n`);

    if (validRows.length === 0) {
        console.log('❌ No valid rows to import. Fix the CSV and retry.');
        process.exit(1);
    }

    // ── 3. Connect to MongoDB ────────────────────────────────────
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
        console.error('❌ MONGO_URI must be defined in the .env file');
        process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected.\n');

    // ── 4. Build bulkWrite operations ────────────────────────────
    console.log('⚙️  Preparing bulk operations...');
    const operations = validRows.map((row) => {
        const stops = parseStops(row.stops);
        const runningDays = row.runningDays.split(',').map(d => d.trim());

        return {
            updateOne: {
                filter: { trainNumber: row.trainNumber },
                update: {
                    $set: {
                        trainNumber: row.trainNumber.trim(),
                        trainName: row.trainName.trim(),
                        source: row.source.trim(),
                        destination: row.destination.trim(),
                        runningDays,
                        stops,
                    }
                },
                upsert: true,
            }
        };
    });

    // ── 5. Execute bulkWrite ─────────────────────────────────────
    console.log(`🚀 Executing bulkWrite with ${operations.length} operations...\n`);

    try {
        const result = await Train.bulkWrite(operations, { ordered: false });

        const inserted = result.upsertedCount;
        const updated = result.modifiedCount;
        const matched = result.matchedCount;

        console.log('╔══════════════════════════════════════════════════╗');
        console.log('║     📊  Import Results                          ║');
        console.log('╠══════════════════════════════════════════════════╣');
        console.log(`║  ✅ Inserted (new):     ${String(inserted).padStart(5)}                    ║`);
        console.log(`║  🔄 Updated (existing): ${String(updated).padStart(5)}                    ║`);
        console.log(`║  ⏭️  Matched (no change):${String(matched - updated).padStart(5)}                    ║`);
        console.log(`║  📦 Total processed:    ${String(operations.length).padStart(5)}                    ║`);
        console.log('╚══════════════════════════════════════════════════╝');
    } catch (err: any) {
        console.error('❌ BulkWrite failed:', err.message);
        if (err.writeErrors) {
            err.writeErrors.forEach((e: any) => {
                console.error(`   → ${e.errmsg}`);
            });
        }
    }

    // ── 6. Disconnect ────────────────────────────────────────────
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected.');
}

importTrains();
