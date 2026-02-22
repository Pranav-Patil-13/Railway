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

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true'); // required to tell iOS safari we don't want fullscreen
                    videoRef.current.play();
                    requestAnimationFrame(tick);
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                if (onError) onError("Failed to access camera. Please ensure permissions are granted.");
            }
        };

        const tick = () => {
            if (!isScanning) return;

            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                const ctx = canvas.getContext('2d');

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
                                setIsScanning(false);
                                onScan({
                                    station_id: parsedData.station_id,
                                    location_id: parsedData.location_id
                                });
                                return; // Stop scanning
                            }
                        } catch (e) {
                            console.warn("QR code found, but it's not valid JSON or missing fields.", code.data);
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
    }, [isScanning, onScan, onError]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-square overflow-hidden rounded-xl border-4 border-indigo-500 shadow-2xl">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-white/50 border-dashed m-12 rounded-lg pointer-events-none" />
            <div className="absolute inset-x-0 bottom-4 text-center">
                <span className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {isScanning ? 'Scan Station QR Code' : 'QR Detected!'}
                </span>
            </div>
        </div>
    );
};

export default QRScanner;
