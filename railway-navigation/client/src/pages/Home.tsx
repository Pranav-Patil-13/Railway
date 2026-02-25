import { useState, useEffect } from 'react';
import { Container, PageWrapper } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Search, Map, Clock, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouteExplorer } from '../components/RouteExplorer';
import { Footer } from '../components/Footer';
import train1 from '../assets/train1.jpg';

export function Home() {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <PageWrapper>
            <Navbar />

            {/* Hero Section */}
            <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-end pb-8 pt-32 lg:pb-16 lg:pt-40 bg-slate-900">
                {/* Background Image */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src={train1}
                        alt="Indian Railways background"
                        className="w-full h-full object-cover animate-slow-fade"
                        style={{
                            transform: `scale(1.2) translateY(${scrollY * 0.4}px)`,
                            willChange: 'transform'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                </div>

                <Container className="relative z-10 w-full mb-8 sm:mb-12 mt-auto">
                    <div className="max-w-4xl px-4 sm:px-0">
                        <div className="flex flex-wrap items-center gap-3 text-white/60 font-black tracking-[0.3em] text-[10px] sm:text-xs mb-6 uppercase">
                            <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/10">Safety</span>
                            <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/10">Security</span>
                            <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded border border-white/10">Punctuality</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter leading-[0.9] text-stroke-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Indian Railways
                        </h1>
                        <p className="max-w-2xl text-lg sm:text-2xl text-white/80 font-medium drop-shadow-lg leading-relaxed hidden sm:block border-l-4 border-primary pl-6">
                            Heartily enjoy every journey through our boundless hospitality.<br />
                            <span className="text-white/60 text-sm font-bold uppercase tracking-widest mt-2 block">The Lifeline of the Nation</span>
                        </p>
                    </div>
                </Container>

                {/* Route Explorer Widget pushed to the bottom of the hero */}
                <div className="relative z-20 w-full">
                    <Container>
                        <RouteExplorer className="-mb-24 sm:-mb-32 translate-y-8 sm:translate-y-16" />
                    </Container>
                </div>
            </section>

            {/* Features Grid spacer since RouteExplorer overlaps */}
            <div className="h-20 sm:h-24"></div>

            {/* Core Capabilities Section */}
            <section className="py-24 bg-slate-50">
                <Container>
                    <div className="text-center max-w-4xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-4 mb-6">
                            <div className="h-px w-10 bg-primary/30"></div>
                            <h2 className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.5em]">Core Capabilities</h2>
                            <div className="h-px w-10 bg-primary/30"></div>
                        </div>
                        <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1] mb-8">
                            Everything you need for a <br className="hidden md:block" />
                            <span className="relative">
                                <span className="relative z-10 text-primary italic">smarter</span>
                                <span className="absolute bottom-2 left-0 w-full h-4 bg-primary/10 -rotate-1"></span>
                            </span> journey.
                        </h3>
                        <p className="text-slate-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
                            Our platform combines cutting-edge technology with the reliability of Indian Railways to provide a world-class travel companion.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                icon: Search,
                                title: "Lightning Search",
                                desc: "Find any train in milliseconds using our globally distributed indexing engine.",
                                color: "blue"
                            },
                            {
                                icon: Map,
                                title: "Smart Routes",
                                desc: "Visualize your entire journey from source to destination with all intermediate stops.",
                                color: "indigo"
                            },
                            {
                                icon: Clock,
                                title: "Real-Time Precision",
                                desc: "Stay updated with live arrivals, departures, and platform announcements.",
                                color: "emerald"
                            },
                            {
                                icon: Navigation,
                                title: "AR Navigation",
                                desc: "Immersive 3D wayfinding at stations to guide you directly to your coach.",
                                color: "purple",
                                link: "/ar-navigate"
                            }
                        ].map((feature, i) => {
                            const colorMap: Record<string, string> = {
                                blue: 'bg-blue-500/10 text-blue-600',
                                indigo: 'bg-indigo-500/10 text-indigo-600',
                                emerald: 'bg-emerald-500/10 text-emerald-600',
                                purple: 'bg-purple-500/10 text-purple-600'
                            };

                            return (
                                <div key={i} className="group relative p-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                                    <div className={`h-14 w-14 rounded-2xl ${colorMap[feature.color]} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                        <feature.icon className="h-7 w-7" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                                    <p className="text-slate-500 leading-relaxed text-sm mb-6">{feature.desc}</p>
                                    {feature.link && (
                                        <Link to={feature.link} className="inline-flex items-center text-primary font-bold text-sm hover:gap-2 transition-all">
                                            Try it now <Navigation className="h-4 w-4 ml-1 rotate-45" />
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Container>
            </section>

            {/* Stats Banner Section */}
            <section className="py-20 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 50 Q 25 40 50 50 T 100 50" fill="none" stroke="white" strokeWidth="0.5" />
                        <path d="M0 60 Q 25 50 50 60 T 100 60" fill="none" stroke="white" strokeWidth="0.5" />
                    </svg>
                </div>
                <Container className="relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center text-white">
                        <div className="space-y-2">
                            <div className="text-5xl font-black italic">13k+</div>
                            <div className="text-white/60 font-bold uppercase tracking-widest text-xs">Active Trains</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-5xl font-black italic">7k+</div>
                            <div className="text-white/60 font-bold uppercase tracking-widest text-xs">Stations Mapped</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-5xl font-black italic">2.5M</div>
                            <div className="text-white/60 font-bold uppercase tracking-widest text-xs">Daily Users</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-5xl font-black italic">99%</div>
                            <div className="text-white/60 font-bold uppercase tracking-widest text-xs">Uptime Ready</div>
                        </div>
                    </div>
                </Container>
            </section>

            <Footer />
        </PageWrapper>
    );
}
