import { Controller, Get, Post, Body } from '@nestjs/common';
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

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'NestJS Backend',
      version: '1.0.0',
    };
  }

  @Get('manual-locations')
  getManualLocations(): ManualLocationOption[] {
    return [
      {
        city: 'New York',
        country: 'United States',
        countryCode: 'US',
        region: 'North America',
      },
      {
        city: 'London',
        country: 'United Kingdom',
        countryCode: 'UK',
        region: 'Europe',
      },
      { city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'Asia' },
      {
        city: 'Sydney',
        country: 'Australia',
        countryCode: 'AU',
        region: 'Oceania',
      },
      { city: 'Mumbai', country: 'India', countryCode: 'IN', region: 'Asia' },
      {
        city: 'Toronto',
        country: 'Canada',
        countryCode: 'CA',
        region: 'North America',
      },
      {
        city: 'Berlin',
        country: 'Germany',
        countryCode: 'DE',
        region: 'Europe',
      },
      { city: 'Paris', country: 'France', countryCode: 'FR', region: 'Europe' },
      {
        city: 'Singapore',
        country: 'Singapore',
        countryCode: 'SG',
        region: 'Asia',
      },
      {
        city: 'São Paulo',
        country: 'Brazil',
        countryCode: 'BR',
        region: 'South America',
      },
      {
        city: 'Mexico City',
        country: 'Mexico',
        countryCode: 'MX',
        region: 'North America',
      },
      {
        city: 'Cape Town',
        country: 'South Africa',
        countryCode: 'ZA',
        region: 'Africa',
      },
    ];
  }

  @Post('feature-flags')
  getFeatureFlags(@Body() locationData: LocationData): FeatureFlags {
    const {
      latitude,
      longitude,
      country,
      city,
      method = 'unknown',
    } = locationData;

    // Simple feature flag logic based on location
    let darkMode = false;
    let premiumFeatures = false;
    let betaFeatures = false;

    // Enable dark mode for users in certain countries (example: US, UK, Canada)
    if (
      country &&
      ['US', 'UK', 'CA', 'IN', 'INDIA'].includes(country.toUpperCase())
    ) {
      darkMode = true;
    }

    // Enable premium features for users in major cities
    if (
      city &&
      ['New York', 'London', 'Tokyo', 'Sydney', 'Mumbai', 'Delhi'].includes(
        city,
      )
    ) {
      premiumFeatures = true;
    }

    // Enable beta features for users in specific coordinates (example: Silicon Valley area)
    if (latitude && longitude) {
      // Roughly Silicon Valley coordinates
      if (
        latitude >= 37.0 &&
        latitude <= 38.0 &&
        longitude >= -122.5 &&
        longitude <= -121.5
      ) {
        betaFeatures = true;
      }
    }

    return {
      darkMode,
      premiumFeatures,
      betaFeatures,
      location: `${city || 'Unknown'}, ${country || 'Unknown'}`,
      timestamp: new Date().toISOString(),
      detectionMethod: method,
    };
  }
}
