"use client";
import React from 'react';
import { Card, Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import LocationMap from '@/components/LocationMap';

const TestMapPage = () => {
  const router = useRouter();

  // Sample locations for testing
  const sampleLocations = [
    {
      lat: 19.0760,
      lng: 72.8777,
      placeName: "Mumbai, India"
    },
    {
      lat: 28.6139,
      lng: 77.2090,
      placeName: "New Delhi, India"
    },
    {
      lat: 12.9716,
      lng: 77.5946,
      placeName: "Bangalore, India"
    }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Map Test Page</h1>
          <p className="text-gray-600">Testing the LocationMap component</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleLocations.map((location, index) => (
          <Card key={index} className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {location.placeName}
              </h3>
              <p className="text-sm text-gray-600">
                Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
            
            <LocationMap
              location={location}
              height="200px"
              width="100%"
              showPopup={true}
              popupContent={location.placeName}
              className="mb-4"
            />
            
            <div className="text-xs text-gray-500">
              Click on the marker to see the popup
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Large Map Example</h3>
          <LocationMap
            location={sampleLocations[0]}
            height="400px"
            width="100%"
            showPopup={true}
            popupContent="Mumbai, India - Large Map View"
          />
        </Card>
      </div>
    </div>
  );
};

export default TestMapPage;
