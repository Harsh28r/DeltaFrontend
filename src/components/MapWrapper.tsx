"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  placeName?: string;
}

interface MapWrapperProps {
  location: Location;
  showPopup: boolean;
  popupContent: string;
}

const MapWrapper: React.FC<MapWrapperProps> = ({
  location,
  showPopup,
  popupContent
}) => {
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
  }, []);

  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.lat, location.lng]}>
        {showPopup && (
          <Popup>
            <div className="p-2">
              <p className="font-medium text-gray-900">{popupContent}</p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
};

export default MapWrapper;
