import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
    onScan: (data: { station_id: string; location_id: string }) => void;
    onError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const isScanningRef = useRef(true);

    // Keep ref in sync
    useEffect(() => {
        isScanningRef.current = isScanning;
    }, [isScanning]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startCamera = async () => {
            try {
                // More explicit constraints for mobile browsers
                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // play() will be handled by autoPlay prop, 
                    // but we call it explicitly just in case.
                    try {
                        await videoRef.current.play();
                        setCameraActive(true);
                        requestAnimationFrame(tick);
                    } catch (playError) {
                        console.error("Video play failed:", playError);
                        // Often happens if not muted or no user gesture
                    }
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                if (onError) onError("Failed to access camera. Please check permissions.");
            }
        };

        const tick = () => {
            if (!isScanningRef.current) return;

            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert',
                    });

                    if (code && code.data) {
                        try {
                            const parsedData = JSON.parse(code.data);
                            if (parsedData.station_id && parsedData.location_id) {
                                isScanningRef.current = false;
                                setIsScanning(false);
                                onScan({
                                    station_id: parsedData.station_id,
                                    location_id: parsedData.location_id
                                });
                                return; // Stop scanning
                            }
                        } catch (e) {
                            // Suppress JSON errors for non-matching QR codes
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [onScan, onError]); // Removed isScanning from deps to avoid camera restarts

    return (
        <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-xl border-4 border-indigo-500 shadow-2xl bg-black">
            {!cameraActive && isScanning && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-white/50 border-dashed m-12 rounded-lg pointer-events-none" />
            <div className="absolute inset-x-0 bottom-4 text-center z-10">
                <span className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                    {isScanning ? 'Scan Station QR Code' : 'QR Detected!'}
                </span>
            </div>
        </div>
    );
};

export default QRScanner;
