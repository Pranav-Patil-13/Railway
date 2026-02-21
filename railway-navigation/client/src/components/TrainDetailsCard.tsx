import React from 'react';
import { type ITrain } from '../types/Train';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Train, MapPin, ArrowRight, Clock, Calendar } from 'lucide-react';

interface TrainDetailsCardProps {
    train: ITrain;
}

export function TrainDetailsCard({ train }: TrainDetailsCardProps) {
    return (
        <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg">
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
                <div className="flex items-center justify-between p-5 bg-secondary/50 rounded-xl">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
                            Source
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-text-primary">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            {train.source}
                        </div>
                    </div>

                    <div className="flex flex-col items-center px-4 min-w-[80px]">
                        <div className="h-[2px] w-full bg-gradient-to-r from-primary/40 to-accent/40 relative">
                            <ArrowRight className="absolute -right-2 -top-[7px] h-4 w-4 text-accent" />
                        </div>
                        <span className="text-[10px] text-text-secondary mt-2 font-medium">
                            {train.stops.length} Stops
                        </span>
                    </div>

                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
                            Destination
                        </span>
                        <div className="flex items-center justify-end gap-2 font-semibold text-text-primary">
                            {train.destination}
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                        </div>
                    </div>
                </div>

                {/* Running Days */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
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
                                        inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold
                                        transition-colors
                                        ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-secondary text-text-secondary/50'
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
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                            Schedule
                        </span>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-secondary/70">
                                    <th className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                                        Station
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                                        Arrival
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                                        Departure
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {train.stops.map((stop, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === train.stops.length - 1;
                                    return (
                                        <tr
                                            key={stop.stationCode}
                                            className={`
                                                transition-colors hover:bg-secondary/30
                                                ${isFirst || isLast ? 'bg-primary/[0.03]' : ''}
                                            `}
                                        >
                                            <td className="py-3 px-4 text-text-secondary font-medium">
                                                {index + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`font-medium ${isFirst || isLast ? 'text-primary' : 'text-text-primary'}`}>
                                                    {stop.stationCode}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-text-primary font-mono text-xs">
                                                {stop.arrival}
                                            </td>
                                            <td className="py-3 px-4 text-text-primary font-mono text-xs">
                                                {stop.departure}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
