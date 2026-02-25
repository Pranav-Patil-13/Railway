import React, { useState } from 'react';
import { Button } from './Button';
import { MapPin, ArrowRightLeft, Navigation2 } from 'lucide-react';
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
            const fromParam = fromCode || from || '';
            const toParam = toCode || to || '';

            // Only add parameters that have a value to not pollute the URL
            const params = new URLSearchParams();
            if (fromParam) params.append('from', fromParam);
            if (toParam) params.append('to', toParam);

            navigate(`/search?${params.toString()}`);
        }
    };

    const swapStations = () => {
        const tempFrom = from;
        const tempFromCode = fromCode;
        setFrom(to);
        setFromCode(toCode);
        setTo(tempFrom);
        setToCode(tempFromCode);
    };

    return (
        <div className={`w-full max-w-5xl mx-auto ${className || ''}`}>
            {/* Main Widget Card */}
            <div className={`${minimal ? 'p-0' : 'bg-white rounded-xl shadow-2xl p-4 sm:p-6 border border-white/20'} relative z-10 w-full`}>

                <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-center gap-4">

                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full flex-[2]">
                        {/* From */}
                        <div className="relative w-full">
                            <StationInput
                                placeholder="From"
                                value={from}
                                onChange={(val, code) => { setFrom(val); if (code) setFromCode(code); else setFromCode(''); }}
                                icon={<MapPin className="h-5 w-5 text-slate-400" />}
                                className="bg-slate-50 border-slate-200 h-14 rounded-xl shadow-sm text-base pl-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900"
                            />
                        </div>

                        {/* Swap Button */}
                        <button
                            type="button"
                            onClick={swapStations}
                            className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-all z-10 mx-auto -my-3 sm:my-0 sm:-mx-6 hover:scale-105 active:scale-95"
                        >
                            <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>

                        {/* To */}
                        <div className="relative w-full">
                            <StationInput
                                placeholder="To"
                                value={to}
                                onChange={(val, code) => { setTo(val); if (code) setToCode(code); else setToCode(''); }}
                                icon={<Navigation2 className="h-5 w-5 text-slate-400" />}
                                className="bg-slate-50 border-slate-200 h-14 rounded-xl shadow-sm text-base pl-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="w-full lg:flex-[1]">
                        <div className="relative group w-full">
                            <input
                                type="date"
                                className="w-full h-14 pl-4 pr-4 bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                            />
                        </div>
                    </div>

                    {/* Search Button */}
                    <Button
                        type="submit"
                        className="w-full lg:w-auto lg:shrink-0 h-14 px-8 rounded-xl text-lg font-bold shadow-lg shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 border-0"
                    >
                        Explore Routes
                    </Button>
                </form>
            </div>
        </div>
    );
}
