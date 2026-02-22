import * as THREE from 'three';

export class ArrowRenderer {
    private scene: THREE.Scene;
    private arrowGroup: THREE.Group;
    private material: THREE.MeshStandardMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.arrowGroup = new THREE.Group();

        // Define materials
        this.material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x005500,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9,
        });

        this.buildArrow();
    }

    private buildArrow() {
        // Create an arrow-like shape using primitives or a custom geometry.
        // For simplicity, we use a Cylinder for the shaft and a Cone for the tip.

        const shaftRadius = 0.05;
        const shaftHeight = 0.5;
        const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 16);
        const shaft = new THREE.Mesh(shaftGeo, this.material);

        // Cylinder is oriented along Y by default. We want it pointing forward (along Z).
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = shaftHeight / 2;

        const tipRadius = 0.12;
        const tipHeight = 0.25;
        const tipGeo = new THREE.ConeGeometry(tipRadius, tipHeight, 16);
        const tip = new THREE.Mesh(tipGeo, this.material);

        // Cone is pointing up (Y+). Rotate to point forward (Z+)
        tip.rotation.x = Math.PI / 2;
        tip.position.z = shaftHeight + (tipHeight / 2);

        this.arrowGroup.add(shaft);
        this.arrowGroup.add(tip);

        // Set scale and initial position
        this.arrowGroup.scale.set(0.5, 0.5, 0.5); // make it reasonably sized for AR
        this.arrowGroup.visible = false; // Hidden until placed

        this.scene.add(this.arrowGroup);
    }

    public updateDirection(angle: number) {
        // Angle is calculated in the XZ plane.
        // Three.js Y-axis is up, so we rotate around Y.
        this.arrowGroup.rotation.y = angle;
    }

    public setPosition(position: THREE.Vector3) {
        // Place arrow slightly ahead of the camera or at a specific anchor.
        this.arrowGroup.position.copy(position);
        this.arrowGroup.visible = true;
    }

    public updateColor(distance: number) {
        // E.g., change color to blue when very close, green when far
        if (distance < 5) {
            this.material.color.setHex(0x00aaff);
            this.material.emissive.setHex(0x002255);
        } else {
            this.material.color.setHex(0x00ff00);
            this.material.emissive.setHex(0x005500);
        }
    }
}
