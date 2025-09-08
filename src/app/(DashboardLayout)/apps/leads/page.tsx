"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Textarea } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";
import { useSearchParams } from "next/navigation";
import { useLeadPermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/app/types/permissions";

interface LeadSource {
  _id: string;
  name: string;
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
}

interface Lead {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  leadSource?: {
    _id: string;
    name: string;
  } | null;
  currentStatus?: {
    _id: string;
    name: string;
  } | null;
  customData: {
    "First Name"?: string;
    "Last Name"?: string;
    "Email"?: string;
    "Phone"?: string;
    "Company"?: string;
    "Notes"?: string;
    [key: string]: any;
  };
  statusHistory: any[];
  createdAt: string;
  updatedAt: string;
  // Computed fields for display
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
  notes?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
}

const LeadsPage = () => {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  
  // Super admin bypass - no permission checks needed
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'superadmin@deltayards.com';
  
  const { 
    canCreateLeads, 
    canReadLeads, 
    canUpdateLeads, 
    canDeleteLeads, 
    isLoading: permissionsLoading 
  } = useLeadPermissions();
  
  // Override permissions for super admin
  const finalPermissions = {
    canCreateLeads: isSuperAdmin ? true : canCreateLeads,
    canReadLeads: isSuperAdmin ? true : canReadLeads,
    canUpdateLeads: isSuperAdmin ? true : canUpdateLeads,
    canDeleteLeads: isSuperAdmin ? true : canDeleteLeads,
    permissionsLoading: isSuperAdmin ? false : permissionsLoading
  };
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "",
    notes: "",
    projectId: "", // Will be empty until user selects
    userId: ""
  });
  
  // Dynamic form fields based on selected status
  const [dynamicFields, setDynamicFields] = useState<{[key: string]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
      // Fetch leads after a short delay
      setTimeout(() => {
        fetchLeads();
      }, 2000);
    }
  }, [token]);

  // Set userId when user data is available
  useEffect(() => {
    if (user && user.id) {
      setFormData(prev => ({ ...prev, userId: user.id }));
    }
  }, [user]);

  // Set most recent project as default (but user can still edit it)
  useEffect(() => {
    if (projects.length > 0 && !formData.projectId) {
      // Set the most recent project (first in the list) as default
      setFormData(prev => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects, formData.projectId]);

  // Get required fields for selected status
  const getRequiredFieldsForStatus = (statusId: string) => {
    const status = leadStatuses.find(s => s._id === statusId);
    return status?.formFields || [];
  };

  // Update dynamic fields when status changes
  const handleStatusChange = (statusId: string) => {
    setFormData(prev => ({ ...prev, status: statusId }));
    
    // Reset dynamic fields
    const newDynamicFields: {[key: string]: any} = {};
    const requiredFields = getRequiredFieldsForStatus(statusId);
    
    // Initialize dynamic fields based on status requirements
    requiredFields.forEach(field => {
      newDynamicFields[field.name] = formData[field.name as keyof typeof formData] || "";
    });
    
    setDynamicFields(newDynamicFields);
  };

  const fetchLeads = async () => {
    if (isLoadingLeads) return;
    
    try {
      setIsLoadingLeads(true);
      const leadsResponse = await fetch(API_ENDPOINTS.LEADS(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        const leadsArray = leadsData.leads || leadsData || [];
        const transformedLeads = transformLeadData(leadsArray);
        setLeads(transformedLeads);
      } else {
        setLeads([]);
        handleLeadsError(leadsResponse);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      setLeads([]);
      setAlertMessage({ 
        type: 'error', 
        message: 'Network error: Failed to fetch leads. Please check your connection.' 
      });
    } finally {
      setIsLoadingLeads(false);
    }
  };

  const transformLeadData = (leadsData: any[]): Lead[] => {
    return leadsData.map(lead => ({
      ...lead,
      name: `${lead.customData?.["First Name"] || ''} ${lead.customData?.["Last Name"] || ''}`.trim() || 'N/A',
      email: lead.customData?.["Email"] || 'N/A',
      phone: lead.customData?.["Phone"] || 'N/A',
      company: lead.customData?.["Company"] || 'N/A',
      notes: lead.customData?.["Notes"] || '',
      source: lead.leadSource?._id || 'N/A',
      status: lead.currentStatus?._id || 'N/A'
    }));
  };

  const handleLeadsError = (response: Response) => {
    if (response.status === 429) {
      setAlertMessage({ 
        type: 'error', 
        message: `Rate Limited (429): Too many requests. Please wait a moment and try again.` 
      });
    } else if (response.status === 500) {
      setAlertMessage({ 
        type: 'error', 
        message: `Backend Error (500): The leads API is experiencing issues. Please try again later or contact support.` 
      });
    } else if (response.status === 404) {
      setAlertMessage({ 
        type: 'error', 
        message: `API Endpoint Not Found (404): The leads API endpoint may not be implemented yet on the backend.` 
      });
    } else if (response.status === 401) {
      setAlertMessage({ 
        type: 'error', 
        message: `Unauthorized (401): Please check your authentication token.` 
      });
    } else {
      setAlertMessage({ 
        type: 'error', 
        message: `Failed to fetch leads: ${response.status} ${response.statusText}` 
      });
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch projects
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projectsList = projectsData.projects || projectsData || [];
        setProjects(projectsList);
        
        if (projectsList.length === 0) {
          setAlertMessage({ 
            type: 'error', 
            message: 'No projects found. Please create a project first before managing leads.' 
          });
        }
        //frwdw
      } else {
        console.error("Failed to fetch projects:", projectsResponse.statusText);
        setAlertMessage({ 
          type: 'error', 
          message: `Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText}` 
        });
      }
      
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
    
    // Validate required fields
    if (!formData.name.trim()) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Please enter a lead name' 
      });
      return;
    }
    
    if (!formData.source) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Please select a lead source' 
      });
      return;
    }
    
    if (!formData.status) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Please select a lead status' 
      });
      return;
    }
    
    if (!formData.projectId) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Please select a project from the dropdown to create this lead.' 
      });
      return;
    }

    if (!formData.userId) {
      setAlertMessage({ 
        type: 'error', 
        message: 'User ID not available. Please refresh the page and try again.' 
      });
      return;
    }

    // Validate dynamic fields based on selected status
    const requiredFields = getRequiredFieldsForStatus(formData.status);
    for (const field of requiredFields) {
      if (field.required) {
        const fieldValue = dynamicFields[field.name] || formData[field.name as keyof typeof formData];
        if (!fieldValue || !fieldValue.toString().trim()) {
          setAlertMessage({ 
            type: 'error', 
            message: `Please fill in the required field: ${field.name}` 
          });
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      if (editingLead) {
        // Update existing lead
        const response = await fetch(API_ENDPOINTS.UPDATE_LEAD(editingLead._id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: formData.projectId,
            leadSource: formData.source,
            currentStatus: formData.status,
            customData: {
              "First Name": formData.name.split(' ')[0] || formData.name,
              "Last Name": formData.name.split(' ').slice(1).join(' ') || '',
              "Email": formData.email,
              "Phone": formData.phone,
              "Notes": formData.notes,
              ...dynamicFields // Include dynamic fields
            },
            user: formData.userId
          }),
        });

        if (response.ok) {
          setAlertMessage({ type: 'success', message: 'Lead updated successfully!' });
          setTimeout(() => fetchLeads(), 2000);
        } else {
          let errorMessage = 'Failed to update lead';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = `Update failed: ${response.status} ${response.statusText}`;
          }
          setAlertMessage({ type: 'error', message: errorMessage });
        }
      } else {
        // Create new lead
        const requestBody = {
          projectId: formData.projectId,
          leadSource: formData.source,
          currentStatus: formData.status,
          customData: {
            "First Name": formData.name.split(' ')[0] || formData.name,
            "Last Name": formData.name.split(' ').slice(1).join(' ') || '',
            "Email": formData.email,
            "Phone": formData.phone,
            "Notes": formData.notes,
            ...dynamicFields // Include dynamic fields
          },
          user: formData.userId
        };
        
        const response = await fetch(API_ENDPOINTS.CREATE_LEAD(formData.projectId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          setAlertMessage({ type: 'success', message: 'Lead created successfully!' });
          setTimeout(() => fetchLeads(), 2000);
        } else {
          let errorMessage = 'Failed to create lead';
          try {
            const responseText = await response.text();
            try {
              const errorData = JSON.parse(responseText);
              errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
            } catch (parseError) {
              errorMessage = responseText || `Creation failed: ${response.status} ${response.statusText}`;
            }
          } catch (textError) {
            errorMessage = `Creation failed: ${response.status} ${response.statusText}`;
          }
          
          setAlertMessage({ 
            type: 'error', 
            message: `Lead creation failed (${response.status}): ${errorMessage}` 
          });
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving lead:", error);
      setAlertMessage({ type: 'error', message: 'Network error: Failed to save lead. Please check your connection.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      const response = await fetch(API_ENDPOINTS.DELETE_LEAD(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setAlertMessage({ type: 'success', message: 'Lead deleted successfully!' });
        setTimeout(() => fetchLeads(), 2000);
      } else {
        let errorMessage = 'Failed to delete lead';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Delete failed: ${response.status} ${response.statusText}`;
        }
        setAlertMessage({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      setAlertMessage({ type: 'error', message: 'Network error: Failed to delete lead. Please check your connection.' });
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.leadSource?._id || '',
      status: lead.currentStatus?._id || '',
      notes: lead.notes || '',
      projectId: formData.projectId || '',
      userId: formData.userId
    });
    
    // Populate dynamic fields from lead's customData
    const newDynamicFields: {[key: string]: any} = {};
    if (lead.currentStatus?._id) {
      const requiredFields = getRequiredFieldsForStatus(lead.currentStatus._id);
      requiredFields.forEach(field => {
        newDynamicFields[field.name] = lead.customData?.[field.name] || '';
      });
    }
    setDynamicFields(newDynamicFields);
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "",
      notes: "",
      projectId: projects.length > 0 ? projects[0]._id : "", // Use default project
      userId: formData.userId
    });
    setDynamicFields({});
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: "",
      notes: "",
      projectId: projects.length > 0 ? projects[0]._id : "", // Use default project
      userId: formData.userId
    });
    setDynamicFields({});
    setIsModalOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === "all" || lead.leadSource?._id === filterSource;
    const matchesStatus = filterStatus === "all" || lead.currentStatus?._id === filterStatus;
    return matchesSearch && matchesSource && matchesStatus;
  });

  if (isLoading || finalPermissions.permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">
          {finalPermissions.permissionsLoading ? 'Loading permissions...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // Check if user has permission to read leads
  if (!finalPermissions.canReadLeads) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Manage your sales leads and prospects
            </p>
          </div>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              <Icon icon="solar:shield-warning-line-duotone" className="mx-auto text-4xl mb-4" />
              <p className="text-lg font-medium mb-2">Access Denied</p>
              <p className="text-sm mb-4">
                You don't have permission to view leads. Please contact your administrator.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Manage your sales leads and prospects
            <span className="block lg:inline lg:ml-2 text-green-600 dark:text-green-400">
              • Viewing All Leads from All Projects
            </span>
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
          {finalPermissions.canCreateLeads && (
            <Button 
              onClick={handleAddNew} 
              color="primary"
              disabled={projects.length === 0 || finalPermissions.permissionsLoading}
              title={
                projects.length === 0 
                  ? "No projects available. Please create a project first." 
                  : finalPermissions.permissionsLoading 
                    ? "Loading permissions..." 
                    : ""
              }
              className="w-full lg:w-auto"
            >
              <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
              Add New Lead
            </Button>
          )}
        </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {leads.length}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Total Leads</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {leadSources.length}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Lead Sources</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {leadStatuses.length}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Lead Statuses</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {leads.filter(lead => {
                const currentStatus = lead.currentStatus;
                if (!currentStatus || !currentStatus._id) return false;
                const status = leadStatuses.find(s => s._id === currentStatus._id);
                return status && status.name === 'New';
              }).length}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400 font-medium">New Leads</div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {projects.length}
            </div>
            <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Total Projects</div>
          </div>
        </Card>
      </div>

      {/* No Projects Warning */}
      {projects.length === 0 && !isLoading && (
        <Alert color="warning">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon icon="solar:info-circle-line-duotone" className="mr-2" />
              <span>
                <strong>No Projects Available:</strong> You need to create at least one project before you can manage leads. 
                Please create a project first, then return to this page.
              </span>
            </div>
            <Button 
              size="sm" 
              color="gray" 
              onClick={() => fetchData()}
              className="ml-4"
            >
              <Icon icon="solar:refresh-line-duotone" className="mr-1" />
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <div>
            <TextInput
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
              disabled={projects.length === 0}
            />
          </div>
          <div>
            <Select
              value="all"
              disabled={true}
              title="Project filter disabled - viewing all leads"
            >
              <option value="all">All Projects</option>
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Viewing leads from all projects
            </p>
          </div>
          <div>
            <Select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              disabled={projects.length === 0}
            >
              <option value="all">All Sources</option>
              {leadSources.map(source => (
                <option key={source._id} value={source._id}>
                  {source.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={projects.length === 0}
            >
              <option value="all">All Statuses</option>
              {leadStatuses.map(status => (
                <option key={status._id} value={status._id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center">
            <Badge color="info" size="lg">
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      {projects.length > 0 ? (
        <Card>
          {isLoadingLeads ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading leads...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Table.Head>
                  <Table.HeadCell className="min-w-[120px]">Name</Table.HeadCell>
                  <Table.HeadCell className="min-w-[150px]">Contact</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Source</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Status</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Created</Table.HeadCell>
                  <Table.HeadCell className="min-w-[150px]">Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {filteredLeads.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500 dark:text-gray-400">
                          <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                          <p>No leads found</p>
                          <p className="text-sm">
                            {leads.length === 0 
                              ? "No leads available in the system"
                              : "No leads match your current filters"
                            }
                          </p>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredLeads.map((lead) => (
                      <Table.Row key={lead._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {lead.name || 'N/A'}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm">
                            <div>{lead.email || 'N/A'}</div>
                            <div className="text-gray-500 dark:text-gray-400">{lead.phone || 'N/A'}</div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color="blue" size="sm">
                            {lead.leadSource?.name || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color="green" size="sm">
                            {lead.currentStatus?.name || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {finalPermissions.canUpdateLeads && (
                              <Button
                                size="xs"
                                color="info"
                                onClick={() => handleEdit(lead)}
                                className="text-xs"
                                disabled={finalPermissions.permissionsLoading}
                              >
                                <Icon icon="solar:pen-line-duotone" className="mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            )}
                            {finalPermissions.canDeleteLeads && (
                              <Button
                                size="xs"
                                color="failure"
                                onClick={() => handleDelete(lead._id)}
                                className="text-xs"
                                disabled={finalPermissions.permissionsLoading}
                              >
                                <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            )}
                            {!finalPermissions.canUpdateLeads && !finalPermissions.canDeleteLeads && (
                              <Badge color="gray" size="sm">
                                No Actions Available
                              </Badge>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-4" />
              <p className="text-lg font-medium mb-2">No Projects Available</p>
              <p className="text-sm mb-4">
                You need to create at least one project before you can view or manage leads.
              </p>
              <Button color="primary" onClick={() => window.location.href = '/projects'}>
                <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={isModalOpen && projects.length > 0} onClose={handleCloseModal} size="xl">
        <Modal.Header>
          {editingLead ? 'Edit Lead' : 'Add New Lead'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body className="max-h-[80vh] overflow-y-auto">
            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" value="Full Name *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="name"
                      type="text"
                      placeholder="Enter full name..."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" value="Email Address" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="email"
                      type="email"
                      placeholder="Enter email address..."
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" value="Phone Number" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <TextInput
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Lead Details Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:chart-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lead Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="source" value="Lead Source *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <Select
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      required
                      className="w-full"
                    >
                      <option value="">Select lead source</option>
                      {leadSources.map(source => (
                        <option key={source._id} value={source._id}>
                          {source.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" value="Lead Status *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      required
                      className="w-full"
                    >
                      <option value="">Select lead status</option>
                      {leadStatuses.map(status => (
                        <option key={status._id} value={status._id}>
                          {status.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              {/* Project Selection Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:folder-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Project Assignment</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId" value="Project *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <Select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    required
                    className="w-full"
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <Icon icon="solar:info-circle-line-duotone" className="inline mr-1" />
                    Default project is selected, but you can change it if needed
                  </p>
                </div>
              </div>

              {/* Dynamic Fields based on selected status */}
              {formData.status && getRequiredFieldsForStatus(formData.status).length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                      <Icon icon="solar:settings-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Additional Required Fields
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        for "{leadStatuses.find(s => s._id === formData.status)?.name}" Status
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getRequiredFieldsForStatus(formData.status)
                      .filter(field => field.name && field.name.trim() !== '') // Filter out empty field names
                      .map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label 
                          htmlFor={field.name} 
                          value={`${field.name} ${field.required ? '*' : ''}`} 
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        />
                        {field.type === 'text' ? (
                          <TextInput
                            id={field.name}
                            type="text"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                          />
                        ) : field.type === 'email' ? (
                          <TextInput
                            id={field.name}
                            type="email"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                          />
                        ) : field.type === 'tel' ? (
                          <TextInput
                            id={field.name}
                            type="tel"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                          />
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.name}
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            rows={3}
                            required={field.required}
                            className="w-full"
                          />
                        ) : (
                          <TextInput
                            id={field.name}
                            type="text"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:notes-line-duotone" className="text-orange-600 dark:text-orange-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Notes</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" value="Notes" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <Textarea
                    id="notes"
                    placeholder="Enter additional notes or comments about this lead..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
              )}
              {editingLead ? 'Update' : 'Create'}
            </Button>
            <Button color="gray" onClick={handleCloseModal} className="w-full sm:w-auto">
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default LeadsPage;
