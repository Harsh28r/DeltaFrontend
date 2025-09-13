"use client";
import React, { useState } from 'react';
import { Card, Button, Alert } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import LocationCapture from '@/components/LocationCapture';
import { LocationData, GeolocationError, getDetailedLocationString, getShortLocationString } from '@/utils/locationUtils';

const TestLocationPage = () => {
  const router = useRouter();
  const [capturedLocation, setCapturedLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocationCaptured = (location: LocationData) => {
    setCapturedLocation(location);
    setLocationError(null);
    console.log('Location captured:', location);
  };

  const handleLocationError = (error: GeolocationError) => {
    setLocationError(error.message);
    setCapturedLocation(null);
    console.error('Location error:', error);
  };

  const clearLocation = () => {
    setCapturedLocation(null);
    setLocationError(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          color="gray"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Capture Test</h1>
          <p className="text-gray-600">Test the enhanced location capture with reverse geocoding</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Capture Component */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Capture</h3>
          <LocationCapture
            onLocationCaptured={handleLocationCaptured}
            onLocationError={handleLocationError}
            initialLocation={capturedLocation}
            showMap={true}
            className="w-full"
          />
        </Card>

        {/* Location Data Display */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Captured Data</h3>
          
          {locationError && (
            <Alert color="failure" className="mb-4">
              <Icon icon="lucide:alert-circle" className="w-4 h-4" />
              <span className="ml-2">{locationError}</span>
            </Alert>
          )}

          {capturedLocation ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <Icon icon="lucide:check-circle" className="w-5 h-5" />
                <span className="font-medium">Location Successfully Captured</span>
              </div>

              <div className="space-y-4">
                {/* Main Location Display */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">📍 Exact Location:</div>
                  <div className="text-sm text-blue-900 font-medium">
                    {getDetailedLocationString(capturedLocation)}
                  </div>
                </div>

                {/* Short Location */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-1">🏢 Short Location:</div>
                  <div className="text-sm text-green-900">
                    {getShortLocationString(capturedLocation)}
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {capturedLocation.building && (
                    <div>
                      <label className="font-medium text-gray-700">Building:</label>
                      <p className="text-gray-900">{capturedLocation.building}</p>
                    </div>
                  )}

                  {capturedLocation.houseNumber && (
                    <div>
                      <label className="font-medium text-gray-700">House Number:</label>
                      <p className="text-gray-900">{capturedLocation.houseNumber}</p>
                    </div>
                  )}

                  {capturedLocation.street && (
                    <div>
                      <label className="font-medium text-gray-700">Street:</label>
                      <p className="text-gray-900">
                        {capturedLocation.roadType ? 
                          `${capturedLocation.street} ${capturedLocation.roadType}` : 
                          capturedLocation.street
                        }
                      </p>
                    </div>
                  )}

                  {capturedLocation.landmark && (
                    <div>
                      <label className="font-medium text-gray-700">Landmark:</label>
                      <p className="text-gray-900">{capturedLocation.landmark}</p>
                    </div>
                  )}

                  {capturedLocation.area && (
                    <div>
                      <label className="font-medium text-gray-700">Area:</label>
                      <p className="text-gray-900">{capturedLocation.area}</p>
                    </div>
                  )}

                  {capturedLocation.sublocality && (
                    <div>
                      <label className="font-medium text-gray-700">Sub-locality:</label>
                      <p className="text-gray-900">{capturedLocation.sublocality}</p>
                    </div>
                  )}

                  {capturedLocation.locality && (
                    <div>
                      <label className="font-medium text-gray-700">Locality:</label>
                      <p className="text-gray-900">{capturedLocation.locality}</p>
                    </div>
                  )}

                  {capturedLocation.city && (
                    <div>
                      <label className="font-medium text-gray-700">City:</label>
                      <p className="text-gray-900">{capturedLocation.city}</p>
                    </div>
                  )}

                  {capturedLocation.state && (
                    <div>
                      <label className="font-medium text-gray-700">State:</label>
                      <p className="text-gray-900">{capturedLocation.state}</p>
                    </div>
                  )}

                  {capturedLocation.country && (
                    <div>
                      <label className="font-medium text-gray-700">Country:</label>
                      <p className="text-gray-900">{capturedLocation.country}</p>
                    </div>
                  )}

                  {capturedLocation.postalCode && (
                    <div>
                      <label className="font-medium text-gray-700">Postal Code:</label>
                      <p className="text-gray-900">{capturedLocation.postalCode}</p>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="font-medium text-gray-700">Coordinates:</label>
                    <p className="text-gray-600">
                      {capturedLocation.lat.toFixed(6)}, {capturedLocation.lng.toFixed(6)}
                    </p>
                  </div>

                  {capturedLocation.fullAddress && (
                    <div className="md:col-span-2">
                      <label className="font-medium text-gray-700">Full Address:</label>
                      <p className="text-gray-900 text-xs">{capturedLocation.fullAddress}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    color="gray"
                    size="sm"
                    onClick={clearLocation}
                    className="flex items-center gap-2"
                  >
                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    Clear Location
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Icon icon="lucide:map-pin" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No location captured yet</p>
              <p className="text-sm">Use the location capture component to get your current location</p>
            </div>
          )}
        </Card>
      </div>

      {/* Raw JSON Data */}
      {capturedLocation && (
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw JSON Data</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(capturedLocation, null, 2)}
          </pre>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Test</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. Click "Capture Location" button to get your current coordinates</p>
          <p>2. Allow location access when prompted by your browser</p>
          <p>3. The system will automatically reverse geocode to get place details</p>
          <p>4. View the captured data in the right panel</p>
          <p>5. The map will show your exact location with a marker</p>
        </div>
      </Card>
    </div>
  );
};

export default TestLocationPage;
