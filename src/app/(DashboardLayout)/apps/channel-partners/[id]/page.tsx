"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert, Modal } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface ChannelPartner {
  _id: string;
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

const ChannelPartnerDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<ChannelPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (token && partnerId) {
      fetchPartnerDetails();
    }
  }, [token, partnerId]);

  const fetchPartnerDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.CHANNEL_PARTNER_BY_ID(partnerId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch channel partner details: ${response.status}`);
      }

      const data = await response.json();
      setPartner(data);
    } catch (err: any) {
      console.error("Error fetching channel partner details:", err);
      setError(err.message || "Failed to fetch channel partner details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!partner) return;

    try {
      setIsDeleting(true);
      const response = await fetch(API_ENDPOINTS.DELETE_CHANNEL_PARTNER(partner._id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete channel partner: ${response.status}`);
      }

      // Redirect back to list
      router.push("/apps/channel-partners");
    } catch (err: any) {
      console.error("Error deleting channel partner:", err);
      setError(err.message || "Failed to delete channel partner");
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

  if (!partner) {
    return (
      <div className="p-6">
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">Channel partner not found</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Channel Partner Details</h1>
            <p className="text-gray-600">{partner.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="orange"
            onClick={() => router.push(`/apps/channel-partners/edit/${partner._id}`)}
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
        {/* Main Information */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:user" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">Partner Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{partner.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{partner.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Firm Name</label>
                <p className="text-gray-900">{partner.firmName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-gray-900">{partner.location}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">{partner.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">MAHARERA Number</label>
                <p className="text-gray-900">{partner.mahareraNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">PIN Code</label>
                <p className="text-gray-900">{partner.pinCode}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Photo */}
          {partner.photo && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Icon icon="lucide:camera" className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Photo</h3>
              </div>
              <div className="text-center">
                <img
                  src={partner.photo}
                  alt={partner.name}
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </Card>
          )}

          {/* Record Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:info" className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Record Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Partner ID</label>
                <p className="text-gray-900 font-mono text-sm">{partner._id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900 text-sm">{formatDate(partner.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 text-sm">{formatDate(partner.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* API Information */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:database" className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">API Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">API Endpoint</label>
                <p className="text-gray-900 font-mono text-xs break-all bg-gray-100 p-2 rounded">
                  {API_ENDPOINTS.CHANNEL_PARTNER_BY_ID(partnerId)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Method</label>
                <p className="text-gray-900">GET</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Modal.Header>Delete Channel Partner</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon icon="lucide:alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this channel partner?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete{" "}
              <strong>{partner.name}</strong> and all associated data.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p><strong>Name:</strong> {partner.name}</p>
              <p><strong>Firm:</strong> {partner.firmName}</p>
              <p><strong>Phone:</strong> {partner.phone}</p>
              <p><strong>Location:</strong> {partner.location}</p>
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
              'Delete Channel Partner'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChannelPartnerDetailPage;
