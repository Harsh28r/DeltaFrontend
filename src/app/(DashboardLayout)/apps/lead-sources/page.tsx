"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

interface LeadSource {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const LeadSourcesPage = () => {
  const { token } = useAuth();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchLeadSources();
    }
  }, [token]);

  const fetchLeadSources = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.LEAD_SOURCES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLeadSources(data.leadSources || data || []);
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch lead sources' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const url = editingSource 
        ? API_ENDPOINTS.UPDATE_LEAD_SOURCE(editingSource._id)
        : API_ENDPOINTS.CREATE_LEAD_SOURCE;
      
      const method = editingSource ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (editingSource) {
        setLeadSources(prev => 
          prev.map(source => 
            source._id === editingSource._id 
              ? { ...source, ...data.leadSource, ...data }
              : source
          )
        );
        setAlertMessage({ type: 'success', message: 'Lead source updated successfully!' });
      } else {
        setLeadSources(prev => [...prev, data.leadSource || data]);
        setAlertMessage({ type: 'success', message: 'Lead source created successfully!' });
      }

      createRefreshEvent();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving lead source:", error);
      setAlertMessage({ type: 'error', message: 'Failed to save lead source' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead source?")) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_LEAD_SOURCE(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLeadSources(prev => prev.filter(source => source._id !== id));
      setAlertMessage({ type: 'success', message: 'Lead source deleted successfully!' });
      createRefreshEvent();
    } catch (error) {
      console.error("Error deleting lead source:", error);
      setAlertMessage({ type: 'error', message: 'Failed to delete lead source' });
    }
  };

  const handleEdit = (source: LeadSource) => {
    setEditingSource(source);
    setFormData({ name: source.name });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSource(null);
    setFormData({ name: "" });
  };

  const handleAddNew = () => {
    setEditingSource(null);
    setFormData({ name: "" });
    setIsModalOpen(true);
  };

  const filteredSources = leadSources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Sources</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage lead sources for your CRM</p>
        </div>
        <Button onClick={handleAddNew} color="primary">
          <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
          Add Lead Source
        </Button>
      </div>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          color={alertMessage.type === 'success' ? 'success' : 'failure'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <TextInput
              placeholder="Search lead sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
            />
          </div>
          <Badge color="info" size="lg">
            {filteredSources.length} Lead Source{filteredSources.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </Card>

      {/* Lead Sources Table */}
      <Card>
        <Table>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Created</Table.HeadCell>
            <Table.HeadCell>Updated</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {filteredSources.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={4} className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                    <p>No lead sources found</p>
                    <p className="text-sm">Create your first lead source to get started</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredSources.map((source) => (
                <Table.Row key={source._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {source.name}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(source.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(source.updatedAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() => handleEdit(source)}
                      >
                        <Icon icon="solar:pen-line-duotone" className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(source._id)}
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal}>
        <Modal.Header>
          {editingSource ? 'Edit Lead Source' : 'Add New Lead Source'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" value="Lead Source Name" />
                <TextInput
                  id="name"
                  type="text"
                  placeholder="Enter lead source name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
              )}
              {editingSource ? 'Update' : 'Create'}
            </Button>
            <Button color="gray" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default LeadSourcesPage;
