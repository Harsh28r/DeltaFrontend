"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert, Modal, Table } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";
import { getSelfieUrl, cleanupObjectUrl } from "@/utils/cpSourcingUtils";
import LocationMap from "@/components/LocationMap";

interface Location {
  lat: number;
  lng: number;
  placeName?: string; // Add place name field
}

interface SourcingHistoryItem {
  _id: string;
  location: Location;
  date: string;
  selfie: string;
  notes: string;
}

interface ChannelPartner {
  _id: string;
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
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

const CPSourcingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const sourcingId = params.id as string;

  const [sourcing, setSourcing] = useState<CPSourcing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selfieUrls, setSelfieUrls] = useState<{ [key: string]: string }>({});
  const [loadingSelfies, setLoadingSelfies] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (token && sourcingId) {
      fetchSourcingDetails();
    }
  }, [token, sourcingId]);

  const fetchSourcingDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.CP_SOURCING_BY_ID(sourcingId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CP sourcing details: ${response.status}`);
      }

      const data = await response.json();
      setSourcing(data);
      
      // Load selfie URLs
      if (data.sourcingHistory && data.sourcingHistory.length > 0) {
        loadSelfieUrls(data.sourcingHistory);
      }
    } catch (err: any) {
      console.error("Error fetching CP sourcing details:", err);
      setError(err.message || "Failed to fetch CP sourcing details");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSelfieUrls = async (sourcingHistory: SourcingHistoryItem[]) => {
    for (let i = 0; i < sourcingHistory.length; i++) {
      const item = sourcingHistory[i];
      if (item.selfie) {
        const selfieKey = `${sourcingId}-${i}`;
        setLoadingSelfies(prev => ({ ...prev, [selfieKey]: true }));
        
        try {
          const url = await getSelfieUrl(item.selfie, sourcingId, i, token || undefined);
          setSelfieUrls(prev => ({ ...prev, [selfieKey]: url }));
        } catch (error) {
          console.error(`Failed to load selfie ${i}:`, error);
          // Fallback to direct URL construction
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
          const fallbackUrl = `${baseUrl}/${item.selfie}`;
          setSelfieUrls(prev => ({ ...prev, [selfieKey]: fallbackUrl }));
        } finally {
          setLoadingSelfies(prev => ({ ...prev, [selfieKey]: false }));
        }
      }
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(selfieUrls).forEach(url => cleanupObjectUrl(url));
    };
  }, [selfieUrls]);

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sourcing) return;

    try {
      setIsDeleting(true);
      const response = await fetch(API_ENDPOINTS.DELETE_CP_SOURCING(sourcing._id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete CP sourcing: ${response.status}`);
      }

      // Redirect back to list
      router.push("/apps/cp-sourcing");
    } catch (err: any) {
      console.error("Error deleting CP sourcing:", err);
      setError(err.message || "Failed to delete CP sourcing");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

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

  const formatLocation = (location: Location) => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return 'N/A';
    }
    
    // If place name is available, show it
    if (location.placeName && location.placeName.trim()) {
      return location.placeName;
    }
    
    // Fallback to coordinates
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const getLocationDisplay = (item: SourcingHistoryItem) => {
    // First try to get place name from sourcing data
    if (item.location?.placeName && item.location.placeName.trim()) {
      return item.location.placeName;
    }
    
    // Fallback to channel partner's location
    if (sourcing?.channelPartnerId?.location && sourcing.channelPartnerId.location.trim()) {
      return sourcing.channelPartnerId.location;
    }
    
    // Fallback to coordinates
    return formatLocation(item.location);
  };

  const getSelfieImageUrl = (selfiePath: string, index: number) => {
    if (!selfiePath) return undefined;
    const selfieKey = `${sourcingId}-${index}`;
    return selfieUrls[selfieKey] || undefined;
  };

  const isSelfieLoading = (index: number) => {
    const selfieKey = `${sourcingId}-${index}`;
    return loadingSelfies[selfieKey] || false;
  };

  const getLatestSourcingData = () => {
    if (sourcing?.sourcingHistory && sourcing.sourcingHistory.length > 0) {
      return sourcing.sourcingHistory.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!sourcing) {
    return (
      <div className="p-6">
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">CP sourcing record not found</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const latestData = getLatestSourcingData();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">CP Sourcing Details</h1>
            <p className="text-gray-600">Channel Partner: {sourcing.channelPartnerId?.name || 'Unknown'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="orange"
            onClick={() => router.push(`/apps/cp-sourcing/${sourcingId}/edit`)}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:edit" className="w-4 h-4" />
            Edit
          </Button>
          <Button
            color="failure"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:trash-2" className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Partner Information */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:user" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-white-900">Channel Partner Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Firm Name</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.firmName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.location || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.address || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">MAHARERA Number</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.mahareraNo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">PIN Code</label>
                <p className="text-gray-900">{sourcing.channelPartnerId?.pinCode || 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Sourcing History */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:history" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Sourcing History</h2>
            </div>
            {sourcing.sourcingHistory && sourcing.sourcingHistory.length > 0 ? (
              <div className="space-y-4">
                {sourcing.sourcingHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((item, index) => {
                    const originalIndex = sourcing.sourcingHistory.length - 1 - index;
                    const selfieUrl = getSelfieImageUrl(item.selfie, originalIndex);
                    const isLoading = isSelfieLoading(originalIndex);
                    
                    return (
                      <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge color="blue" size="sm">
                              Visit #{sourcing.sourcingHistory.length - index}
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
                            <p className="text-gray-900 mb-2">
                              {getLocationDisplay(item)}
                            </p>
                            {item.location && (
                              <LocationMap
                                location={item.location}
                                height="150px"
                                width="100%"
                                showPopup={true}
                                popupContent={getLocationDisplay(item)}
                                className="mt-2"
                              />
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-gray-900">{item.notes || 'No notes'}</p>
                          </div>
                        </div>
                        
                        {item.selfie && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Selfie</label>
                            <div className="flex justify-center">
                              {isLoading ? (
                                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                              ) : selfieUrl ? (
                                <img
                                  src={selfieUrl}
                                  alt={`Selfie from ${formatDate(item.date)}`}
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
                                  <Icon icon="lucide:image-x" className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {item.selfie && (
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                API: {API_ENDPOINTS.CP_SOURCING_SELFIE(sourcingId, originalIndex)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon icon="lucide:calendar-x" className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No sourcing history available</p>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Project Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:building" className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Project</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Project Name</label>
                <p className="text-gray-900">{sourcing.projectId?.name || 'Unknown Project'}</p>
              </div>
              {sourcing.projectId?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 text-sm">{sourcing.projectId.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Status Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:info" className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge color={sourcing.isActive ? "green" : "red"} size="sm">
                    {sourcing.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Total Visits</label>
                <p className="text-gray-900">{sourcing.sourcingHistory?.length || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 text-sm">{formatDate(sourcing.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 text-sm">{formatDate(sourcing.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* Latest Selfie */}
          {latestData?.selfie && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Icon icon="lucide:camera" className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Latest Selfie</h3>
              </div>
              <div className="text-center">
                {(() => {
                  const latestIndex = sourcing?.sourcingHistory?.length ? sourcing.sourcingHistory.length - 1 : 0;
                  const selfieUrl = getSelfieImageUrl(latestData.selfie, latestIndex);
                  const isLoading = isSelfieLoading(latestIndex);
                  
                  if (isLoading) {
                    return (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                      </div>
                    );
                  } else if (selfieUrl) {
                    return (
                      <img
                        src={selfieUrl}
                        alt="Latest selfie"
                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    );
                  } else {
                    return (
                      <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
                        <Icon icon="lucide:image-x" className="w-12 h-12 text-gray-400" />
                      </div>
                    );
                  }
                })()}
                <p className="text-xs text-gray-500 mt-2">
                  From {formatDate(latestData.date)}
                </p>
                {latestData.selfie && (
                  <p className="text-xs text-gray-400 mt-1">
                    API: {API_ENDPOINTS.CP_SOURCING_SELFIE(sourcingId, sourcing?.sourcingHistory?.length ? sourcing.sourcingHistory.length - 1 : 0)}
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

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
              <strong>{sourcing.channelPartnerId?.name || 'Unknown Partner'}</strong> and all associated data.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p><strong>Partner:</strong> {sourcing.channelPartnerId?.name || 'Unknown'}</p>
              <p><strong>Project:</strong> {sourcing.projectId?.name || 'Unknown Project'}</p>
              <p><strong>Status:</strong> {sourcing.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Visits:</strong> {sourcing.sourcingHistory?.length || 0} visit(s)</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="failure" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete CP Sourcing'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CPSourcingDetailPage;
