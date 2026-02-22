import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { ArrowRenderer } from './ArrowRenderer';
import { calculateDirection } from './DirectionCalculator';
import type { Coordinate } from '../../types';

interface ARSessionManagerProps {
    currentLocation: Coordinate;
    targetLocation: Coordinate;
    targetLabel: string;
}

const ARSessionManager: React.FC<ARSessionManagerProps> = ({ currentLocation, targetLocation, targetLabel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [distance, setDistance] = useState<number>(0);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [xrSupported, setXrSupported] = useState<boolean | null>(null);

    useEffect(() => {
        // Check for WebXR support first
        if ('xr' in navigator) {
            navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
                setXrSupported(supported);
            });
        } else {
            setXrSupported(false);
        }

        if (!containerRef.current || xrSupported === false) return;

        // 1. Setup Three.js Scene
        const scene = new THREE.Scene();

        // 2. Setup Camera
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        // 3. Setup Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true; // Enable WebXR
        containerRef.current.appendChild(renderer.domElement);

        // 4. Add AR Button to document with DOM Overlay
        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: overlayRef.current || document.body }
        });

        // Add custom styling so it's visible before clicking
        arButton.style.backgroundColor = 'rgba(79, 70, 229, 0.9)'; // indigo-600
        arButton.style.padding = '16px 24px';
        arButton.style.borderRadius = '12px';
        arButton.style.fontWeight = 'bold';
        arButton.style.letterSpacing = '1px';
        arButton.style.bottom = '15%';

        if (overlayRef.current) {
            overlayRef.current.appendChild(arButton);
        } else {
            document.body.appendChild(arButton);
        }

        // Listen for session start/end to remove dark background
        renderer.xr.addEventListener('sessionstart', () => setIsSessionActive(true));
        renderer.xr.addEventListener('sessionend', () => setIsSessionActive(false));

        // 5. Add Lights
        const light = new THREE.AmbientLight(0xffffff, 1);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 0);
        scene.add(directionalLight);

        // 6. Initialize Arrow Renderer
        const arrow = new ArrowRenderer(scene);

        // Calculate initial direction
        const { angle, distance: initialDistance } = calculateDirection(currentLocation, targetLocation);
        setDistance(Math.round(initialDistance));

        // 7. Setup Animation Loop
        renderer.setAnimationLoop((_, frame) => {
            if (frame) {
                // In a real sophisticated app, we'd use hit-testing to place the arrow on the floor.
                // For MVP, we'll place it 1 meter in front of the camera, slightly below eye level.

                const referenceSpace = renderer.xr.getReferenceSpace();
                const session = renderer.xr.getSession();

                if (session && referenceSpace) {
                    const cameraPose = frame.getViewerPose(referenceSpace);
                    if (cameraPose) {
                        // Get camera position and rotation
                        const camTransform = cameraPose.transform;
                        const camPosition = new THREE.Vector3(
                            camTransform.position.x,
                            camTransform.position.y,
                            camTransform.position.z
                        );

                        // Position arrow 1.5 meters in front of camera
                        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
                            new THREE.Quaternion(camTransform.orientation.x, camTransform.orientation.y, camTransform.orientation.z, camTransform.orientation.w)
                        );

                        // We only want XZ forward, ignore pitch/roll for arrow placement
                        forward.y = 0;
                        forward.normalize();

                        const arrowPos = camPosition.clone().add(forward.multiplyScalar(1.5));
                        // Place it a bit low (ground level approach)
                        arrowPos.y -= 0.5;

                        arrow.setPosition(arrowPos);

                        // Set the rotation towards the target
                        arrow.updateDirection(angle);
                        arrow.updateColor(initialDistance);
                    }
                }
            }

            renderer.render(scene, camera);
        });

        // Handle Resize
        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onWindowResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', onWindowResize);
            renderer.setAnimationLoop(null);
            renderer.domElement.remove();
            if (arButton.parentNode) {
                arButton.parentNode.removeChild(arButton);
            }
        };
    }, [currentLocation, targetLocation, xrSupported]);

    // Pre-session: show dark background so the white HUD and AR button are visible.
    // In-session: background MUST be transparent for camera passthrough.
    return (
        <div
            ref={overlayRef}
            className={`relative w-full h-screen overflow-hidden ${isSessionActive ? 'bg-transparent' : 'bg-slate-900'} transition-colors duration-500`}
        >
            {/* The canvas container */}
            <div ref={containerRef} className="absolute inset-0 z-0 bg-transparent pointer-events-none" />

            {/* Support Warning */}
            {xrSupported === false && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-6 text-center">
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-sm shadow-2xl border border-red-100">
                        <h2 className="text-xl font-bold mb-2">WebXR Not Supported</h2>
                        <p className="text-sm">
                            Your browser or device does not support Augmented Reality. Please ensure you are using a compatible mobile device (Android with ARCore or iOS with WebXR Viewer) and the site is loaded over HTTPS.
                        </p>
                    </div>
                </div>
            )}

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white shadow-xl shadow-black/20">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Destination</h3>
                    <p className="text-2xl font-bold">{targetLabel}</p>
                </div>

                <div className="bg-indigo-600/80 backdrop-blur-md p-4 rounded-xl text-white text-right shadow-xl shadow-indigo-900/20">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-200">Distance</h3>
                    <p className="text-2xl font-bold">{distance} <span className="text-sm font-normal">meters</span></p>
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
                <p className="text-white/90 bg-black/60 backdrop-blur-md inline-block px-5 py-3 rounded-full text-sm font-medium border border-white/10 shadow-lg">
                    {isSessionActive ? "Follow the green arrow to your coach" : "Tap START AR to launch camera"}
                </p>
            </div>
        </div>
    );
};

export default ARSessionManager;
