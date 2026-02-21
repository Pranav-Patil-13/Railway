import React, { useState } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { MapPin, ArrowRightLeft, Search, Navigation2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StationInput } from './StationInput';

export function RouteExplorer({ className, minimal = false }: { className?: string, minimal?: boolean }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [fromCode, setFromCode] = useState('');
    const [toCode, setToCode] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (from || to) {
            // Use station codes if resolved, otherwise fall back to the typed text
            const fromParam = fromCode || from;
            const toParam = toCode || to;
            navigate(`/search?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}`);
        }
    };

    const swapStations = () => {
        setFrom(to);
        setTo(from);
        setFromCode(toCode);
        setToCode(fromCode);
    };

    const content = (
        <div className={minimal ? '' : 'p-2 sm:p-4'}>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch gap-2">
                {/* From Input Group */}
                <div className="relative flex-1">
                    <StationInput
                        placeholder="From Station"
                        value={from}
                        onChange={(val, code) => {
                            setFrom(val);
                            if (code) setFromCode(code);
                            else setFromCode('');
                        }}
                        icon={<MapPin className="h-5 w-5" />}
                    />
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-30 hidden md:block">
                        <button
                            type="button"
                            onClick={swapStations}
                            className="h-8 w-8 rounded-full bg-surface border border-border shadow-md flex items-center justify-center text-text-secondary hover:text-primary hover:scale-110 active:scale-95 transition-all"
                        >
                            <ArrowRightLeft className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Swap Button for Mobile */}
                <div className="md:hidden flex justify-center -my-2 relative z-20">
                    <button
                        type="button"
                        onClick={swapStations}
                        className="h-10 w-10 rounded-full bg-surface border border-border shadow-md flex items-center justify-center text-text-secondary hover:text-primary"
                    >
                        <ArrowRightLeft className="h-5 w-5 rotate-90" />
                    </button>
                </div>

                {/* To Input Group */}
                <StationInput
                    placeholder="To Station"
                    value={to}
                    onChange={(val, code) => {
                        setTo(val);
                        if (code) setToCode(code);
                        else setToCode('');
                    }}
                    icon={<Navigation2 className="h-5 w-5" />}
                />

                {/* Submit Button */}
                <Button
                    type="submit"
                    size="lg"
                    className="h-16 px-10 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Search className="mr-2 h-5 w-5" />
                    Explore
                </Button>
            </form>

            {/* Quick Suggestions */}
            <div className="mt-4 px-2 flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest whitespace-nowrap">Suggested:</span>
                {[
                    { f: 'Mumbai', t: 'Delhi' },
                    { f: 'Bangalore', t: 'Chennai' },
                    { f: 'Kolkata', t: 'Delhi' }
                ].map((route, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => {
                            setFrom(route.f); setTo(route.t);
                            setFromCode(''); setToCode('');
                        }}
                        className="text-xs font-semibold py-1.5 px-3 rounded-full bg-secondary/50 text-text-secondary hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all whitespace-nowrap"
                    >
                        {route.f} → {route.t}
                    </button>
                ))}
            </div>
        </div>
    );

    if (minimal) return content;

    return (
        <Card className={`max-w-4xl mx-auto relative z-10 shadow-2xl border-none bg-surface/90 backdrop-blur-xl ring-1 ring-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`}>
            <CardContent>
                {content}
            </CardContent>
        </Card>
    );
}
