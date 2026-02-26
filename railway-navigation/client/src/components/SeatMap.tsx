import { useState, useEffect } from 'react';
import { Loader2, Ticket, CheckCircle2, UserX, AlertTriangle, BarChart3, TrainFront } from 'lucide-react';
import { cn } from '../utils/cn';
import { TrainService } from '../services/api';

interface SeatMapProps {
    trainNumber: string;
}

interface CoachInfo {
    number: string;
    class: string;
}

interface AvailabilityInfo {
    class: string;
    total: number;
    available: number;
    wl: number;
    rac: number;
}

interface ChartData {
    trainNumber: string;
    trainName: string;
    fromStation: string;
    toStation: string;
    date: string;
    coaches: CoachInfo[];
    availability: AvailabilityInfo[];
    scrapedAt: string;
    source: string;
}

// Seats per coach for each class
const SEATS_PER_COACH: Record<string, number> = {
    'SL': 72, '3A': 72, '2A': 54, '1A': 24, 'CC': 78, 'EC': 56, '2S': 108
};

// Berth types per class
const BERTH_LAYOUT: Record<string, string[]> = {
    'SL': ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'],
    '3A': ['LB', 'MB', 'UB', 'LB', 'MB', 'UB', 'SL', 'SU'],
    '2A': ['LB', 'UB', 'LB', 'UB', 'SL', 'SU'],
    '1A': ['LB', 'UB', 'LB', 'UB'],
    'CC': ['W', 'M', 'A', 'M', 'W'],
    '2S': ['W', 'M', 'A', 'M', 'W', 'W', 'M', 'A'],
};

