"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert, Modal, Table } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";
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
}

interface Project {
  _id: string;
  name: string;
  location: string;
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

  useEffect(() => {
    if (token && sourcingId) {
      fetchSourcingDetails();
    }
  }, [token, sourcingId]);

  const fetchSourcingDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_ENDPOINTS.CP_SOURCING_BY_ID(sourcingId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("CP Sourcing record not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch CP sourcing details: ${response.status}`
        );
      }

      const data = await response.json();
      setSourcing(data);
    } catch (err: any) {
      console.error("Error fetching CP sourcing details:", err);
      setError(err.message || "Failed to fetch CP sourcing details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sourcing) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        API_ENDPOINTS.DELETE_CP_SOURCING(sourcing._id),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to delete CP sourcing: ${response.status}`
        );
      }

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
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) {
      return '';
    }
    
    // If it's a local file path, convert it to a proper URL
    if (imagePath.includes('uploads\\') || imagePath.includes('uploads/')) {
      // Convert backslashes to forward slashes for proper URL construction
      const normalizedPath = imagePath.replace(/\\/g, '/');
      
      // For local files, we need to serve them through the backend
      const fullUrl = `${API_BASE_URL}/${normalizedPath}`;
      
      return fullUrl;
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('file://')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend the API base URL
    if (imagePath.startsWith('/')) {
      return `${API_BASE_URL}${imagePath}`;
    }
    
    // Default fallback - assume it's a relative path
    return `${API_BASE_URL}/${imagePath}`;
  };

  // Component to handle image display with fallback
  const ImageDisplay = ({ src, alt, className, fallbackIcon = "lucide:camera" }: {
    src: string | undefined;
    alt: string;
    className: string;
    fallbackIcon?: string;
  }) => {
    const [imageError, setImageError] = useState(false);

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
          console.warn(`Failed to load image: ${src}`);
          setImageError(true);
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
          <span className="ml-2">CP Sourcing record not found</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const latestSourcing = sourcing.sourcingHistory[sourcing.sourcingHistory.length - 1];

  return (
    <div className="p-6">
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
            <h1 className="text-2xl font-bold text-gray-900">
              CP Sourcing Details
            </h1>
            <p className="text-gray-600">
              {sourcing.channelPartnerId.name} - {sourcing.projectId.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="orange"
            onClick={() => router.push(`/apps/cp-sourcing/edit/${sourcing._id}`)}
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
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:users" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Sourcing Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Channel Partner</label>
                <p className="text-gray-900 font-medium">{sourcing.channelPartnerId.name}</p>
                <p className="text-sm text-gray-600">{sourcing.channelPartnerId.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Project</label>
                <p className="text-gray-900 font-medium">{sourcing.projectId.name}</p>
                <p className="text-sm text-gray-600">{sourcing.projectId.location}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User</label>
                <p className="text-gray-900">{sourcing.userId.name}</p>
                <p className="text-sm text-gray-600">{sourcing.userId.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge color={sourcing.isActive ? "success" : "failure"}>
                  {sourcing.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </Card>

          {sourcing.sourcingHistory && sourcing.sourcingHistory.length > 0 && (
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="lucide:map-pin"
                    className="w-6 h-6 text-orange-500"
                  />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sourcing History
                  </h2>
                </div>
                <Badge color="blue" size="sm">
                  {sourcing.sourcingHistory.length} visits
                </Badge>
              </div>
              <Table>
                <Table.Head>
                  <Table.HeadCell>Date</Table.HeadCell>
                  <Table.HeadCell>Location</Table.HeadCell>
                  <Table.HeadCell>Selfie</Table.HeadCell>
                  <Table.HeadCell>Notes</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {sourcing.sourcingHistory.map((item, index) => (
                    <Table.Row key={item._id}>
                      <Table.Cell>{formatDate(item.date)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <LocationMap
                            location={item.location}
                            height="40px"
                            width="60px"
                            showPopup={false}
                          />
                          <span className="text-xs text-gray-500">
                            {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <ImageDisplay
                          src={getImageUrl(item.selfie)}
                          alt={`Selfie ${index + 1}`}
                          className="w-8 h-8 rounded-full object-cover"
                          fallbackIcon="lucide:camera"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-600">
                          {item.notes || "No notes"}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {latestSourcing?.selfie && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Icon icon="lucide:camera" className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Latest Selfie</h3>
              </div>
              <div className="text-center">
                <img
                  src={getImageUrl(latestSourcing.selfie)}
                  alt="Latest Selfie"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:info" className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Record Information
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Sourcing ID
                </label>
                <p className="text-gray-900 font-mono text-sm">{sourcing._id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <p className="text-gray-900 text-sm">
                  {formatDate(sourcing.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="text-gray-900 text-sm">
                  {formatDate(sourcing.updatedAt)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Modal.Header>Delete CP Sourcing Record</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon
              icon="lucide:alert-triangle"
              className="w-16 h-16 text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this CP sourcing record?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the sourcing record for{" "}
              <strong>{sourcing.channelPartnerId.name}</strong> and project{" "}
              <strong>{sourcing.projectId.name}</strong>.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p>
                <strong>Channel Partner:</strong> {sourcing.channelPartnerId.name}
              </p>
              <p>
                <strong>Project:</strong> {sourcing.projectId.name}
              </p>
              <p>
                <strong>Visits:</strong> {sourcing.sourcingHistory.length}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button color="failure" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete CP Sourcing Record"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CPSourcingDetailPage;
