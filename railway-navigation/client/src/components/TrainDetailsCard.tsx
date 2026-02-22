import React, { useState } from 'react';
import { type ITrain } from '../types/Train';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Train, MapPin, ArrowRight, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface TrainDetailsCardProps {
    train: ITrain;
}

export function TrainDetailsCard({ train }: TrainDetailsCardProps) {
    const [showFullRoute, setShowFullRoute] = useState(false);

    // Determine the slice of stops to show
    const matched = train.matchedRoute;
    const stopsToShow = (matched && !showFullRoute)
        ? train.stops.slice(matched.fromStopIndex, matched.toStopIndex + 1)
        : train.stops;

    const sourceLabel = (matched && !showFullRoute) ? matched.fromStation : train.source;
    const destLabel = (matched && !showFullRoute) ? matched.toStation : train.destination;
    const stopCount = (matched && !showFullRoute) ? (matched.stopsInBetween + 1) : train.stops.length;

    return (
        <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg ring-1 ring-border/50">
            {/* Header */}
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2.5 text-xl">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <Train className="h-5 w-5 text-primary" />
                            </div>
                            {train.trainName}
                        </CardTitle>
                        <p className="text-sm font-medium text-text-secondary pl-[46px]">
                            Train #{train.trainNumber}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Route Info */}
                <div className="flex items-center justify-between p-5 bg-secondary/50 rounded-xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex flex-col gap-1 z-10">
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                            {(matched && !showFullRoute) ? 'Your Start' : 'Source'}
                        </span>
                        <div className="flex items-center gap-2 font-bold text-text-primary">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            {sourceLabel}
                        </div>
                    </div>

                    <div className="flex flex-col items-center px-4 min-w-[80px] z-10">
                        <div className="h-[2px] w-full bg-gradient-to-r from-primary to-accent relative">
                            <ArrowRight className="absolute -right-2 -top-[7px] h-4 w-4 text-accent" />
                        </div>
                        <span className="text-[10px] text-text-secondary mt-2 font-bold whitespace-nowrap">
                            {stopCount} {stopCount === 1 ? 'Stop' : 'Stops'}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 text-right z-10">
                        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">
                            {(matched && !showFullRoute) ? 'Your Destination' : 'Destination'}
                        </span>
                        <div className="flex items-center justify-end gap-2 font-bold text-text-primary">
                            {destLabel}
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Running Days */}
                <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                            Running Days
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                            const isActive = train.runningDays.includes(day);
                            return (
                                <span
                                    key={day}
                                    className={`
                                        inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold
                                        transition-all
                                        ${isActive
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'bg-secondary text-text-secondary/30'
                                        }
                                    `}
                                >
                                    {day}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Stops Table */}
                <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-text-secondary" />
                            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                                {showFullRoute ? 'Full Schedule' : 'Segment Schedule'}
                            </span>
                        </div>

                        {matched && (
                            <button
                                onClick={() => setShowFullRoute(!showFullRoute)}
                                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20"
                            >
                                {showFullRoute ? (
                                    <>
                                        <ChevronUp className="h-3.5 w-3.5" />
                                        Show Segment Only
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                        Show Full Route
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border/50 overflow-hidden shadow-sm bg-surface">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-secondary/40">
                                        <th className="text-left py-4 px-5 font-bold text-text-secondary text-[10px] uppercase tracking-[0.2em] w-16">
                                            #
                                        </th>
                                        <th className="text-left py-4 px-5 font-bold text-text-secondary text-[10px] uppercase tracking-[0.2em]">
                                            Station
                                        </th>
                                        <th className="text-left py-4 px-5 font-bold text-text-secondary text-[10px] uppercase tracking-[0.2em]">
                                            Arrival
                                        </th>
                                        <th className="text-left py-4 px-5 font-bold text-text-secondary text-[10px] uppercase tracking-[0.2em]">
                                            Departure
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {stopsToShow.map((stop, index) => {
                                        const globalIndex = matched && !showFullRoute ? matched.fromStopIndex + index : index;
                                        const isFirstToShow = index === 0;
                                        const isLastToShow = index === stopsToShow.length - 1;

                                        return (
                                            <tr
                                                key={`${stop.stationCode}-${globalIndex}`}
                                                className={`
                                                    transition-colors hover:bg-secondary/20
                                                    ${isFirstToShow || isLastToShow ? 'bg-primary/[0.02]' : ''}
                                                `}
                                            >
                                                <td className="py-4 px-5 text-xs font-bold text-text-secondary">
                                                    {globalIndex + 1}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold tracking-tight ${isFirstToShow || isLastToShow ? 'text-primary' : 'text-text-primary'}`}>
                                                            {stop.stationCode}
                                                        </span>
                                                        {isFirstToShow && matched && !showFullRoute && (
                                                            <span className="text-[10px] font-bold text-primary/60 uppercase leading-none mt-1">Starting Point</span>
                                                        )}
                                                        {isLastToShow && matched && !showFullRoute && (
                                                            <span className="text-[10px] font-bold text-primary/60 uppercase leading-none mt-1">End Point</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 font-mono text-xs font-bold text-text-primary">
                                                    {stop.arrival}
                                                </td>
                                                <td className="py-4 px-5 font-mono text-xs font-bold text-text-primary">
                                                    {stop.departure}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!showFullRoute && matched && (
                        <p className="mt-3 text-[11px] text-center text-text-secondary font-medium">
                            Only showing stations relevant to your search.
                            <button
                                onClick={() => setShowFullRoute(true)}
                                className="ml-1 text-primary hover:underline font-bold"
                            >
                                Tap here to see the full train route.
                            </button>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
