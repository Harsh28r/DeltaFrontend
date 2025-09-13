"use client";
import React, { useState } from 'react';
import { Button, Alert, Card, Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { getCurrentLocation, LocationData, GeolocationError, formatLocationForDisplay, getLocationSummary, getDetailedLocationString, getShortLocationString } from '@/utils/locationUtils';
import LocationMap from './LocationMap';

interface LocationCaptureProps {
  onLocationCaptured: (location: LocationData) => void;
  onLocationError: (error: GeolocationError) => void;
  initialLocation?: LocationData | null;
  disabled?: boolean;
  showMap?: boolean;
  className?: string;
}

const LocationCapture: React.FC<LocationCaptureProps> = ({
  onLocationCaptured,
  onLocationError,
  initialLocation,
  disabled = false,
  showMap = true,
  className = ""
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(initialLocation || null);
  const [error, setError] = useState<string | null>(null);

  const handleCaptureLocation = async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      onLocationCaptured(location);
    } catch (err: any) {
      const error: GeolocationError = {
        code: err.code || 0,
        message: err.message || 'Failed to capture location'
      };
      setError(error.message);
      onLocationError(error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClearLocation = () => {
    setCurrentLocation(null);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Capture Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleCaptureLocation}
          disabled={disabled || isCapturing}
          color="blue"
          className="flex items-center gap-2"
        >
          {isCapturing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Capturing...
            </>
          ) : (
            <>
              <Icon icon="lucide:map-pin" className="w-4 h-4" />
              Capture Location
            </>
          )}
        </Button>

        {currentLocation && (
          <Button
            onClick={handleClearLocation}
            disabled={disabled}
            color="gray"
            size="sm"
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {/* Location Display */}
      {currentLocation && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="space-y-3">
            {/* Location Summary */}
            <div className="flex items-center gap-2">
              <Icon icon="lucide:check-circle" className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Location Captured</span>
            </div>

            {/* Detailed Location Information */}
            <div className="space-y-3">
              {/* Main Location String */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">📍 Exact Location:</div>
                <div className="text-sm text-blue-900 font-medium">
                  {getDetailedLocationString(currentLocation)}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {currentLocation.building && (
                  <div>
                    <span className="font-medium text-gray-700">Building: </span>
                    <span className="text-gray-900">{currentLocation.building}</span>
                  </div>
                )}
                
                {currentLocation.houseNumber && (
                  <div>
                    <span className="font-medium text-gray-700">House No: </span>
                    <span className="text-gray-900">{currentLocation.houseNumber}</span>
                  </div>
                )}
                
                {currentLocation.street && (
                  <div>
                    <span className="font-medium text-gray-700">Street: </span>
                    <span className="text-gray-900">
                      {currentLocation.roadType ? 
                        `${currentLocation.street} ${currentLocation.roadType}` : 
                        currentLocation.street
                      }
                    </span>
                  </div>
                )}
                
                {currentLocation.landmark && (
                  <div>
                    <span className="font-medium text-gray-700">Landmark: </span>
                    <span className="text-gray-900">{currentLocation.landmark}</span>
                  </div>
                )}
                
                {currentLocation.area && (
                  <div>
                    <span className="font-medium text-gray-700">Area: </span>
                    <span className="text-gray-900">{currentLocation.area}</span>
                  </div>
                )}
                
                {currentLocation.sublocality && (
                  <div>
                    <span className="font-medium text-gray-700">Sub-locality: </span>
                    <span className="text-gray-900">{currentLocation.sublocality}</span>
                  </div>
                )}
                
                {currentLocation.locality && (
                  <div>
                    <span className="font-medium text-gray-700">Locality: </span>
                    <span className="text-gray-900">{currentLocation.locality}</span>
                  </div>
                )}
                
                {currentLocation.city && (
                  <div>
                    <span className="font-medium text-gray-700">City: </span>
                    <span className="text-gray-900">{currentLocation.city}</span>
                  </div>
                )}
                
                {currentLocation.state && (
                  <div>
                    <span className="font-medium text-gray-700">State: </span>
                    <span className="text-gray-900">{currentLocation.state}</span>
                  </div>
                )}
                
                {currentLocation.postalCode && (
                  <div>
                    <span className="font-medium text-gray-700">Postal Code: </span>
                    <span className="text-gray-900">{currentLocation.postalCode}</span>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Coordinates: </span>
                  <span className="text-gray-600">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Tags */}
            <div className="flex flex-wrap gap-2">
              {currentLocation.building && (
                <Badge color="indigo" size="sm">
                  <Icon icon="lucide:building-2" className="w-3 h-3 mr-1" />
                  {currentLocation.building}
                </Badge>
              )}
              {currentLocation.houseNumber && (
                <Badge color="gray" size="sm">
                  <Icon icon="lucide:hash" className="w-3 h-3 mr-1" />
                  {currentLocation.houseNumber}
                </Badge>
              )}
              {currentLocation.street && (
                <Badge color="blue" size="sm">
                  <Icon icon="lucide:road" className="w-3 h-3 mr-1" />
                  {currentLocation.street}
                </Badge>
              )}
              {currentLocation.landmark && (
                <Badge color="yellow" size="sm">
                  <Icon icon="lucide:landmark" className="w-3 h-3 mr-1" />
                  {currentLocation.landmark}
                </Badge>
              )}
              {currentLocation.area && (
                <Badge color="green" size="sm">
                  <Icon icon="lucide:building" className="w-3 h-3 mr-1" />
                  {currentLocation.area}
                </Badge>
              )}
              {currentLocation.city && (
                <Badge color="purple" size="sm">
                  <Icon icon="lucide:map-pin" className="w-3 h-3 mr-1" />
                  {currentLocation.city}
                </Badge>
              )}
            </div>

            {/* Map Display */}
            {showMap && (
              <div className="mt-4">
                <LocationMap
                  location={currentLocation}
                  height="200px"
                  width="100%"
                  showPopup={true}
                  popupContent={getLocationSummary(currentLocation)}
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Instructions */}
      {!currentLocation && !error && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <Icon icon="lucide:info" className="w-4 h-4 inline mr-2" />
          Click "Capture Location" to get your current coordinates and location details automatically.
        </div>
      )}
    </div>
  );
};

export default LocationCapture;
