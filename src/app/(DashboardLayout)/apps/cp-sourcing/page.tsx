"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config"; // Fixed API_BASE_URL import

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ChannelPartner {
  _id: string;
  name: string;
  phone: string;
}

interface Project {
  _id: string;
  name: string;
  location?: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface SourcingHistoryItem {
  _id: string;
  location: Location;
  date: string;
  selfie: string;
  notes: string;
}

interface CPSourcing {
  _id: string;
  userId: User;
  channelPartnerId: ChannelPartner;
  projectId: Project;
  sourcingHistory: SourcingHistoryItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CPSourcingPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [cpSourcingList, setCpSourcingList] = useState<CPSourcing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sourcingToDelete, setSourcingToDelete] = useState<CPSourcing | null>(null);

  // Fetch CP sourcing data
  useEffect(() => {
    if (token) {
      fetchCPSourcing();
    }
  }, [token]);

  const fetchCPSourcing = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.CP_SOURCING, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CP sourcing data: ${response.status}`);
      }

      const data = await response.json();
      setCpSourcingList(data.cpSourcing || data || []);
    } catch (err: any) {
      console.error("Error fetching CP sourcing data:", err);
      setError(err.message || "Failed to fetch CP sourcing data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sourcing: CPSourcing) => {
    setSourcingToDelete(sourcing);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sourcingToDelete) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_CP_SOURCING(sourcingToDelete._id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete CP sourcing: ${response.status}`);
      }

      // Remove from local state
      setCpSourcingList(prev => prev.filter(s => s._id !== sourcingToDelete._id));
      setDeleteModalOpen(false);
      setSourcingToDelete(null);
    } catch (err: any) {
      console.error("Error deleting CP sourcing:", err);
      setError(err.message || "Failed to delete CP sourcing");
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatLocation = (location: Location | undefined) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return 'N/A';
    }
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const getProjectName = (project: Project | undefined) => {
    if (project && project.name && project.name.trim()) {
      return project.name;
    }
    return 'Unknown Project';
  };

  const getLatestSourcingData = (sourcing: CPSourcing) => {
    if (sourcing.sourcingHistory && sourcing.sourcingHistory.length > 0) {
      // Get the latest sourcing entry (most recent date)
      const latest = sourcing.sourcingHistory.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return latest;
    }
    return null;
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) {
      console.log('No image path provided');
      return '';
    }
    
    console.log('Original image path:', imagePath);
    
    // If it's a local file path, convert it to a file:// URL
    if (imagePath.includes('uploads\\') || imagePath.includes('uploads/')) {
      // Convert backslashes to forward slashes for proper URL construction
      const normalizedPath = imagePath.replace(/\\/g, '/');
      console.log('Normalized path:', normalizedPath);
      
      // For local files, we need to serve them through the backend
      // The backend should serve static files from the uploads directory
      const fullUrl = `${API_BASE_URL}/${normalizedPath}`;
      console.log('Full image URL:', fullUrl);
      
      return fullUrl;
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file://')) {
      return imagePath;
    }
    
    // Default fallback
    return imagePath;
  };

  // Component to handle image display with fallback
  const ImageDisplay = ({ src, alt, className, fallbackIcon = "lucide:user" }: {
    src: string | undefined;
    alt: string;
    className: string;
    fallbackIcon?: string;
  }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (!src || imageError) {
      return (
        <div className={`${className} bg-orange-100 rounded-full flex items-center justify-center`}>
          <Icon icon={fallbackIcon} className="w-4 h-4 text-orange-600" />
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        crossOrigin="anonymous"
        onError={(e) => {
          console.log('Image failed to load:', src);
          console.log('Error details:', e);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', src);
          setImageLoaded(true);
        }}
        style={{ 
          objectFit: 'cover',
          borderRadius: '50%'
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CP sourcing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CP Sourcing</h1>
          <p className="text-gray-600">Manage channel partner sourcing activities</p>
        </div>
        <div className="flex gap-2">
          <Button
            color="blue"
            onClick={() => {
              // Test if backend is serving static files
              const testUrl = `${API_BASE_URL}/uploads/cpsourcing/test.jpg`;
              console.log('Testing image URL:', testUrl);
              window.open(testUrl, '_blank');
            }}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:test-tube" className="w-4 h-4" />
            Test Image
          </Button>
          <Button
            color="orange"
            onClick={() => router.push('/apps/cp-sourcing/add')}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
            Add CP Sourcing
          </Button>
        </div>
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {/* Debug Section - Remove this after fixing */}
      {cpSourcingList.length > 0 && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>API Base URL: {API_BASE_URL}</div>
            <div>Environment: {process.env.NODE_ENV}</div>
            {cpSourcingList[0]?.sourcingHistory?.[0]?.selfie && (
              <div>
                Sample Image Path: {cpSourcingList[0].sourcingHistory[0].selfie}
              </div>
            )}
            {cpSourcingList[0]?.sourcingHistory?.[0]?.selfie && (
              <div>
                Generated URL: {getImageUrl(cpSourcingList[0].sourcingHistory[0].selfie)}
              </div>
            )}
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <div className="text-green-800 font-medium">✅ Images are loading but may have display issues:</div>
              <div className="text-green-700 text-xs mt-1">
                <strong>Current Image Path:</strong> {cpSourcingList[0]?.sourcingHistory?.[0]?.selfie}
                <br />
                <strong>Generated URL:</strong> {cpSourcingList[0]?.sourcingHistory?.[0]?.selfie ? getImageUrl(cpSourcingList[0].sourcingHistory[0].selfie) : 'N/A'}
                <br />
                <br />
                <strong>Test the URL directly:</strong>
                <br />
                <a 
                  href={cpSourcingList[0]?.sourcingHistory?.[0]?.selfie ? getImageUrl(cpSourcingList[0].sourcingHistory[0].selfie) : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {cpSourcingList[0]?.sourcingHistory?.[0]?.selfie ? getImageUrl(cpSourcingList[0].sourcingHistory[0].selfie) : 'N/A'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        {cpSourcingList.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:handshake" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No CP Sourcing Data</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first CP sourcing activity.</p>
            <Button
              color="orange"
              onClick={() => router.push('/apps/cp-sourcing/add')}
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
              Add CP Sourcing
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Partner Name</Table.HeadCell>
                <Table.HeadCell>Phone</Table.HeadCell>
                <Table.HeadCell>Project</Table.HeadCell>
                <Table.HeadCell>Latest Location</Table.HeadCell>
                <Table.HeadCell>Latest Selfie</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Last Visit</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {cpSourcingList.map((sourcing) => {
                  const latestData = getLatestSourcingData(sourcing);
                  return (
                  <Table.Row key={sourcing._id || 'unknown'} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <ImageDisplay
                          src={latestData?.selfie ? getImageUrl(latestData.selfie) : undefined}
                          alt={sourcing.channelPartnerId?.name || 'Channel Partner'}
                          className="w-8 h-8 rounded-full object-cover"
                          fallbackIcon="lucide:user"
                        />
                        {sourcing.channelPartnerId?.name || 'Unknown Partner'}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{sourcing.channelPartnerId?.phone || 'N/A'}</Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {getProjectName(sourcing.projectId)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-gray-500">
                        {latestData ? formatLocation(latestData.location) : 'N/A'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                        {latestData?.selfie ? (
                          <div className="flex items-center gap-2">
                            <ImageDisplay
                              src={getImageUrl(latestData.selfie)}
                              alt="Latest Selfie"
                              className="w-8 h-8 rounded-full object-cover"
                              fallbackIcon="lucide:camera"
                            />
                            <span className="text-xs text-gray-500">Captured</span>
                            {/* Debug info */}
                            <div className="text-xs text-gray-400 max-w-xs truncate">
                              {latestData.selfie}
                            </div>
                            {/* Test image display */}
                            <div className="text-xs">
                              <img 
                                src={getImageUrl(latestData.selfie)} 
                                alt="Test" 
                                className="w-4 h-4 border border-gray-300"
                                onLoad={() => console.log('Test image loaded')}
                                onError={() => console.log('Test image failed')}
                              />
                            </div>
                          </div>
                        ) : (
                        <span className="text-xs text-gray-400">No selfie</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={sourcing.isActive ? "green" : "red"} size="sm">
                        {sourcing.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-gray-500">
                        {latestData ? formatDate(latestData.date) : formatDate(sourcing.createdAt)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => router.push(`/apps/cp-sourcing/edit/${sourcing._id}`)}
                        >
                          <Icon icon="lucide:edit" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => setSourcingToDelete(sourcing)}
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Modal.Header>Delete CP Sourcing</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon icon="lucide:alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this CP sourcing record?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the sourcing record for{" "}
              <strong>{sourcingToDelete?.channelPartnerId?.name || 'Unknown Partner'}</strong> and all associated data.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p><strong>Partner:</strong> {sourcingToDelete?.channelPartnerId?.name || 'Unknown'}</p>
              <p><strong>Project:</strong> {getProjectName(sourcingToDelete?.projectId)}</p>
              <p><strong>Status:</strong> {sourcingToDelete?.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Visits:</strong> {sourcingToDelete?.sourcingHistory?.length || 0} visit(s)</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button color="failure" onClick={confirmDelete}>
            Delete CP Sourcing
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CPSourcingPage;
