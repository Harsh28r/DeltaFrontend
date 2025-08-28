"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

interface FormField {
  name: string;
  type: string;
  required: boolean;
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
  createdAt?: string;
  updatedAt?: string;
}

const LeadStatusesPage = () => {
  const { token } = useAuth();
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    formFields: [{ name: "", type: "text", required: false }] 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Select" },
    { value: "checkbox", label: "Checkbox" },
  ];

  useEffect(() => {
    if (token) {
      fetchLeadStatuses();
    }
  }, [token]);

  const fetchLeadStatuses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.LEAD_STATUSES, {
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
      setLeadStatuses(data.leadStatuses || data || []);
    } catch (error) {
      console.error("Error fetching lead statuses:", error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch lead statuses' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const url = editingStatus 
        ? API_ENDPOINTS.UPDATE_LEAD_STATUS(editingStatus._id)
        : API_ENDPOINTS.CREATE_LEAD_STATUS;
      
      const method = editingStatus ? "PUT" : "POST";
      
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
      
      if (editingStatus) {
        setLeadStatuses(prev => 
          prev.map(status => 
            status._id === editingStatus._id 
              ? { ...status, ...data.leadStatus, ...data }
              : status
          )
        );
        setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });
      } else {
        setLeadStatuses(prev => [...prev, data.leadStatus || data]);
        setAlertMessage({ type: 'success', message: 'Lead status created successfully!' });
      }

      createRefreshEvent();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving lead status:", error);
      setAlertMessage({ type: 'error', message: 'Failed to save lead status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead status?")) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_LEAD_STATUS(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLeadStatuses(prev => prev.filter(status => status._id !== id));
      setAlertMessage({ type: 'success', message: 'Lead status deleted successfully!' });
      createRefreshEvent();
    } catch (error) {
      console.error("Error deleting lead status:", error);
      setAlertMessage({ type: 'error', message: 'Failed to delete lead status' });
    }
  };

  const handleEdit = (status: LeadStatus) => {
    setEditingStatus(status);
    setFormData({ 
      name: status.name, 
      formFields: status.formFields.length > 0 ? status.formFields : [{ name: "", type: "text", required: false }]
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStatus(null);
    setFormData({ 
      name: "", 
      formFields: [{ name: "", type: "text", required: false }] 
    });
  };

  const handleAddNew = () => {
    setEditingStatus(null);
    setFormData({ 
      name: "", 
      formFields: [{ name: "", type: "text", required: false }] 
    });
    setIsModalOpen(true);
  };

  const addFormField = () => {
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, { name: "", type: "text", required: false }]
    }));
  };

  const removeFormField = (index: number) => {
    if (formData.formFields.length > 1) {
      setFormData(prev => ({
        ...prev,
        formFields: prev.formFields.filter((_, i) => i !== index)
      }));
    }
  };

  const updateFormField = (index: number, field: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map((f, i) => 
        i === index ? { ...f, ...field } : f
      )
    }));
  };

  const filteredStatuses = leadStatuses.filter(status =>
    status.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Statuses</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage lead statuses and their form fields</p>
        </div>
        <Button onClick={handleAddNew} color="primary">
          <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
          Add Lead Status
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
              placeholder="Search lead statuses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
            />
          </div>
          <Badge color="info" size="lg">
            {filteredStatuses.length} Lead Status{filteredStatuses.length !== 1 ? 'es' : ''}
          </Badge>
        </div>
      </Card>

      {/* Lead Statuses Table */}
      <Card>
        <Table>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Form Fields</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {filteredStatuses.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                    <p>No lead statuses found</p>
                    <p className="text-sm">Create your first lead status to get started</p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredStatuses.map((status) => (
                <Table.Row key={status._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {status.name}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="space-y-1">
                      {status.formFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge color="info" size="sm">
                            {field.name}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {field.type} {field.required && '(Required)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() => handleEdit(status)}
                      >
                        <Icon icon="solar:pen-line-duotone" className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(status._id)}
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
      <Modal show={isModalOpen} onClose={handleCloseModal} size="2xl">
        <Modal.Header>
          {editingStatus ? 'Edit Lead Status' : 'Add New Lead Status'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" value="Lead Status Name" />
                <TextInput
                  id="name"
                  type="text"
                  placeholder="Enter lead status name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label value="Form Fields" />
                  <Button
                    type="button"
                    size="sm"
                    color="gray"
                    onClick={addFormField}
                  >
                    <Icon icon="solar:add-circle-line-duotone" className="mr-1" />
                    Add Field
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.formFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <TextInput
                          placeholder="Field name..."
                          value={field.name}
                          onChange={(e) => updateFormField(index, { name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="w-32">
                        <Select
                          value={field.type}
                          onChange={(e) => updateFormField(index, { type: e.target.value })}
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={field.required}
                          onChange={(e) => updateFormField(index, { required: e.target.checked })}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor={`required-${index}`} value="Required" />
                      </div>
                      {formData.formFields.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          color="failure"
                          onClick={() => removeFormField(index)}
                        >
                          <Icon icon="solar:trash-bin-trash-line-duotone" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
              {editingStatus ? 'Update' : 'Create'}
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

export default LeadStatusesPage;
