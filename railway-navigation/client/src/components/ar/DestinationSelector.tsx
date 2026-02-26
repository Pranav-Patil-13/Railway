import React, { useEffect, useRef, useState } from 'react';
import { Train, MapPin, Ticket, DoorOpen, Clock, Droplets, Coffee, GlassWater, ArrowRight, Mic } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { cn } from '../../utils/cn';
import type { Coordinate } from '../../types';

interface DestinationSelectorProps {
    stationName: string;
    locations: Record<string, Coordinate>;
    onSelect: (key: string, label: string, coord: Coordinate) => void;
}

// Facility metadata for pretty display
const FACILITY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    ticket_counter: { label: 'Ticket Counter', icon: <Ticket className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    main_gate: { label: 'Main Gate', icon: <DoorOpen className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    exit: { label: 'Exit', icon: <DoorOpen className="w-5 h-5" />, color: 'bg-red-50 text-red-600 border-red-200' },
    waiting_room: { label: 'Waiting Room', icon: <Clock className="w-5 h-5" />, color: 'bg-green-50 text-green-600 border-green-200' },
    washroom: { label: 'Washroom', icon: <Droplets className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    food_stall: { label: 'Food Stall', icon: <Coffee className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    water_cooler: { label: 'Water Cooler', icon: <GlassWater className="w-5 h-5" />, color: 'bg-sky-50 text-sky-600 border-sky-200' },
};

const DestinationSelector: React.FC<DestinationSelectorProps> = ({ stationName, locations, onSelect }) => {
    // Separate coaches and facilities from the locations map
    const coaches: { key: string; label: string; coord: Coordinate }[] = [];
    const facilities: { key: string; label: string; coord: Coordinate; meta: typeof FACILITY_META[string] }[] = [];

    Object.entries(locations).forEach(([key, coord]) => {
        if (key.startsWith('coach_')) {
            const coachName = key.replace('coach_', '');
            coaches.push({ key, label: coachName, coord });
        } else if (FACILITY_META[key]) {
            facilities.push({ key, label: FACILITY_META[key].label, coord, meta: FACILITY_META[key] });
        }
        // Skip non-destination keys like platform_start, platform_mid, platform_end
    });

    // Sort coaches naturally (S1, S2, ..., B1, B2, ..., A1, A2)
    coaches.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

    // Voice assistant logic
    const { isListening, transcript, startListening, stopListening, hasSupport } = useVoice();
    const [statusText, setStatusText] = useState('Tap to speak...');
    const commandTimeout = useRef<any>(null);

    useEffect(() => {
        if (!isListening && transcript) {
            processVoiceCommand(transcript);
        } else if (transcript) {
            if (commandTimeout.current) clearTimeout(commandTimeout.current);
            commandTimeout.current = setTimeout(() => {
                stopListening();
            }, 1000);
        }
    }, [isListening, transcript]);

    const processVoiceCommand = (text: string) => {
        setStatusText('Processing...');
        text = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

        const allDestinations = [...coaches, ...facilities];

        let matched = allDestinations.find(d => {
            const label = d.label.toLowerCase();
            return text.includes(label) || label.includes(text) || (text.includes('coach') && text.includes(label.replace('coach', '').trim()));
        });

        if (matched) {
            setStatusText(`Navigating to ${matched.label}...`);
            setTimeout(() => {
                onSelect(matched.key, matched.key.startsWith('coach_') ? `Coach ${matched.label}` : matched.label, matched.coord);
            }, 800);
        } else {
            setStatusText('Not found. Tap to try again.');
        }
    };

    const toggleListening = () => {
        if (isListening) stopListening();
        else {
            setStatusText('Listening for destination...');
            startListening();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Position Locked
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Where to?</h1>
                    <p className="text-sm text-slate-500">{stationName}</p>
                </div>

                {/* Coaches Section */}
                {coaches.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Train className="w-5 h-5 text-indigo-600" />
                            <h2 className="text-base font-bold text-slate-800">Train Coaches</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {coaches.map((c) => (
                                <button
                                    key={c.key}
                                    onClick={() => onSelect(c.key, `Coach ${c.label}`, c.coord)}
                                    className="group relative bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-xl px-3 py-3 text-center transition-all duration-200 active:scale-95"
                                >
                                    <p className="text-lg font-bold text-indigo-700 group-hover:text-white transition-colors">{c.label}</p>
                                    <p className="text-[10px] text-indigo-400 group-hover:text-indigo-200 uppercase tracking-wider transition-colors">Coach</p>
                                    <ArrowRight className="w-3.5 h-3.5 absolute top-2 right-2 text-indigo-300 group-hover:text-white transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Facilities Section */}
                {facilities.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-5 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-5 h-5 text-slate-600" />
                            <h2 className="text-base font-bold text-slate-800">Station Facilities</h2>
                        </div>
                        <div className="space-y-2">
                            {facilities.map((f) => (
                                <button
                                    key={f.key}
                                    onClick={() => onSelect(f.key, f.label, f.coord)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md active:scale-[0.98] ${f.meta.color}`}
                                >
                                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                                        {f.meta.icon}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-semibold text-sm">{f.label}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 opacity-40" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* AR Voice Assistant Bubble */}
                {hasSupport && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-md backdrop-blur-md border transition-all",
                            isListening ? "bg-red-500/20 text-red-600 border-red-200" : "bg-white/80 text-slate-500 border-slate-200"
                        )}>
                            {statusText}
                        </div>
                        <button
                            onClick={toggleListening}
                            className={cn(
                                "relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 outline-none focus:ring-4 focus:ring-indigo-500/50",
                                isListening ? "bg-red-500 text-white animate-pulse" : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95"
                            )}
                        >
                            {isListening && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                                    <div className="absolute inset-0 rounded-full bg-red-400 opacity-50 blur-md animate-pulse" />
                                </>
                            )}
                            <Mic className="w-8 h-8 relative z-10" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DestinationSelector;
