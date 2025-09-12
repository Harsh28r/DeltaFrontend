"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface ChannelPartnerData {
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface CPSourcing {
  _id: string;
  channelPartnerData: ChannelPartnerData;
  projectId: string;
  projectName?: string;
  location: Location;
  selfie?: string;
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
  const [selectedSourcing, setSelectedSourcing] = useState<CPSourcing | null>(null);

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
    setSelectedSourcing(sourcing);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSourcing) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_CP_SOURCING(selectedSourcing._id), {
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
      setCpSourcingList(prev => prev.filter(s => s._id !== selectedSourcing._id));
      setDeleteModalOpen(false);
      setSelectedSourcing(null);
    } catch (err: any) {
      console.error("Error deleting CP sourcing:", err);
      setError(err.message || "Failed to delete CP sourcing");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLocation = (location: Location) => {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
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
        <Button
          color="orange"
          onClick={() => router.push('/apps/cp-sourcing/add')}
          className="flex items-center gap-2"
        >
          <Icon icon="lucide:plus" className="w-4 h-4" />
          Add CP Sourcing
        </Button>
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
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
                <Table.HeadCell>Firm Name</Table.HeadCell>
                <Table.HeadCell>Phone</Table.HeadCell>
                <Table.HeadCell>Project</Table.HeadCell>
                <Table.HeadCell>Location</Table.HeadCell>
                <Table.HeadCell>MAHARERA</Table.HeadCell>
                <Table.HeadCell>Created</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {cpSourcingList.map((sourcing) => (
                  <Table.Row key={sourcing._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {sourcing.selfie ? (
                          <img
                            src={sourcing.selfie}
                            alt={sourcing.channelPartnerData.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Icon icon="lucide:user" className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        {sourcing.channelPartnerData.name}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{sourcing.channelPartnerData.firmName}</Table.Cell>
                    <Table.Cell>{sourcing.channelPartnerData.phone}</Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {sourcing.projectName || sourcing.projectId}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-xs text-gray-500">
                        {formatLocation(sourcing.location)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {sourcing.channelPartnerData.mahareraNo ? (
                        <Badge color="blue" size="sm">
                          {sourcing.channelPartnerData.mahareraNo}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">Not provided</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>{formatDate(sourcing.createdAt)}</Table.Cell>
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
                          onClick={() => handleDelete(sourcing)}
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
        <Modal.Header>Delete CP Sourcing</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon icon="lucide:alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this CP sourcing record?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete the sourcing record for{" "}
              <strong>{selectedSourcing?.channelPartnerData.name}</strong> and all associated data.
            </p>
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
