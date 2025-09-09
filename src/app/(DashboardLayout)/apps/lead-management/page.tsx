"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

interface LeadSource {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FormField {
  name: string;
  type: string;
  required: boolean;
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
  is_final_status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const LeadManagementPage = () => {
  const { token } = useAuth();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("source");
  const [formData, setFormData] = useState({
    // Lead Source
    sourceName: "",
    // Lead Status
    statusName: "",
    formFields: [{ name: "", type: "text", required: false }],
    is_final_status: false
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
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch lead sources
      const sourcesResponse = await fetch(API_ENDPOINTS.LEAD_SOURCES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setLeadSources(sourcesData.leadSources || sourcesData || []);
      }

      // Fetch lead statuses
      const statusesResponse = await fetch(API_ENDPOINTS.LEAD_STATUSES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setLeadStatuses(statusesData.leadStatuses || statusesData || []);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === "source" && !formData.sourceName.trim()) {
      setAlertMessage({ type: 'error', message: 'Please enter a lead source name' });
      return;
    }
    
    if (activeTab === "status" && !formData.statusName.trim()) {
      setAlertMessage({ type: 'error', message: 'Please enter a lead status name' });
      return;
    }

    // Check if trying to create a final status when one already exists
    if (activeTab === "status" && formData.is_final_status) {
      const existingFinalStatus = leadStatuses.find(status => status.is_final_status === true);
      if (existingFinalStatus) {
        setAlertMessage({ 
          type: 'error', 
          message: `Cannot create final status. A final status already exists: "${existingFinalStatus.name}". Only one final status is allowed.` 
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      if (activeTab === "source") {
        // Create lead source
        const response = await fetch(API_ENDPOINTS.CREATE_LEAD_SOURCE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: formData.sourceName }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLeadSources(prev => [...prev, data.leadSource || data]);
        setAlertMessage({ type: 'success', message: 'Lead source created successfully!' });
        
      } else {
        // Create lead status
        const response = await fetch(API_ENDPOINTS.CREATE_LEAD_STATUS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.statusName,
            formFields: formData.formFields.filter(field => field.name.trim()),
            is_final_status: formData.is_final_status
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setLeadStatuses(prev => [...prev, data.leadStatus || data]);
        setAlertMessage({ type: 'success', message: 'Lead status created successfully!' });
      }

      createRefreshEvent();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving data:", error);
      setAlertMessage({ type: 'error', message: 'Failed to save data' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: 'source' | 'status', id: string) => {
    const itemType = type === 'source' ? 'lead source' : 'lead status';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) return;

    try {
      const endpoint = type === 'source' 
        ? API_ENDPOINTS.DELETE_LEAD_SOURCE(id)
        : API_ENDPOINTS.DELETE_LEAD_STATUS(id);

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (type === 'source') {
        setLeadSources(prev => prev.filter(source => source._id !== id));
      } else {
        setLeadStatuses(prev => prev.filter(status => status._id !== id));
      }
      
      setAlertMessage({ type: 'success', message: `${itemType} deleted successfully!` });
      createRefreshEvent();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      setAlertMessage({ type: 'error', message: `Failed to delete ${itemType}` });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      sourceName: "",
      statusName: "",
      formFields: [{ name: "", type: "text", required: false }],
      is_final_status: false
    });
  };

  const handleAddNew = () => {
    setFormData({
      sourceName: "",
      statusName: "",
      formFields: [{ name: "", type: "text", required: false }],
      is_final_status: false
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage lead sources and statuses in one place</p>
        </div>
        <Button onClick={handleAddNew} color="primary">
          <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
          Add New
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {leadSources.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lead Sources</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {leadStatuses.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lead Statuses</div>
          </div>
        </Card>
      </div>

      {/* Combined Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Sources</h3>
            <Badge color="blue" size="lg">
              {leadSources.length} Source{leadSources.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {leadSources.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3} className="text-center py-4">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      No lead sources found
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                leadSources.map((source) => (
                  <Table.Row key={source._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {source.name}
                    </Table.Cell>
                    <Table.Cell className="text-gray-500 dark:text-gray-400">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete('source', source._id)}
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                        Delete
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </Card>

        {/* Lead Statuses Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Statuses</h3>
            <Badge color="green" size="lg">
              {leadStatuses.length} Status{leadStatuses.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Form Fields</Table.HeadCell>
              <Table.HeadCell>Final Status</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {leadStatuses.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} className="text-center py-4">
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      No lead statuses found
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                leadStatuses.map((status) => (
                  <Table.Row key={status._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
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
                      {status.is_final_status ? (
                        <Badge color="red" size="sm">
                          <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                          Final
                        </Badge>
                      ) : (
                        <Badge color="gray" size="sm">
                          <Icon icon="solar:clock-circle-line-duotone" className="mr-1" />
                          Active
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete('status', status._id)}
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                        Delete
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </Card>
      </div>

      {/* Combined Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="2xl">
        <Modal.Header>
          Add New Lead Source or Status
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                color={activeTab === "source" ? "primary" : "gray"}
                onClick={() => setActiveTab("source")}
                className={`flex-1 rounded-b-none border-b-2 ${
                  activeTab === "source" 
                    ? "border-primary bg-primary text-white" 
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Icon icon="solar:target-line-duotone" className="mr-2" />
                Lead Source
              </Button>
              <Button
                type="button"
                color={activeTab === "status" ? "primary" : "gray"}
                onClick={() => setActiveTab("status")}
                className={`flex-1 rounded-b-none border-b-2 ${
                  activeTab === "status" 
                    ? "border-primary bg-primary text-white" 
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Icon icon="solar:clipboard-list-line-duotone" className="mr-2" />
                Lead Status
              </Button>
            </div>
            {activeTab === "source" && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="sourceName" value="Lead Source Name" />
                  <TextInput
                    id="sourceName"
                    type="text"
                    placeholder="Enter lead source name (e.g., Direct, Website, Referral)..."
                    value={formData.sourceName}
                    onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                    required={activeTab === "source"}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Examples: Direct, Website, Social Media, Referral, Cold Call
                  </p>
                </div>
              </div>
            )}

            {activeTab === "status" && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="statusName" value="Lead Status Name" />
                  <TextInput
                    id="statusName"
                    type="text"
                    placeholder="Enter lead status name (e.g., New, Contacted, Qualified)..."
                    value={formData.statusName}
                    onChange={(e) => setFormData({ ...formData, statusName: e.target.value })}
                    required={activeTab === "status"}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Examples: New, Contacted, Qualified, Proposal Sent, Closed Won
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_final_status"
                      checked={formData.is_final_status}
                      onChange={(e) => setFormData({ ...formData, is_final_status: e.target.checked })}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      disabled={leadStatuses.some(status => status.is_final_status === true)}
                    />
                    <Label htmlFor="is_final_status" value="Final Status" />
                  </div>
                  {leadStatuses.some(status => status.is_final_status === true) ? (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <Icon icon="solar:danger-triangle-line-duotone" className="text-red-600 dark:text-red-400 text-lg" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Final Status Already Exists
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Only one final status is allowed. Current final status: "{leadStatuses.find(s => s.is_final_status)?.name}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Check if this is a final status (e.g., Closed Won, Closed Lost)
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label value="Custom Form Fields" />
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
                            placeholder="Field name (e.g., Remark, Budget, Timeline)..."
                            value={field.name}
                            onChange={(e) => updateFormField(index, { name: e.target.value })}
                            required={activeTab === "status"}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Add custom fields to collect specific information for this status
                  </p>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
              )}
              Create {activeTab === "source" ? "Lead Source" : "Lead Status"}
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

export default LeadManagementPage;
