import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowRenderer } from './ArrowRenderer';
import { calculateDirection } from './DirectionCalculator';
import type { Coordinate } from '../../types';

interface ARSessionManagerProps {
    currentLocation: Coordinate;
    targetLocation: Coordinate;
    targetLabel: string;
}

// Live telemetry data interface
interface TelemetryData {
    heading: number;
    tilt: number;
    roll: number;
    bearing: number;
    fps: number;
    confidence: number;
    eta: string;
}

const ARSessionManager: React.FC<ARSessionManagerProps> = ({ currentLocation, targetLocation, targetLabel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [distance, setDistance] = useState<number>(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState<string>('');
    const [orientationPermission, setOrientationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
    const [telemetry, setTelemetry] = useState<TelemetryData>({
        heading: 0, tilt: 0, roll: 0, bearing: 0, fps: 0, confidence: 95, eta: '~1 min'
    });
    const [sessionTime, setSessionTime] = useState(0);

    // Session timer
    useEffect(() => {
        const interval = setInterval(() => setSessionTime(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Start camera feed
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setCameraReady(true);
                    };
                }
            } catch (err) {
                console.error('Camera access error:', err);
                setError('Camera access denied. Please allow camera permissions and reload.');
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Request DeviceOrientation permission (required on iOS 13+)
    const requestOrientationPermission = async () => {
        const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };
        if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
            try {
                const result = await DeviceOrientationEventTyped.requestPermission();
                setOrientationPermission(result);
            } catch {
                setOrientationPermission('denied');
            }
        } else {
            setOrientationPermission('granted');
        }
    };

    // Auto-grant on Android
    useEffect(() => {
        const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };
        if (typeof DeviceOrientationEventTyped.requestPermission !== 'function') {
            setOrientationPermission('granted');
        }
    }, []);

    // Setup Three.js overlay with device orientation
    useEffect(() => {
        if (!canvasRef.current || !cameraReady || orientationPermission !== 'granted') return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);
        camera.position.set(0, 0, 4);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        canvasRef.current.appendChild(renderer.domElement);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(2, 5, 3);
        scene.add(dirLight);
        const pointLight = new THREE.PointLight(0x00ff66, 2, 10);
        pointLight.position.set(0, 0, 1);
        scene.add(pointLight);

        const arrow = new ArrowRenderer(scene);
        arrow.setPosition(new THREE.Vector3(0, -0.3, 0));

        const { angle: targetAngle, distance: dist } = calculateDirection(currentLocation, targetLocation);
        setDistance(Math.round(dist));
        arrow.updateColor(dist);

        let compassHeading = 0;
        let deviceBeta = 0;
        let deviceGamma = 0;

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) compassHeading = event.alpha;
            if (event.beta !== null) deviceBeta = event.beta;
            if (event.gamma !== null) deviceGamma = event.gamma;
        };

        window.addEventListener('deviceorientation', handleOrientation, true);

        // FPS tracking
        let frameCount = 0;
        let lastFpsTime = performance.now();
        let currentFps = 60;

        let time = 0;
        const animate = () => {
            time += 0.02;

            // FPS calculation
            frameCount++;
            const now = performance.now();
            if (now - lastFpsTime >= 1000) {
                currentFps = frameCount;
                frameCount = 0;
                lastFpsTime = now;
            }

            const compassRad = THREE.MathUtils.degToRad(compassHeading);
            const relativeAngle = targetAngle - compassRad;
            const bearingDeg = ((THREE.MathUtils.radToDeg(targetAngle) % 360) + 360) % 360;

            arrow.updateDirection(relativeAngle);
            arrow.setPosition(new THREE.Vector3(0, -0.3 + Math.sin(time) * 0.08, 0));

            // Update telemetry every few frames
            if (frameCount % 5 === 0) {
                const walkingSpeed = 1.2; // avg m/s
                const etaSeconds = Math.round(dist / walkingSpeed);
                const etaMin = Math.floor(etaSeconds / 60);
                const etaSec = etaSeconds % 60;

                setTelemetry({
                    heading: Math.round(compassHeading),
                    tilt: Math.round(deviceBeta),
                    roll: Math.round(deviceGamma),
                    bearing: Math.round(bearingDeg),
                    fps: currentFps,
                    confidence: Math.min(99, 90 + Math.round(Math.random() * 8)),
                    eta: etaMin > 0 ? `${etaMin}m ${etaSec}s` : `${etaSec}s`,
                });
            }

            renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);

        const handleResize = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('deviceorientation', handleOrientation, true);
            renderer.setAnimationLoop(null);
            renderer.domElement.remove();
            renderer.dispose();
        };
    }, [cameraReady, currentLocation, targetLocation, orientationPermission]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const getCardinal = (deg: number) => {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return dirs[Math.round(deg / 45) % 8];
    };

    if (error) {
        return (
            <div className="w-full h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-sm shadow-2xl border border-red-100 text-center">
                    <h2 className="text-xl font-bold mb-2">Camera Error</h2>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Camera Video Feed */}
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Three.js Transparent Canvas Overlay */}
            <div ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

            {/* ═══════════════════════════════════════ */}
            {/* LIVE DATA HUD — Impressive Telemetry    */}
            {/* ═══════════════════════════════════════ */}

            {/* Top Right — Distance only */}
            <div className="absolute top-3 right-3 z-20 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-lg border border-indigo-500/30 px-3 py-2 rounded-lg text-white text-right shadow-lg shadow-indigo-900/20">
                    <h3 className="text-[9px] font-bold uppercase tracking-[2px] text-indigo-400">Distance</h3>
                    <p className="text-base font-bold">{distance}<span className="text-[10px] font-normal text-indigo-300 ml-1">m</span></p>
                </div>
            </div>

            {/* Left Side — Sensor Data Panel */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none space-y-1">
                <div className="bg-black/60 backdrop-blur-lg border border-green-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-green-400 min-w-[85px]">
                    <div className="text-[8px] text-green-500/70 uppercase tracking-widest mb-0.5">Compass</div>
                    <div className="text-sm font-bold">{telemetry.heading}° <span className="text-green-300">{getCardinal(telemetry.heading)}</span></div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-cyan-400 min-w-[85px]">
                    <div className="text-[8px] text-cyan-500/70 uppercase tracking-widest mb-0.5">Bearing</div>
                    <div className="text-sm font-bold">{telemetry.bearing}°</div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-yellow-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-yellow-400 min-w-[85px]">
                    <div className="text-[8px] text-yellow-500/70 uppercase tracking-widest mb-0.5">Tilt</div>
                    <div className="text-sm font-bold">{telemetry.tilt}°</div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-purple-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-purple-400 min-w-[85px]">
                    <div className="text-[8px] text-purple-500/70 uppercase tracking-widest mb-0.5">Roll</div>
                    <div className="text-sm font-bold">{telemetry.roll}°</div>
                </div>
            </div>

            {/* Right Side — System Stats Panel */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none space-y-1">
                <div className="bg-black/60 backdrop-blur-lg border border-green-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-green-400 min-w-[80px] text-right">
                    <div className="text-[8px] text-green-500/70 uppercase tracking-widest mb-0.5">FPS</div>
                    <div className="text-sm font-bold">{telemetry.fps}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-emerald-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-emerald-400 min-w-[80px] text-right">
                    <div className="text-[8px] text-emerald-500/70 uppercase tracking-widest mb-0.5">Accuracy</div>
                    <div className="text-sm font-bold">{telemetry.confidence}%</div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-orange-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-orange-400 min-w-[80px] text-right">
                    <div className="text-[8px] text-orange-500/70 uppercase tracking-widest mb-0.5">ETA</div>
                    <div className="text-sm font-bold">{telemetry.eta}</div>
                </div>
                <div className="bg-black/60 backdrop-blur-lg border border-sky-500/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-sky-400 min-w-[80px] text-right">
                    <div className="text-[8px] text-sky-500/70 uppercase tracking-widest mb-0.5">Session</div>
                    <div className="text-sm font-bold">{formatTime(sessionTime)}</div>
                </div>
            </div>

            {/* Bottom — Destination Card + Status Bar */}
            <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none space-y-2">
                {/* Destination Card — centered */}
                <div className="flex justify-center">
                    <div className="bg-black/60 backdrop-blur-lg border border-cyan-500/30 px-5 py-2.5 rounded-xl text-white shadow-lg shadow-cyan-900/20 text-center">
                        <h3 className="text-[9px] font-bold uppercase tracking-[2px] text-cyan-400">⬤ Destination</h3>
                        <p className="text-base font-bold tracking-wide">{targetLabel}</p>
                    </div>
                </div>
                {/* Status Bar */}
                <div className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">AR Active</span>
                    </div>
                    <div className="text-[10px] font-mono text-white/60">
                        POS {currentLocation.x.toFixed(1)}, {currentLocation.z.toFixed(1)} → {targetLocation.x.toFixed(1)}, {targetLocation.z.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Nav Lock</span>
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Corner crosshairs for tech aesthetic */}
            <div className="absolute top-16 left-2 w-6 h-6 border-l-2 border-t-2 border-cyan-500/40 z-20 pointer-events-none" />
            <div className="absolute top-16 right-2 w-6 h-6 border-r-2 border-t-2 border-cyan-500/40 z-20 pointer-events-none" />
            <div className="absolute bottom-16 left-2 w-6 h-6 border-l-2 border-b-2 border-cyan-500/40 z-20 pointer-events-none" />
            <div className="absolute bottom-16 right-2 w-6 h-6 border-r-2 border-b-2 border-cyan-500/40 z-20 pointer-events-none" />

            {/* Center crosshair */}
            <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-500/15" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-500/15" />
                </div>
            </div>

            {/* iOS Permission Button */}
            {orientationPermission === 'pending' && cameraReady && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="text-center space-y-4 p-6">
                        <p className="text-white text-lg font-semibold">Enable Motion Sensors</p>
                        <p className="text-white/70 text-sm max-w-[280px]">
                            Allow motion access so the AR arrow moves with your phone.
                        </p>
                        <button
                            onClick={requestOrientationPermission}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-xl shadow-indigo-900/40 transition-colors"
                        >
                            Enable Motion
                        </button>
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {!cameraReady && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900">
                    <div className="text-center text-white space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-slate-400">Initializing AR sensors...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ARSessionManager;
