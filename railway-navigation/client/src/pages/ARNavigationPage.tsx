import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/ar/QRScanner';
import DestinationSelector from '../components/ar/DestinationSelector';
import ARSessionManager from '../components/ar/ARSessionManager';
import { getStationByCode } from '../services/stationService';
import type { Coordinate } from '../types';
import { MapPin, ArrowLeft, ScanLine } from 'lucide-react';

// Flow states: scan → select → navigate
type FlowState = 'scanning' | 'selecting' | 'navigating';

const ARNavigationPage: React.FC = () => {
    const navigate = useNavigate();

    const [flowState, setFlowState] = useState<FlowState>('scanning');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Station data after QR scan
    const [stationName, setStationName] = useState<string>('');
    const [allLocations, setAllLocations] = useState<Record<string, Coordinate>>({});
    const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);

    // Selected destination
    const [targetLocation, setTargetLocation] = useState<Coordinate | null>(null);
    const [targetLabel, setTargetLabel] = useState<string>('');

    // Step 1: QR code scanned → fetch station data, store current position, move to selection
    const handleQRScan = React.useCallback(async (data: { station_id: string; location_id: string }) => {
        setLoading(true);
        setError('');

        try {
            const station = await getStationByCode(data.station_id);

            if (!station) {
                setError('Station not found. Invalid QR code.');
                setLoading(false);
                return;
            }

            if (!station.locations || !station.locations[data.location_id]) {
                setError(`Location '${data.location_id}' is not mapped at this station.`);
                setLoading(false);
                return;
            }

            // Save station data and current position
            setStationName(station.name);
            setAllLocations(station.locations);
            setCurrentLocation(station.locations[data.location_id]);

            // Advance to destination selection
            setFlowState('selecting');
        } catch (err) {
            console.error('Failed to handle QR scan', err);
            setError('An error occurred while fetching station data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleScannerError = React.useCallback((err: string) => {
        setError(err);
    }, []);

    // Step 2: User selects destination → start AR navigation
    const handleDestinationSelect = (key: string, label: string, coord: Coordinate) => {
        setTargetLabel(label);
        setTargetLocation(coord);
        setFlowState('navigating');
    };

    // Reset back to a previous step
    const goBack = () => {
        if (flowState === 'navigating') {
            setTargetLocation(null);
            setTargetLabel('');
            setFlowState('selecting');
        } else if (flowState === 'selecting') {
            setCurrentLocation(null);
            setAllLocations({});
            setStationName('');
            setFlowState('scanning');
        } else {
            navigate(-1);
        }
    };

    // ─── STEP 3: AR NAVIGATION ──────────────────────────
    if (flowState === 'navigating' && currentLocation && targetLocation) {
        return (
            <div className="w-full h-screen overflow-hidden relative">
                <button
                    onClick={goBack}
                    className="absolute z-50 top-6 left-6 bg-black/40 hover:bg-black/60 backdrop-blur-md p-2 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 shrink-0 text-white" />
                </button>
                <ARSessionManager
                    currentLocation={currentLocation}
                    targetLocation={targetLocation}
                    targetLabel={targetLabel}
                />
            </div>
        );
    }

    // ─── STEP 2: DESTINATION SELECTION ──────────────────
    if (flowState === 'selecting' && currentLocation) {
        return (
            <div className="min-h-screen bg-slate-50">
                {/* Back button */}
                <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                    <button onClick={goBack} className="p-2 text-slate-500 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-700">Select Destination</span>
                </div>
                <DestinationSelector
                    stationName={stationName}
                    locations={allLocations}
                    onSelect={handleDestinationSelect}
                />
            </div>
        );
    }

    // ─── STEP 1: QR SCANNER ─────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 selection:bg-indigo-100">
            {/* Header */}
            <div className="w-full max-w-md flex items-center mb-8 relative">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute -left-2 top-0 p-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 shrink-0" />
                </button>
                <div className="mx-auto text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 inline-flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                        Indoor Navigation
                    </h1>
                </div>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-2">
                        <ScanLine className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">Scan QR to Start</h2>
                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                        Find an official Railway Navigation QR code on the platform and scan it to set your current position.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200 border-dashed">
                        <div className="text-center space-y-3">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-slate-400">Fetching station data...</p>
                        </div>
                    </div>
                ) : (
                    <QRScanner onScan={handleQRScan} onError={handleScannerError} />
                )}
            </div>
        </div>
    );
};

export default ARNavigationPage;
