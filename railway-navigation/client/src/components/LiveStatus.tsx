import React, { useState, useEffect, useRef } from 'react';
import { TrainService } from '../services/api';
import { LoadingSpinner, ErrorState } from './States';
import { Clock, Navigation, Activity } from 'lucide-react';


interface LiveStatusProps {
    trainNumber: string;
}

export function LiveStatus({ trainNumber }: LiveStatusProps) {
    const [liveData, setLiveData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const currentStationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (liveData && currentStationRef.current && scrollContainerRef.current) {
            // Scroll specifically within the local container
            setTimeout(() => {
                const container = scrollContainerRef.current;
                const element = currentStationRef.current;

                if (container && element) {
                    const offsetTop = element.offsetTop;
                    const containerHalfHeight = container.clientHeight / 2;
                    const elementHalfHeight = element.clientHeight / 2;

                    container.scrollTo({
                        top: offsetTop - containerHalfHeight + elementHalfHeight,
                        behavior: 'smooth'
                    });
                }
            }, 600);
        }
    }, [liveData]);


    useEffect(() => {
        let isMounted = true;

        const fetchStatus = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get today's date formatted as YYYYMMDD
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const formattedDate = `${yyyy}${mm}${dd}`;

                const response = await TrainService.getLiveStatus(trainNumber, formattedDate);

                if (isMounted) {
                    if (response.success && response.data && !response.data.error) {
                        setLiveData(response.data.body);
                    } else {
                        // Handled RapidAPI errors explicitly if wrapped inside "success: true" due to generic response wrapper
                        setError(response.data?.error || response.message || 'Unable to fetch real-time data.');
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.response?.data?.message || err.message || 'Failed to fetch live status.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchStatus();
        return () => { isMounted = false; };
    }, [trainNumber]);

    if (isLoading) {
        return (
            <div className="py-12 flex flex-col items-center justify-center bg-surface rounded-2xl border border-border/50">
                <LoadingSpinner size={32} />
                <p className="mt-4 text-sm font-bold text-text-secondary animate-pulse uppercase tracking-wider">
                    Connecting to Satellite...
                </p>
            </div>
        );
    }

    if (error || !liveData) {
        return (
            <div className="py-4">
                <ErrorState
                    message={error || "Live status is currently unavailable for this train."}
                    action={null}
                />
            </div>
        );
    }

    const { train_status_message, current_station, time_of_availability, stations } = liveData;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 rounded-2xl border border-primary/20 bg-surface shadow-lg overflow-hidden flex flex-col">

            {/* Status Header Banner */}
            <div className={`p-5 flex items-start gap-4 ${liveData.terminated ? 'bg-slate-100 dark:bg-slate-800' : 'bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20'}`}>
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${liveData.terminated ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-primary text-white shadow-md shadow-primary/30 animate-pulse'}`}>
                    <Activity className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-text-primary leading-tight mb-1">
                        {train_status_message}
                    </h3>
                    <p className="text-xs font-bold text-text-secondary tracking-widest uppercase flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Updated {time_of_availability}
                    </p>
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={scrollContainerRef}
                className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar relative scroll-smooth"
            >
                <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-border/50" />

                <div className="space-y-0">
                    {stations && stations.map((station: any, idx: number) => {
                        // Very rough heuristic to check if passed or upcoming
                        // RapidAPI data sometimes marks actual_arrival_time as "Delay" or "--", so we'll just style it cleanly
                        const isCurrent = station.stationCode === current_station;

                        return (
                            <div
                                key={idx}
                                className="relative flex items-stretch group cursor-default"
                                ref={isCurrent ? currentStationRef : null}
                            >
                                {/* Connector Dot */}
                                <div className="w-16 shrink-0 py-4 flex flex-col items-center justify-start relative z-10 transition-transform group-hover:scale-110">
                                    <div className={`h-4 w-4 rounded-full border-4 shadow-sm transition-colors ${isCurrent
                                        ? 'bg-primary border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse'
                                        : (train_status_message.toLowerCase().includes('destination') || idx < stations.findIndex((s: any) => s.stationCode === current_station))
                                            ? 'bg-accent border-accent/20'
                                            : 'bg-surface border-border'
                                        }`}
                                    />
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 py-3 pr-2 transition-all`}>
                                    <div className={`p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-lg transform -translate-y-0.5' : 'bg-surface border-transparent hover:border-border/60 hover:bg-secondary/20'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className={`font-black text-sm tracking-tight ${isCurrent ? 'text-primary' : 'text-text-primary'}`}>
                                                    {station.stationName} <span className="text-xs font-bold text-text-secondary/60">({station.stationCode})</span>
                                                </h4>
                                                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-0.5">
                                                    Day {station.dayCount} • {station.distance} KM
                                                </p>
                                            </div>
                                            {isCurrent && (
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-primary px-2.5 py-1.5 rounded-md shadow-md animate-bounce">
                                                    <Navigation className="h-3 w-3" />
                                                    Here Now
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-0.5">Arrival</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-text-primary">{station.arrivalTime === '--' ? 'Start' : station.arrivalTime}</span>
                                                    {station.actual_arrival_time !== '--' && station.actual_arrival_time !== station.arrivalTime && (
                                                        <span className="font-mono text-[10px] font-bold text-red-500 bg-red-500/10 px-1 rounded">Act: {station.actual_arrival_time}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider mb-0.5">Departure</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm font-semibold text-text-primary">{station.departureTime === '--' ? 'End' : station.departureTime}</span>
                                                    {station.actual_departure_time !== '--' && station.actual_departure_time !== station.departureTime && (
                                                        <span className="font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">Act: {station.actual_departure_time}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
