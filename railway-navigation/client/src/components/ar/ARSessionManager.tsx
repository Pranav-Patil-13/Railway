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
    const [distance, setDistance] = useState<number>(0);

    useEffect(() => {
        if (!containerRef.current) return;

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

        // 4. Add AR Button to document
        const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
        document.body.appendChild(arButton);
        // Auto-click the button to start immediately if possible, but usually requires user interaction
        arButton.click(); // Might not work without user gesture, but user clicked "Start AR" to get here!

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
            if (document.body.contains(arButton)) {
                document.body.removeChild(arButton);
            }
        };
    }, [currentLocation, targetLocation]);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black/90">
            {/* The canvas container */}
            <div ref={containerRef} className="absolute inset-0 z-0" />

            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-white">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">Destination</h3>
                    <p className="text-2xl font-bold">{targetLabel}</p>
                </div>

                <div className="bg-indigo-600/80 backdrop-blur-md p-4 rounded-xl text-white text-right">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-200">Distance</h3>
                    <p className="text-2xl font-bold">{distance} <span className="text-sm font-normal">meters</span></p>
                </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 z-10 text-center pointer-events-none">
                <p className="text-white/80 bg-black/50 inline-block px-4 py-2 rounded-full text-sm">
                    Follow the green arrow to your coach
                </p>
            </div>
        </div>
    );
};

export default ARSessionManager;
