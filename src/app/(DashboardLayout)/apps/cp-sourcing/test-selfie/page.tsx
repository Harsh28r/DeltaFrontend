"use client";
import React, { useState } from "react";
import { Button, Card, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { fetchSelfie } from "@/utils/cpSourcingUtils";

const TestSelfiePage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Test data - replace with actual values
  const testSourcingId = "68c3ff0724ae80522b5ca20c";
  const testSelfieIndex = 0;

  const handleFetchSelfie = async () => {
    if (!token) {
      setError("No authentication token found");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelfieUrl(null);

    try {
      const url = await fetchSelfie(testSourcingId, testSelfieIndex, token);
      setSelfieUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to fetch selfie");
    } finally {
      setIsLoading(false);
    }
  };

  const apiEndpoint = `http://localhost:5000/api/cp-sourcing/${testSourcingId}/selfie/${testSelfieIndex}`;

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
          <h1 className="text-2xl font-bold text-gray-900">Test Selfie Fetching</h1>
          <p className="text-gray-600">Test the selfie API endpoint functionality</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="lucide:test-tube" className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Test Controls</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Sourcing ID</label>
              <p className="text-gray-900 font-mono text-sm">{testSourcingId}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Selfie Index</label>
              <p className="text-gray-900 font-mono text-sm">{testSelfieIndex}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">API Endpoint</label>
              <p className="text-gray-900 font-mono text-xs break-all bg-gray-100 p-2 rounded">
                {apiEndpoint}
              </p>
            </div>
            
            <Button
              color="orange"
              onClick={handleFetchSelfie}
              disabled={isLoading || !token}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fetching Selfie...
                </>
              ) : (
                <>
                  <Icon icon="lucide:camera" className="w-4 h-4 mr-2" />
                  Fetch Selfie
                </>
              )}
            </Button>
            
            {!token && (
              <Alert color="warning">
                <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
                <span className="ml-2">Authentication token required</span>
              </Alert>
            )}
          </div>
        </Card>

        {/* Results */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Icon icon="lucide:image" className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">Results</h2>
          </div>
          
          <div className="space-y-4">
            {error && (
              <Alert color="failure">
                <Icon icon="lucide:alert-circle" className="w-4 h-4" />
                <span className="ml-2">{error}</span>
              </Alert>
            )}
            
            {isLoading && (
              <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            )}
            
            {selfieUrl && !isLoading && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Selfie URL</label>
                  <p className="text-gray-900 font-mono text-xs break-all bg-gray-100 p-2 rounded">
                    {selfieUrl}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Image Preview</label>
                  <div className="flex justify-center">
                    <img
                      src={selfieUrl}
                      alt="Fetched selfie"
                      className="max-w-full h-64 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        setError('Failed to load image');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!selfieUrl && !isLoading && !error && (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="lucide:camera-off" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Click "Fetch Selfie" to test the API</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* API Information */}
      <Card className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon icon="lucide:info" className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">API Information</h2>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-900">Endpoint</h3>
            <p className="text-gray-600 font-mono text-sm">{apiEndpoint}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Method</h3>
            <p className="text-gray-600">GET</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Headers</h3>
            <p className="text-gray-600 font-mono text-sm">Authorization: Bearer {token ? '[TOKEN]' : '[NO TOKEN]'}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Expected Response</h3>
            <p className="text-gray-600">Image file (JPEG/PNG) or error response</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TestSelfiePage;
