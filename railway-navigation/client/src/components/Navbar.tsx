import { Container } from './Layout';
import { Train } from 'lucide-react';

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/80 backdrop-blur-md">
            <Container>
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <Train className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-semibold tracking-tight text-text-primary">
                            Rail<span className="text-primary">Nav</span>
                        </span>
                    </div>

                    <nav className="flex items-center gap-6">
                        <a href="/" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                            Home
                        </a>
                        <a href="/search" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                            Search Trains
                        </a>
                        <a href="/ar-navigate" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            AR Navigation
                        </a>
                        <div className="h-4 w-px bg-border" />
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            GitHub
                        </a>
                    </nav>
                </div>
            </Container>
        </header>
    );
}
