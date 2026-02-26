import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, PageWrapper } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search as SearchIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { StationPhotos } from '../components/StationPhotos';
import { StationInput } from '../components/StationInput';
import train1 from '../assets/train1.jpg';

export function StationGallery() {
    const [searchInput, setSearchInput] = useState('');
    const [tempCode, setTempCode] = useState('');
    const [searchedCode, setSearchedCode] = useState<string | null>(null);
    const [scrollY, setScrollY] = useState(0);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchInput(q);
            setSearchedCode(q.toUpperCase());
        }
    }, [searchParams]);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // If a suggestion was picked, tempCode has the station code. Otherwise just use whatever they typed.
        const code = tempCode || searchInput.trim().toUpperCase();
        if (code) {
            setSearchedCode(code);
        }
    };

    return (
        <PageWrapper>
            <Navbar />

            {/* Hero Search Section */}
            <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 bg-slate-900 z-20">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src={train1}
                        alt="Station Gallery Background"
                        className="w-full h-full object-cover opacity-30 transition-transform duration-75 ease-out"
                        style={{
                            transform: `scale(1.2) translateY(${scrollY * 0.4}px)`,
                            willChange: 'transform'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/80"></div>
                </div>

                <Container className="relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 drop-shadow-lg tracking-tight">
                            Station <span className="text-primary italic border-b-4 border-primary">Gallery</span>
                        </h1>
                        <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
                            Immerse yourself in beautiful, high-resolution photographs of any railway station across India.
                        </p>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative group text-left">
                            <StationInput
                                placeholder="Enter a station name or code (e.g. NDLS)..."
                                value={searchInput}
                                onChange={(val, code) => {
                                    setSearchInput(val);
                                    if (code) setTempCode(code);
                                    else setTempCode('');
                                }}
                                icon={<SearchIcon className="h-6 w-6 text-white/50 group-focus-within:text-white transition-colors" />}
                                className="w-full h-16 sm:h-[72px] pl-16 pr-32 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/40 text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-2xl"
                            />
                            <div className="absolute inset-y-2 right-2 z-10">
                                <Button
                                    type="submit"
                                    className="h-full px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                                >
                                    Explore
                                </Button>
                            </div>
                        </form>
                    </div>
                </Container>
            </section>

            {/* Gallery Content Section */}
            <section className="flex-1 py-16 bg-slate-50 min-h-[40vh]">
                <Container>
                    {!searchedCode ? (
                        <div className="text-center py-20">
                            <div className="bg-slate-200/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ImageIcon className="h-10 w-10 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Beautiful Imagery Awaits</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Enter a station code above to fetch high-quality, fullscreen structural photographs of that station.
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="mb-10 text-center">
                                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest text-xs font-black shadow-sm border border-primary/20 mb-4">
                                    Viewing Station
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                    {searchedCode}
                                </h2>
                            </div>

                            <div className="max-w-5xl mx-auto">
                                <StationPhotos stationCodes={[searchedCode]} />
                            </div>
                        </div>
                    )}
                </Container>
            </section>

            <Footer />
        </PageWrapper>
    );
}
