import { Container } from './Layout';
import { Train, Github, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-white pt-20 pb-10 border-t border-white/5">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 4H10V20H4V4Z" fill="white" />
                                    <path d="M14 4H20V11H14V4Z" fill="white" />
                                    <path d="M14 13H20V20H14V13Z" fill="white" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold tracking-tight">Railway Nav</span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed">
                            Revolutionizing Indian Railways travel experience with advanced indoor navigation, real-time tracking, and seamless route planning.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all group">
                                <Twitter className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all group">
                                <Github className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            </a>
                            <a href="#" className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-all group">
                                <Linkedin className="h-5 w-5 text-slate-400 group-hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link to="/search" className="text-slate-400 hover:text-blue-400 transition-colors">Search Trains</Link></li>
                            <li><Link to="/ar-navigate" className="text-slate-400 hover:text-blue-400 transition-colors">AR Navigation</Link></li>
                            <li><Link to="/" className="text-slate-400 hover:text-blue-400 transition-colors">Route Explorer</Link></li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold">Features</h4>
                        <ul className="space-y-4">
                            <li className="text-slate-400">Indoor Positioning</li>
                            <li className="text-slate-400">QR-Based Wayfinding</li>
                            <li className="text-slate-400">Smart Route Analysis</li>
                            <li className="text-slate-400">Accessibility Mode</li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold">Contact Us</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-400">
                                <MapPin className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <span>Rail Bhawan, Raisina Road,<br />New Delhi, 110001</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Phone className="h-5 w-5 text-blue-500 shrink-0" />
                                <span>+91 11 2338 1234</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                                <span>support@railwaynav.in</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                    <p>© {currentYear} Indian Railways Navigation System. All rights reserved.</p>
                    <div className="flex items-center gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Safety Guidelines</a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
