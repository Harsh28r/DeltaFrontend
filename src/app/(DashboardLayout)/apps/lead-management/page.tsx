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
  options: string[];
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
  is_final_status?: boolean;
  is_default_status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  sourceName: string;
  statusName: string;
  formFields: FormField[];
  is_final_status: boolean;
  is_default_status: boolean;
}

const LeadManagementPage = () => {
  const { token } = useAuth();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("source");
  const [editingItem, setEditingItem] = useState<{ type: 'source' | 'status', id: string, data: any } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    // Lead Source
    sourceName: "",
    // Lead Status
    statusName: "",
    formFields: [{ name: "Remark", type: "text", required: true, options: [] }],
    is_final_status: false,
    is_default_status: false
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
      const existingFinalStatus = leadStatuses.find(status => status.is_final_status === true && status._id !== editingItem?.id);
      if (existingFinalStatus) {
        setAlertMessage({ 
          type: 'error', 
          message: `Cannot create final status. A final status already exists: "${existingFinalStatus.name}". Only one final status is allowed.` 
        });
        return;
      }
    }

    // Check if trying to create a default status when one already exists
    if (activeTab === "status" && formData.is_default_status) {
      const existingDefaultStatus = leadStatuses.find(status => status.is_default_status === true && status._id !== editingItem?.id);
      if (existingDefaultStatus) {
        setAlertMessage({ 
          type: 'error', 
          message: `Cannot create default status. A default status already exists: "${existingDefaultStatus.name}". Only one default status is allowed.` 
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      if (activeTab === "source") {
        if (editingItem) {
          // Update lead source
          const response = await fetch(API_ENDPOINTS.UPDATE_LEAD_SOURCE(editingItem.id), {
            method: "PUT",
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
          setLeadSources(prev => prev.map(source => 
            source._id === editingItem.id ? data.leadSource || data : source
          ));
          setAlertMessage({ type: 'success', message: 'Lead source updated successfully!' });
        } else {
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
        }
        
      } else {
        if (editingItem) {
          // Update lead status
          const response = await fetch(API_ENDPOINTS.UPDATE_LEAD_STATUS(editingItem.id), {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.statusName,
              formFields: formData.formFields.filter(field => field.name.trim()),
              is_final_status: formData.is_final_status,
              is_default_status: formData.is_default_status
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setLeadStatuses(prev => prev.map(status => 
            status._id === editingItem.id ? data.leadStatus || data : status
          ));
          setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });
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
              is_final_status: formData.is_final_status,
              is_default_status: formData.is_default_status
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setLeadStatuses(prev => [...prev, data.leadStatus || data]);
          setAlertMessage({ type: 'success', message: 'Lead status created successfully!' });
        }
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
    setEditingItem(null);
    setFormData({
      sourceName: "",
      statusName: "",
      formFields: [{ name: "Remark", type: "text", required: true, options: [] as string[] }],
      is_final_status: false,
      is_default_status: false
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      sourceName: "",
      statusName: "",
      formFields: [{ name: "Remark", type: "text", required: true, options: [] as string[] }],
      is_final_status: false,
      is_default_status: false
    });
    setIsModalOpen(true);
  };

  const handleEdit = (type: 'source' | 'status', item: any) => {
    setEditingItem({ type, id: item._id, data: item });
    setActiveTab(type);
    
    if (type === 'source') {
      setFormData({
        sourceName: item.name,
        statusName: "",
        formFields: [{ name: "Remark", type: "text", required: true, options: [] as string[] }],
        is_final_status: false,
        is_default_status: false
      });
    } else {
      setFormData({
        sourceName: "",
        statusName: item.name,
        formFields: item.formFields || [{ name: "Remark", type: "text", required: true, options: [] as string[] }],
        is_final_status: item.is_final_status || false,
        is_default_status: item.is_default_status || false
      });
    }
    
    setIsModalOpen(true);
  };

  const addFormField = () => {
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, { name: "", type: "text", required: false, options: [] as string[] }]
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

  const addOption = (fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map((field, i) => 
        i === fieldIndex 
          ? { ...field, options: [...field.options, ""] }
          : field
      )
    }));
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map((field, i) => 
        i === fieldIndex 
          ? { ...field, options: field.options.filter((_, idx) => idx !== optionIndex) }
          : field
      )
    }));
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map((field, i) => 
        i === fieldIndex 
          ? { 
              ...field, 
              options: field.options.map((opt, idx) => 
                idx === optionIndex ? value : opt
              )
            }
          : field
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Lead Sources Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Sources</h3>
            <Badge color="blue" size="lg">
              {leadSources.length} Source{leadSources.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell>Created</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {leadSources.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={3} className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-2xl mb-2" />
                        <p>No lead sources found</p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  leadSources.map((source) => (
                    <Table.Row key={source._id} className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Table.Cell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:target-line-duotone" className="text-blue-500" />
                          {source.name}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-gray-500 dark:text-gray-400">
                        {new Date(source.createdAt).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="info"
                            onClick={() => handleEdit('source', source)}
                          >
                            <Icon icon="solar:pen-line-duotone" className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDelete('source', source._id)}
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
          </div>
        </Card>

        {/* Lead Statuses Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Statuses</h3>
            <Badge color="green" size="lg">
              {leadStatuses.length} Status{leadStatuses.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell>Form Fields</Table.HeadCell>
                <Table.HeadCell>Type</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {leadStatuses.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-2xl mb-2" />
                        <p>No lead statuses found</p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  leadStatuses.map((status) => (
                    <Table.Row key={status._id} className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Table.Cell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:clipboard-list-line-duotone" className="text-green-500" />
                          {status.name}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="space-y-2 max-w-xs">
                          {status.formFields.map((field, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge color="info" size="sm">
                                  {field.name}
                                </Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {field.type} {field.required && '(Required)'}
                                </span>
                              </div>
                              
                            {/* Show options for select fields */}
                            {field.type === 'select' && field.options && field.options.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Options:</div>
                                <div className="flex flex-wrap gap-1">
                                  {field.options.map((option, optionIndex) => (
                                    <span 
                                      key={optionIndex}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Show options for checkbox fields */}
                            {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Checkbox Options:</div>
                                <div className="flex flex-wrap gap-1">
                                  {field.options.map((option, optionIndex) => (
                                    <span 
                                      key={optionIndex}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    >
                                      ☑ {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                              {/* Show field type specific details */}
                              {field.type === 'checkbox' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  ✓ Checkbox field
                                </div>
                              )}
                              
                              {field.type === 'date' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  📅 Date picker field
                                </div>
                              )}

                              {field.type === 'textarea' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  📝 Multi-line text field
                                </div>
                              )}

                              {field.type === 'email' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  ✉️ Email validation
                                </div>
                              )}

                              {field.type === 'phone' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  📞 Phone number field
                                </div>
                              )}

                              {field.type === 'number' && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  🔢 Numeric input only
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-1">
                          {status.is_final_status && (
                            <Badge color="red" size="sm">
                              <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                              Final
                            </Badge>
                          )}
                          {status.is_default_status && (
                            <Badge color="blue" size="sm">
                              <Icon icon="solar:star-line-duotone" className="mr-1" />
                              Default
                            </Badge>
                          )}
                          {!status.is_final_status && !status.is_default_status && (
                            <Badge color="gray" size="sm">
                              <Icon icon="solar:clock-circle-line-duotone" className="mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="info"
                            onClick={() => handleEdit('status', status)}
                          >
                            <Icon icon="solar:pen-line-duotone" className="mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDelete('status', status._id)}
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
          </div>
        </Card>
      </div>

      {/* Combined Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="2xl">
        <Modal.Header>
          {editingItem ? `Edit ${editingItem.type === 'source' ? 'Lead Source' : 'Lead Status'}` : 'Add New Lead Source or Status'}
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

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_default_status"
                      checked={formData.is_default_status}
                      onChange={(e) => setFormData({ ...formData, is_default_status: e.target.checked })}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      disabled={leadStatuses.some(status => status.is_default_status === true)}
                    />
                    <Label htmlFor="is_default_status" value="Default Status" />
                  </div>
                  {leadStatuses.some(status => status.is_default_status === true) ? (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <Icon icon="solar:danger-triangle-line-duotone" className="text-blue-600 dark:text-blue-400 text-lg" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Default Status Already Exists
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Only one default status is allowed. Current default status: "{leadStatuses.find(s => s.is_default_status)?.name}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Check if this should be the default status for new leads
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
                  
                  <div className="space-y-4">
                    {formData.formFields.map((field, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex gap-2 items-start mb-3">
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

                        {/* Options for Select fields */}
                        {field.type === 'select' && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Label value="Select Options" className="text-sm font-medium" />
                              <Button
                                type="button"
                                size="sm"
                                color="gray"
                                onClick={() => addOption(index)}
                              >
                                <Icon icon="solar:add-circle-line-duotone" className="mr-1" />
                                Add Option
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2 items-center">
                                  <TextInput
                                    placeholder="Option value (e.g., Yes, No, Maybe)..."
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    color="failure"
                                    onClick={() => removeOption(index, optionIndex)}
                                  >
                                    <Icon icon="solar:trash-bin-trash-line-duotone" />
                                  </Button>
                                </div>
                              ))}
                              {(!field.options || field.options.length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No options added yet. Click "Add Option" to add choices for this select field.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Checkbox Options */}
                        {field.type === 'checkbox' && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Label value="Checkbox Options" className="text-sm font-medium" />
                              <Button
                                type="button"
                                size="sm"
                                color="gray"
                                onClick={() => addOption(index)}
                              >
                                <Icon icon="solar:add-circle-line-duotone" className="mr-1" />
                                Add Option
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2 items-center">
                                  <TextInput
                                    placeholder="Checkbox option (e.g., Agree to Terms, Newsletter, etc.)..."
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    color="failure"
                                    onClick={() => removeOption(index, optionIndex)}
                                  >
                                    <Icon icon="solar:trash-bin-trash-line-duotone" />
                                  </Button>
                                </div>
                              ))}
                              {(!field.options || field.options.length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No checkbox options added yet. Click "Add Option" to add choices for this checkbox field.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Preview of field type */}
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                          <strong>Preview:</strong> {field.name || 'Field Name'} ({field.type})
                          {field.type === 'select' && field.options && field.options.length > 0 && (
                            <span> - Options: {field.options.join(', ')}</span>
                          )}
                          {field.type === 'checkbox' && field.options && field.options.length > 0 && (
                            <span> - Checkbox Options: {field.options.join(', ')}</span>
                          )}
                          {field.required && <span className="text-red-500 ml-1">(Required)</span>}
                        </div>
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
              {editingItem ? 'Update' : 'Create'} {activeTab === "source" ? "Lead Source" : "Lead Status"}
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