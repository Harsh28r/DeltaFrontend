"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config"; // Fixed API_BASE_URL import
import LocationMap from "@/components/LocationMap";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface ChannelPartner {
  _id: string;
  name: string;
  phone: string;
  location?: string;
  firmName?: string;
  address?: string;
  mahareraNo?: string;
  pinCode?: string;
}

interface Project {
  _id: string;
  name: string;
  location?: string;
}

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
      console.log('API Response:', data);
      
      // Ensure we always have an array
      let sourcingList = [];
      if (Array.isArray(data.cpSourcings)) {
        sourcingList = data.cpSourcings;
      } else if (Array.isArray(data.cpSourcing)) {
        sourcingList = data.cpSourcing;
      } else if (Array.isArray(data)) {
        sourcingList = data;
      } else {
        console.warn('Unexpected API response structure:', data);
        sourcingList = [];
      }
      
      console.log('Parsed sourcing list:', sourcingList);
      setCpSourcingList(sourcingList);
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
    
    // If place name is available, show it
    if (location.placeName && location.placeName.trim()) {
      return location.placeName;
    }
    
    // Fallback to coordinates
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const getProjectName = (project: Project | undefined) => {
    if (project && project.name && project.name.trim()) {
      return project.name;
    }
    return 'Unknown Project';
  };

  const getLocationDisplay = (sourcing: CPSourcing, latestData: SourcingHistoryItem | null) => {
    // First try to get place name from latest sourcing data
    if (latestData?.location?.placeName && latestData.location.placeName.trim()) {
      return latestData.location.placeName;
    }
    
    // Fallback to channel partner's location
    if (sourcing.channelPartnerId?.location && sourcing.channelPartnerId.location.trim()) {
      return sourcing.channelPartnerId.location;
    }
    
    // Fallback to coordinates
    if (latestData?.location) {
      return `${latestData.location.lat.toFixed(4)}, ${latestData.location.lng.toFixed(4)}`;
    }
    
    return 'N/A';
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
    if (!imagePath) return undefined;

    // Always route through backend API for S3 Express buckets
    // Extract S3 key from full URL if it's a complete S3 URL
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // Extract S3 key from full URL
      try {
        const url = new URL(imagePath);
        const s3Key = url.pathname.substring(1); // Remove leading slash
        return `${API_BASE_URL}/api/cp-sourcing/selfie/${encodeURIComponent(s3Key)}`;
      } catch (error) {
        console.warn('Failed to parse S3 URL:', imagePath);
        return undefined;
      }
    }

    // If path contains '/', it's an S3 key - route through backend API
    if (imagePath.includes('/')) {
      // S3 key format: "cp-sourcing/userId/filename.jpeg"        
      // Backend endpoint: GET /api/cp-sourcing/selfie/:filename
      return `${API_BASE_URL}/api/cp-sourcing/selfie/${encodeURIComponent(imagePath)}`;
    }

    // Legacy local file (just filename, no path)
    // Route through backend API as well
    return `${API_BASE_URL}/api/cp-sourcing/selfie/${imagePath}`;
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
    const [imageSrc, setImageSrc] = useState<string | undefined>(src);
    const [isLoading, setIsLoading] = useState(false);
    const [isS3Url, setIsS3Url] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Handle authenticated image loading
    // const loadAuthenticatedImage = async (url: string) => {
    //   try {
    //     setIsLoading(true);
    //     console.log('Loading authenticated image:', url);
    //     const response = await fetch(url, {
    //       method: 'GET',
    //       headers: {
    //         'Authorization': `Bearer ${token}`,
    //       },
    //       credentials: 'include',
    //     });

    //     console.log('Image response status:', response.status);
    //     if (response.ok) {
    //       const blob = await response.blob();
    //       const objectUrl = URL.createObjectURL(blob);
    //       console.log('Image loaded successfully, blob URL created');
    //       setImageSrc(objectUrl);
    //     } else {
    //       console.warn(`Failed to load authenticated image: ${url} - ${response.status}`);
    //       setImageError(true);
    //     }
    //   } catch (error) {
    //     console.warn(`Error loading authenticated image: ${url}`, error);
    //     setImageError(true);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };

    // // Check if this is an authenticated API endpoint
    // React.useEffect(() => {
    //   if (src) {
    //     const isS3 = src.includes('s3.amazonaws.com') || src.includes('s3express');
    //     setIsS3Url(isS3);
        
    //     if (src.includes('/api/cp-sourcing/') && !isS3) {
    //       loadAuthenticatedImage(src);
    //     } else {
    //       setImageSrc(src);
    //     }
    //   }
    // }, [src, token]);



    
    const loadAuthenticatedImage = async (url: string) => {
      // Don't attempt to load if no token is available
      if (!token) {
        setImageError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
        } else if (response.status === 404) {
          // 404 is expected when images don't exist - handle gracefully without logging
          setImageError(true);
        } else if (response.status === 401) {
          // 401 means unauthorized - log this as it's an authentication issue
          console.warn('[Image Tracking] Unauthorized access to image:', {
            url,
            alt,
            status: response.status
          });
          setImageError(true);
        } else {
          // Other errors (500, etc.) - log as unexpected
          console.warn('[Image Tracking] Failed to load authenticated image:', {
            url,
            alt,
            status: response.status,
            statusText: response.statusText
          });
          setImageError(true);
        }
      } catch (error) {
        // Network errors or other exceptions
        console.warn('[Image Tracking] Error loading authenticated image:', {
          url,
          alt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if this is an authenticated API endpoint
    React.useEffect(() => {
      if (src && src.includes('/api/cp-sourcing/')) {
        loadAuthenticatedImage(src);
      } else {
        setImageSrc(src);
      }
    }, [src, token]);

    // Cleanup: Revoke object URLs when component unmounts or imageSrc changes
    React.useEffect(() => {
      return () => {
        if (imageSrc && imageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc);
        }
      };
    }, [imageSrc]);

    if (isLoading) {
      return (
        <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
        
      );
    }

    if (!imageSrc || imageError) {
      return (
        <div className={`${className} bg-orange-100 rounded-lg flex items-center justify-center`}>
          <Icon icon={fallbackIcon} className="w-4 h-4 text-orange-600" />
        </div>
      );
      // eslint-disable-next-line react/jsx-no-useless-fragment gdgshgs
    }

    return (
      <>
        <button
          type="button"
          className="relative"
          onClick={() => setIsPreviewOpen(true)}
          title="View full image"
        >
          <img
            src={imageSrc}
            alt={alt}
            className={`${className} cursor-zoom-in`}
            crossOrigin="use-credentials"
            onError={(e) => {
              // Only log if it's not a blob URL (which we already handled in loadAuthenticatedImage)
              if (!imageSrc?.startsWith('blob:')) {
                console.warn('[Image Tracking] Failed to render image:', {
                  url: imageSrc,
                  originalSrc: src,
                  alt,
                  error: e.type
                });
              }
              setImageError(true);
            }}
            onLoad={() => {
              setImageLoaded(true);
            }}
            style={{ 
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </button>

        <Modal
          show={isPreviewOpen}
          size="xl"
          onClose={() => setIsPreviewOpen(false)}
        >
          <Modal.Header>{alt}</Modal.Header>
          <Modal.Body>
            <div className="flex justify-center">
              <img
                src={imageSrc}
                alt={alt}
                className="max-h-[70vh] rounded-lg object-contain"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button color="gray" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </>
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


      <Card>
        {!Array.isArray(cpSourcingList) || cpSourcingList.length === 0 ? (
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
                <Table.HeadCell>Sourced By</Table.HeadCell>
                <Table.HeadCell>Project</Table.HeadCell>
                <Table.HeadCell>Latest Location</Table.HeadCell>
                <Table.HeadCell>Map</Table.HeadCell>
                <Table.HeadCell>Latest Selfie</Table.HeadCell>
                <Table.HeadCell>Visits</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Last Visit</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {Array.isArray(cpSourcingList) && cpSourcingList.map((sourcing) => {
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
                        <button
                          onClick={() => router.push(`/apps/cp-sourcing/${sourcing._id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {sourcing.channelPartnerId?.name || 'Unknown Partner'}
                        </button>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{sourcing.channelPartnerId?.phone || 'N/A'}</Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {sourcing.userId?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {sourcing.userId?.email || 'N/A'}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {getProjectName(sourcing.projectId)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-gray-500">
                        {getLocationDisplay(sourcing, latestData)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {latestData?.location ? (
                        <LocationMap
                          location={latestData.location}
                          height="60px"
                          width="80px"
                          showPopup={true}
                          popupContent={getLocationDisplay(sourcing, latestData)}
                        />
                      ) : (
                        <div className="w-20 h-15 bg-gray-100 rounded flex items-center justify-center">
                          <Icon icon="lucide:map-pin" className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
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
                          </div>
                        ) : (
                        <span className="text-xs text-gray-400">No selfie</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Badge color="purple" size="sm">
                          {sourcing.sourcingHistory?.length || 0}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {sourcing.sourcingHistory?.length === 1 ? 'visit' : 'visits'}
                        </span>
                      </div>
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
                          color="gray"
                          onClick={() => router.push(`/apps/cp-sourcing/${sourcing._id}`)}
                          title="View Details"
                        >
                          <Icon icon="lucide:eye" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => router.push(`/apps/cp-sourcing/edit/${sourcing._id}`)}
                          title="Edit"
                        >
                          <Icon icon="lucide:edit" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => setSourcingToDelete(sourcing)}
                          title="Delete"
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
              <p><strong>Sourced By:</strong> {sourcingToDelete?.userId?.name || 'Unknown User'}</p>
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
