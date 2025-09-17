"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Textarea } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent, API_BASE_URL } from "@/lib/config";
import { useSearchParams, useRouter } from "next/navigation";
import { useLeadPermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/app/types/permissions";

const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface LeadSource {
  _id: string;
  name: string;
}

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

interface CPSourcingUser {
  _id: string;
  name: string;
  email: string;
}

interface FormField {
  name: string;
  type: string;
  required: boolean;
  options: string[];
  _id: string;
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
  is_default_status?: boolean; // Optional default field from API
  is_final_status?: boolean; // Optional final status field from API
}

interface Lead {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  leadSource?: {
    _id: string;
    name: string;
  } | null;
  currentStatus?: {
    _id: string;
    name: string;
  } | null;
  cpSourcingId?: {
    _id: string;
    name: string;
  } | null;
  channelPartner?: {
    _id: string;
    name: string;
  } | null;
  project?: {
    _id: string;
    name: string;
  } | null;
  customData: {
    "First Name"?: string;
    "Email"?: string;
    "Phone"?: string;
    "Notes"?: string;
    [key: string]: any;
  };
  statusHistory: any[];
  LeadScore?: number;
  createdAt: string;
  updatedAt: string;
  // Computed fields for display
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  projectName?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  level?: number;
  mobile?: string;
  companyName?: string;
}

const LeadsPage = () => {
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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
  const [users, setUsers] = useState<User[]>([]);
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  const [cpSourcingOptions, setCPSourcingOptions] = useState<CPSourcingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);



  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("custom");
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
    userId: "",
    remark: "", // For status updates
    leadPriority: "",
    propertyType: "",
    configuration: "",
    fundingMode: "",
    gender: "",
    budget: "",
    channelPartner: "", // Channel partner selection
    cpSourcingId: "" // Channel partner sourcing option
  });
  
  // Dynamic form fields based on selected status
  const [dynamicFields, setDynamicFields] = useState<{[key: string]: any}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({ newStatus: '', remark: '' });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [bulkTransferModal, setBulkTransferModal] = useState(false);
  const [transferToUser, setTransferToUser] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingCPSourcing, setIsLoadingCPSourcing] = useState(false);

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
      console.log("Setting userId:", user.id);
      setFormData(prev => ({ ...prev, userId: user.id }));
    } else {
      console.log("User or user.id not available:", user);
    }
  }, [user]);

  // Set most recent project as default (but user can still edit it)
  useEffect(() => {
    if (projects.length > 0 && !formData.projectId) {
      // Set the most recent project (first in the list) as default
      setFormData(prev => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects, formData.projectId]);

  // Fetch CP sourcing options when editing a lead and channel partner/project are set
  useEffect(() => {
    if (editingLead && formData.channelPartner && formData.projectId && token) {
      fetchCPSourcingOptions(formData.channelPartner, formData.projectId);
    }
  }, [editingLead, formData.channelPartner, formData.projectId, token]);

  // Get required fields for selected status
  const getRequiredFieldsForStatus = (statusId: string) => {
    const status = leadStatuses.find(s => s._id === statusId);
    return status?.formFields || [];
  };

  // Update dynamic fields when status changes (disabled for locked default status)
  const handleStatusChange = (statusId: string) => {
    // Don't allow status changes when dropdown is disabled
    
    setFormData(prev => ({ ...prev, status: statusId }));
    
    // Reset dynamic fields
    const newDynamicFields: {[key: string]: any} = {};
    const requiredFields = getRequiredFieldsForStatus(statusId);
    const newlySelectedStatus = leadStatuses.find(s => s._id === statusId);
    
    // Initialize dynamic fields based on status requirements
    requiredFields.forEach(field => {
      if (field.type === 'date') {
        if (newlySelectedStatus?.is_final_status) {
          const today = new Date();
          newDynamicFields[field.name] = formatDateToYYYYMMDD(today);
        } else {
          newDynamicFields[field.name] = ''; // Clear date if not a final status
        }
      } else if (field.type === 'checkbox') {
        // Initialize checkbox fields as empty arrays
        newDynamicFields[field.name] = [];
      } else {
        // Initialize other fields as empty strings
        newDynamicFields[field.name] = formData[field.name as keyof typeof formData] || "";
      }
    });
    
    setDynamicFields(newDynamicFields);
  };

  // Function to fetch CP sourcing users for a specific channel partner and project
  const fetchCPSourcingOptions = async (channelPartnerId: string, projectId: string) => {
    if (!channelPartnerId || !projectId) {
      setCPSourcingOptions([]);
      return;
    }

    try {
      setIsLoadingCPSourcing(true);
      const response = await fetch(
        `http://localhost:5000/api/cp-sourcing/unique-users?projectId=${projectId}&channelPartnerId=${channelPartnerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        // The API returns an array of users directly
        const sourcingOptions = Array.isArray(data) ? data : [];
        setCPSourcingOptions(sourcingOptions);
      } else {
        console.error('Failed to fetch CP sourcing users:', response.statusText);
        setCPSourcingOptions([]);
      }
    } catch (error) {
      console.error('Error fetching CP sourcing users:', error);
      setCPSourcingOptions([]);
    } finally {
      setIsLoadingCPSourcing(false);
    }
  };

  const fetchAllCPSourcingUsers = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/cp-sourcing/unique-users-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCPSourcingOptions(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch all CP sourcing users:', response.statusText);
        setCPSourcingOptions([]);
      }
    } catch (error) {
      console.error('Error fetching all CP sourcing users:', error);
      setCPSourcingOptions([]);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = e.target.value;
    
    // Check if the selected source is a channel partner (either by ID or manual value)
    const isChannelPartner = newSource === 'channel-partner' || 
      leadSources.some(source => source._id === newSource && source.name.toLowerCase() === 'channel partner');
    
    // Single functional update to prevent stale overwrites
    setFormData(prev => ({ 
      ...prev, 
      source: newSource,
      channelPartner: isChannelPartner ? prev.channelPartner : '',
      cpSourcingId: isChannelPartner ? prev.cpSourcingId : ''
    }));
    
    // Reset dynamic fields when source changes
    setDynamicFields({});
  };

  // Handler for channel partner change
  const handleChannelPartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const channelPartnerId = e.target.value;
    const projectId = formData.projectId;
    
    setFormData(prev => ({ 
      ...prev, 
      channelPartner: channelPartnerId,
      cpSourcingId: '' // Reset CP sourcing when channel partner changes
    }));
    
    // Fetch CP sourcing options for the selected channel partner and project
    if (channelPartnerId && projectId) {
      fetchCPSourcingOptions(channelPartnerId, projectId);
    } else {
      setCPSourcingOptions([]);
    }
  };

  // Handler for project change
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value;
    const channelPartnerId = formData.channelPartner;
    
    setFormData(prev => ({ 
      ...prev, 
      projectId: projectId,
      cpSourcingId: '' // Reset CP sourcing when project changes
    }));
    
    // If a channel partner is already selected, fetch CP sourcing options for the new project
    if (channelPartnerId && projectId) {
      fetchCPSourcingOptions(channelPartnerId, projectId);
    } else {
      setCPSourcingOptions([]);
    }
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
        console.log('Leads Data:', leadsData);
        const leadsArray = leadsData.leads || leadsData || [];
        const transformedLeads = transformLeadData(leadsArray);
        setLeads(transformedLeads);
        setLastRefresh(new Date());
        
        // Only clear selected leads if we're not in bulk transfer mode
        // This prevents clearing selection when refreshing for bulk transfer
        if (!bulkTransferModal) {
          setSelectedLeads([]);
        }
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
    return leadsData.map(lead => {
      // Determine source name prioritizing top-level relations first
      let sourceName = 'N/A';

      // Prefer top-level populated channelPartner
      if (lead.channelPartner) {
        const cpObj = typeof lead.channelPartner === 'object' ? lead.channelPartner : null;
        const cpName = cpObj?.name;
        if (cpName) {
          sourceName = `Channel Partner: ${cpName}`;
        } else {
          // fallback to custom data id mapping
          const cpIdFromCustom = lead.customData?.["Channel Partner"];
          const cp = channelPartners.find(cp => cp._id === cpIdFromCustom);
          if (cp) sourceName = `Channel Partner: ${cp.name}`;
          else sourceName = 'Channel Partner';
        }

        // Append sourcing info if available
        const cpSourcingRef = lead.cpSourcingId || lead.customData?.["Channel Partner Sourcing"];
        if (cpSourcingRef) {
          let cpSourcing: any = null;
          if (typeof cpSourcingRef === 'object' && cpSourcingRef !== null) {
            cpSourcing = cpSourcingRef;
          } else {
            cpSourcing = cpSourcingOptions.find(cp => cp._id === cpSourcingRef);
          }
          if (cpSourcing && cpSourcing.channelPartnerId && cpSourcing.projectId) {
            sourceName += ` (${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name})`;
          }
        }
      } else if (lead.leadSource?._id) {
        // Regular lead source
        sourceName = lead.leadSource?.name || 'N/A';
      } else {
        // Final fallback: infer from customData if present
        const cpIdFromCustom = lead.customData?.["Channel Partner"];
        if (cpIdFromCustom) {
          const cp = channelPartners.find(cp => cp._id === cpIdFromCustom);
          sourceName = cp ? `Channel Partner: ${cp.name}` : 'Channel Partner';
        }
      }

      return {
        ...lead,
        name: `${lead.customData?.["First Name"] || ''}`.trim() || 'N/A',
        email: lead.customData?.["Email"] || 'N/A',
        phone: lead.customData?.["Phone"] || 'N/A',
        company: 'N/A',
        notes: lead.customData?.["Notes"] || '',
        source: sourceName,
        status: lead.currentStatus?._id || 'N/A',
        projectName: lead.project?.name || 'N/A',
        LeadScore: lead.LeadScore || 0
      };
    });
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
        const statuses = statusesData.leadStatuses || statusesData || [];
        setLeadStatuses(statuses);
        
        // Set default status (check for default field, then "New", then first status)
        if (statuses.length > 0 && !formData.status) {
          console.log('Available statuses:', statuses.map((s: LeadStatus) => ({ 
            name: s.name, 
            id: s._id, 
            is_default_status: (s as any).is_default_status,
            isDefault: (s as any).is_default_status === true 
          })));
          
          const defaultStatus = statuses.find((status: LeadStatus) => 
            (status as any).is_default_status === true
          ) || statuses.find((status: LeadStatus) => 
            status.name.toLowerCase() === 'new'
          ) || statuses[0]; // Fallback to first status if no default found
          
          console.log('Selected default status:', {
            name: defaultStatus?.name,
            id: defaultStatus?._id,
            isFromDefaultField: (defaultStatus as any)?.is_default_status === true,
            isFromNewName: defaultStatus?.name?.toLowerCase() === 'new',
            isFirstStatus: statuses[0] === defaultStatus
          });
          
          setFormData(prev => ({ ...prev, status: defaultStatus._id }));
          
          // Also populate dynamic fields for the default status
          if (defaultStatus.formFields && defaultStatus.formFields.length > 0) {
            const newDynamicFields: {[key: string]: any} = {};
            defaultStatus.formFields.forEach((field: FormField) => {
              if (field.type === 'date') {
                const today = new Date();
                newDynamicFields[field.name] = formatDateToDDMMYYYY(today);
              } else if (field.type === 'checkbox') {
                // Initialize checkbox fields as empty arrays
                newDynamicFields[field.name] = [];
              } else {
                // Initialize other fields as empty strings
                newDynamicFields[field.name] = '';
              }
            });
            setDynamicFields(newDynamicFields);
          }
        }
      }

      // Fetch channel partners
      const channelPartnersResponse = await fetch(API_ENDPOINTS.CHANNEL_PARTNERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (channelPartnersResponse.ok) {
        const channelPartnersData = await channelPartnersResponse.json();
        const partners = channelPartnersData.channelPartners || channelPartnersData || [];
        setChannelPartners(partners);
        await fetchAllCPSourcingUsers(); // Fetch all CP sourcing users
      }

      // Fetch CP sourcing options - will be fetched dynamically when channel partner is selected
      // Initial empty state
      setCPSourcingOptions([]);

      // Fetch users (only for super admin)
      if (isSuperAdmin) {
        const usersResponse = await fetch(API_ENDPOINTS.USERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const projectsData = await usersResponse.json();
          const projects = projectsData.projects || projectsData || [];
          
          // Extract all unique users from projects (owner, members, managers)
          const allUsers = new Map();
          
          projects.forEach((project: any) => {
            // Add owner
            if (project.owner) {
              allUsers.set(project.owner._id, {
                _id: project.owner._id,
                name: project.owner.name,
                email: project.owner.email,
                role: project.owner.role,
                level: project.owner.level,
                mobile: project.owner.mobile,
                companyName: project.owner.companyName
              });
            }
            
            // Add members
            if (project.members && Array.isArray(project.members)) {
              project.members.forEach((member: any) => {
                allUsers.set(member._id, {
                  _id: member._id,
                  name: member.name,
                  email: member.email,
                  role: member.role,
                  level: member.level,
                  mobile: member.mobile,
                  companyName: member.companyName
                });
              });
            }
            
            // Add managers
            if (project.managers && Array.isArray(project.managers)) {
              project.managers.forEach((manager: any) => {
                allUsers.set(manager._id, {
                  _id: manager._id,
                  name: manager.name,
                  email: manager.email,
                  role: manager.role,
                  level: manager.level,
                  mobile: manager.mobile,
                  companyName: manager.companyName
                });
              });
            }
          });
          
          // Convert Map to Array
          const usersList = Array.from(allUsers.values());
          setUsers(usersList);
          console.log("Extracted users from projects:", usersList);
        } else {
          console.error("Failed to fetch users:", usersResponse.statusText);
        }
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
    
    // If channel partner is selected as source, validate channel partner selection
    const isChannelPartner = formData.source === 'channel-partner' || 
      leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner');
    
    if (!editingLead && isChannelPartner && !formData.channelPartner) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Please select a channel partner' 
      });
      return;
    }
    
    if (!formData.status) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Default lead status not found. Please refresh the page.' 
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
    if (!editingLead) { // Only validate dynamic fields for new leads
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
    }

    try {
      setIsSubmitting(true);
      
      if (editingLead) {
        // Check if status has changed - if so, use status update API
        const statusChanged = editingLead.currentStatus?._id !== formData.status;
        
        if (statusChanged) {
          // Use status update API with the format you specified
          const statusUpdateBody = {
            newStatus: formData.status, // new status id
            newData: { 
              "First Name": editingLead.customData?.["First Name"] || 'N/A',
              "Email": editingLead.customData?.["Email"] || editingLead.email || 'N/A',
              "Phone": editingLead.customData?.["Phone"] || editingLead.phone || 'N/A',
              "Notes": editingLead.customData?.["Notes"] || editingLead.notes || '',
              "Lead Priority": editingLead.customData?.["Lead Priority"] || '',
              "Property Type": editingLead.customData?.["Property Type"] || '',
              "Configuration": editingLead.customData?.["Configuration"] || '',
              "Funding Mode": editingLead.customData?.["Funding Mode"] || '',
              "Gender": editingLead.customData?.["Gender"] || '',
              "Budget": editingLead.customData?.["Budget"] || '',
              "Remark": formData.remark || 'Status updated',
              ...dynamicFields // Include dynamic fields
            } // form data
          };
          
          console.log('Status update request:', {
            url: `${API_BASE_URL}/api/leads/${editingLead._id}/status/`,
            method: 'PUT',
            body: statusUpdateBody
          });
          console.log('Dynamic fields being sent:', dynamicFields);
          
          const response = await fetch(`${API_BASE_URL}/api/leads/${editingLead._id}/status/`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(statusUpdateBody),
          });

          if (response.ok) {
            setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });
            handleCloseModal();
            fetchLeads();
          } else {
            let errorMessage = 'Failed to update lead status';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
              errorMessage = `Status update failed: ${response.status} ${response.statusText}`;
            }
            setAlertMessage({ type: 'error', message: errorMessage });
          }
        } else {
          // Regular lead update (no status change)
        const response = await fetch(API_ENDPOINTS.UPDATE_LEAD(editingLead._id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            // Always send the selected lead source id (do not replace with CP id)
            leadSource: formData.source,
            currentStatus: formData.status,
            // Send CP details only if provided
            channelPartner: formData.channelPartner || undefined,
            cpSourcingId: formData.cpSourcingId || undefined,
            customData: {
              "First Name": formData.name.split(' ')[0] || formData.name,
              "Email": formData.email,
              "Phone": formData.phone,
              "Notes": formData.notes,
              "Lead Priority": formData.leadPriority,
              "Property Type": formData.propertyType,
              "Configuration": formData.configuration,
              "Funding Mode": formData.fundingMode,
              "Gender": formData.gender,
              "Budget": formData.budget,
              ...dynamicFields // Include dynamic fields
            },
              userId: formData.userId
          }),
        });

        if (response.ok) {
          setAlertMessage({ type: 'success', message: 'Lead updated successfully!' });
            handleCloseModal();
            fetchLeads();
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
        }
      } else {
        // Create new lead
        const requestBody = {
          // Always send the selected lead source id (do not replace with CP id)
          leadSource: formData.source,
          currentStatus: formData.status,
          project: formData.projectId, // Add required project field
          channelPartner: formData.channelPartner || undefined,
          cpSourcingId: formData.cpSourcingId || undefined,
          customData: {
            "First Name": formData.name.split(' ')[0] || formData.name,
            "Email": formData.email,
            "Phone": formData.phone,
            "Notes": formData.notes,
            "Lead Priority": formData.leadPriority,
            "Property Type": formData.propertyType,
            "Configuration": formData.configuration,
            "Funding Mode": formData.fundingMode,
            "Gender": formData.gender,
            "Budget": formData.budget,
            ...dynamicFields // Include dynamic fields
          },
          userId: formData.userId
        };
        
        console.log('Creating new lead with dynamic fields:', {
          dynamicFields,
          requestBody
        });
        
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

  const handleStatusUpdate = async (leadId: string, newStatusId: string, remark: string = '') => {
    try {
      setIsUpdatingStatus(true);
      
      // Find the lead to get its current data
      const currentLead = leads.find(lead => lead._id === leadId);
      
      const requestBody = {
        newStatus: newStatusId, // new status id
        newData: { 
          "First Name": currentLead?.customData?.["First Name"] || '',
          "Email": currentLead?.customData?.["Email"] || '',
          "Phone": currentLead?.customData?.["Phone"] || '',
          "Notes": currentLead?.customData?.["Notes"] || '',
          "Lead Priority": currentLead?.customData?.["Lead Priority"] || '',
          "Property Type": currentLead?.customData?.["Property Type"] || '',
          "Configuration": currentLead?.customData?.["Configuration"] || '',
          "Funding Mode": currentLead?.customData?.["Funding Mode"] || '',
          "Gender": currentLead?.customData?.["Gender"] || '',
          "Budget": currentLead?.customData?.["Budget"] || '',
          "Remark": remark || 'Status updated',
          // Include all dynamic fields from current lead's customData
          ...Object.keys(currentLead?.customData || {}).reduce((acc, key) => {
            if (!["First Name", "Email", "Phone", "Notes", "Lead Priority", "Property Type", "Configuration", "Funding Mode", "Gender", "Budget"].includes(key)) {
              acc[key] = currentLead?.customData?.[key];
            }
            return acc;
          }, {} as any)
        } // form data
      };
      
      console.log('Status update request:', {
        url: `${API_BASE_URL}/api/leads/${leadId}/status/`,
        method: 'PUT',
        body: requestBody
      });
      
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/status/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Status update response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });
        fetchLeads(); // Refresh immediately
        setStatusUpdateData({ newStatus: '', remark: '' });
      } else {
        let errorMessage = 'Failed to update lead status';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('Error response data:', errorData);
        } catch (parseError) {
          errorMessage = `Status updat failed: ${response.status} ${response.statusText}`;
        }
        setAlertMessage({ type: 'error', message: errorMessage });
      }
    } catch (error) {
      console.error("Error updating lead status:", error);
      setAlertMessage({ type: 'error', message: 'Network error: Failed to update lead status. Please check your connection.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Bulk transfer functions
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead._id));
    }
  };

  const fetchRecipientProjects = async (recipientUserId: string) => {
    if (!token || !recipientUserId) return;
    
    try {
      console.log('Fetching projects for recipient user:', recipientUserId);
      
      // First try the superadmin endpoint to get user with projects
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/with-projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Superadmin users with projects response:', data);
        
        // Find the specific user and extract their projects
        const users = data.users || data || [];
        const recipientUser = users.find((u: any) => u._id === recipientUserId);
        
        if (recipientUser && recipientUser.projects && Array.isArray(recipientUser.projects)) {
          console.log('Found recipient user projects:', recipientUser.projects);
          setUserProjects(recipientUser.projects);
          return;
        }
      }
      
      // Fallback: try to get projects from the user's assigned projects
      const userProjectsResponse = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userProjectsResponse.ok) {
        const projectsData = await userProjectsResponse.json();
        const allProjects = projectsData.projects || projectsData || [];
        
        // Filter projects where the user is owner, member, or manager
        const userAssignedProjects = allProjects.filter((project: any) => {
          const isOwner = project.owner && project.owner._id === recipientUserId;
          const isMember = project.members && project.members.some((member: any) => member._id === recipientUserId);
          const isManager = project.managers && project.managers.some((manager: any) => manager._id === recipientUserId);
          
          return isOwner || isMember || isManager;
        });
        
        console.log('Filtered user assigned projects:', userAssignedProjects);
        
        if (userAssignedProjects.length > 0) {
          setUserProjects(userAssignedProjects);
        } else {
          // If no specific projects found, show all projects as fallback
          console.log('No specific projects found for user, showing all projects');
          setUserProjects(allProjects);
        }
      } else {
        console.log('Failed to fetch projects, using all available projects');
        setUserProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching recipient projects:', error);
      // Fallback to all projects
      setUserProjects(projects);
    }
  };

  const handleOpenBulkTransferModal = async () => {
    // Check if leads are selected first
    if (selectedLeads.length === 0) {
      setAlertMessage({ type: 'error', message: 'Please select leads to transfer first.' });
      return;
    }
    
    setBulkTransferModal(true);
    setSelectedProjectId('');
    setTransferToUser('');
    setUserProjects([]); // Clear previous projects
    
    // Store current selection before refresh
    const currentSelection = [...selectedLeads];
    console.log('Opening bulk transfer with selected leads:', currentSelection);
    
    // Refresh leads to ensure we have the latest data
    console.log('Refreshing leads before bulk transfer...');
    await fetchLeads();
    
    // Restore selection after refresh
    setSelectedLeads(currentSelection);
    console.log('Restored selection after refresh:', currentSelection);
  };

  const handleRecipientUserChange = (userId: string) => {
    setTransferToUser(userId);
    setSelectedProjectId(''); // Clear selected project when user changes
    if (userId) {
      fetchRecipientProjects(userId);
    } else {
      setUserProjects([]);
    }
  };

  const handleBulkTransfer = async () => {
    if (selectedLeads.length === 0) {
      setAlertMessage({ type: 'error', message: 'Please select leads to transfer' });
      return;
    }

    if (!transferToUser) {
      setAlertMessage({ type: 'error', message: 'Please select a user to transfer to' });
      return;
    }

    if (!selectedProjectId) {
      setAlertMessage({ type: 'error', message: 'Please select a project for the transfer' });
      return;
    }

    // Validate that selected leads exist in current leads (no ownership restriction)
    const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead._id));
    const validLeadIds = selectedLeadsData.map(lead => lead._id);
    const invalidLeadIds = selectedLeads.filter(id => !leads.some(lead => lead._id === id));
    
    // Check if any leads are already assigned to the target user AND project
    const alreadyAssignedLeads = selectedLeadsData.filter(lead => 
      lead.user?._id === transferToUser && lead.project?._id === selectedProjectId
    );
    const alreadyAssignedLeadIds = alreadyAssignedLeads.map(lead => lead._id);
    const transferableLeadIds = selectedLeadsData.filter(lead => 
      !(lead.user?._id === transferToUser && lead.project?._id === selectedProjectId)
    ).map(lead => lead._id);
    
    console.log('Selected leads validation:', {
      selectedLeads,
      validLeadIds,
      invalidLeadIds,
      alreadyAssignedLeadIds,
      transferableLeadIds,
      totalLeads: leads.length,
      selectedCount: selectedLeadsData.length,
      targetUser: transferToUser,
      allLeads: leads.map(l => ({ id: l._id, name: l.name, userId: l.user?._id, currentUser: user?.id }))
    });

    // If no valid leads found, show a more helpful error
    if (validLeadIds.length === 0) {
      if (selectedLeads.length === 0) {
        setAlertMessage({ type: 'error', message: 'Please select leads to transfer first.' });
      } else if (invalidLeadIds.length === selectedLeads.length) {
        setAlertMessage({ 
          type: 'error', 
          message: 'Selected leads are no longer available. Please refresh the page and select leads again.' 
        });
        // Clear the invalid selection
        setSelectedLeads([]);
      } else {
        setAlertMessage({ 
          type: 'error', 
          message: 'No valid leads found for transfer. Please check your selection and try again.' 
        });
      }
      return;
    }

    // Check if all selected leads are already assigned to the target user AND project
    if (alreadyAssignedLeadIds.length === selectedLeads.length) {
      setAlertMessage({ 
        type: 'info', 
        message: `All selected leads are already assigned to the target user and project. No transfer needed.` 
      });
      return;
    }

    // If some leads are already assigned, show info message and continue with transferable ones
    if (alreadyAssignedLeadIds.length > 0) {
      setAlertMessage({ 
        type: 'info', 
        message: `Skipping ${alreadyAssignedLeadIds.length} lead(s) that are already assigned to the target user and project. Transferring ${transferableLeadIds.length} lead(s).` 
      });
    }


    // If some leads are invalid, remove them and continue with valid ones
    if (invalidLeadIds.length > 0) {
      console.log('Removing invalid lead IDs from selection:', invalidLeadIds);
      setSelectedLeads(validLeadIds);
      setAlertMessage({ 
        type: 'info', 
        message: `Removed ${invalidLeadIds.length} invalid lead(s) from selection. Proceeding with ${validLeadIds.length} valid lead(s).` 
      });
    }

    // Use only transferable leads (exclude already assigned ones)
    const finalLeadIds = transferableLeadIds.length > 0 ? transferableLeadIds : validLeadIds;
    
    if (finalLeadIds.length === 0) {
      setAlertMessage({ 
        type: 'info', 
        message: 'No leads available for transfer after filtering.' 
      });
      return;
    }

    setIsTransferring(true);
    try {
      // Get the old project information from the first lead being transferred
      const firstLead = leads.find(lead => finalLeadIds.includes(lead._id));
      const oldProjectId = firstLead?.project?._id;
      
      const requestBody = {
        fromUser: user?.id,
        toUser: transferToUser,
        leadIds: finalLeadIds, // Use only transferable lead IDs
        projectId: selectedProjectId, // New project ID
        oldProjectId: oldProjectId // Old project ID for activity tracking
      };

      console.log('Bulk transfer request:', {
        url: API_ENDPOINTS.BULK_TRANSFER_LEADS,
        method: 'POST',
        body: requestBody,
        note: 'Sending projectId as per schema validation'
      });

      const response = await fetch(API_ENDPOINTS.BULK_TRANSFER_LEADS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Bulk transfer response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.status === 404) {
        // Bulk transfer endpoint not implemented, fallback to individual transfers
        console.log('Bulk transfer endpoint not available, falling back to individual transfers...');
        await transferLeadsIndividually(validLeadIds, transferToUser, selectedProjectId);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Bulk transfer error data:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Bulk transfer successful:', result);
      
      setAlertMessage({ 
        type: 'success', 
        message: `Successfully transferred ${validLeadIds.length} lead(s)` 
      });
      
      // Reset selection and close modal
      setSelectedLeads([]);
      setBulkTransferModal(false);
      setTransferToUser('');
      
      // Refresh leads
      await fetchLeads();
      
    } catch (error) {
      console.error('Bulk transfer failed:', error);
      setAlertMessage({ 
        type: 'error', 
        message: `Bulk transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsTransferring(false);
    }
  };

  // Fallback function for individual lead transfers using bulk transfer API
  const transferLeadsIndividually = async (leadIds: string[], toUser: string, projectId: string) => {
    console.log('Starting individual lead transfers using bulk transfer API...', { leadIds, toUser, projectId });
    
    try {
      // Debug: Show selected leads data
      const selectedLeadsData = leads.filter(lead => leadIds.includes(lead._id));
      console.log('Selected leads data:', selectedLeadsData.map(lead => ({
        id: lead._id,
        name: lead.name,
        userId: lead.user?._id,
        currentUserId: user?.id
      })));

      // Check if any leads are already assigned to the target user AND project
      const alreadyAssignedLeads = selectedLeadsData.filter(lead => 
        lead.user?._id === toUser && lead.project?._id === projectId
      );
      const transferableLeads = selectedLeadsData.filter(lead => 
        !(lead.user?._id === toUser && lead.project?._id === projectId)
      );
      
      console.log('Lead assignment check:', {
        total: selectedLeadsData.length,
        alreadyAssigned: alreadyAssignedLeads.length,
        transferable: transferableLeads.length,
        targetUser: toUser
      });

      // If all leads are already assigned, show message and return
      if (alreadyAssignedLeads.length === selectedLeadsData.length) {
        setAlertMessage({ 
          type: 'info', 
          message: `All selected leads are already assigned to the target user and project. No transfer needed.` 
        });
        return;
      }

      // If some leads are already assigned, show info message
      if (alreadyAssignedLeads.length > 0) {
        setAlertMessage({ 
          type: 'info', 
          message: `Skipping ${alreadyAssignedLeads.length} lead(s) that are already assigned to the target user and project. Transferring ${transferableLeads.length} lead(s).` 
        });
      }

      // Group transferable leads by their actual owners since backend requires fromUser to match lead ownership
      const leadsByOwner = transferableLeads.reduce((acc, lead) => {
        const ownerId = lead.user?._id || 'unknown';
        if (!acc[ownerId]) {
          acc[ownerId] = [];
        }
        acc[ownerId].push(lead._id);
        return acc;
      }, {} as Record<string, string[]>);

      console.log('Leads grouped by owner:', leadsByOwner);

      let totalTransferred = 0;
      let totalErrors = 0;
      const errors: string[] = [];

      // Make separate transfer requests for each owner
      for (const [ownerId, ownerLeadIds] of Object.entries(leadsByOwner)) {
        try {
          // Get the old project information from the first lead being transferred
          const firstLead = leads.find(lead => ownerLeadIds.includes(lead._id));
          const oldProjectId = firstLead?.project?._id;
          
          const requestBody = {
            fromUser: ownerId,
            toUser: toUser,
            leadIds: ownerLeadIds,
            projectId: projectId, // New project ID
            oldProjectId: oldProjectId // Old project ID for activity tracking
          };

          console.log(`Transferring leads from owner ${ownerId}:`, requestBody);

          const response = await fetch(API_ENDPOINTS.BULK_TRANSFER_LEADS, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const result = await response.json();
            totalTransferred += result.modifiedCount || ownerLeadIds.length;
            console.log(`Successfully transferred ${ownerLeadIds.length} leads from owner ${ownerId}`);
          } else {
            const errorData = await response.json();
            totalErrors += ownerLeadIds.length;
            errors.push(`Owner ${ownerId}: ${errorData.message || 'Transfer failed'}`);
            console.error(`Failed to transfer leads from owner ${ownerId}:`, errorData);
          }
        } catch (error) {
          totalErrors += ownerLeadIds.length;
          errors.push(`Owner ${ownerId}: ${error instanceof Error ? error.message : 'Network error'}`);
          console.error(`Error transferring leads from owner ${ownerId}:`, error);
        }
      }

      // Show results
      if (totalTransferred > 0) {
        setAlertMessage({ 
          type: 'success', 
          message: `Successfully transferred ${totalTransferred} lead(s)` 
        });
      }

      if (totalErrors > 0) {
        setAlertMessage({ 
          type: 'error', 
          message: `Failed to transfer ${totalErrors} lead(s). Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}` 
        });
      }

      // Reset selection and close modal
      setSelectedLeads([]);
      setBulkTransferModal(false);
      setTransferToUser('');
      
      // Refresh leads
      await fetchLeads();
      
    } catch (error) {
      console.error('Individual transfer failed:', error);
      setAlertMessage({ 
        type: 'error', 
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
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
      projectId: lead.project?._id || '',
      userId: user?.id || '', // Always use current user's ID
      remark: '', // Reset remark for new status update
      leadPriority: lead.customData?.["Lead Priority"] || '',
      propertyType: lead.customData?.["Property Type"] || '',
      configuration: lead.customData?.["Configuration"] || '',
      fundingMode: lead.customData?.["Funding Mode"] || '',
      gender: lead.customData?.["Gender"] || '',
      budget: lead.customData?.["Budget"] || '',
      channelPartner: lead.customData?.["Channel Partner"] || '',
      cpSourcingId: lead.customData?.["Channel Partner Sourcing"] || ''
    });
    
    // Populate dynamic fields from lead's customData
    const newDynamicFields: {[key: string]: any} = {};
    if (lead.currentStatus?._id) {
      const requiredFields = getRequiredFieldsForStatus(lead.currentStatus._id);
      const currentLeadStatus = leadStatuses.find(s => s._id === lead.currentStatus?._id);
      
      requiredFields.forEach(field => {
        if (field.type === 'date') {
          if (currentLeadStatus?.is_final_status) {
            const today = new Date();
            newDynamicFields[field.name] = lead.customData?.[field.name] || formatDateToYYYYMMDD(today);
          } else {
            newDynamicFields[field.name] = lead.customData?.[field.name] || ''; // Keep existing or clear
          }
        } else if (field.type === 'checkbox') {
          // Initialize checkbox fields as arrays
          const existingValue = lead.customData?.[field.name];
          newDynamicFields[field.name] = Array.isArray(existingValue) ? existingValue : [];
        } else {
          // Initialize other fields as strings
          newDynamicFields[field.name] = lead.customData?.[field.name] || '';
        }
      });
    }
    setDynamicFields(newDynamicFields);
    
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    
    // Find default status (check for default field, then "New", then first status)
    const defaultStatus = leadStatuses.find((status: LeadStatus) => 
      (status as any).is_default_status === true
    ) || leadStatuses.find((status: LeadStatus) => 
      status.name.toLowerCase() === 'new'
    ) || leadStatuses[0];
    
    // Initialize dynamic fields for default status
    const newDynamicFields: {[key: string]: any} = {};
    if (defaultStatus && defaultStatus.formFields && defaultStatus.formFields.length > 0) {
      const selectedDefaultStatus = leadStatuses.find(s => s._id === defaultStatus._id);
      defaultStatus.formFields.forEach((field: FormField) => {
        if (field.type === 'date') {
          if (selectedDefaultStatus?.is_final_status) {
            const today = new Date();
            newDynamicFields[field.name] = formatDateToDDMMYYYY(today);
          } else {
            newDynamicFields[field.name] = ''; // Clear date if not a final status
          }
        } else if (field.type === 'checkbox') {
          // Initialize checkbox fields as empty arrays
          newDynamicFields[field.name] = [];
        } else {
          // Initialize other fields as empty strings
          newDynamicFields[field.name] = '';
        }
      });
    }
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: defaultStatus?._id || "", // Set default status
      notes: "",
      projectId: projects.length > 0 ? projects[0]._id : "", // Use default project
      userId: user?.id || "", // Always use current user's ID
      remark: "",
      leadPriority: "",
      propertyType: "",
      configuration: "",
      fundingMode: "",
      gender: "",
      budget: "",
      channelPartner: "",
      cpSourcingId: ""
    });
    setDynamicFields(newDynamicFields);
  };

  const handleAddNew = () => {
    setEditingLead(null);
    
    // Find default status (check for default field, then "New", then first status)
    console.log('handleAddNew - Available statuses:', leadStatuses.map((s: LeadStatus) => ({ 
      name: s.name, 
      id: s._id, 
      is_default_status: (s as any).is_default_status,
      isDefault: (s as any).is_default_status === true 
    })));
    
    const defaultStatus = leadStatuses.find((status: LeadStatus) => 
      (status as any).is_default_status === true
    ) || leadStatuses.find((status: LeadStatus) => 
      status.name.toLowerCase() === 'new'
    ) || leadStatuses[0];
    
    console.log('handleAddNew - Selected default status:', {
      name: defaultStatus?.name,
      id: defaultStatus?._id,
      isFromDefaultField: (defaultStatus as any)?.is_default_status === true,
      isFromNewName: defaultStatus?.name?.toLowerCase() === 'new',
      isFirstStatus: leadStatuses[0] === defaultStatus
    });
    
    // Initialize dynamic fields for default status
    const newDynamicFields: {[key: string]: any} = {};
    if (defaultStatus && defaultStatus.formFields && defaultStatus.formFields.length > 0) {
      defaultStatus.formFields.forEach((field: FormField) => {
        if (field.type === 'checkbox') {
          // Initialize checkbox fields as empty arrays
          newDynamicFields[field.name] = [];
        } else {
          // Initialize other fields as empty strings
          newDynamicFields[field.name] = '';
        }
      });
    }
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      source: "",
      status: defaultStatus?._id || "", // Set default status
      notes: "",
      projectId: projects.length > 0 ? projects[0]._id : "", // Use default project
      userId: user?.id || "", // Always use current user's ID
      remark: "",
      leadPriority: "",
      propertyType: "",
      configuration: "",
      fundingMode: "",
      gender: "",
      budget: "",
      channelPartner: "",
      cpSourcingId: ""
    });
    setDynamicFields(newDynamicFields);
    setIsModalOpen(true);
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case "today":
        const todayStr = today.toISOString().split('T')[0];
        setFilterDateFrom(todayStr);
        setFilterDateTo(todayStr);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setFilterDateFrom(yesterdayStr);
        setFilterDateTo(yesterdayStr);
        break;
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        setFilterDateFrom(startOfWeek.toISOString().split('T')[0]);
        setFilterDateTo(endOfWeek.toISOString().split('T')[0]);
        break;
      case "lastWeek":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        setFilterDateFrom(lastWeekStart.toISOString().split('T')[0]);
        setFilterDateTo(lastWeekEnd.toISOString().split('T')[0]);
        break;
      case "thisMonth":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFilterDateFrom(startOfMonth.toISOString().split('T')[0]);
        setFilterDateTo(endOfMonth.toISOString().split('T')[0]);
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilterDateFrom(lastMonthStart.toISOString().split('T')[0]);
        setFilterDateTo(lastMonthEnd.toISOString().split('T')[0]);
        break;
      case "clear":
        setFilterDateFrom("");
        setFilterDateTo("");
        break;
      default:
        // Custom - don't change dates
        break;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === "all" || lead.leadSource?._id === filterSource;
    const matchesStatus = filterStatus === "all" || lead.currentStatus?._id === filterStatus;
    
    // Date filtering
    let matchesDate = true;
    if (filterDateFrom || filterDateTo) {
      const leadDate = new Date(lead.createdAt);
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && leadDate >= fromDate;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && leadDate <= toDate;
      }
    }
    
    return matchesSearch && matchesSource && matchesStatus && matchesDate;
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
            {lastRefresh && (
              <span className="block lg:inline lg:ml-2 text-blue-600 dark:text-blue-400 text-xs">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
          <Button 
            onClick={fetchLeads} 
            color="gray"
            disabled={isLoadingLeads}
            title="Refresh leads list"
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:refresh-line-duotone" className={`mr-2 ${isLoadingLeads ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleOpenBulkTransferModal} 
            color="orange"
            disabled={isTransferring || selectedLeads.length === 0}
            title={selectedLeads.length === 0 ? "Please select leads first" : "Transfer selected leads"}
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:transfer-horizontal-line-duotone" className="mr-2" />
            {selectedLeads.length === 0 ? "Select Leads to Transfer" : `Transfer (${selectedLeads.length})`}
          </Button>
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
          color={alertMessage.type === 'success' ? 'success' : alertMessage.type === 'info' ? 'info' : 'failure'}
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

      {/* Quick Tips */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3">
          <Icon icon="solar:lightbulb-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              💡 <strong>Quick Tip:</strong> Click on any lead name or use the "View" button to see detailed information about that lead.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              You can also use the breadcrumb navigation to easily move between the leads list and individual lead details.
            </p>
          </div>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-3 lg:gap-4">
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
          <div>
            <TextInput
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              placeholder="From Date"
              disabled={projects.length === 0}
            />
            <p className="text-sm text-gray-500 mt-1">From Date</p>
          </div>
          <div>
            <TextInput
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              placeholder="To Date"
              disabled={projects.length === 0}
            />
            <p className="text-sm text-gray-500 mt-1">To Date</p>
          </div>
          <div>
            <Select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              disabled={projects.length === 0}
            >
              <option value="custom">Custom Range</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="clear">Clear All</option>
            </Select>
            <p className="text-sm text-gray-500 mt-1">Quick Filters</p>
          </div>
          <div>
            <Button
              color="gray"
              onClick={() => {
                setFilterDateFrom("");
                setFilterDateTo("");
                setDatePreset("custom");
              }}
              disabled={projects.length === 0}
              className="w-full"
            >
              <Icon icon="solar:refresh-line-duotone" className="mr-2" />
              Clear Dates
            </Button>
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
                  <Table.HeadCell className="min-w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAllLeads}
                      className="rounded border-gray-300"
                    />
                  </Table.HeadCell>
                  <Table.HeadCell className="min-w-[120px]">Name</Table.HeadCell>
                  <Table.HeadCell className="min-w-[150px]">Contact</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Source</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Status</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Project</Table.HeadCell>
                  <Table.HeadCell className="min-w-[140px]">Assigned To</Table.HeadCell>
                  <Table.HeadCell className="min-w-[100px]">Created</Table.HeadCell>
                  <Table.HeadCell className="min-w-[150px]">Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {filteredLeads.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={9} className="text-center py-8">
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
                      <Table.Row 
                        key={lead._id} 
                        className={`bg-white dark:border-gray-700 dark:bg-gray-800 ${
                          selectedLeads.includes(lead._id) 
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700' 
                            : ''
                        }`}
                      >
                        <Table.Cell>
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead._id)}
                            onChange={() => handleSelectLead(lead._id)}
                            className="rounded border-gray-300"
                          />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          <button
                            onClick={() => router.push(`/apps/leads/${lead._id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                          >
                            {lead.name || 'N/A'}
                          </button>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm">
                            <div>{lead.email || 'N/A'}</div>
                            <div className="text-gray-500 dark:text-gray-400">{lead.phone || 'N/A'}</div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {lead.source || 'N/A'}
                            </div>
                            {(lead.cpSourcingId || lead.customData?.["Channel Partner Sourcing"]) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">CP User:</span> {(() => {
                                  const cpSourcingId = (typeof lead.cpSourcingId === 'object' && lead.cpSourcingId ? lead.cpSourcingId._id : lead.cpSourcingId) || lead.customData?.["Channel Partner Sourcing"]; 
                                  const cpUser = cpSourcingOptions.find(user => user._id === cpSourcingId);
                                  return cpUser ? `${cpUser.name} (${cpUser.email})` : 'N/A';
                                })()}
                              </div>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color="green" size="sm">
                            {lead.currentStatus?.name || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color="purple" size="sm">
                            {lead.projectName || 'N/A'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {lead.user?.name || 'Unassigned'}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-xs">
                              {lead.user?.email || ''}
                            </div>
                            {lead.user?.role && (
                              <div className="mt-1">
                                <Badge color="blue" size="xs">
                                  {lead.user.role}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              size="xs"
                              color="primary"
                              onClick={() => router.push(`/apps/leads/${lead._id}`)}
                              className="text-xs"
                            >
                              <Icon icon="solar:eye-line-duotone" className="mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            {finalPermissions.canUpdateLeads && (
                              <Button
                                size="xs"
                                color="info"
                                onClick={() => handleEdit(lead)}
                                className="text-xs"
                                disabled={finalPermissions.permissionsLoading}
                              >
                                <Icon icon="solar:pen-line-duotone" className="mr-1" />
                                <span className="hidden sm:inline">change status</span>
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
                                View Only
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
      <Modal show={isModalOpen && projects.length > 0} onClose={handleCloseModal} size="6xl">
        <Modal.Header>
          {editingLead ? 'Change Lead Status' : 'Add New Lead'}
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
                      disabled={!!editingLead}
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
                      disabled={!!editingLead}
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
                      disabled={!!editingLead}
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
                  <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lead Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status is automatically set to default and locked
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="source" value="Lead Source *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                <Select
                  id="source"
                  value={formData.source}
                      onChange={handleSourceChange}
                  required
                      className="w-full"
                      disabled={!!editingLead}
                >
                  console.log(leadSources)
                      <option value="">Select lead source</option>
                  {leadSources.map(source => (
                    <option key={source._id} value={source._id}>
                      
                      {source.name}
                    </option>

                  ))}
                      {!leadSources.some(source => source.name.toLowerCase() === 'channel partner') && (
                        <option value="channel-partner">Channel Partner</option>
                      )}
                </Select>
                    {(formData.source === 'channel-partner' || 
                      leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner')) && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Icon icon="solar:info-circle-line-duotone" className="w-3 h-3" />
                        Channel partner selected as lead source
                      </p>
                    )}
              </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" value="Lead Status *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                <Select
                  id="status"
                  value={formData.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                  required
                      className="w-full"
                      disabled={!editingLead}
                >
                      <option value="">Select lead status</option>
                  {leadStatuses.map(status => (
                    <option key={status._id} value={status._id}>
                      {status.name}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Icon icon="solar:lock-line-duotone" className="w-3 h-3" />
                  Status is automatically set to default and locked
                </p>
              </div>
            </div>

              {/* Project Selection Section */}
              {formData.status !== (leadStatuses.find(s => s.name.toLowerCase() === 'new')?._id || '') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">
                      <Icon icon="solar:folder-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Project Selection</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select the project for this lead
                      </p>
                  </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectId" value="Project *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
              <Select
                id="projectId"
                value={formData.projectId}
                onChange={handleProjectChange}
                required
                    className="w-full"
                    disabled={!!editingLead}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
                {formData.projectId && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Icon icon="solar:check-circle-line-duotone" className="w-3 h-3" />
                    {(() => {
                      const selectedProject = projects.find(p => p._id === formData.projectId);
                      return selectedProject ? `Project: ${selectedProject.name}` : 'Project selected';
                    })()}
                  </p>
                )}
              </div>
            </div>
                </div>
              )}

                {/* Channel Partner Fields - Only show when Channel Partner is selected as source */} 
                {((formData.source === 'channel-partner' || 
                  leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner')) && !editingLead) && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center mb-6">
                      <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg mr-3">
                        <Icon icon="solar:users-group-two-rounded-line-duotone" className="text-orange-600 dark:text-orange-400 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Channel Partner Selection</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Select channel partner and CP sourcing user
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="channelPartner" value="Select Channel Partner *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                          <Select
                            id="channelPartner"
                            value={formData.channelPartner}
                            onChange={handleChannelPartnerChange}
                            required
                            className="w-full"
                          >
                            <option value="">Select a channel partner</option>
                            {channelPartners.map(partner => (
                              <option key={partner._id} value={partner._id}>
                                {partner.name} - {partner.firmName} - {partner.phone}
                              </option>
                            ))}
                          </Select>
                </div>
                      <div className="space-y-2">
                        <Label htmlFor="channelPartnerSourcing" value="CP Sourcing User" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                        <Select
                          id="cpSourcingId"
                          value={formData.cpSourcingId}
                          onChange={(e) => setFormData({ ...formData, cpSourcingId: e.target.value })}
                          className="w-full"
                          disabled={isLoadingCPSourcing || !formData.channelPartner || !formData.projectId}
                        >
                          <option value="">
                            {!formData.channelPartner || !formData.projectId 
                              ? "Select channel partner and project first"
                              : isLoadingCPSourcing 
                                ? "Loading users..."
                                : "Select CP sourcing user"
                            }
                          </option>
                          {cpSourcingOptions.map(user => (
                            <option key={user._id} value={user._id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                        </Select>
                        {isLoadingCPSourcing && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Icon icon="solar:refresh-line-duotone" className="w-3 h-3 animate-spin" />
                            Loading users...
                          </p>
                        )}
                        {!isLoadingCPSourcing && cpSourcingOptions.length === 0 && formData.channelPartner && formData.projectId && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No users found for this channel partner and project combination
                          </p>
                        )}
                      </div>
                </div>
                  </div>
                )}

             
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
                            // disabled={!!editingLead}
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
                            disabled={!!editingLead}
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
                            disabled={!!editingLead}
                          />
                        ) : field.type === 'number' ? (
                          <TextInput
                            id={field.name}
                            type="number"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                            disabled={!!editingLead}
                          />
                        ) : field.type === 'date' ? (
                          <TextInput
                            id={field.name}
                            type="date"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                            disabled={true} // Disable the date field
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
                            disabled={!!editingLead}
                          />
                        ) : field.type === 'select' && field.options && field.options.length > 0 ? (
                          <Select
                            id={field.name}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                            disabled={!!editingLead}
                          >
                            <option value="">Select {field.name}</option>
                            {field.options.map((option: string, index: number) => (
                              <option key={index} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                          <div className="space-y-2">
                            {field.options.map((option: string, index: number) => {
                              const currentValues = dynamicFields[field.name] || [];
                              const isChecked = Array.isArray(currentValues) 
                                ? currentValues.includes(option)
                                : currentValues === option;
                              
                              return (
                                <div key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`${field.name}_${index}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentValues = dynamicFields[field.name] || [];
                                      let newValues;
                                      
                                      if (Array.isArray(currentValues)) {
                                        if (e.target.checked) {
                                          newValues = [...currentValues, option];
                                        } else {
                                          newValues = currentValues.filter((v: string) => v !== option);
                                        }
                                      } else {
                                        newValues = e.target.checked ? [option] : [];
                                      }
                                      
                                      setDynamicFields(prev => ({ ...prev, [field.name]: newValues }));
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    disabled={!!editingLead}
                                  />
                                  <label htmlFor={`${field.name}_${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    {option}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <TextInput
                            id={field.name}
                            type="text"
                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                            value={dynamicFields[field.name] || ''}
                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.required}
                            className="w-full"
                            // disabled={!!editingLead}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Lead Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 dark:bg-indigo-900/20 p-2 rounded-lg mr-3">
                    <Icon icon="solar:settings-line-duotone" className="text-indigo-600 dark:text-indigo-400 text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Lead Information</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="leadPriority" value="Lead Priority *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="leadPriority"
                        value={formData.leadPriority}
                        onChange={(e) => setFormData({ ...formData, leadPriority: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Priority</option>
                        <option value="Hot">Hot</option>
                        <option value="Cold">Cold</option>
                        <option value="Warm">Warm</option>
                        
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="propertyType" value="Property Type *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="propertyType"
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Property Type</option>
                        <option value="residential">Residential</option>
                        
                       
                        <option value="Commercial">Commercial</option>
                       
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="configuration" value="Configuration *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="configuration"
                        value={formData.configuration}
                        onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Configuration</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                        <option value="2+1 BHK">2+1 BHK</option>
                        <option value="2+2 BHK">2+2 BHK</option>
                        <option value="commercial office">Commercial Office</option>
                        <option value="unknown">Unknown</option>
                      
                        <option value="Duplex">Duplex</option>
                       
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fundingMode" value="Funding Mode *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="fundingMode"
                        value={formData.fundingMode}
                        onChange={(e) => setFormData({ ...formData, fundingMode: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Funding Mode</option>
                        <option value="Self Funded">Self Funded</option>
                        <option value="sale out property">Sale Out Property</option>
                        <option value="loan">Loan</option>
                        <option value="self loan">Self Loan</option>
                        
                        
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="gender" value="Gender *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget" value="Budget *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                      <Select
                        id="budget"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full"
                        required
                        disabled={!!editingLead}
                      >
                        <option value="">Select Budget Range</option>
                        <option value="25-50 Lakhs">25-50 Lakhs</option>
                        <option value="50 Lakhs - 1 Crore">50 Lakhs - 1 Crore</option>
                        <option value="1-2 Crores">1-2 Crores</option>
                        <option value="2-5 Crores">2-5 Crores</option>
                        <option value="Above 5 Crores">Above 5 Crores</option>
                        <option value="Not Specified">Not Specified</option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {formData.status !== (leadStatuses.find(s => s.name.toLowerCase() === 'new')?._id || '') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3">
                      <Icon icon="solar:notes-line-duotone" className="text-gray-600 dark:text-gray-400 text-xl" />
                    </div>
                    <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Notes</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add any additional information about this lead
                      </p>
                    </div>
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes" value="Notes" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <Textarea
                    id="notes"
                        placeholder="Enter any additional notes about this lead..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={4}
                          className="w-full"
                        />
                    </div>
                  </div>
                )}
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

      {/* Bulk Transfer Modal */}
      <Modal show={bulkTransferModal} onClose={() => setBulkTransferModal(false)} size="md">
        <Modal.Header>Transfer Leads</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Transfer {selectedLeads.length} selected lead(s) to another user
              </p>
              {selectedLeads.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Selected Leads:</strong> {selectedLeads.length} lead(s) ready for transfer
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Total leads available: {leads.length}
                  </p>
                  {transferToUser && selectedProjectId && (() => {
                    const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead._id));
                    const alreadyAssignedCount = selectedLeadsData.filter(lead => 
                      lead.user?._id === transferToUser && lead.project?._id === selectedProjectId
                    ).length;
                    const transferableCount = selectedLeadsData.filter(lead => 
                      !(lead.user?._id === transferToUser && lead.project?._id === selectedProjectId)
                    ).length;
                    
                    if (alreadyAssignedCount > 0) {
                      return (
                        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-700">
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            <Icon icon="solar:warning-circle-line-duotone" className="inline mr-1" />
                            <strong>Warning:</strong> {alreadyAssignedCount} of {selectedLeads.length} selected lead(s) are already assigned to this user and project and will be skipped.
                          </p>
                          {transferableCount > 0 && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Only {transferableCount} lead(s) will be transferred.
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="transferToUser" value="Transfer to User" />
              <Select
                id="transferToUser"
                value={transferToUser}
                onChange={(e) => handleRecipientUserChange(e.target.value)}
                required
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="selectedProjectId" value="Project" />
              <Select
                id="selectedProjectId"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                disabled={!transferToUser || userProjects.length === 0}
              >
                <option value="">
                  {!transferToUser 
                    ? "Select a user first..." 
                    : userProjects.length === 0 
                      ? "Loading projects..." 
                      : "Select a project..."
                  }
                </option>
                {userProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {!transferToUser 
                  ? "Please select a user first to see their assigned projects"
                  : userProjects.length === 0 
                    ? "No projects found for this user"
                    : `Showing ${userProjects.length} project(s) accessible to the selected user`
                }
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={() => {
              setBulkTransferModal(false);
              setTransferToUser('');
              setSelectedProjectId('');
              setUserProjects([]); // Clear user projects
              setSelectedLeads([]); // Clear selection when modal is closed
            }}
            disabled={isTransferring}
          >
            Cancel
          </Button>
          <Button
            color="orange"
            onClick={handleBulkTransfer}
            disabled={isTransferring || !transferToUser || !selectedProjectId}
          >
            {isTransferring ? (
              <>
                <Icon icon="solar:refresh-line-duotone" className="mr-2 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Icon icon="solar:transfer-horizontal-line-duotone" className="mr-2" />
                Transfer Leads
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default LeadsPage;
