import { Container, PageWrapper } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Search, Map, Clock, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouteExplorer } from '../components/RouteExplorer';
import { useRef } from 'react';

export function Home() {
    const explorerRef = useRef<HTMLDivElement>(null);

    const scrollToExplorer = () => {
        explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <PageWrapper>
            <Navbar />

            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-surface to-secondary/30 pt-16 md:pt-24 pb-32">
                <Container>
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-text-primary mb-6">
                            Next-Generation <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Railway Navigation</span>
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg sm:text-xl text-text-secondary mb-10">
                            Track trains, view live schedules, and explore routes with our blazingly fast and highly accurate dashboard platform.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/search">
                                <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                                    <Search className="mr-2 h-5 w-5" />
                                    Search Trains Now
                                </Button>
                            </Link>
                            <Link to="/ar-navigate">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto text-base h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Navigation className="mr-2 h-5 w-5" />
                                    Launch AR Nav
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto text-base h-12 px-8"
                                onClick={scrollToExplorer}
                            >
                                Explore Routes
                            </Button>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Route Explorer Section */}
            <div ref={explorerRef}>
                <Container>
                    <RouteExplorer className="-mt-12" />
                </Container>
            </div>

            {/* Features Grid */}
            <section className="py-16 -mt-16">
                <Container>
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-surface/80 backdrop-blur border-t-primary">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <Search className="h-6 w-6" />
                                </div>
                                <CardTitle>Lightning Fast Search</CardTitle>
                                <CardDescription>Find any train by number or name instantly using our optimized text indexing engine.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-surface/80 backdrop-blur border-t-accent">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 text-accent">
                                    <Map className="h-6 w-6" />
                                </div>
                                <CardTitle>Route Visualization</CardTitle>
                                <CardDescription>Clearly breakdown source, destination, and intermediate stops intuitively.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-surface/80 backdrop-blur border-t-success">
                            <CardHeader>
                                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4 text-success">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <CardTitle>Real-Time Ready</CardTitle>
                                <CardDescription>Architecture built to seamlessly integrate WebSocket live-tracking in the future.</CardDescription>
                            </CardHeader>
                        </Card>

                        <Link to="/ar-navigate" className="block h-full">
                            <Card className="h-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur border-t-indigo-500 cursor-pointer group">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                                        <Navigation className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-indigo-900">AR Indoor Navigation</CardTitle>
                                    <CardDescription>Scan QR codes at stations to unlock immersive 3D routing to your exact coach instantly.</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </div>
                </Container>
            </section>

        </PageWrapper>
    );
}
