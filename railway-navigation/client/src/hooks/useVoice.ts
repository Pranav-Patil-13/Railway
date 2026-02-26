import { useState, useEffect, useCallback } from 'react';

// Make sure window objects match TS
// @ts-ignore
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useVoice() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition API not supported in this browser.");
            return;
        }

        const rec = new SpeechRecognitionAPI();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-IN'; // Indian English to capture names better

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = (e: any) => {
            console.error('Speech recognition error', e.error);
            setIsListening(false);
        };

        rec.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; ++i) {
                current += event.results[i][0].transcript;
            }
            setTranscript(current);
        };

        setRecognition(rec);
    }, []);

    const startListening = useCallback(() => {
        if (recognition) {
            setTranscript('');
            try {
                recognition.start();
            } catch (e) {
                console.warn(e);
            }
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn(e);
            }
        }
    }, [recognition]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        hasSupport: !!SpeechRecognitionAPI
    };
}
