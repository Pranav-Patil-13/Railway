import React from 'react';
import { Container } from './Layout';
import { Train, Search as SearchIcon, Navigation, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';

export function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const location = useLocation();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { path: '/', label: 'Railways', icon: Train },
        { path: '/search', label: 'Search Trains', icon: SearchIcon },
        { path: '/gallery', label: 'Gallery', icon: ImageIcon },
        { path: '/ar-navigate', label: 'AR Navigation', icon: Navigation },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 pt-4 pb-4",
                isScrolled ? "bg-slate-900/80 backdrop-blur-lg border-b border-white/5 pt-2 pb-2" : "bg-transparent"
            )}
        >
            <Container>
                <div className="flex h-16 items-center justify-between">
                    {/* Logo (Approximating the stylized IRCTC/B logo) */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4H10V20H4V4Z" fill="white" />
                                <path d="M14 4H20V11H14V4Z" fill="white" />
                                <path d="M14 13H20V20H14V13Z" fill="white" />
                            </svg>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className={cn(
                        "hidden lg:flex items-center gap-1 px-1 py-1 rounded-full border transition-all duration-300",
                        isScrolled
                            ? "bg-black/20 border-white/10"
                            : "bg-black/10 backdrop-blur-md border-white/5"
                    )}>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "text-sm font-bold transition-all flex items-center gap-2 px-5 py-2.5 rounded-full relative group",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-lg"
                                            : "text-white/70 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-blue-400" : "")} />
                                    {item.label}
                                    {!isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-1/3" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white hidden sm:flex bg-transparent">
                            Login
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-600/30 font-medium">
                            Register
                        </Button>
                    </div>
                </div>
            </Container>
        </header>
    );
}
