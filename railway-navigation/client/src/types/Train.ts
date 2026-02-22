export interface ITrainStop {
    stationCode: string;
    arrival: string;
    departure: string;
}

export interface ITrain {
    _id: string;
    trainNumber: string;
    trainName: string;
    source: string;
    destination: string;
    runningDays: string[];
    stops: ITrainStop[];
    matchedRoute?: {
        fromStopIndex: number;
        toStopIndex: number;
        fromStation: string;
        toStation: string;
        stopsInBetween: number;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    count?: number;
    message?: string;
}
