import { AppService } from './app.service';
interface LocationData {
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
    ip?: string;
    method?: string;
}
interface FeatureFlags {
    darkMode: boolean;
    premiumFeatures: boolean;
    betaFeatures: boolean;
    location: string;
    timestamp: string;
    detectionMethod: string;
}
interface ManualLocationOption {
    city: string;
    country: string;
    countryCode: string;
    region?: string;
}
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
        version: string;
    };
    getManualLocations(): ManualLocationOption[];
    getFeatureFlags(locationData: LocationData): FeatureFlags;
}
export {};
