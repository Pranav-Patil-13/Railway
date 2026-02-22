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

const ARSessionManager: React.FC<ARSessionManagerProps> = ({ currentLocation, targetLocation, targetLabel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [distance, setDistance] = useState<number>(0);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState<string>('');
    const [orientationPermission, setOrientationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');

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
            // Android and other browsers don't need explicit permission
            setOrientationPermission('granted');
        }
    };

    // Auto-request permission on mount (works on Android, needs button tap on iOS)
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

        // Scene
        const scene = new THREE.Scene();

        // Camera - positioned at origin, orientation will be controlled by device
        const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);

        // Renderer with transparency
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        canvasRef.current.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(2, 5, 3);
        scene.add(dirLight);

        // Arrow
        const arrow = new ArrowRenderer(scene);

        // Calculate direction to target
        const { angle, distance: dist } = calculateDirection(currentLocation, targetLocation);
        setDistance(Math.round(dist));

        // Place arrow at world-space position based on target angle
        // The arrow sits at a fixed position in the world; the camera rotates around it
        const arrowDistance = 2; // meters in front
        const arrowX = Math.sin(angle) * arrowDistance;
        const arrowZ = -Math.cos(angle) * arrowDistance;
        const arrowPosition = new THREE.Vector3(arrowX, -0.5, arrowZ);
        arrow.setPosition(arrowPosition);
        arrow.updateDirection(angle);
        arrow.updateColor(dist);

        // Device orientation tracking
        let deviceAlpha = 0;  // compass heading (0-360)
        let deviceBeta = 90;  // front-back tilt (-180 to 180)
        let deviceGamma = 0;  // left-right tilt (-90 to 90)

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.alpha !== null) deviceAlpha = event.alpha;
            if (event.beta !== null) deviceBeta = event.beta;
            if (event.gamma !== null) deviceGamma = event.gamma;
        };

        window.addEventListener('deviceorientation', handleOrientation, true);

        // Animation loop
        let time = 0;
        const animate = () => {
            time += 0.02;

            // Convert device orientation to camera rotation
            // Phone held upright in portrait mode:
            // alpha = compass heading, beta = tilt forward/back, gamma = tilt left/right
            const alphaRad = THREE.MathUtils.degToRad(deviceAlpha);
            const betaRad = THREE.MathUtils.degToRad(deviceBeta);
            const gammaRad = THREE.MathUtils.degToRad(deviceGamma);

            // Create rotation from device orientation
            // Standard ZXY Euler order for device orientation
            const euler = new THREE.Euler();
            euler.set(betaRad - Math.PI / 2, alphaRad, -gammaRad, 'YXZ');

            camera.quaternion.setFromEuler(euler);

            // Gentle floating animation for arrow
            const floatingY = -0.5 + Math.sin(time) * 0.08;
            arrow.setPosition(new THREE.Vector3(arrowX, floatingY, arrowZ));

            renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);

        // Resize handler
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

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-xl shadow-black/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Destination</h3>
                    <p className="text-lg font-bold">{targetLabel}</p>
                </div>

                <div className="bg-indigo-600/80 backdrop-blur-md p-4 rounded-xl text-white text-right shadow-xl shadow-indigo-900/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Distance</h3>
                    <p className="text-lg font-bold">{distance} <span className="text-xs font-normal">meters</span></p>
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
                        <p className="text-sm text-slate-400">Starting camera...</p>
                    </div>
                </div>
            )}

            {/* Bottom instruction */}
            <div className="absolute bottom-8 left-0 right-0 z-20 text-center pointer-events-none">
                <p className="text-white/90 bg-black/60 backdrop-blur-md inline-block px-5 py-3 rounded-full text-sm font-medium border border-white/10 shadow-lg">
                    Point your phone around — follow the green arrow to your coach
                </p>
            </div>
        </div>
    );
};

export default ARSessionManager;
