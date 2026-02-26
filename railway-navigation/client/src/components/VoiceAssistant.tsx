import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../hooks/useVoice';
import { cn } from '../utils/cn';
import { StationService } from '../services/api';

export function VoiceAssistant() {
    const { isListening, transcript, startListening, stopListening, hasSupport } = useVoice();
    const [finalTranscript, setFinalTranscript] = useState('');
    const navigate = useNavigate();
    const [statusText, setStatusText] = useState('Listening...');
    const [showPopup, setShowPopup] = useState(false);
    const popupTimeout = useRef<any>(null);

    // AI logic to process sentences into intent!
    const processCommand = async (text: string) => {
        text = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        if (!text) return;

        setStatusText('Processing...');

        // Match: "photos of howrah station" / "gallery for cst"
        if (text.includes('photo') || text.includes('photos') || text.includes('gallery') || text.includes('image') || text.includes('images')) {
            const words = text.split(' ');
            const forIndex = Math.max(words.indexOf('of'), words.indexOf('for'), words.indexOf('at'));
            let stationName = '';

            if (forIndex !== -1 && forIndex < words.length - 1) {
                // capture the rest of the sentence as the station name
                stationName = words.slice(forIndex + 1).filter(w => w !== 'station').join(' ');
            } else {
                // heuristic: take the first long string before picture
                stationName = text.replace(/photos|photo|images|image|gallery|show me|of|for|station/g, '').trim();
            }

            if (stationName.length > 2) {
                try {
                    // Quick hit our api to convert written name "Howrah" -> "HWH"
                    setStatusText(`Searching for ${stationName}...`);
                    const res = await StationService.search(stationName);
                    if (res.success && res.data && res.data.length > 0) {
                        const code = res.data[0].code;
                        setStatusText(`Heading to ${code} Gallery!`);

                        setTimeout(() => {
                            // Close popup and redirect
                            setShowPopup(false);
                            navigate(`/gallery?q=${code}`);
                        }, 1000);
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }

        // Match: "mumbai to delhi"
        if (text.includes(' to ')) {
            const parts = text.split(' to ');
            let fromStr = parts[0].replace(/find|train|trains|from|show me/g, '').trim();
            let toStr = parts[1].replace(/train|trains/g, '').trim();

            if (fromStr && toStr) {
                setStatusText('Mapping route...');
                let fromCode = fromStr;
                let toCode = toStr;
                try {
                    const [fromRes, toRes] = await Promise.all([
                        StationService.search(fromStr),
                        StationService.search(toStr)
                    ]);
                    if (fromRes.success && fromRes.data?.[0]) fromCode = fromRes.data[0].code;
                    if (toRes.success && toRes.data?.[0]) toCode = toRes.data[0].code;
                } catch (e) { }

                setStatusText(`Searching ${fromCode} ➔ ${toCode}`);
                setTimeout(() => {
                    setShowPopup(false);
                    navigate(`/search?from=${fromCode}&to=${toCode}`);
                }, 1000);
                return;
            }
        }

        // Match: "where is train 12951" / "track 12951" / "status of 12951"
        const digitMatch = text.match(/\d{5}/);
        if (digitMatch || text.includes('where is') || text.includes('status of') || text.includes('track')) {
            let maybeTrain = digitMatch ? digitMatch[0] : text.replace(/where is|status of|track|find|the|train/g, '').trim();
            if (maybeTrain) {
                setStatusText(`Tracking train ${maybeTrain}...`);
                setTimeout(() => {
                    setShowPopup(false);
                    navigate(`/search?search=${maybeTrain}`);
                }, 1000);
                return;
            }
        }

        setStatusText('Command not recognized.');
        setTimeout(() => setShowPopup(false), 2000);
    };

    // Keep finalTranscript updated
    useEffect(() => {
        if (transcript) {
            setFinalTranscript(transcript);
            if (popupTimeout.current) clearTimeout(popupTimeout.current);
            // wait a little bit after they stop talking to act on it
            popupTimeout.current = setTimeout(() => {
                if (isListening) stopListening();
            }, 1000);
        }
    }, [transcript, isListening, stopListening]);

    // Handle Mic stop
    useEffect(() => {
        if (!isListening && finalTranscript) {
            processCommand(finalTranscript);
        }
    }, [isListening, finalTranscript]);

    if (!hasSupport) return null;

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            setFinalTranscript('');
            setStatusText('Listening...');
            setShowPopup(true);
            startListening();
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-50">
            {/* The Orb */}
            <button
                onClick={toggleListening}
                className={cn(
                    "relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto group outline-none focus:ring-4 focus:ring-primary/50 border-0",
                    isListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 border border-white/10"
                )}
            >
                {/* Glowing ring when listening */}
                {isListening && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        <div className="absolute inset-0 rounded-full bg-red-400 opacity-50 blur-md animate-pulse" />
                    </>
                )}

                <Mic className={cn("w-6 h-6 relative z-10", isListening ? "" : "group-hover:text-primary transition-colors")} />
            </button>

            {/* Conversation Popup */}
            {showPopup && (
                <div className="absolute bottom-16 left-0 mb-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {statusText === 'Listening...' ? (
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            ) : statusText.includes('Process') || statusText.includes('Search') || statusText.includes('Heading') || statusText.includes('Track') ? (
                                <Loader2 className="h-3 w-3 text-primary animate-spin" />
                            ) : null}
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50">{statusText}</span>
                        </div>
                        <p className="text-white text-base font-medium leading-tight min-h-[1.5rem]">
                            {finalTranscript || "Try saying: 'Mumbai to Delhi' or 'Photos of CSMT'"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
