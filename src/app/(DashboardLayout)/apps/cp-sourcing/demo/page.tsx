"use client";
import React, { useState } from "react";
import { Button, Card, Badge, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

// Sample data as provided by user
const sampleFormData = {
  "channelPartnerData": {
    "name": "John Doe",
    "phone": "9876543210",
    "firmName": "Doe Realty",
    "location": "Mumbai",
    "address": "123 Main St",
    "mahareraNo": "MHR123456",
    "pinCode": "400001"
  },
  "projectId": "68be6b01b2a42ef6c9e04832",
  "location": { "lat": 19.0760, "lng": 72.8777 },
  "notes": "First visit",
  "selfie": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQDw4ODx4WFxIZJCAmJSMgIyIOJjUlKC0vNTI0LCw4PTIyPC4zNDA2JjEmJicoNzg3/2wBDAQsLCw0NDxkQDw4ODx4WFxIZJCAmJSMgIyIOJjUlKC0vNTI0LCw4PTIyPC4zNDA2JjEmJicoNzg3OzswOzv/3QAEAA//Z"
};

const sampleApiResponse = {
  "_id": "68c3f0e1e4d239afeb997dd0",
  "userId": "68be6a20b2a42ef6c9e04816",
  "channelPartnerId": "68c3dd1dcaa8d7bc1e2a6265",
  "projectId": "68be6b01b2a42ef6c9e04832",
  "sourcingHistory": [
    {
      "location": {
        "lat": 19.076,
        "lng": 72.8777
      },
      "date": "2025-09-12T10:07:29.611Z",
      "selfie": "uploads\\cpsourcing\\1757671649596-live-selfie.jpeg",
      "notes": "First visit",
      "_id": "68c3f0e1e4d239afeb997dd1"
    },
    {
      "date": "2025-09-13T06:25:10.074Z",
      "selfie": "uploads\\cpsourcing\\1757744708437-live-selfie.jpeg",
      "location": {
        "lat": 19.076,
        "lng": 72.8777
      },
      "notes": "First visit",
      "_id": "68c50e469c79226ad9f26a26"
    }
  ],
  "isActive": true,
  "createdAt": "2025-09-12T10:07:29.617Z",
  "updatedAt": "2025-09-13T06:25:10.133Z",
  "__v": 1
};

const CPSourcingDemoPage = () => {
  const router = useRouter();
  const [showFormData, setShowFormData] = useState(true);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatLocation = (location: { lat: number; lng: number }) => {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-gray-900">CP Sourcing Data Binding Demo</h1>
          <p className="text-gray-600">Demonstrates how form data maps to API response</p>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="mb-6">
        <Button
          color={showFormData ? "orange" : "gray"}
          onClick={() => setShowFormData(!showFormData)}
          className="flex items-center gap-2"
        >
          <Icon icon={showFormData ? "lucide:form-input" : "lucide:database"} className="w-4 h-4" />
          {showFormData ? "Show API Response" : "Show Form Data"}
        </Button>
      </div>

      {showFormData ? (
        /* Form Data Display */
        <div className="space-y-6">
          <Alert color="info" className="mb-4">
            <Icon icon="lucide:info" className="w-4 h-4" />
            <span className="ml-2">This is the data structure sent from the form to the API</span>
          </Alert>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:form-input" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Form Data Structure</h2>
            </div>
            
            <div className="space-y-6">
              {/* Channel Partner Data */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Channel Partner Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Firm Name</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.firmName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">MAHARERA Number</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.mahareraNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">PIN Code</label>
                    <p className="text-gray-900">{sampleFormData.channelPartnerData.pinCode}</p>
                  </div>
                </div>
              </div>

              {/* Project and Location */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Project & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project ID</label>
                    <p className="text-gray-900 font-mono text-sm">{sampleFormData.projectId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location Coordinates</label>
                    <p className="text-gray-900 font-mono text-sm">{formatLocation(sampleFormData.location)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Data */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Data</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900">{sampleFormData.notes}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Selfie (Base64)</label>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 font-mono break-all">
                        {sampleFormData.selfie.substring(0, 100)}...
                      </p>
                      <div className="mt-2">
                        <img
                          src={sampleFormData.selfie}
                          alt="Sample selfie"
                          className="w-24 h-24 object-cover rounded border"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* API Response Display */
        <div className="space-y-6">
          <Alert color="success" className="mb-4">
            <Icon icon="lucide:check-circle" className="w-4 h-4" />
            <span className="ml-2">This is the data structure returned by the API after processing</span>
          </Alert>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:database" className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">API Response Structure</h2>
            </div>
            
            <div className="space-y-6">
              {/* Record Metadata */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Record ID</label>
                    <p className="text-gray-900 font-mono text-sm">{sampleApiResponse._id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge color={sampleApiResponse.isActive ? "green" : "red"} size="sm">
                        {sampleApiResponse.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900 text-sm">{formatDate(sampleApiResponse.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Updated</label>
                    <p className="text-gray-900 text-sm">{formatDate(sampleApiResponse.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Sourcing History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Sourcing History</h3>
                <div className="space-y-4">
                  {sampleApiResponse.sourcingHistory.map((item, index) => (
                    <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge color="blue" size="sm">
                            Visit #{sampleApiResponse.sourcingHistory.length - index}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color={item.location?.lat ? "green" : "gray"} size="sm">
                            {item.location?.lat ? "Location Captured" : "No Location"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <p className="text-gray-900 font-mono text-sm">
                            {formatLocation(item.location)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Notes</label>
                          <p className="text-gray-900">{item.notes}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="text-sm font-medium text-gray-500">Selfie Path</label>
                        <p className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded">
                          {item.selfie}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Mapping Explanation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Data Mapping Process</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Channel Partner Data:</strong> Stored in separate collection, referenced by ID</li>
                  <li>• <strong>Project ID:</strong> Directly mapped from form to response</li>
                  <li>• <strong>Location:</strong> Moved to sourcingHistory array with timestamp</li>
                  <li>• <strong>Selfie:</strong> Uploaded to server, path stored in sourcingHistory</li>
                  <li>• <strong>Notes:</strong> Added to sourcingHistory entry</li>
                  <li>• <strong>Metadata:</strong> Server adds userId, timestamps, and record ID</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CPSourcingDemoPage;
