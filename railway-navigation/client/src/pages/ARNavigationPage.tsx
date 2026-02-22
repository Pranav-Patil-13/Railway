import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRScanner from '../components/ar/QRScanner';
import ARSessionManager from '../components/ar/ARSessionManager';
import { getStationByCode } from '../services/stationService';
import type { Coordinate } from '../types';
import { Train, MapPin, ArrowLeft } from 'lucide-react';

const ARNavigationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // We expect the user to pass down a target coordinate identifier or exact coordinate via router state.
    // E.g., navigating to coach 'B2'
    const targetCoachIdentifier = location.state?.targetCoach || 'B2';

    const [scannedLocation, setScannedLocation] = useState<Coordinate | null>(null);
    const [targetLocation, setTargetLocation] = useState<Coordinate | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleQRScan = async (data: { station_id: string; location_id: string }) => {
        setLoading(true);
        setError('');

        try {
            // Fetch station coordinates from backend
            const station = await getStationByCode(data.station_id);

            if (!station) {
                setError('Station not found or invalid format.');
                setLoading(false);
                return;
            }

            if (!station.locations || !station.locations[data.location_id]) {
                setError(`Location '${data.location_id}' not mapped in this station.`);
                setLoading(false);
                return;
            }

            // We need destination coords. First check if the destination coach exists in the map
            const destinationKey = `coach_${targetCoachIdentifier}`;

            if (!station.locations[destinationKey]) {
                setError(`Target destination '${targetCoachIdentifier}' cannot be found at this station.`);
                setLoading(false);
                return;
            }

            // Successfully acquired coordinates
            setScannedLocation(station.locations[data.location_id]);
            setTargetLocation(station.locations[destinationKey]);

        } catch (err) {
            console.error('Failed to handle QR scan', err);
            setError('An error occurred while fetching station data.');
        } finally {
            setLoading(false);
        }
    };

    if (scannedLocation && targetLocation) {
        // We have both coordinates; start the AR camera session
        return (
            <div className="w-full h-screen overflow-hidden relative">
                <button
                    onClick={() => {
                        // Resets state back to scanner
                        setScannedLocation(null);
                        setTargetLocation(null);
                    }}
                    className="absolute z-50 top-6 left-6 bg-black/40 hover:bg-black/60 backdrop-blur-md p-2 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 shrink-0 text-white" />
                </button>
                <ARSessionManager
                    currentLocation={scannedLocation}
                    targetLocation={targetLocation}
                    targetLabel={`Coach ${targetCoachIdentifier}`}
                />
            </div>
        );
    }

    // Default view: QR Scanner
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
                    <h2 className="text-xl font-semibold text-slate-800">Scan QR to Start</h2>
                    <p className="text-sm text-slate-500 max-w-[280px] mx-auto">
                        Locate an official Railway Navigation QR code on the platform and scan it to initialize AR.
                    </p>
                </div>

                {/* Target context (e.g. "To: Coach B2") */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Train className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Navigating To</p>
                            <p className="font-bold text-indigo-900">Coach {targetCoachIdentifier}</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center border border-red-100 font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center border-2 border-slate-200 border-dashed">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <QRScanner onScan={handleQRScan} onError={(err) => setError(err)} />
                )}
            </div>
        </div>
    );
};

export default ARNavigationPage;
