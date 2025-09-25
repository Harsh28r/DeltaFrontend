"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';

// Create a wrapper component for the map to handle dynamic loading
const MapWrapper = dynamic(() => import('./MapWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  )
});

interface Location {
  lat: number;
  lng: number;
  placeName?: string;
}

interface LocationMapProps {
  location: Location;
  height?: string;
  width?: string;
  className?: string;
  showPopup?: boolean;
  popupContent?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
  location,
  height = "200px",
  width = "100%",
  className = "",
  showPopup = true,
  popupContent
}) => {
  const [isClient, setIsClient] = useState(false);

  // Fix Leaflet default icon paths
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).L) {
      try {
        // @ts-ignore
        delete (window as any).L.Icon.Default.prototype._getIconUrl;
        // @ts-ignore
        (window as any).L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      } catch (error) {
        console.warn('Failed to configure Leaflet icons:', error);
      }
    }
    setIsClient(true);
  }, []);

  // Don't render if location is invalid
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-gray-500">
          <Icon icon="lucide:map-pin" className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No location data</p>
        </div>
      </div>
    );
  }

  // Show loading state while client-side hydration is happening
  if (!isClient) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const defaultPopupContent = popupContent || location.placeName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height, width }}>
      <MapWrapper
        location={location}
        showPopup={showPopup}
        popupContent={defaultPopupContent}
      />
    </div>
  );
};

export default LocationMap;
