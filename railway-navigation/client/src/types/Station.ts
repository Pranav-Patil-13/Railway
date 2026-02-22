export interface Coordinate {
    x: number;
    z: number;
}

export interface Station {
    _id: string;
    code: string;
    name: string;
    locations?: Record<string, Coordinate>;
}