export function SeatMap({ trainNumber }: SeatMapProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [liveScraped, setLiveScraped] = useState(false);
    const [selectedCoachIdx, setSelectedCoachIdx] = useState(0);
    const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);

    // Seat simulation based on real availability numbers
    const [seats, setSeats] = useState<{ id: number; status: 'available' | 'booked' | 'selected'; type: string }[]>([]);

    useEffect(() => {
        fetchChartData();
    }, [trainNumber]);

    const fetchChartData = async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const response = await TrainService.getReservationChart(trainNumber, dateStr);

            if (response && response.liveScraped && response.data) {
                setChartData(response.data);
                setLiveScraped(true);

                // Set default class filter from first availability entry
                if (response.data.availability?.length > 0) {
                    setSelectedClassFilter(response.data.availability[0].class);
                }

                // Generate seats for first coach
                if (response.data.coaches?.length > 0) {
                    generateSeatsForCoach(response.data.coaches[0], response.data.availability);
                }
            } else {
                setLiveScraped(false);
            }
        } catch (e) {
            console.warn("Chart fetch failed:", e);
            setLiveScraped(false);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSeatsForCoach = (coach: CoachInfo, availability: AvailabilityInfo[]) => {
        const coachClass = coach.class;
        const totalSeats = SEATS_PER_COACH[coachClass] || 72;
        const berthPattern = BERTH_LAYOUT[coachClass] || BERTH_LAYOUT['SL'];

        // Find real availability for this class
        const avl = availability.find(a => a.class === coachClass);
        const availableInClass = avl?.available || 0;

        // Calculate the number of coaches of this class
        const coachesOfSameClass = chartData?.coaches.filter(c => c.class === coachClass).length || 1;
        // Distribute availability across coaches
        const availablePerCoach = Math.round(availableInClass / coachesOfSameClass);

        const newSeats = [];
        let availableRemaining = availablePerCoach;

        for (let i = 1; i <= totalSeats; i++) {
            const berthType = berthPattern[(i - 1) % berthPattern.length];
            const isAvailable = availableRemaining > 0;

            if (isAvailable) {
                availableRemaining--;
            }

            newSeats.push({
                id: i,
                status: (isAvailable ? 'available' : 'booked') as 'available' | 'booked',
                type: berthType
            });
        }

        // Shuffle booked/available to make it realistic
        // (instead of all available at the start)
        for (let i = newSeats.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmpStatus = newSeats[i].status;
            newSeats[i].status = newSeats[j].status;
            newSeats[j].status = tmpStatus;
        }

        setSeats(newSeats);
    };

    const selectCoach = (idx: number) => {
        setSelectedCoachIdx(idx);
        if (chartData) {
            generateSeatsForCoach(chartData.coaches[idx], chartData.availability);
        }
    };

    const toggleSeatSelection = (id: number) => {
        setSeats(prev => prev.map(s => {
            if (s.id === id && s.status !== 'booked') {
                return { ...s, status: s.status === 'selected' ? 'available' : 'selected' };
            }
            return s;
        }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border shadow-xl bg-surface">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-bold text-text-primary">Scraping Live Chart Data...</h3>
                <p className="text-sm text-text-secondary mt-2">Connecting to erail.in for real-time seat data</p>
            </div>
        );
    }

    if (!liveScraped || !chartData) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-border shadow-xl bg-surface">
                <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-text-primary">Unable to Fetch Chart</h3>
                <p className="text-sm text-text-secondary mt-2">Could not scrape live data for this train. Try again later.</p>
            </div>
        );
    }


    const currentCoach = chartData.coaches[selectedCoachIdx];
    const currentAvl = chartData.availability.find(a => a.class === currentCoach?.class);

    const availableCount = seats.filter(s => s.status === 'available').length;
    const selectedCount = seats.filter(s => s.status === 'selected').length;
    const bookedCount = seats.filter(s => s.status === 'booked').length;



    return (
        <div className="rounded-2xl border border-border overflow-hidden shadow-xl bg-surface animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-xl font-black text-text-primary flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-primary" />
                            Live Reservation Chart
                        </h3>
                        <p className="text-sm text-text-secondary mt-1 flex items-center gap-1.5">
                            <TrainFront className="w-4 h-4" />
                            {chartData.trainName} &bull; {chartData.fromStation} → {chartData.toStation}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-green-700 bg-green-100 rounded-full uppercase tracking-wider border border-green-200 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Live Data from {chartData.source}
                            </span>
                            <span className="text-[10px] text-text-secondary font-medium">
                                Scraped at {new Date(chartData.scrapedAt).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Availability Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {chartData.availability.map((avl) => (
                        <div
                            key={avl.class}
                            onClick={() => {
                                setSelectedClassFilter(avl.class);
                                const firstOfClass = chartData.coaches.findIndex(c => c.class === avl.class);
                                if (firstOfClass >= 0) selectCoach(firstOfClass);
                            }}
                            className={cn(
                                "p-3 rounded-xl cursor-pointer transition-all border",
                                selectedClassFilter === avl.class
                                    ? "bg-primary/10 border-primary shadow-md"
                                    : "bg-secondary/50 border-border hover:bg-secondary"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black uppercase tracking-wider text-text-primary">{avl.class}</span>
                                <BarChart3 className="w-3.5 h-3.5 text-text-secondary" />
                            </div>
                            <div className="text-2xl font-black text-primary">{avl.available}</div>
                            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">of {avl.total} available</div>
                            <div className="flex gap-2 mt-1.5 text-[9px] font-bold">
                                {avl.wl > 0 && <span className="text-red-500">WL: {avl.wl}</span>}
                                {avl.rac > 0 && <span className="text-amber-600">RAC: {avl.rac}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coach selector tabs */}
                <div className="overflow-x-auto scrollbar-hide pb-1">
                    <div className="flex gap-2 min-w-max">
                        {chartData.coaches.map((coach, idx) => (
                            <button
                                key={`${coach.number}-${idx}`}
                                onClick={() => selectCoach(idx)}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border shadow-sm",
                                    selectedCoachIdx === idx
                                        ? "bg-primary text-white border-primary shadow-primary/20"
                                        : selectedClassFilter && coach.class !== selectedClassFilter
                                            ? "bg-secondary/30 text-text-secondary/40 border-border/50"
                                            : "bg-surface text-text-secondary border-border hover:bg-secondary hover:text-text-primary"
                                )}
                            >
                                {coach.number}
                                <span className="ml-1 text-[9px] opacity-70">({coach.class})</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Seat Layout */}
            <div className="p-4 sm:p-6 overflow-x-auto">
                {currentCoach && (
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-text-primary">
                            Coach {currentCoach.number} <span className="text-text-secondary">({currentCoach.class})</span>
                        </span>
                        {currentAvl && (
                            <span className="text-xs text-text-secondary font-medium">
                                {currentAvl.available} of {currentAvl.total} seats available across all {currentCoach.class} coaches
                            </span>
                        )}
                    </div>
                )}

                <div className="min-w-[400px] bg-secondary/30 rounded-2xl p-4 sm:p-5 border-2 border-border/50 shadow-inner">
                    {/* Coach header bar */}
                    <div className="flex items-center justify-between text-[9px] font-bold text-text-secondary/50 uppercase tracking-widest mb-3 px-1">
                        <span>Lower / Middle / Upper</span>
                        <span>Side L / Side U</span>
                    </div>

                    {/* Bay rows */}
                    <div className="flex flex-col gap-2">
                        {(() => {
                            const berthPattern = BERTH_LAYOUT[currentCoach?.class] || BERTH_LAYOUT['SL'];
                            const baySize = berthPattern.length;
                            const totalBays = Math.ceil(seats.length / baySize);

                            return Array.from({ length: totalBays }).map((_, bayIdx) => {
                                const bayStart = bayIdx * baySize;
                                const baySeats = seats.slice(bayStart, bayStart + baySize);
                                if (baySeats.length === 0) return null;

                                // Split into main berths and side berths
                                const mainSeats = baySeats.filter(s => {
                                    const bt = berthPattern[(s.id - 1) % berthPattern.length];
                                    return !['SL', 'SU'].includes(bt);
                                });
                                const sideSeats = baySeats.filter(s => {
                                    const bt = berthPattern[(s.id - 1) % berthPattern.length];
                                    return ['SL', 'SU'].includes(bt);
                                });

                                return (
                                    <div key={bayIdx} className="flex items-stretch gap-2">
                                        {/* Main berths (LB/MB/UB pairs) */}
                                        <div className="flex-1 bg-surface rounded-xl p-2 shadow-sm border border-border">
                                            <div className="grid grid-cols-6 gap-1.5">
                                                {mainSeats.map(seat => (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => toggleSeatSelection(seat.id)}
                                                        disabled={seat.status === 'booked'}
                                                        className={cn(
                                                            "h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative overflow-hidden",
                                                            seat.status === 'booked' ? "bg-red-50 text-red-300 cursor-not-allowed border border-red-100" :
                                                                seat.status === 'selected' ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105 z-10" :
                                                                    "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-500 hover:text-white"
                                                        )}
                                                    >
                                                        {seat.status === 'booked' && <UserX className="absolute inset-0 m-auto w-3.5 h-3.5 opacity-15" />}
                                                        <span className="z-10 text-[11px] font-black">{seat.id}</span>
                                                        <span className="text-[7px] opacity-60 z-10">{seat.type}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Aisle divider */}
                                        <div className="w-5 flex items-center justify-center">
                                            <div className="h-full w-px border-l-2 border-dashed border-border/40" />
                                        </div>

                                        {/* Side berths */}
                                        <div className="w-24 bg-surface rounded-xl p-2 shadow-sm border border-border">
                                            <div className={cn("grid gap-1.5", sideSeats.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                                                {sideSeats.map(seat => (
                                                    <button
                                                        key={seat.id}
                                                        onClick={() => toggleSeatSelection(seat.id)}
                                                        disabled={seat.status === 'booked'}
                                                        className={cn(
                                                            "h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all relative overflow-hidden",
                                                            seat.status === 'booked' ? "bg-red-50 text-red-300 cursor-not-allowed border border-red-100" :
                                                                seat.status === 'selected' ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105 z-10" :
                                                                    "bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-500 hover:text-white"
                                                        )}
                                                    >
                                                        {seat.status === 'booked' && <UserX className="absolute inset-0 m-auto w-3.5 h-3.5 opacity-15" />}
                                                        <span className="z-10 text-[11px] font-black">{seat.id}</span>
                                                        <span className="text-[7px] opacity-60 z-10">{seat.type}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {/* Legend & Actions */}
            <div className="p-4 sm:p-6 border-t border-border flex flex-wrap items-center justify-between gap-4 bg-surface">
                <div className="flex gap-5 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
                        <span className="text-xs font-bold text-text-secondary">Available ({availableCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-50 border border-red-200 flex items-center justify-center">
                            <UserX className="w-2.5 h-2.5 text-red-300" />
                        </div>
                        <span className="text-xs font-bold text-text-secondary">Booked ({bookedCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-primary shadow-sm" />
                        <span className="text-xs font-bold text-text-secondary">Selected ({selectedCount})</span>
                    </div>
                </div>

                {selectedCount > 0 && (
                    <button className="px-5 py-2 bg-primary hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Book {selectedCount} Seat{selectedCount > 1 ? 's' : ''}
                    </button>
                )}
            </div>
        </div>
    );
}
