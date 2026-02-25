import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, PageWrapper } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { TrainService } from '../services/api';
import { type ITrain } from '../types/Train';
import {
    Search as SearchIcon,
    History,
    TrendingUp,
    Map as MapIcon,
    Train as TrainIcon,
    Building2,
    MapPin,
    ArrowRight,
    ChevronRight,
    SearchX
} from 'lucide-react';
import { LoadingSpinner, ErrorState, EmptyState } from '../components/States';
import { TrainDetailsCard } from '../components/TrainDetailsCard';
import { RouteExplorer } from '../components/RouteExplorer';
import { Footer } from '../components/Footer';
import train1 from '../assets/train1.jpg';

const POPULAR_TRAINS = [
    { number: '12951', name: 'Mumbai Rajdhani' },
    { number: '12002', name: 'Bhopal Shatabdi' },
    { number: '12049', name: 'Gatimaan Express' },
    { number: '12301', name: 'Howrah Rajdhani' },
];



export function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrain, setSelectedTrain] = useState<ITrain | null>(null);
    const [searchResults, setSearchResults] = useState<ITrain[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<{ number: string, name: string }[]>([]);
    const [searchMode, setSearchMode] = useState<'train' | 'route'>('train');
    const [scrollY, setScrollY] = useState(0);

    const [searchParams] = useSearchParams();

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const search = searchParams.get('search');

        if (from || to) {
            setSearchMode('route');
            performSearch('', from || undefined, to || undefined);
        } else if (search) {
            setSearchMode('train');
            performSearch(search);
        }
    }, [searchParams]);

    const addToRecent = (train: ITrain) => {
        const item = { number: train.trainNumber, name: train.trainName };
        const filtered = recentSearches.filter(s => s.number !== item.number);
        const updated = [item, ...filtered].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const performSearch = async (query: string, from?: string, to?: string) => {
        // If query is empty but from/to provided, it's valid route search
        if (!query.trim() && !from && !to) return;

        setIsLoading(true);
        setError(null);
        setSelectedTrain(null);
        setSearchResults([]);
        setHasSearched(true);
        setSearchQuery(query || (from && to ? `${from} → ${to}` : from || to || ''));

        try {
            let response;

            if (from || to) {
                // Route-based search — uses the dedicated /routes endpoint
                response = await TrainService.searchRoutes(from, to);
            } else {
                // Train name/number search
                response = await TrainService.getAll(query.trim());
            }

            if (response.success && response.data) {
                const results = response.data;
                setSearchResults(results);

                // If exactly one result, show it immediately
                if (results.length === 1) {
                    setSelectedTrain(results[0]);
                    addToRecent(results[0]);
                }
            } else {
                setSearchResults([]);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred during search');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchQuery);
    };

    const handleSelectTrain = (train: ITrain) => {
        setSelectedTrain(train);
        addToRecent(train);
        // Scroll to top of result
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const clearSearch = () => {
        setHasSearched(false);
        setSearchQuery('');
        setSelectedTrain(null);
        setSearchResults([]);
    };

    return (
        <PageWrapper>
            <Navbar />

            {/* Header Background Section */}
            <div className="relative h-[28rem] w-full bg-slate-900 overflow-hidden">
                <img
                    src={train1}
                    alt="Background"
                    className="w-full h-full object-cover opacity-50 animate-slow-fade"
                    style={{
                        transform: `scale(1.2) translateY(${scrollY * 0.3}px)`,
                        willChange: 'transform'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-background"></div>
            </div>

            <main className="flex-1 -mt-64 relative z-10 pb-12">
                <Container>
                    <div className="max-w-3xl mx-auto space-y-12">

                        {/* Header Section */}
                        <div className="text-center space-y-6 mb-12">
                            <div className="inline-flex items-center gap-3 px-4 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-4">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.4em]">Real-Time Tracking</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] drop-shadow-sm">
                                <span className="text-white">Tracking</span> <span className="italic text-primary">Simplicity.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto font-medium leading-relaxed pt-2">
                                Search for any Indian Railways train by <span className="text-slate-900 border-b-2 border-primary/20">number</span> or <span className="text-slate-900 border-b-2 border-primary/20">name</span> instantly.
                            </p>
                        </div>

                        {/* Search Mode Toggles */}
                        <div className="flex justify-center -mb-8 relative z-10">
                            <div className="flex bg-surface border border-border rounded-2xl p-1.5 shadow-lg shadow-black/5 ring-1 ring-border/50">
                                <button
                                    onClick={() => setSearchMode('train')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${searchMode === 'train'
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-secondary/50'
                                        }`}
                                >
                                    <TrainIcon className="h-4 w-4" />
                                    Find Train
                                </button>
                                <button
                                    onClick={() => setSearchMode('route')}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${searchMode === 'route'
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-secondary/50'
                                        }`}
                                >
                                    <MapIcon className="h-4 w-4" />
                                    Explore Routes
                                </button>
                            </div>
                        </div>

                        {/* Search Form */}
                        <Card className="border-t-4 border-t-primary shadow-xl ring-1 ring-border/50 overflow-visible">
                            <CardContent className="pt-10"> {/* Extra top padding for the tabs overlapping */}
                                {searchMode === 'train' ? (
                                    <form onSubmit={handleSearch} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className="flex-1 relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <SearchIcon className="h-5 w-5 text-text-secondary" />
                                            </div>
                                            <Input
                                                placeholder="Enter train number or name (e.g. Rajdhani)"
                                                className="pl-12 h-14 text-lg border-transparent bg-secondary/30 focus:bg-surface transition-all rounded-xl text-slate-900"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" size="lg" isLoading={isLoading} className="h-14 px-10 rounded-xl text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                                            Search
                                        </Button>
                                    </form>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                        <RouteExplorer minimal />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Initial Content - Only shown if no search has been performed */}
                        {!hasSearched && !isLoading && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                                {/* Popular / Recent Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-text-primary px-1">
                                        {recentSearches.length > 0 ? (
                                            <History className="h-4 w-4 text-primary" />
                                        ) : (
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                        )}
                                        <span className="font-bold uppercase tracking-wider text-sm">
                                            {recentSearches.length > 0 ? 'Recently Searched' : 'Popular Trains'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(recentSearches.length > 0 ? recentSearches : POPULAR_TRAINS).map((item) => (
                                            <button
                                                key={item.number}
                                                onClick={() => performSearch(item.number)}
                                                className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium text-text-primary hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 group shadow-sm active:scale-95"
                                            >
                                                <span>{item.number}</span>
                                                <span className="text-text-secondary group-hover:text-primary/70 border-l border-border pl-2 dark:border-border/20">{item.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>


                                {/* Statistics Banner */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                                    {[
                                        { icon: TrainIcon, value: '13,000+', label: 'Trains' },
                                        { icon: Building2, value: '7,000+', label: 'Stations' },
                                        { icon: MapPin, value: 'Nationwide', label: 'Coverage' }
                                    ].map((stat, i) => (
                                        <div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-b from-surface to-secondary/30 border border-border shadow-sm text-center transform transition-transform hover:translate-y-[-4px]">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <div className="text-2xl font-black text-text-primary">{stat.value}</div>
                                            <div className="text-sm font-semibold text-text-secondary uppercase tracking-widest mt-1">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results Section */}
                        <div className="space-y-4">
                            {isLoading && (
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardContent className="py-20 text-center">
                                        <LoadingSpinner size={48} />
                                        <p className="mt-4 text-text-secondary font-medium animate-pulse">Searching the railways...</p>
                                    </CardContent>
                                </Card>
                            )}

                            {!isLoading && error && (
                                <ErrorState
                                    message={error}
                                    action={<Button onClick={() => setError(null)} variant="outline">Dismiss</Button>}
                                />
                            )}

                            {/* Search Summary & Clear Action */}
                            {!isLoading && !error && hasSearched && (
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                                            {searchResults.length} {searchResults.length === 1 ? 'train' : 'trains'} found for "{searchQuery}"
                                        </h2>
                                    </div>
                                    <button
                                        onClick={clearSearch}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group"
                                    >
                                        <SearchX className="h-3 w-3 transition-transform group-hover:rotate-12" />
                                        <span>New Search</span>
                                    </button>
                                </div>
                            )}

                            {/* Multiple Results List */}
                            {!isLoading && !error && hasSearched && !selectedTrain && searchResults.length > 0 && (
                                <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    {searchResults.map((t) => (
                                        <button
                                            key={t._id}
                                            onClick={() => handleSelectTrain(t)}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface border border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group text-left active:scale-[0.99]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                                    <TrainIcon className="h-6 w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-bold text-lg text-text-primary leading-none">{t.trainNumber}</span>
                                                        <span className="text-sm font-medium px-2 py-0.5 bg-secondary text-text-secondary rounded-md uppercase tracking-tighter">Express</span>
                                                    </div>
                                                    <h3 className="font-semibold text-text-primary truncate">{t.trainName}</h3>
                                                </div>
                                            </div>

                                            <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1">
                                                        {t.matchedRoute ? 'Searched Segment' : 'Route'}
                                                    </div>
                                                    <div className="text-sm font-medium text-text-primary flex items-center gap-2">
                                                        {t.matchedRoute
                                                            ? t.matchedRoute.fromStation
                                                            : (t.source.includes('(') ? t.source.split('(')[1]?.replace(')', '') : t.source)
                                                        }
                                                        <ArrowRight className="h-3 w-3 text-text-secondary" />
                                                        {t.matchedRoute
                                                            ? t.matchedRoute.toStation
                                                            : (t.destination.includes('(') ? t.destination.split('(')[1]?.replace(')', '') : t.destination)
                                                        }
                                                    </div>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-secondary/50 group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No Results Empty State */}
                            {!isLoading && !error && hasSearched && searchResults.length === 0 && (
                                <EmptyState
                                    title="No results found"
                                    description={`We couldn't find any trains matching "${searchQuery}". Try searching by train number or a different name.`}
                                    action={
                                        <Button
                                            variant="outline"
                                            onClick={clearSearch}
                                            className="rounded-xl"
                                        >
                                            Try Different Search
                                        </Button>
                                    }
                                />
                            )}

                            {/* Selected Train Details */}
                            {!isLoading && !error && selectedTrain && (
                                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    <TrainDetailsCard train={selectedTrain} />

                                    {searchResults.length > 1 && (
                                        <button
                                            onClick={() => setSelectedTrain(null)}
                                            className="mt-6 w-full py-4 border-2 border-dashed border-border rounded-2xl text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all font-semibold flex items-center justify-center gap-2 group"
                                        >
                                            <ArrowRight className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
                                            Back to search results
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </Container>
            </main>
            <Footer />
        </PageWrapper>
    );
}
