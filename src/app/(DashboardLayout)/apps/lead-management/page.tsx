"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";
import DateTimePicker from "@/components/DateTimePicker";
import { useLeadManagementPermissions } from "@/hooks/use-permissions";

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
  statusIds?: string[]; // Store status IDs for dynamic field lookup
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
  is_final_status?: boolean;
  is_default_status?: boolean;
  is_site_visit_done?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  sourceName: string;
  statusName: string;
  formFields: FormField[];
  is_final_status: boolean;
  is_default_status: boolean;
  is_site_visit_done: boolean;
}

const LeadManagementPage = () => {
  const { token } = useAuth();
  const { socket, connected, subscribeToLead, subscribeToLeadSources, subscribeToLeadStatuses } = useWebSocket();
  const {
    canReadLeadSources,
    canCreateLeadSources,
    canUpdateLeadSources,
    canDeleteLeadSources,
    canReadLeadStatuses,
    canCreateLeadStatuses,
    canUpdateLeadStatuses,
    canDeleteLeadStatuses,
    isLoading: permissionsLoading,
    error: permissionsError
  } = useLeadManagementPermissions();
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("source");
  const [editingItem, setEditingItem] = useState<{ type: 'source' | 'status', id: string, data: any } | null>(null);
  const defaultFormFields: FormField[] = [
    { name: "Remark", type: "text", required: true, options: [] as string[], statusIds: [] },
    { name: "Date", type: "date", required: true, options: [], statusIds: [] }
  ];
  const bookingDateField: FormField = { name: "Booking Date", type: "date", required: true, options: [], statusIds: [] };
  const finalStatusFormFields: FormField[] = [bookingDateField]; // Only Booking Date for final statuses

  const [formData, setFormData] = useState<FormData>({
    // Lead Source
    sourceName: "",
    // Lead Status
    statusName: "",
    formFields: defaultFormFields,
    is_final_status: false,
    is_default_status: false,
    is_site_visit_done: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "Date Time" },
    { value: "time", label: "Time" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Select" },
    { value: "checkbox", label: "Checkbox" },
  ];

  useEffect(() => {
    if (token) {
      fetchData();
      // Subscribe to lead sources and statuses for real-time updates
      subscribeToLeadSources();
      subscribeToLeadStatuses();
    }
  }, [token, subscribeToLeadSources, subscribeToLeadStatuses]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('🔌 No socket available for lead management page');
      return;
    }

    console.log('🔌 Setting up lead management event listeners');

    // Listen for lead source updates
    socket.on('lead-source-created', (data) => {
      console.log('🆕 New lead source created:', data);
      setLeadSources(prev => {
        const newSources = [data.source, ...prev];
        console.log('📝 Updated lead sources list:', newSources);
        return newSources;
      });
    });

    socket.on('lead-source-updated', (data) => {
      console.log('✏️ Lead source updated:', data);
      setLeadSources(prev => {
        const updatedSources = prev.map(source =>
          source._id === data.source._id ? data.source : source
        );
        console.log('📝 Updated lead sources list:', updatedSources);
        return updatedSources;
      });
    });

    socket.on('lead-source-deleted', (data) => {
      console.log('🗑️ Lead source deleted:', data);
      setLeadSources(prev => {
        const filteredSources = prev.filter(source => source._id !== data.sourceId);
        console.log('📝 Updated lead sources list:', filteredSources);
        return filteredSources;
      });
    });

    // Listen for lead status updates
    socket.on('lead-status-created', (data) => {
      console.log('🆕 New lead status created:', data);
      setLeadStatuses(prev => {
        const newStatuses = [data.status, ...prev];
        console.log('📝 Updated lead statuses list:', newStatuses);
        return newStatuses;
      });
    });

    socket.on('lead-status-updated', (data) => {
      console.log('✏️ Lead status updated:', data);
      setLeadStatuses(prev => {
        const updatedStatuses = prev.map(status =>
          status._id === data.status._id ? data.status : status
        );
        console.log('📝 Updated lead statuses list:', updatedStatuses);
        return updatedStatuses;
      });
    });

    socket.on('lead-status-deleted', (data) => {
      console.log('🗑️ Lead status deleted:', data);
      setLeadStatuses(prev => {
        const filteredStatuses = prev.filter(status => status._id !== data.statusId);
        console.log('📝 Updated lead statuses list:', filteredStatuses);
        return filteredStatuses;
      });
    });

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up lead management event listeners');
      socket.off('lead-source-created');
      socket.off('lead-source-updated');
      socket.off('lead-source-deleted');
      socket.off('lead-status-created');
      socket.off('lead-status-updated');
      socket.off('lead-status-deleted');
    };
  }, [socket]);

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
    
    // Check permissions before proceeding
    if (activeTab === "source") {
      if (editingItem && !canUpdateLeadSources) {
        setAlertMessage({ type: 'error', message: 'You do not have permission to update lead sources' });
        return;
      }
      if (!editingItem && !canCreateLeadSources) {
        setAlertMessage({ type: 'error', message: 'You do not have permission to create lead sources' });
        return;
      }
    } else if (activeTab === "status") {
      if (editingItem && !canUpdateLeadStatuses) {
        setAlertMessage({ type: 'error', message: 'You do not have permission to update lead statuses' });
        return;
      }
      if (!editingItem && !canCreateLeadStatuses) {
        setAlertMessage({ type: 'error', message: 'You do not have permission to create lead statuses' });
        return;
      }
    }
    
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

    // Check if trying to create a site visit done status when one already exists
    if (activeTab === "status" && formData.is_site_visit_done) {
      const existingSiteVisitDone = leadStatuses.find(status => status.is_site_visit_done === true && status._id !== editingItem?.id);
      if (existingSiteVisitDone) {
        setAlertMessage({ 
          type: 'error', 
          message: `Cannot create site visit done status. A site visit done status already exists: "${existingSiteVisitDone.name}". Only one site visit done status is allowed.` 
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
          const updateUrl = API_ENDPOINTS.UPDATE_LEAD_STATUS(editingItem.id);
          console.log('🔧 Updating lead status:', {
            url: updateUrl,
            id: editingItem.id,
            data: {
              name: formData.statusName,
              formFields: formData.formFields.filter(field => field.name.trim()),
              is_final_status: formData.is_final_status,
              is_default_status: formData.is_default_status
            }
          });
          
          const response = await fetch(updateUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.statusName,
              formFields: formData.formFields
                .filter(field => field.name.trim())
                .map(field => ({
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  options: field.options || [],
                  statusIds: field.statusIds || []
                })),
              is_final_status: formData.is_final_status,
              is_default_status: formData.is_default_status,
              is_site_visit_done: formData.is_site_visit_done
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
              formFields: formData.formFields
                .filter(field => field.name.trim())
                .map(field => ({
                  name: field.name,
                  type: field.type,
                  required: field.required,
                  options: field.options || [],
                  statusIds: field.statusIds || []
                })),
              is_final_status: formData.is_final_status,
              is_default_status: formData.is_default_status,
              is_site_visit_done: formData.is_site_visit_done
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
      let errorMessage = 'Failed to save data';
      
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMessage = 'Access denied. You do not have permission to perform this action.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Resource not found. Please refresh and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAlertMessage({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (type: 'source' | 'status', id: string) => {
    const itemType = type === 'source' ? 'lead source' : 'lead status';
    
    // Check permissions
    if (type === 'source' && !canDeleteLeadSources) {
      setAlertMessage({ type: 'error', message: 'You do not have permission to delete lead sources' });
      return;
    }
    if (type === 'status' && !canDeleteLeadStatuses) {
      setAlertMessage({ type: 'error', message: 'You do not have permission to delete lead statuses' });
      return;
    }
    
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
      formFields: defaultFormFields,
      is_final_status: false,
      is_default_status: false,
      is_site_visit_done: false
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData(prev => {
      // When adding a new status, it's not a final status by default.
      // The date field will be added dynamically if the user checks 'Final Status'.
      return {
        ...prev,
        sourceName: "",
        statusName: "",
        formFields: defaultFormFields,
        is_final_status: false,
        is_default_status: false,
        is_site_visit_done: false
      };
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
        formFields: defaultFormFields,
        is_final_status: false,
        is_default_status: false,
        is_site_visit_done: false
      });
    } else {
      const isFinalStatus = item.is_final_status || false;
      
      // For final statuses, always use only booking date field
      // For non-final statuses, use existing fields but remove booking date if present
      let fields;
      if (isFinalStatus) {
        fields = finalStatusFormFields;
      } else {
        fields = (item.formFields || defaultFormFields).filter((field: FormField) => field.name !== bookingDateField.name);
      }
      
      setFormData({
        sourceName: "",
        statusName: item.name,
        formFields: fields,
        is_final_status: isFinalStatus,
        is_default_status: item.is_default_status || false,
        is_site_visit_done: item.is_site_visit_done || false
      });
    }
    
    setIsModalOpen(true);
  };

  const addFormField = () => {
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, { name: "", type: "text", required: false, options: [] as string[], statusIds: [] }]
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
        
        <div className="relative z-10 px-4 sm:px-6 py-10 sm:py-12 md:py-14 lg:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
              <div className="text-white">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Lead Management
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl leading-relaxed">
                  Comprehensive lead source and status management system for your business
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base">
                    <Icon icon="solar:target-line-duotone" className="text-lg sm:text-xl md:text-2xl" />
                    <span className="font-semibold">{leadSources.length} Lead Sources</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base">
                    <Icon icon="solar:clipboard-list-line-duotone" className="text-lg sm:text-xl md:text-2xl" />
                    <span className="font-semibold">{leadStatuses.length} Lead Statuses</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="font-semibold">{connected ? 'Live Updates' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm rounded-full px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-xs sm:text-sm md:text-base">
                    <Icon icon="solar:settings-line-duotone" className="text-lg sm:text-xl md:text-2xl" />
                    <span className="font-semibold">Customizable Forms</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  onClick={handleAddNew} 
                  disabled={!canCreateLeadSources && !canCreateLeadStatuses}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  <Icon icon="solar:add-circle-line-duotone" className="mr-1 sm:mr-2 text-base sm:text-lg" />
                  <span>Add New</span>
                </Button>
                <Button 
                  color="light" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base w-full sm:w-auto"
                >
                  <Icon icon="solar:settings-line-duotone" className="mr-1 sm:mr-2 text-base sm:text-lg" />
                  <span className="hidden xs:inline">Settings</span>
                  <span className="xs:hidden">Config</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-8 sm:py-10 md:py-12 -mt-6 sm:-mt-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">

      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          color={alertMessage.type === 'success' ? 'success' : 'failure'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Permission Error Alert */}
      {permissionsError && (
        <Alert
          color="failure"
          onDismiss={() => {}}
        >
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-line-duotone" className="text-lg" />
            <div>
              <h4 className="font-semibold">Permission Error</h4>
              <p className="text-sm">Unable to load permissions: {permissionsError}</p>
            </div>
          </div>
        </Alert>
      )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lead Sources Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl w-fit mb-3 sm:mb-4">
                      <Icon icon="solar:target-line-duotone" className="text-2xl sm:text-3xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {leadSources.length}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Lead Sources
                    </div>
                  </div>
                  <div className="text-left sm:text-right self-start sm:self-auto">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Active Sources</div>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <Icon icon="solar:check-circle-line-duotone" className="mr-1 text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm font-medium">Configured</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Statuses Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl w-fit mb-3 sm:mb-4">
                      <Icon icon="solar:clipboard-list-line-duotone" className="text-2xl sm:text-3xl text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {leadStatuses.length}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Lead Statuses
                    </div>
                  </div>
                  <div className="text-left sm:text-right self-start sm:self-auto">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Status Types</div>
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <Icon icon="solar:check-circle-line-duotone" className="mr-1 text-sm sm:text-base" />
                      <span className="text-xs sm:text-sm font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Tables */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Lead Sources Table */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-blue-500/10 rounded-xl">
                      <Icon icon="solar:target-line-duotone" className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Lead Sources</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your lead acquisition channels</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-500/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                    <Icon icon="solar:target-line-duotone" className="text-blue-600 dark:text-blue-400 text-sm sm:text-base" />
                    <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {leadSources.length} Source{leadSources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {leadSources.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Icon icon="solar:info-circle-line-duotone" className="text-3xl text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lead Sources</h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first lead source</p>
                      <Button 
                        onClick={handleAddNew} 
                        color="blue" 
                        size="sm"
                        disabled={!canCreateLeadSources}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                        Create First Source
                      </Button>
                    </div>
                  ) : (
                    leadSources.map((source) => (
                      <div key={source._id} className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 group">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                              <Icon icon="solar:target-line-duotone" className="text-lg sm:text-xl text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">{source.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Created {new Date(source.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => handleEdit('source', source)}
                              disabled={!canUpdateLeadSources}
                              className="hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              <Icon icon="solar:pen-line-duotone" className="mr-1 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              color="failure"
                              onClick={() => handleDelete('source', source._id)}
                              disabled={!canDeleteLeadSources}
                              className="hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Lead Statuses Table */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl">
                      <Icon icon="solar:clipboard-list-line-duotone" className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Lead Statuses</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Configure your lead workflow stages</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-green-500/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                    <Icon icon="solar:clipboard-list-line-duotone" className="text-green-600 dark:text-green-400 text-sm sm:text-base" />
                    <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                      {leadStatuses.length} Status{leadStatuses.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {leadStatuses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Icon icon="solar:info-circle-line-duotone" className="text-3xl text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Lead Statuses</h4>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first lead status to get started</p>
                      <Button 
                        onClick={handleAddNew} 
                        color="green" 
                        size="sm"
                        disabled={!canCreateLeadStatuses}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                        Create First Status
                      </Button>
                    </div>
                  ) : (
                    leadStatuses.map((status) => (
                      <div key={status._id} className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 group">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="p-2 bg-green-500/10 rounded-lg flex-shrink-0">
                              <Icon icon="solar:clipboard-list-line-duotone" className="text-lg sm:text-xl text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">{status.name}</h4>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
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
                                {status.is_site_visit_done && (
                                  <Badge color="green" size="sm">
                                    <Icon icon="solar:location-line-duotone" className="mr-1" />
                                    Site Visit Done
                                  </Badge>
                                )}
                                {!status.is_final_status && !status.is_default_status && !status.is_site_visit_done && (
                                  <Badge color="gray" size="sm">
                                    <Icon icon="solar:clock-circle-line-duotone" className="mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => handleEdit('status', status)}
                              disabled={!canUpdateLeadStatuses}
                              className="hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              <Icon icon="solar:pen-line-duotone" className="mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              color="failure"
                              onClick={() => handleDelete('status', status._id)}
                              disabled={!canDeleteLeadStatuses}
                              className="hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial text-xs sm:text-sm"
                            >
                              <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                              <span className="sm:hidden">Delete</span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Form Fields Display */}
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Form Fields ({status.formFields.length})</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {status.formFields.map((field, index) => (
                              <div key={index} className="bg-gray-50 dark:bg-gray-600/30 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center gap-2 mb-2">
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
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="4xl">
        <Modal.Header className="px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Icon icon="solar:settings-line-duotone" className="text-white text-lg sm:text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {editingItem ? `Edit ${editingItem.type === 'source' ? 'Lead Source' : 'Lead Status'}` : 'Add New Lead Source or Status'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your lead sources and statuses</p>
            </div>
          </div>
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body className="max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 px-4 sm:px-6">
            <div className="flex space-x-1 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                color={activeTab === "source" ? "primary" : "gray"}
                onClick={() => setActiveTab("source")}
                className={`flex-1 rounded-b-none border-b-2 transition-all duration-200 text-xs sm:text-sm ${
                  activeTab === "source" 
                    ? "border-blue-500 bg-blue-500 text-white shadow-lg" 
                    : "border-transparent hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Icon icon="solar:target-line-duotone" className="mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="hidden sm:inline">Lead Source</span>
                <span className="sm:hidden">Source</span>
              </Button>
              <Button
                type="button"
                color={activeTab === "status" ? "primary" : "gray"}
                onClick={() => setActiveTab("status")}
                className={`flex-1 rounded-b-none border-b-2 transition-all duration-200 text-xs sm:text-sm ${
                  activeTab === "status" 
                    ? "border-blue-500 bg-blue-500 text-white shadow-lg" 
                    : "border-transparent hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Icon icon="solar:clipboard-list-line-duotone" className="mr-1 sm:mr-2 text-sm sm:text-base" />
                <span className="hidden sm:inline">Lead Status</span>
                <span className="sm:hidden">Status</span>
              </Button>
            </div>
            {activeTab === "source" && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-300 dark:border-blue-700 p-4 sm:p-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Icon icon="solar:target-line-duotone" className="text-blue-600 dark:text-blue-400 text-lg sm:text-xl" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Lead Source Information</h3>
                  </div>
                  <div>
                    <Label htmlFor="sourceName" value="Lead Source Name *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="sourceName"
                      type="text"
                      placeholder="Enter lead source name (e.g., Direct, Website, Referral)..."
                      value={formData.sourceName}
                      onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                      required={activeTab === "source"}
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                      Examples: Direct, Website, Social Media, Referral, Cold Call
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "status" && (
              <div className="space-y-4 sm:space-y-6 pt-4">
                {/* Basic Status Information */}
                <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-300 dark:border-green-700 p-4 sm:p-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-green-100 dark:bg-green-900/20 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Icon icon="solar:clipboard-list-line-duotone" className="text-green-600 dark:text-green-400 text-lg sm:text-xl" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Basic Status Information</h3>
                  </div>
                  <div>
                    <Label htmlFor="statusName" value="Lead Status Name *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="statusName"
                      type="text"
                      placeholder="Enter lead status name (e.g., New, Contacted, Qualified)..."
                      value={formData.statusName}
                      onChange={(e) => setFormData({ ...formData, statusName: e.target.value })}
                      required={activeTab === "status"}
                      className="w-full mt-2 bg-white dark:bg-gray-700"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                      Examples: New, Contacted, Qualified, Proposal Sent, Closed Won
                    </p>
                  </div>
                </div>
                
                {/* Status Type Configuration */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-300 dark:border-purple-700 p-4 sm:p-6">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Icon icon="solar:settings-line-duotone" className="text-purple-600 dark:text-purple-400 text-lg sm:text-xl" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Status Type Configuration</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="is_final_status"
                          checked={formData.is_final_status}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData(prev => {
                              // For final statuses, use only booking date field
                              // For non-final statuses, keep existing fields but remove booking date if present
                              let updatedFormFields;
                              if (isChecked) {
                                // Final status: only booking date
                                updatedFormFields = finalStatusFormFields;
                              } else {
                                // Non-final status: remove booking date, keep other fields
                                updatedFormFields = prev.formFields.filter(field => field.name !== bookingDateField.name);
                              }
                              return { ...prev, is_final_status: isChecked, formFields: updatedFormFields };
                            });
                          }}
                          className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                          disabled={leadStatuses.some(status => status.is_final_status === true && status._id !== editingItem?.id)}
                        />
                        <Label htmlFor="is_final_status" value="Final Status" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      </div>
                      {leadStatuses.some(status => status.is_final_status === true && status._id !== editingItem?.id) ? (
                        <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <Icon icon="solar:danger-triangle-line-duotone" className="text-red-600 dark:text-red-400 text-lg mt-0.5" />
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
                          <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                          Check if this is a final status (e.g., Closed Won, Closed Lost)
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="is_default_status"
                          checked={formData.is_default_status}
                          onChange={(e) => setFormData({ ...formData, is_default_status: e.target.checked })}
                          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          disabled={leadStatuses.some(status => status.is_default_status === true && status._id !== editingItem?.id)}
                        />
                        <Label htmlFor="is_default_status" value="Default Status" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      </div>
                      {leadStatuses.some(status => status.is_default_status === true && status._id !== editingItem?.id) ? (
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <Icon icon="solar:danger-triangle-line-duotone" className="text-blue-600 dark:text-blue-400 text-lg mt-0.5" />
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
                          <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                          Check if this should be the default status for new leads
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="is_site_visit_done"
                          checked={formData.is_site_visit_done}
                          onChange={(e) => setFormData({ ...formData, is_site_visit_done: e.target.checked })}
                          className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          disabled={leadStatuses.some(status => status.is_site_visit_done === true && status._id !== editingItem?.id)}
                        />
                        <Label htmlFor="is_site_visit_done" value="Site Visit Done" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      </div>
                      {leadStatuses.some(status => status.is_site_visit_done === true && status._id !== editingItem?.id) ? (
                        <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                          <Icon icon="solar:danger-triangle-line-duotone" className="text-green-600 dark:text-green-400 text-lg mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Site Visit Done Already Exists
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Only one site visit done status is allowed. Current status: "{leadStatuses.find(s => s.is_site_visit_done)?.name}"
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                          Check if a site visit has been completed for this status
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Custom Form Fields */}
                <div className="bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-300 dark:border-orange-700 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center">
                      <div className="bg-orange-100 dark:bg-orange-900/20 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                        <Icon icon="solar:settings-line-duotone" className="text-orange-600 dark:text-orange-400 text-lg sm:text-xl" />
                      </div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Custom Form Fields</h3>
                    </div>
                     <Button
                       type="button"
                       size="sm"
                       color="orange"
                       onClick={addFormField}
                       disabled={formData.is_final_status}
                       className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                     >
                       <Icon icon="solar:add-circle-line-duotone" className="mr-1 text-sm sm:text-base" />
                       <span>Add Field</span>
                     </Button>
                  </div>
                  {formData.is_final_status ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:info-circle-line-duotone" className="text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Final Status:</strong> Only the "Booking Date" field is available for final statuses.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                      Add custom fields to collect specific information for this status
                    </p>
                  )}
                  
                  <div className="space-y-3 sm:space-y-4">
                    {formData.formFields.map((field, index) => (
                      <div key={index} className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 sm:p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 dark:bg-blue-900/20 p-1 sm:p-1.5 rounded-lg flex-shrink-0">
                              <Icon icon="solar:settings-line-duotone" className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              Field {index + 1}
                            </span>
                          </div>
                           {formData.formFields.length > 1 && !(formData.is_final_status && field.name === "Booking Date") && (
                             <Button
                               type="button"
                               size="sm"
                               color="failure"
                               onClick={() => removeFormField(index)}
                               className="flex items-center gap-1 text-xs sm:text-sm"
                             >
                               <Icon icon="solar:trash-bin-trash-line-duotone" className="text-xs sm:text-sm" />
                               <span className="hidden sm:inline">Remove</span>
                               <span className="sm:hidden">Del</span>
                             </Button>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="sm:col-span-2">
                            <Label htmlFor={`field-name-${index}`} value="Field Name *" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block" />
                            <TextInput
                              id={`field-name-${index}`}
                              placeholder="Field name (e.g., Remark, Budget, Timeline)..."
                              value={field.name}
                              onChange={(e) => updateFormField(index, { name: e.target.value })}
                              required={activeTab === "status"}
                              disabled={formData.is_final_status && field.name === "Booking Date"}
                              className="w-full bg-white dark:bg-gray-700 text-sm sm:text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`field-type-${index}`} value="Field Type *" className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block" />
                            <Select
                              id={`field-type-${index}`}
                              value={field.type}
                              onChange={(e) => updateFormField(index, { type: e.target.value })}
                              disabled={formData.is_final_status && field.name === "Booking Date"}
                              className="w-full bg-white dark:bg-gray-700 text-sm sm:text-base"
                            >
                              {fieldTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            checked={field.required}
                            onChange={(e) => updateFormField(index, { required: e.target.checked })}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <Label htmlFor={`required-${index}`} value="Required Field" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                        </div>

                        {/* Options for Select fields */}
                        {field.type === 'select' && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon icon="solar:list-line-duotone" className="text-blue-600 dark:text-blue-400" />
                              <Label value="Select Lead Statuses as Options" className="text-sm font-medium text-blue-800 dark:text-blue-200" />
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                              <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                              Check the lead statuses you want to show as options in this select field
                            </p>
                            <div className="space-y-2 max-h-60 overflow-y-auto bg-white dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                              {leadStatuses.map((status) => {
                                const isSelected = field.options?.includes(status.name) || false;
                                return (
                                  <div key={status._id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                                    <input
                                      type="checkbox"
                                      id={`status-option-${index}-${status._id}`}
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const currentOptions = field.options || [];
                                        const currentStatusIds = field.statusIds || [];
                                        let newOptions, newStatusIds;
                                        if (e.target.checked) {
                                          // Add status name to options and ID to statusIds
                                          newOptions = [...currentOptions, status.name];
                                          newStatusIds = [...currentStatusIds, status._id];
                                        } else {
                                          // Remove status name from options and ID from statusIds
                                          newOptions = currentOptions.filter(opt => opt !== status.name);
                                          newStatusIds = currentStatusIds.filter(id => id !== status._id);
                                        }
                                        updateFormField(index, { options: newOptions, statusIds: newStatusIds });
                                      }}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <label
                                      htmlFor={`status-option-${index}-${status._id}`}
                                      className="flex-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                    >
                                      <Badge color="info" size="sm">{status.name}</Badge>
                                      {status.is_final_status && <span className="text-xs text-red-600 dark:text-red-400">(Final)</span>}
                                      {status.is_default_status && <span className="text-xs text-blue-600 dark:text-blue-400">(Default)</span>}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            {(field.options || []).length > 0 && (
                              <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Selected Options ({field.options.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                  {field.options.map((option, optionIndex) => (
                                    <Badge key={optionIndex} color="info" size="sm">
                                      {option}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Checkbox Options */}
                        {field.type === 'checkbox' && (
                          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:check-square-line-duotone" className="text-green-600 dark:text-green-400" />
                                <Label value="Checkbox Options" className="text-sm font-medium text-green-800 dark:text-green-200" />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                color="green"
                                onClick={() => addOption(index)}
                                className="flex items-center gap-1"
                              >
                                <Icon icon="solar:add-circle-line-duotone" className="text-sm" />
                                Add Option
                              </Button>
                            </div>
                            <div className="space-y-3">
                              {(field.options || []).map((option, optionIndex) => (
                                <div key={optionIndex} className="flex gap-2 items-center">
                                  <TextInput
                                    placeholder="Checkbox option (e.g., Agree to Terms, Newsletter, etc.)..."
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    className="flex-1 bg-white dark:bg-gray-700"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    color="failure"
                                    onClick={() => removeOption(index, optionIndex)}
                                    className="flex items-center gap-1"
                                  >
                                    <Icon icon="solar:trash-bin-trash-line-duotone" className="text-sm" />
                                    Remove
                                  </Button>
                                </div>
                              ))}
                              {(!field.options || field.options.length === 0) && (
                                <div className="text-center py-4">
                                  <Icon icon="solar:info-circle-line-duotone" className="text-green-400 text-2xl mx-auto mb-2" />
                                  <p className="text-sm text-green-600 dark:text-green-400">
                                    No checkbox options added yet. Click "Add Option" to add choices for this checkbox field.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Field Preview - Disabled for preview only */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="flex flex-col sm:flex-row gap-2 px-4 sm:px-6 pb-4 sm:pb-6">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto text-sm sm:text-base">
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-1 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{editingItem ? 'Update' : 'Create'} {activeTab === "source" ? "Lead Source" : "Lead Status"}</span>
              <span className="sm:hidden">{editingItem ? 'Update' : 'Create'}</span>
            </Button>
            <Button color="gray" onClick={handleCloseModal} className="w-full sm:w-auto text-sm sm:text-base">
              <Icon icon="solar:close-circle-line-duotone" className="mr-1 sm:mr-2" />
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default LeadManagementPage;