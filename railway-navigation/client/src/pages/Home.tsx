import { Container, PageWrapper } from '../components/Layout';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/Card';
import { Search, Map, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
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
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8">
                                Explore Routes
                            </Button>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Features Grid */}
            <section className="py-16 -mt-16">
                <Container>
                    <div className="grid gap-6 md:grid-cols-3">
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
                    </div>
                </Container>
            </section>

        </PageWrapper>
    );
}
