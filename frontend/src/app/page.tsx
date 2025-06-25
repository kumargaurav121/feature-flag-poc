'use client';

import { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
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

export default function Home() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [manualLocations, setManualLocations] = useState<ManualLocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationMethod, setLocationMethod] = useState<string>('');
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Try Browser Geolocation (Most Accurate)
  const tryBrowserGeolocation = (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationMethod('Browser Geolocation');
          setCurrentStep(2);

          try {
            // Get city/country from coordinates using reverse geocoding
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const locationData: LocationData = {
              latitude,
              longitude,
              country: data.countryName,
              city: data.city || data.locality,
              method: 'browser'
            };
            
            setLocationData(locationData);
            resolve(locationData);
          } catch (error) {
            // If reverse geocoding fails, still use coordinates
            const locationData: LocationData = {
              latitude,
              longitude,
              method: 'browser'
            };
            setLocationData(locationData);
            resolve(locationData);
          }
        },
        (error) => {
          console.log('Browser geolocation failed:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Step 2: Try IP-based Geolocation (Medium Accuracy)
  const tryIPGeolocation = async (): Promise<LocationData | null> => {
    try {
      setLocationMethod('IP-based Geolocation');
      setCurrentStep(3);

      // Try ipinfo.io first (free tier: 50K requests/month)
      const response = await fetch('https://ipinfo.io/json');
      const data = await response.json();
      console.log('IP-based Geolocation response:', data);
      
      if (data.country && data.city) {
        const locationData: LocationData = {
          country: data.country,
          city: data.city,
          method: 'ip'
        };
        setLocationData(locationData);
        return locationData;
      }
    } catch (error) {
      console.log('IP geolocation failed, trying fallback...');
    }

    // Fallback to ip-api.com
    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      
      if (data.country && data.city) {
        const locationData: LocationData = {
          country: data.country,
          city: data.city,
          method: 'ip'
        };
        setLocationData(locationData);
        return locationData;
      }
    } catch (error) {
      console.log('IP geolocation fallback failed');
    }

    return null;
  };

  // Step 3: Get Manual Location Options from Backend
  const getManualLocations = async (): Promise<ManualLocationOption[]> => {
    try {
      const response = await fetch('http://localhost:3000/manual-locations');
      const data = await response.json();
      setManualLocations(data);
      return data;
    } catch (error) {
      console.log('Failed to fetch manual locations from backend');
      return [];
    }
  };

  // Step 4: Default Location (Frontend Fallback)
  const getDefaultLocation = (): LocationData => {
    setLocationMethod('Default Location');
    setCurrentStep(4);

    // Use browser timezone as fallback
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Simple timezone to country mapping
    const timezoneToCountry: { [key: string]: string } = {
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'Europe/London': 'UK',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Asia/Tokyo': 'JP',
      'Asia/Shanghai': 'CN',
      'Australia/Sydney': 'AU',
    };

    const country = timezoneToCountry[timezone] || 'US';
    const city = 'Unknown';

    const locationData: LocationData = {
      country,
      city,
      method: 'default'
    };

    setLocationData(locationData);
    return locationData;
  };

  // Progressive Enhancement: Try methods in order
  useEffect(() => {
    const progressiveLocationDetection = async () => {
      setCurrentStep(1);

      // Step 1: Browser Geolocation
      let location = await tryBrowserGeolocation();
      
      if (!location) {
        // Step 2: IP-based Geolocation
        location = await tryIPGeolocation();
      }

      if (!location) {
        // Step 3: Manual Selection (show options)
        setShowManualSelection(true);
        await getManualLocations();
        return;
      }

      // If we have location, fetch feature flags
      if (location) {
        await fetchFeatureFlags(location);
      }
    };

    progressiveLocationDetection();
  }, []);

  // Handle manual location selection
  const handleManualLocationSelect = async (option: ManualLocationOption) => {
    const locationData: LocationData = {
      country: option.countryCode,
      city: option.city,
      method: 'manual'
    };

    setLocationData(locationData);
    setLocationMethod('Manual Selection');
    setShowManualSelection(false);
    await fetchFeatureFlags(locationData);
  };

  // Use default location as final fallback
  const useDefaultLocation = async () => {
    const locationData = getDefaultLocation();
    setShowManualSelection(false);
    await fetchFeatureFlags(locationData);
  };

  // Fetch feature flags
  const fetchFeatureFlags = async (location: LocationData) => {
    try {
      const response = await fetch('http://localhost:3000/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(location),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFeatureFlags(data);
    } catch (err) {
      console.error('Failed to fetch feature flags:', err);
    }
  };

  // Fetch health data
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:3000/health');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setHealthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Next.js + NestJS Progressive Enhancement POC
          </h1>
          <p className="text-xl text-gray-600">
            Location Detection with Progressive Enhancement
          </p>
        </header>

        {/* Progressive Enhancement Progress */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🔄 Progressive Enhancement Steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className={`p-4 rounded-lg border ${currentStep >= 1 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Browser Geolocation</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${currentStep >= 2 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">IP Geolocation</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${currentStep >= 3 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Manual Selection</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg border ${currentStep >= 4 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  4
                </div>
                <span className="ml-2 text-sm font-medium">Default Fallback</span>
              </div>
            </div>
          </div>

          {locationMethod && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                <strong>Current Method:</strong> {locationMethod}
              </p>
            </div>
          )}
        </div>

        {/* Manual Location Selection */}
        {showManualSelection && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📍 Select Your Location
            </h2>
            <p className="text-gray-600 mb-4">
              Choose your location to get personalized feature flags:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {manualLocations.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleManualLocationSelect(option)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                >
                  <div className="font-medium text-gray-800">{option.city}</div>
                  <div className="text-sm text-gray-600">{option.country}</div>
                  {option.region && (
                    <div className="text-xs text-gray-500">{option.region}</div>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t pt-4">
              <button
                onClick={useDefaultLocation}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Use Default Location (Skip)
              </button>
            </div>
          </div>
        )}

        {/* Location Status */}
        {locationData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📍 Detected Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locationData.latitude && locationData.longitude && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800">Coordinates</h3>
                  <p className="text-blue-700">
                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </p>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800">Location</h3>
                <p className="text-green-700">
                  {locationData.city || 'Unknown'}, {locationData.country || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Flags */}
        {featureFlags && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              🚩 Feature Flags
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`border rounded-lg p-4 ${featureFlags.darkMode ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dark Mode</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${featureFlags.darkMode ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
                    {featureFlags.darkMode ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              <div className={`border rounded-lg p-4 ${featureFlags.premiumFeatures ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Premium Features</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${featureFlags.premiumFeatures ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                    {featureFlags.premiumFeatures ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
              <div className={`border rounded-lg p-4 ${featureFlags.betaFeatures ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Beta Features</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${featureFlags.betaFeatures ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                    {featureFlags.betaFeatures ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Feature Flags Response:</h3>
              <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(featureFlags, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Health Check */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🏥 Backend Health Status
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Checking backend health...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error connecting to backend
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    <p className="mt-1">Make sure the NestJS backend is running on port 3000.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {healthData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Status</h3>
                      <p className="text-sm text-green-700">{healthData.status}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Timestamp</h3>
                      <p className="text-sm text-blue-700">{new Date(healthData.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-purple-800">Service</h3>
                      <p className="text-sm text-purple-700">{healthData.service}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">Version</h3>
                      <p className="text-sm text-orange-700">{healthData.version}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Health Check Response:</h3>
                <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(healthData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center mt-12 text-gray-500">
          <p>Next.js Frontend (Port 3001) ↔ NestJS Backend (Port 3000) | Progressive Enhancement</p>
        </footer>
      </div>
    </div>
  );
}
