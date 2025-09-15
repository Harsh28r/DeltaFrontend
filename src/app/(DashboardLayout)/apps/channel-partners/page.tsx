"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";
import { getSelfieUrl, cleanupObjectUrl } from "@/utils/cpSourcingUtils";

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
  status: string;
}

const ChannelPartnersPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch channel partners
  useEffect(() => {
    if (token) {
      fetchChannelPartners();
    }
  }, [token]);

  const fetchChannelPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.CHANNEL_PARTNERS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channel partners: ${response.status}`);
      }

      const data = await response.json();
      setChannelPartners(data.channelPartners || data || []);
    } catch (err: any) {
      console.error("Error fetching channel partners:", err);
      setError(err.message || "Failed to fetch channel partners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (partner: ChannelPartner) => {
    setSelectedPartner(partner);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPartner) return;

    try {
      setIsDeleting(true);
      const response = await fetch(API_ENDPOINTS.DELETE_CHANNEL_PARTNER(selectedPartner._id), {
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

      // Remove from local state
      setChannelPartners(prev => prev.filter(p => p._id !== selectedPartner._id));
      setDeleteModalOpen(false);
      setSelectedPartner(null);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error("Error deleting channel partner:", err);
      setError(err.message || "Failed to delete channel partner");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading channel partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Partners</h1>
          <p className="text-gray-600">Manage your channel partner network</p>
        </div>
        <Button
          color="orange"
          onClick={() => router.push('/apps/channel-partners/add')}
          className="flex items-center gap-2"
        >
          <Icon icon="lucide:plus" className="w-4 h-4" />
          Add Channel Partner
        </Button>
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      <Card>
        {channelPartners.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:users" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Channel Partners</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first channel partner.</p>
            <Button
              color="orange"
              onClick={() => router.push('/apps/channel-partners/add')}
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
              Add Channel Partner
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell>Firm Name</Table.HeadCell>
                <Table.HeadCell>Phone</Table.HeadCell>
                <Table.HeadCell>Location</Table.HeadCell>
                <Table.HeadCell>MAHARERA No.</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Created</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {channelPartners.map((partner) => (
                  <Table.Row key={partner._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {partner.photo ? (
                          <img
                            src={partner.photo}
                            alt={partner.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Icon icon="lucide:user" className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        {partner.name}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{partner.firmName}</Table.Cell>
                    <Table.Cell>{partner.phone}</Table.Cell>
                    <Table.Cell>{partner.location}</Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {partner.mahareraNo}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {partner.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(partner.createdAt)}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => router.push(`/apps/channel-partners/${partner._id}`)}
                          title="View Details"
                        >
                          <Icon icon="lucide:eye" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => router.push(`/apps/channel-partners/edit/${partner._id}`)}
                          title="Edit"
                        >
                          <Icon icon="lucide:edit" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => handleDelete(partner)}
                          title="Delete"
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

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
              <strong>{selectedPartner?.name}</strong> and all associated data.
            </p>
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

export default ChannelPartnersPage;
