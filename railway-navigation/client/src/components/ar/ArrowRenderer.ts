import * as THREE from 'three';

export class ArrowRenderer {
    private scene: THREE.Scene;
    private arrowGroup: THREE.Group;
    private material: THREE.MeshStandardMaterial;
    private glowMaterial: THREE.MeshBasicMaterial;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.arrowGroup = new THREE.Group();

        // Bright, highly visible material
        this.material = new THREE.MeshStandardMaterial({
            color: 0x00ff66,
            emissive: 0x00cc44,
            emissiveIntensity: 0.8,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.95,
        });

        // Glow outline material
        this.glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff66,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide,
        });

        this.buildArrow();
    }

    private buildArrow() {
        // Much larger arrow for clear visibility

        // Shaft
        const shaftRadius = 0.12;
        const shaftHeight = 1.0;
        const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 16);
        const shaft = new THREE.Mesh(shaftGeo, this.material);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = shaftHeight / 2;

        // Arrowhead (cone)
        const tipRadius = 0.3;
        const tipHeight = 0.5;
        const tipGeo = new THREE.ConeGeometry(tipRadius, tipHeight, 16);
        const tip = new THREE.Mesh(tipGeo, this.material);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = shaftHeight + (tipHeight / 2);

        // Glow shell around the tip for extra visibility
        const glowGeo = new THREE.ConeGeometry(tipRadius * 1.4, tipHeight * 1.3, 16);
        const glow = new THREE.Mesh(glowGeo, this.glowMaterial);
        glow.rotation.x = Math.PI / 2;
        glow.position.z = shaftHeight + (tipHeight / 2);

        this.arrowGroup.add(shaft);
        this.arrowGroup.add(tip);
        this.arrowGroup.add(glow);

        // Large scale — clearly visible on screen
        this.arrowGroup.scale.set(1.8, 1.8, 1.8);
        this.arrowGroup.visible = true;

        this.scene.add(this.arrowGroup);
    }

    public updateDirection(angle: number) {
        this.arrowGroup.rotation.y = angle;
    }

    public setPosition(position: THREE.Vector3) {
        this.arrowGroup.position.copy(position);
        this.arrowGroup.visible = true;
    }

    public updateColor(distance: number) {
        if (distance < 5) {
            this.material.color.setHex(0x00ccff);
            this.material.emissive.setHex(0x0088cc);
            this.glowMaterial.color.setHex(0x00ccff);
        } else {
            this.material.color.setHex(0x00ff66);
            this.material.emissive.setHex(0x00cc44);
            this.glowMaterial.color.setHex(0x00ff66);
        }
    }
}
