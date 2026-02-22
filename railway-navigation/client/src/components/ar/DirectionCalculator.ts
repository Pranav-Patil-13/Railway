import type { Coordinate } from '../../types';

export const calculateDirection = (
    current: Coordinate,
    target: Coordinate
): { angle: number; distance: number; dx: number; dz: number } => {
    // WebXR standard coordinate system:
    // -X = left, +X = right
    // -Y = down, +Y = up
    // -Z = forward, +Z = backward

    // So X represents Left/Right and Z represents Forward/Backward
    const dx = target.x - current.x;
    const dz = target.z - current.z;

    // Angle in radians (for Y-axis rotation in three.js)
    const angle = Math.atan2(dx, dz);

    // Euclidean distance in meters
    const distance = Math.sqrt(dx * dx + dz * dz);

    return { angle, distance, dx, dz };
};
