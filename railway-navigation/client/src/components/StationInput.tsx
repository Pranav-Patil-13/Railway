import React, { useState, useEffect, useRef } from 'react';
import { StationService } from '../services/api';

interface Station {
    _id: string;
    code: string;
    name: string;
}

interface StationInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string, stationCode?: string) => void;
    icon: React.ReactNode;
    className?: string;
}

export function StationInput({ placeholder, value, onChange, icon, className }: StationInputProps) {
    const [suggestions, setSuggestions] = useState<Station[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced station search
    useEffect(() => {
        if (!value || value.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await StationService.search(value);
                if (response.success && response.data) {
                    setSuggestions(response.data);
                    setIsOpen(response.data.length > 0);
                    setHighlightIndex(-1);
                }
            } catch {
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectStation = (station: Station) => {
        onChange(`${station.name} (${station.code})`, station.code);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && highlightIndex >= 0) {
            e.preventDefault();
            selectStation(suggestions[highlightIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="flex-1 relative group">
            {/* Icon */}
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors z-10">
                {icon}
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                className={className || "w-full h-16 pl-12 pr-4 bg-secondary/20 hover:bg-secondary/40 focus:bg-surface border-2 border-transparent focus:border-primary/30 rounded-2xl outline-none transition-all text-lg font-medium placeholder:text-text-secondary/50"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none z-10">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            )}

            {/* Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200 text-slate-900">
                    <div className="max-h-64 overflow-y-auto">
                        {suggestions.map((station, i) => (
                            <button
                                key={station._id}
                                type="button"
                                onClick={() => selectStation(station)}
                                onMouseEnter={() => setHighlightIndex(i)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === highlightIndex
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-secondary/50 text-text-primary'
                                    }`}
                            >
                                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                                    {station.code}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm truncate">{station.name}</div>
                                    <div className="text-xs text-text-secondary">Station Code: {station.code}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
