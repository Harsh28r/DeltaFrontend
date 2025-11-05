"use client";

import React, { useState, useEffect } from "react";

import { Button, Card, Badge, Alert, Timeline, Modal, TextInput, Label, Select, Textarea } from "flowbite-react";

import { Icon } from "@iconify/react";

import { useAuth } from "@/app/context/AuthContext";

import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";

import DateTimePicker from "@/components/DateTimePicker";

import { useParams, useRouter } from "next/navigation";

import Link from "next/link";



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

interface CPSourcing {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  channelPartnerId: {
    _id: string;
    name: string;
    phone: string;
  };
  projectId: {
    _id: string;
    name: string;
    location: string;
  };
  sourcingHistory: Array<{
    location: {
      lat: number;
      lng: number;
    };
    date: string;
    selfie: string;
    notes: string;
    _id: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
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

    formFields: FormField[];

    is_final_status: boolean;

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

  statusHistory: StatusHistoryItem[];

  LeadScore?: number;

  createdAt: string;

  updatedAt: string;

}



interface FormField {

  name: string;

  type: string;

  required: boolean;

  options: string[];

  _id: string;

  statusIds?: string[]; // Optional: IDs of statuses for nested status selection fields

}



interface StatusHistoryItem {

  status: {

    _id: string;

    name: string;

    formFields: FormField[];

    is_final_status: boolean;

  };

  data: any;

  changedAt: string;

  _id: string;

}



interface Activity {

  _id: string;

  lead: {
    _id: string;
    currentStatus: string;
  };

  user: {

    _id: string;

    name: string;

    email: string;

  };

  action: string;

  details: any;

  timestamp: string;

  createdAt: string;

  updatedAt: string;

}



const LeadDetailPage = () => {

  const { token, user } = useAuth();

  const params = useParams();

  const router = useRouter();

  const leadId = params.id as string;



  const [lead, setLead] = useState<Lead | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);

  const [leadStatuses, setLeadStatuses] = useState<any[]>([]);

  const [leadSources, setLeadSources] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);

  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);

  const [cpSourcingOptions, setCPSourcingOptions] = useState<CPSourcing[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const [editFormData, setEditFormData] = useState({

    firstName: '',

    email: '',

    phone: '',

    notes: '',

    leadSource: '',

    project: '',

    leadPriority: '',

    propertyType: '',

    configuration: '',

    fundingMode: '',

    gender: '',

    budget: ''
    

  });

  const [statusFormData, setStatusFormData] = useState<{
    newStatusId: string;
    statusRemark: string;
    [key: string]: any; // Added index signature for dynamic fields
  }>({
    newStatusId: '',
    statusRemark: ''
  });
  
  // Dynamic form fields based on selected status
  const [dynamicFields, setDynamicFields] = useState<{[key: string]: any}>({});
  
  // Counter to force remount of dynamic fields when status changes
  const [fieldResetKey, setFieldResetKey] = useState<number>(0);

  // Reset dynamic fields when status changes in the modal
  useEffect(() => {
    if (isStatusModalOpen && statusFormData.newStatusId) {
      console.log('🔄 Status changed to:', statusFormData.newStatusId);
      // Reset dynamic fields when a new status is selected
      setDynamicFields({});
    }
  }, [statusFormData.newStatusId, isStatusModalOpen]);

  // Function to resolve status name from various possible identifiers
  const resolveStatusName = (statusId: string, statuses: any[]) => {
    if (!statusId || !statuses || statuses.length === 0) {
      console.log('Status resolution failed - no statusId or statuses:', { statusId, statusesLength: statuses?.length });
      return statusId || 'Unknown Status';
    }
    
    console.log('Resolving status:', { statusId, availableStatuses: statuses.map(s => ({ id: s._id, name: s.name })) });
    
    // Try to find by _id first
    let status = statuses.find(s => s._id === statusId);
    if (status) {
      console.log('Found status by _id:', status.name);
      return status.name;
    }
    
    // Try to find by name
    status = statuses.find(s => s.name === statusId);
    if (status) {
      console.log('Found status by name:', status.name);
      return status.name;
    }
    
    // Try to find by id (alternative field)
    status = statuses.find(s => s.id === statusId);
    if (status) {
      console.log('Found status by id field:', status.name);
      return status.name;
    }
    
    // If no match found, return the original ID or a fallback
    console.log('No status found for ID:', statusId);
    return statusId || 'Unknown Status';
  };

  // Function to get source name with channel partner info
  const getSourceName = (lead: Lead) => {
    console.log('getSourceName Debug:', {
      leadCustomData: lead.customData,
      channelPartnerId: lead.customData?.["Channel Partner"],
      cpSourcingId: lead.customData?.["Channel Partner Sourcing"],
      channelPartners: channelPartners?.length || 0,
      cpSourcingOptions: cpSourcingOptions?.length || 0,
      leadSource: lead.leadSource
    });
    
    // Check if this is a channel partner by looking at customData
    const channelPartnerId = lead.customData?.["Channel Partner"];
    if (channelPartnerId) {
      // Find the channel partner name
      const channelPartner = channelPartners?.find(cp => cp._id === channelPartnerId);
      if (channelPartner) {
        let sourceName = `Channel Partner: ${channelPartner.name}`;
        
        // Add CP sourcing info if available
        const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
        if (cpSourcingId && Array.isArray(cpSourcingOptions)) {
          const cpSourcing = cpSourcingOptions.find(cp => cp._id === cpSourcingId);
          if (cpSourcing) {
            sourceName += ` (${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name})`;
          }
        }
        return sourceName;
      } else {
        // If channel partner not found, try to get name from CP sourcing data
        const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
        if (cpSourcingId && Array.isArray(cpSourcingOptions)) {
          const cpSourcing = cpSourcingOptions.find(cp => cp._id === cpSourcingId);
          if (cpSourcing) {
            return `Channel Partner: ${cpSourcing.channelPartnerId.name}`;
          }
        }
        return 'Channel Partner';
      }
    } else if (lead.leadSource?._id) {
      // Regular lead source
      return lead.leadSource?.name || 'N/A';
    }
    return 'N/A';
  };

  useEffect(() => {

    if (token && leadId) {

      fetchLeadDetails();

    }

  }, [token, leadId]);



  const fetchLeadDetails = async () => {

    try {

      setIsLoading(true);



      // Fetch lead details

      const leadResponse = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {

        headers: { Authorization: `Bearer ${token}` },

      });



      if (leadResponse.ok) {

        const data = await leadResponse.json();

        setLead(data.lead);

        setActivities(data.activities || []);



        // Populate edit form with current lead data

        if (data.lead) {

          const baseFormData = {
            firstName: data.lead.customData?.["First Name"] || data.lead.customData?.name || '',

            email: data.lead.customData?.["Email"] || data.lead.customData?.email || '',

            phone: data.lead.customData?.["Phone"] || data.lead.customData?.phone || data.lead.customData?.contact || '',

            notes: data.lead.customData?.["Notes"] || data.lead.customData?.notes || '',

            leadSource: data.lead.leadSource?._id || '',

            project: data.lead.project?._id || '',

            leadPriority: data.lead.customData?.["Lead Priority"] || data.lead.customData?.leadPriority || '',

            propertyType: data.lead.customData?.["Property Type"] || data.lead.customData?.propertyType || '',

            configuration: data.lead.customData?.["Configuration"] || data.lead.customData?.configuration || '',

            fundingMode: data.lead.customData?.["Funding Mode"] || data.lead.customData?.fundingMode || '',

            gender: data.lead.customData?.["Gender"] || data.lead.customData?.gender || '',

            budget: data.lead.customData?.["Budget"] || data.lead.customData?.budget || ''

          };

          // Add status-specific fields
          const statusFieldsData: any = {};
          if (data.lead.currentStatus?.formFields) {
            data.lead.currentStatus.formFields.forEach((field: FormField) => {
              statusFieldsData[field.name] = data.lead.customData?.[field.name] || '';
            });
          }

          setEditFormData({ ...baseFormData, ...statusFieldsData });


          // Populate status form with current status

          setStatusFormData({ newStatusId: data.lead.currentStatus?._id || '', statusRemark: '' });

        }

      } else {

        setAlertMessage({

          type: 'error',

          message: `Failed to fetch lead details: ${leadResponse.status} ${leadResponse.statusText}`

        });

      }


        
      // Fetch additional data for editing

      const [statusesResponse, sourcesResponse, projectsResponse, channelPartnersResponse, cpSourcingResponse] = await Promise.all([

        fetch(`${API_BASE_URL}/api/lead-statuses`, {

          headers: { Authorization: `Bearer ${token}` },

        }),

        fetch(`${API_BASE_URL}/api/lead-sources`, {

          headers: { Authorization: `Bearer ${token}` },

        }),

        fetch(`${API_BASE_URL}/api/projects`, {

          headers: { Authorization: `Bearer ${token}` },

        }),

        fetch(`${API_BASE_URL}/api/channel-partner`, {

          headers: { Authorization: `Bearer ${token}` },

        }),

        fetch(`${API_BASE_URL}/api/cp-sourcing/`, {

          headers: { Authorization: `Bearer ${token}` },

        })

      ]);



      if (statusesResponse.ok) {

        const statusesData = await statusesResponse.json();
        const statuses = statusesData.leadStatuses || statusesData || [];
        console.log('Loaded lead statuses:', statuses);
        setLeadStatuses(statuses);

      } else {
        console.error('Failed to load lead statuses:', statusesResponse.status, statusesResponse.statusText);
      }



      if (sourcesResponse.ok) {

        const sourcesData = await sourcesResponse.json();

        setLeadSources(sourcesData.leadSources || sourcesData || []);

      }



      if (projectsResponse.ok) {

        const projectsData = await projectsResponse.json();

        const projectsArray = projectsData.projects || projectsData || [];
        setProjects(projectsArray);

        // Derive users from projects (owner, members, managers)
        const allUsers = new Map<string, any>();
        projectsArray.forEach((project: any) => {
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
        setUsers(Array.from(allUsers.values()));

      }



      // Users are derived from projects above; no separate users API call

      // Handle channel partners response
      if (channelPartnersResponse.ok) {
        const channelPartnersData = await channelPartnersResponse.json();
        setChannelPartners(channelPartnersData.channelPartners || channelPartnersData || []);
      }

      // Handle CP sourcing response
      if (cpSourcingResponse.ok) {
        const cpSourcingData = await cpSourcingResponse.json();
        console.log('CP Sourcing API Response:', cpSourcingData);
        // Ensure we always set an array
        const cpSourcingArray = Array.isArray(cpSourcingData.cpSourcing) 
          ? cpSourcingData.cpSourcing 
          : Array.isArray(cpSourcingData) 
            ? cpSourcingData 
            : [];
        setCPSourcingOptions(cpSourcingArray);
      } else {
        console.error('CP Sourcing API error:', cpSourcingResponse.status, cpSourcingResponse.statusText);
        setCPSourcingOptions([]); // Ensure it's always an array
      }

    } catch (error) {

      console.error("Error fetching lead details:", error);

      setAlertMessage({

        type: 'error',

        message: 'Network error: Failed to fetch lead details. Please check your connection.'

      });

    } finally {

      setIsLoading(false);

    }

  };



  const getActionIcon = (action: string) => {

    switch (action) {

      case 'created':

        return 'solar:add-circle-line-duotone';

      case 'status_changed':

        return 'solar:refresh-line-duotone';

      case 'transferred':

        return 'solar:transfer-horizontal-line-duotone';

      case 'updated':

        return 'solar:pen-line-duotone';

      default:

        return 'solar:info-circle-line-duotone';

    }

  };



  const getActionColor = (action: string) => {

    switch (action) {

      case 'created':

        return 'green';

      case 'status_changed':

        return 'blue';

      case 'transferred':

        return 'orange';

      case 'updated':

        return 'purple';

      default:

        return 'gray';

    }

  };



  const formatActionText = (activity: Activity) => {

    switch (activity.action) {

      case 'created':

        return 'Lead created';

      case 'status_changed':

        return 'Status changed';

      case 'transferred':

        return 'Lead transferred';

      case 'updated':

        return 'Lead updated';

      default:

        return activity.action.replace('_', ' ');

    }

  };


  const formatDetails = (activity: Activity) => {

    switch (activity.action) {

      case 'status_changed':

        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon icon="solar:arrow-right-line-duotone" className="text-blue-600 dark:text-blue-400" />
              <span className="font-medium">Status Changed</span>
            </div>
            {(() => {
              console.log('Status change activity details:', {
                activityDetails: activity.details,
                leadStatuses: leadStatuses,
                oldStatus: activity.details.oldStatus,
                newStatusId: activity.details.newStatusId,
                newStatus: activity.details.newStatus
              });
              
              // Show debug info if status resolution fails
              const oldStatusId = activity.details.oldStatus || activity.details.oldStatusId;
              const newStatusId = activity.details.newStatusId || activity.details.newStatus;
              const oldStatusFound = leadStatuses.find(s => s._id === oldStatusId);
              const newStatusFound = leadStatuses.find(s => s._id === newStatusId);
              
              if (!oldStatusFound || !newStatusFound) {
                return (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:info-circle-line-duotone" className="text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Debug Info</span>
                    </div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                      <div>Old Status ID: {oldStatusId} {!oldStatusFound && '(Not found in statuses)'}</div>
                      <div>New Status ID: {newStatusId} {!newStatusFound && '(Not found in statuses)'}</div>
                      <div>Available Statuses: {leadStatuses.length}</div>
                      <div>Status IDs: {leadStatuses.map(s => s._id).join(', ')}</div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">From:</span>
                <Badge color="gray" size="sm">
                  {resolveStatusName(activity.details.oldStatus || activity.details.oldStatusId, leadStatuses)}
                </Badge>
                {(() => {
                  const oldStatusId = activity.details.oldStatus || activity.details.oldStatusId;
                  const oldStatus = leadStatuses.find(s => s._id === oldStatusId);
                  if (!oldStatus && oldStatusId) {
                    return (
                      <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                        (ID: {oldStatusId})
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">To:</span>
                <Badge color="green" size="sm">
                  {resolveStatusName(activity.details.newStatusId || activity.details.newStatus, leadStatuses)}
                </Badge>
                {(() => {
                  const newStatusId = activity.details.newStatusId || activity.details.newStatus;
                  const newStatus = leadStatuses.find(s => s._id === newStatusId);
                  if (!newStatus && newStatusId) {
                    return (
                      <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                        (ID: {newStatusId})
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            {activity.details.statusFields && Object.keys(activity.details.statusFields).length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:settings-line-duotone" className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Fields Updated:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {Object.entries(activity.details.statusFields).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1">
                      <span className="font-medium text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="text-gray-900 dark:text-white max-w-[150px] truncate">
                        {Array.isArray(value) ? value.join(', ') : String(value) || 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activity.details.remark && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:chat-round-line-duotone" className="text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Remark:</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{activity.details.remark}</p>
              </div>
            )}
          </div>
        );
      case 'transferred':

        return (

          <div className="text-sm space-y-2">
            {(() => {
              console.log('Transfer activity details:', activity.details);
              console.log('Available projects:', projects);
              console.log('Old project ID:', activity.details.oldProjectId);
              console.log('New project ID:', activity.details.newProjectId);
              return null;
            })()}

            {(() => {
              console.log('Transfer activity details:', activity.details);
              console.log('Available projects:', projects);
              console.log('Activity user:', activity.user);
              console.log('Available users:', users);
              console.log('Transfer to user ID:', activity.details.toUser || activity.details.transferredTo);
              console.log('All activity details keys:', Object.keys(activity.details));
              return null;
            })()}

            {/* Lead Name Information */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="solar:user-line-duotone" className="text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Lead Transferred</span>
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                <div className="font-medium">
                  {(() => {
                    // Try to get lead name from various possible sources
                    const leadName = activity.details.leadName || 
                                   activity.details.name ||
                                   (activity.details.oldData?.customData?.["First Name"] && activity.details.oldData?.customData?.["Last Name"] 
                                     ? `${activity.details.oldData.customData["First Name"]} ${activity.details.oldData.customData["Last Name"]}`.trim()
                                     : activity.details.oldData?.customData?.["First Name"]) ||
                                   (activity.details.newData?.customData?.["First Name"] && activity.details.newData?.customData?.["Last Name"]
                                     ? `${activity.details.newData.customData["First Name"]} ${activity.details.newData.customData["Last Name"]}`.trim()
                                     : activity.details.newData?.customData?.["First Name"]) ||
                                   (lead?.customData?.["First Name"] && lead?.customData?.["Last Name"]
                                     ? `${lead.customData["First Name"]} ${lead.customData["Last Name"]}`.trim()
                                     : lead?.customData?.["First Name"]) ||
                                   'Unknown Lead';
                    
                    console.log('Lead name resolution:', {
                      activityLeadName: activity.details.leadName,
                      activityName: activity.details.name,
                      oldDataName: activity.details.oldData?.customData?.["First Name"],
                      newDataName: activity.details.newData?.customData?.["First Name"],
                      currentLeadName: lead?.customData?.["First Name"],
                      resolvedName: leadName
                    });
                    
                    return leadName;
                  })()}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Lead ID: {activity.lead?._id?.slice(-8) || (lead?._id ? String(lead._id).slice(-8) : 'N/A')}
                </div>
              </div>
            </div>

            {(() => {
              // Try multiple ways to get project information
              const oldProjectId = activity.details.oldProjectId || 
                                 activity.details.oldProject?._id || 
                                 activity.details.oldData?.project ||
                                 activity.details.oldProject;
              
              const newProjectId = activity.details.newProjectId || 
                                 activity.details.newProject?._id || 
                                 activity.details.newData?.project ||
                                 activity.details.newProject;
              
              // Get project names from the projects array
              const oldProjectName = activity.details.oldProject?.name || 
                (oldProjectId && projects.find(p => p._id === oldProjectId)?.name) ||
                'N/A';
              
              const newProjectName = activity.details.newProject?.name || 
                (newProjectId && projects.find(p => p._id === newProjectId)?.name) ||
                'N/A';
              
              console.log('Project name resolution:', {
                oldProjectId,
                newProjectId,
                oldProjectName,
                newProjectName,
                projectsCount: projects.length,
                allProjectIds: projects.map(p => p._id),
                activityDetails: activity.details
              });
              
              // If we can't find project information, try to show current project info
              if (oldProjectName === 'N/A' && newProjectName === 'N/A') {
                const currentProjectName = lead?.project?.name;
                if (currentProjectName) {
                  return (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div><strong>Current Project:</strong> {currentProjectName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Project details not available in transfer record
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Project information not available in this transfer record
                  </div>
                );
              }
              
              return (
                <>
                  <div><strong>Old Project:</strong> {oldProjectName}</div>
                  <div><strong>New Project:</strong> {newProjectName}</div>
                </>
              );
            })()}

            {/* Transfer User Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Transferred By</span>
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <div className="font-medium">{activity.user?.name || 'Unknown User'}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">{activity.user?.email || 'N/A'}</div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:user-plus-line-duotone" className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">Transferred To</span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {(() => {
                    // Try to get the transferred to user information
                    const transferredToUserId = activity.details.toUser || activity.details.transferredTo;
                    const transferredToUser = users.find(u => u._id === transferredToUserId);
                    
                    console.log('Transfer recipient resolution:', {
                      transferredToUserId,
                      transferredToUser,
                      allUserIds: users.map(u => u._id),
                      activityDetails: activity.details
                    });
                    
                    if (transferredToUser) {
                      return (
                        <>
                          <div className="font-medium">{transferredToUser.name || 'Unknown User'}</div>
                          <div className="text-xs text-green-600 dark:text-green-400">{transferredToUser.email || 'N/A'}</div>
                        </>
                      );
                    }
                    
                    // Try alternative field names
                    const altUserId = activity.details.newUser || 
                                    activity.details.assignedTo || 
                                    activity.details.userId ||
                                    activity.details.transferTo ||
                                    activity.details.recipient ||
                                    activity.details.targetUser;
                    const altUser = users.find(u => u._id === altUserId);
                    
                    if (altUser) {
                      console.log('Found user with alternative field:', altUser);
                      return (
                        <>
                          <div className="font-medium">{altUser.name || 'Unknown User'}</div>
                          <div className="text-xs text-green-600 dark:text-green-400">{altUser.email || 'N/A'}</div>
                        </>
                      );
                    }
                    
                    return (
                      <div className="text-gray-500 dark:text-gray-400">
                        {transferredToUserId ? (
                          <>
                            <div className="font-medium text-gray-700 dark:text-gray-300 text-lg">
                              {transferredToUserId}
                            </div>
                            <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                              User ID (Name not available)
                            </div>
                            <div className="text-xs mt-1 text-gray-500 dark:text-gray-500">
                              Users API: {users.length === 0 ? 'Not loaded' : `${users.length} users`}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>User information not available</div>
                            <div className="text-xs mt-1">
                              No user ID found | Users: {users.length}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {activity.details.reason && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:chat-round-line-duotone" className="text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Reason</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">{activity.details.reason}</p>
              </div>
            )}

            {activity.details.notes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:document-text-line-duotone" className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{activity.details.notes}</p>
              </div>
            )}

          </div>

        );

      case 'updated':

        return (

          <div className="space-y-4">

            {/* Old Data Card */}

            {activity.details.oldData && (

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">

                <div className="flex items-center gap-2 mb-3">

                  <Icon icon="solar:arrow-left-line-duotone" className="text-red-600 dark:text-red-400" />

                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Previous Data</h4>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">

                  <div><strong>Name:</strong> {activity.details.oldData.customData?.["First Name"] || activity.details.oldData.customData?.name || ''} {activity.details.oldData.customData?.["Last Name"] || ''}</div>

                  <div><strong>Email:</strong> {activity.details.oldData.customData?.["Email"] || activity.details.oldData.customData?.email || 'N/A'}</div>

                  <div><strong>Phone:</strong> {activity.details.oldData.customData?.["Phone"] || activity.details.oldData.customData?.phone || activity.details.oldData.customData?.contact || 'N/A'}</div>

                  <div><strong>Company:</strong> {activity.details.oldData.customData?.["Company"] || activity.details.oldData.customData?.company || 'N/A'}</div>

                  <div><strong>Priority:</strong> {activity.details.oldData.customData?.["Lead Priority"] || activity.details.oldData.customData?.leadPriority || 'N/A'}</div>

                  <div><strong>Property Type:</strong> {activity.details.oldData.customData?.["Property Type"] || activity.details.oldData.customData?.propertyType || 'N/A'}</div>

                  <div><strong>Configuration:</strong> {activity.details.oldData.customData?.["Configuration"] || activity.details.oldData.customData?.configuration || 'N/A'}</div>

                  <div><strong>Funding Mode:</strong> {activity.details.oldData.customData?.["Funding Mode"] || activity.details.oldData.customData?.fundingMode || 'N/A'}</div>

                  <div><strong>Gender:</strong> {activity.details.oldData.customData?.["Gender"] || activity.details.oldData.customData?.gender || 'N/A'}</div>

                  <div><strong>Budget:</strong> {activity.details.oldData.customData?.["Budget"] || activity.details.oldData.customData?.budget || 'N/A'}</div>

                  {activity.details.oldData.currentStatus && (

                    <div><strong>Status:</strong> {activity.details.oldData.currentStatus.name || 'N/A'}</div>

                  )}

                  {/* Lead Status Fields for old data */}
                  {lead?.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 && (
                    <>
                      {lead.currentStatus.formFields.map((field) => {
                        const value = activity.details.oldData.customData?.[field.name];
                        return (
                          <div key={field.name}>
                            <strong>{field.name}:</strong> {
                              Array.isArray(value) ? value.join(', ') : (value || 'N/A')
                            }
                          </div>
                        );
                      })}
                    </>
                  )}

                </div>


                {/* Old Status Fields Section */}
                {activity.details.oldStatusFields && Object.keys(activity.details.oldStatusFields).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:settings-line-duotone" className="text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">Previous Status Fields:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(activity.details.oldStatusFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="font-medium text-red-700 dark:text-red-300">{key}:</span>
                          <span className="text-red-900 dark:text-red-100 max-w-[150px] truncate">
                            {Array.isArray(value) ? value.join(', ') : String(value) || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            )}



            {/* New Data Card */}

            {activity.details.newData && (

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">

                <div className="flex items-center gap-2 mb-3">

                  <Icon icon="solar:arrow-right-line-duotone" className="text-green-600 dark:text-green-400" />

                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Updated Data</h4>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">

                  <div><strong>Name:</strong> {activity.details.newData.customData?.["First Name"] || activity.details.newData.customData?.name || ''}</div>

                  <div><strong>Phone:</strong> {activity.details.newData.customData?.["Phone"] || activity.details.newData.customData?.phone || activity.details.newData.customData?.contact || ''}</div>

                  <div><strong>Company:</strong> {activity.details.newData.customData?.["Company"] || activity.details.newData.customData?.company || 'N/A'}</div>

                  <div><strong>Priority:</strong> {activity.details.newData.customData?.["Lead Priority"] || activity.details.newData.customData?.leadPriority || ''}</div>

                  <div><strong>Property Type:</strong> {activity.details.newData.customData?.["Property Type"] || activity.details.newData.customData?.propertyType || ''}</div>

                  <div><strong>Configuration:</strong> {activity.details.newData.customData?.["Configuration"] || activity.details.newData.customData?.configuration || ''}</div>

                  <div><strong>Funding Mode:</strong> {activity.details.newData.customData?.["Funding Mode"] || activity.details.newData.customData?.fundingMode || ''}</div>

                  <div><strong>Gender:</strong> {activity.details.newData.customData?.["Gender"] || activity.details.newData.customData?.gender || ''}</div>

                  <div><strong>Budget:</strong> {activity.details.newData.customData?.["Budget"] || activity.details.newData.customData?.budget || ''}</div>

                  {/* Lead Status Fields for new data */}
                  {lead?.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 && (
                    <>
                      {lead.currentStatus.formFields.map((field) => {
                        const value = activity.details.newData.customData?.[field.name];
                        return (
                          <div key={field.name}>
                            <strong>{field.name}:</strong> {
                              Array.isArray(value) ? value.join(', ') : (value || 'N/A')
                            }
                          </div>
                        );
                      })}
                    </>
                  )}

                </div>


                {/* Status Fields Section */}
                {activity.details.statusFields && Object.keys(activity.details.statusFields).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:settings-line-duotone" className="text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Status Fields Updated:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(activity.details.statusFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="font-medium text-green-700 dark:text-green-300">{key}:</span>
                          <span className="text-green-900 dark:text-green-100 max-w-[150px] truncate">
                            {Array.isArray(value) ? value.join(', ') : String(value) || 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            )}

          </div>

        );

      case 'created':

        return 'New lead created with initial data';

      default:

        return JSON.stringify(activity.details);

    }

  };

  
  const handleEditLead = () => {

    // Populate status-specific fields
    if (lead?.currentStatus?.formFields) {
      const statusFieldsData: any = {};
      lead.currentStatus.formFields.forEach((field: FormField) => {
        statusFieldsData[field.name] = lead.customData?.[field.name] || '';
      });
      setEditFormData(prev => ({ ...prev, ...statusFieldsData }));
    }
    setIsEditModalOpen(true);

  };



  const handleCloseEditModal = () => {

    setIsEditModalOpen(false);

    setEditFormData({

      firstName: lead?.customData?.["First Name"] || '',

      email: lead?.customData?.["Email"] || '',

      phone: lead?.customData?.["Phone"] || '',

      notes: lead?.customData?.["Notes"] || '',

      leadSource: lead?.leadSource?._id || '',

      project: lead?.project?._id || '',

      leadPriority: lead?.customData?.["Lead Priority"] || lead?.customData?.leadPriority || '',

      propertyType: lead?.customData?.["Property Type"] || lead?.customData?.propertyType || '',

      configuration: lead?.customData?.["Configuration"] || lead?.customData?.configuration || '',

      fundingMode: lead?.customData?.["Funding Mode"] || lead?.customData?.fundingMode || '',

      gender: lead?.customData?.["Gender"] || lead?.customData?.gender || '',

      budget: lead?.customData?.["Budget"] || lead?.customData?.budget || ''

    });

  };



  const handleStatusChange = () => {

    // Populate edit form with current lead data before opening status modal

    if (lead) {

      setEditFormData({

        firstName: lead.customData?.["First Name"] || '',

        email: lead.customData?.["Email"] || '',

        phone: lead.customData?.["Phone"] || '',

        notes: lead.customData?.["Notes"] || '',

        leadSource: lead.leadSource?._id || '',

        project: lead.project?._id || '',

        leadPriority: lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || '',

        propertyType: lead.customData?.["Property Type"] || lead.customData?.propertyType || '',

        configuration: lead.customData?.["Configuration"] || lead.customData?.configuration || '',

        fundingMode: lead.customData?.["Funding Mode"] || lead.customData?.fundingMode || '',

        gender: lead.customData?.["Gender"] || lead.customData?.gender || '',

        budget: lead.customData?.["Budget"] || lead.customData?.budget || ''

      });

    }

    // Reset status form and dynamic fields when opening the modal to ensure clean state
    setStatusFormData({ newStatusId: '', statusRemark: '' });
    setDynamicFields({});
    setFieldResetKey(prev => prev + 1);

    setIsStatusModalOpen(true);

  };



  const handleCloseStatusModal = () => {

    setIsStatusModalOpen(false);

    setStatusFormData({ newStatusId: lead?.currentStatus?._id || '', statusRemark: '' });

    setDynamicFields({}); // Reset dynamic fields when closing modal
    
    setFieldResetKey(prev => prev + 1); // Increment reset key to force remount on next open

  };



  const handleEditSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!lead) return;



    try {

      setIsSubmitting(true);



      // Prepare custom data including status-specific fields
      const customData: any = {
        "First Name": editFormData.firstName,

        "Email": editFormData.email,

        "Phone": editFormData.phone,

        "Notes": editFormData.notes,

        "Lead Priority": editFormData.leadPriority,

        "Property Type": editFormData.propertyType,

        "Configuration": editFormData.configuration,

        "Funding Mode": editFormData.fundingMode,

        "Gender": editFormData.gender,

        "Budget": editFormData.budget

      };

      // Add status-specific fields to customData
      if (lead.currentStatus?.formFields) {
        lead.currentStatus.formFields.forEach((field: FormField) => {
          const fieldValue = editFormData[field.name as keyof typeof editFormData] || '';
          customData[field.name] = fieldValue;
        });
      }

      // Use the specific API endpoint for updating lead details without changing status
      const response = await fetch(`${API_BASE_URL}/api/leads/${lead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project: editFormData.project,
          leadSource: editFormData.leadSource,
          customData: customData
        }),

      });



      if (response.ok) {

        setAlertMessage({ type: 'success', message: 'Lead details updated successfully!' });

        setIsEditModalOpen(false);

        fetchLeadDetails(); // Refresh the lead data

      } else {

        const errorData = await response.json();

        setAlertMessage({

          type: 'error',

          message: errorData.message || `Failed to update lead: ${response.status}`

        });

      }

    } catch (error) {

      console.error("Error updating lead:", error);

      setAlertMessage({

        type: 'error',

        message: 'Network error: Failed to update lead. Please check your connection.'

      });

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleStatusUpdate = async () => {

    if (!lead || !statusFormData.newStatusId) return;



    try {

      setIsSubmitting(true);

      // ⚠️ CRITICAL: STRICT FILTER - Remove ANY status-related fields from submission
      // RULE: ONLY 1-level status update allowed (Current → New, NO third status)
      // This prevents nested/recursive status updates completely
      const cleanedDynamicFields = Object.keys(dynamicFields).reduce((acc, key) => {
        const keyLower = key.toLowerCase();
        
        // STRICT BLOCKING - Check multiple patterns:
        const hasStatusInKey = keyLower.includes('status') || keyLower.includes('statues');
        const isExactStatusMatch = keyLower === 'status' || keyLower === 'select status' || keyLower === 'statues';
        const isStatusRelated = hasStatusInKey || isExactStatusMatch;
        
        if (!isStatusRelated) {
          acc[key] = dynamicFields[key];
        } else {
          console.log('🚫 REJECTED from submission:', key, '=', dynamicFields[key], 'Reason: Status field detected');
        }
        
        return acc;
      }, {} as {[key: string]: any});

      console.log('📤 Submitting status update:', {
        newStatusId: statusFormData.newStatusId,
        statusName: leadStatuses.find(s => s._id === statusFormData.newStatusId)?.name,
        cleanedFields: Object.keys(cleanedDynamicFields),
        blockedFields: Object.keys(dynamicFields).filter(k => !Object.keys(cleanedDynamicFields).includes(k))
      });

      // Use the status update API endpoint with current lead data and cleaned dynamic fields

      const response = await fetch(`${API_BASE_URL}/api/leads/${lead._id}/status/`, {

        method: 'PUT',

        headers: {

          'Content-Type': 'application/json',

          Authorization: `Bearer ${token}`,

        },

        body: JSON.stringify({
          newStatusId: statusFormData.newStatusId, // ONLY this status ID is used, no nested status
          newData: {

            "First Name": lead.customData?.["First Name"] || lead.customData?.name || '',

            "Email": lead.customData?.["Email"] || lead.customData?.email || '',

            "Phone": lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || '',

            "Notes": lead.customData?.["Notes"] || lead.customData?.notes || '',

            "Lead Priority": lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || '',

            "Property Type": lead.customData?.["Property Type"] || lead.customData?.propertyType || '',

            "Configuration": lead.customData?.["Configuration"] || lead.customData?.configuration || '',

            "Funding Mode": lead.customData?.["Funding Mode"] || lead.customData?.fundingMode || '',

            "Gender": lead.customData?.["Gender"] || lead.customData?.gender || '',

            "Budget": lead.customData?.["Budget"] || lead.customData?.budget || '',


            "Remark": statusFormData.statusRemark || 'Status updated',

            // Include ONLY cleaned dynamic fields (no status fields)
            ...cleanedDynamicFields

          },

        }),

      });



      if (response.ok) {

        setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });

        setIsStatusModalOpen(false);

        setDynamicFields({}); // Reset dynamic fields after successful update
        
        setFieldResetKey(prev => prev + 1); // Increment reset key

        fetchLeadDetails(); // Refresh the lead data

      } else {

        const errorData = await response.json();

        setAlertMessage({

          type: 'error',

          message: errorData.message || `Failed to update lead status: ${response.status}`

        });

      }

    } catch (error) {

      console.error("Error updating lead status:", error);

      setAlertMessage({

        type: 'error',

        message: 'Network error: Failed to update lead status. Please check your connection.'

      });

    } finally {

      setIsSubmitting(false);

    }

  };



  if (isLoading) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>

        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading lead details...</p>

      </div>

    );

  }



  if (!lead) {

    return (

      <div className="space-y-6">

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

          <div className="flex-1">

            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Not Found</h1>

            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">

              The requested lead could not be found.

            </p>

          </div>

        </div>

        <Card>

          <div className="text-center py-8">

            <div className="text-gray-500 dark:text-gray-400">

              <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-4" />

              <p className="text-lg font-medium mb-2">Lead Not Found</p>

              <p className="text-sm mb-4">

                The lead you're looking for doesn't exist or you don't have permission to view it.

              </p>

              <Button color="primary" onClick={() => router.push('/apps/leads')}>

                <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />

                Back to Leads

              </Button>

            </div>

          </div>

        </Card>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {/* Breadcrumb Navigation */}

      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">

        <button

          onClick={() => router.push('/apps/leads')}

          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"

        >

          Leads

        </button>

        <Icon icon="solar:arrow-right-line-duotone" className="w-4 h-4" />

        <span className="text-gray-900 dark:text-white font-medium">

          {lead.customData?.["First Name"] || ''} {lead.customData?.["Last Name"] || ''}

          {!lead.customData?.["First Name"] && !lead.customData?.["Last Name"] && 'Lead Details'}

        </span>

      </nav>



      {/* Header */}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

        <div className="flex-1">

          <div className="flex items-center gap-3 mb-2">

            <Button

              color="gray"

              size="sm"

              onClick={() => router.push('/apps/leads')}

              className="flex items-center gap-2"

            >

              <Icon icon="solar:arrow-left-line-duotone" />

              Back

            </Button>

            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">

              Lead Details

            </h1>

            <Badge color="blue" size="sm">

              ID: {lead._id.slice(-8)}

            </Badge>

          </div>

          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">

            Complete information and activity history for this lead

          </p>

        </div>

        <div className="flex gap-2">

          <Button

            color="gray"

            onClick={() => router.push('/apps/leads')}

            className="flex items-center gap-2"

          >

            <Icon icon="solar:list-line-duotone" />

            All Leads

          </Button>

          <Button

            color="info"

            onClick={handleEditLead}

            className="flex items-center gap-2"

          >

            <Icon icon="solar:pen-line-duotone" />

            Edit Lead

          </Button>

          {/* <Button

            color="warning"

            onClick={handleStatusChange}

            className="flex items-center gap-2"

          >

            <Icon icon="solar:refresh-line-duotone" />

            Change Status

          </Button> */}

          <Button

            color="success"

            onClick={() => {/* Add call functionality */ }}

            className="flex items-center gap-2"

          >

            <Icon icon="solar:phone-line-duotone" />

            Call

          </Button>

          <Button

            color="warning"

            onClick={() => {/* Add email functionality */ }}

            className="flex items-center gap-2"

          >

            <Icon icon="solar:letter-unread-line-duotone" />

            Email

          </Button>

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



      {/* Lead Overview Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Lead Score</p>

              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">

                {lead.LeadScore || 0}

              </p>

            </div>

            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">

              <Icon icon="solar:star-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />

            </div>

          </div>

        </Card>



        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>

              <div className="flex items-center gap-2 mt-1">

                <Badge color="green" size="sm">

                  {lead.currentStatus?.name || 'N/A'}

                </Badge>





              </div>

            </div>

            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">

              <Icon icon="solar:check-circle-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />

            </div>

          </div>

        </Card>



        <Card className="p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Source</p>

              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">

                {lead ? getSourceName(lead) : 'N/A'}

              </p>

            </div>

            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">

              <Icon icon="solar:target-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />

            </div>

          </div>

        </Card>

        {/* CP Sourcing Information - Always show if there's CP sourcing data */}
        {lead?.customData?.["Channel Partner Sourcing"] && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">CP Sourcing Details</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
                    const cpSourcing = Array.isArray(cpSourcingOptions) ? cpSourcingOptions.find(cp => cp._id === cpSourcingId) : null;
                    console.log('CP Sourcing Debug:', {
                      cpSourcingId,
                      cpSourcing,
                      cpSourcingOptions: Array.isArray(cpSourcingOptions) ? cpSourcingOptions.length : 0,
                      allIds: Array.isArray(cpSourcingOptions) ? cpSourcingOptions.map(cp => cp._id) : []
                    });
                    return cpSourcing ? `${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name}` : 'Loading...';
                  })()}
                </p>
                {(() => {
                  const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
                  const cpSourcing = Array.isArray(cpSourcingOptions) ? cpSourcingOptions.find(cp => cp._id === cpSourcingId) : null;
                  return cpSourcing ? (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <p>Visits: {cpSourcing.sourcingHistory.length}</p>
                      <p>Status: {cpSourcing.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      <p>Loading CP sourcing data...</p>
                    </div>
                  );
                })()}
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <Icon icon="solar:chart-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />
              </div>
            </div>
          </Card>
        )}

      </div>



      {/* Lead Priority and Scoring */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card className="p-4">

          <div className="flex items-center justify-between mb-3">

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Score</h4>

            <Icon icon="solar:star-line-duotone" className="text-yellow-500 text-lg" />

          </div>

          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">

            {lead.LeadScore || 0}

          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">

            <div

              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"

              style={{ width: `${Math.min((lead.LeadScore || 0) * 10, 100)}%` }}

            ></div>

          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

            {(lead.LeadScore || 0) >= 80 ? 'High Priority' : (lead.LeadScore || 0) >= 50 ? 'Medium Priority' : 'Low Priority'}

          </p>

        </Card>



        <Card className="p-4">

          <div className="flex items-center justify-between mb-3">

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Engagement Level</h4>

            <Icon icon="solar:heart-line-duotone" className="text-red-500 text-lg" />

          </div>

          <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">

            {activities.length > 10 ? 'High' : activities.length > 5 ? 'Medium' : 'Low'}

          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">

            Based on {activities.length} activities

          </div>

        </Card>



        <Card className="p-4">

          <div className="flex items-center justify-between mb-3">

            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Age</h4>

            <Icon icon="solar:clock-circle-line-duotone" className="text-blue-500 text-lg" />

          </div>

          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">

            {lead.createdAt ? Math.ceil((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}

          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">

            Days since creation

          </div>

        </Card>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Lead Information */}

        <div className="space-y-6">

          {/* Basic Information */}

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>

            </div>

            <div className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>

                  <div className="flex items-center gap-2 mt-1">

                    <p className="text-gray-900 dark:text-white font-medium">

                      {lead.customData?.["First Name"] || lead.customData?.name || 'N/A'} 

                    </p>

                    {(lead.customData?.["First Name"] || lead.customData?.name) && (

                      <Badge color="blue" size="sm">

                        Verified

                      </Badge>

                    )}

                  </div>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>

                  <p className="text-gray-900 dark:text-white">{lead.customData?.["Company"] || lead.customData?.company || 'N/A'}</p>

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>

                  <div className="flex items-center gap-2 mt-1">

                    <p className="text-gray-900 dark:text-white">{lead.customData?.["Email"] || lead.customData?.email || 'N/A'}</p>

                    {(lead.customData?.["Email"] || lead.customData?.email) && (

                      <Button size="xs" color="light" onClick={() => window.open(`mailto:${lead.customData?.["Email"] || lead.customData?.email}`)}>

                        <Icon icon="solar:letter-unread-line-duotone" className="w-3 h-3" />

                      </Button>

                    )}

                  </div>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>

                  <div className="flex items-center gap-2 mt-1">

                    <p className="text-gray-900 dark:text-white">{lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || 'N/A'}</p>

                    {(lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact) && (

                      <Button size="xs" color="light" onClick={() => window.open(`tel:${lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact}`)}>

                        <Icon icon="solar:phone-line-duotone" className="w-3 h-3" />

                      </Button>

                    )}

                  </div>

                </div>

              </div>



              <div>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>

                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">

                  <p className="text-gray-900 dark:text-white text-sm">

                    {lead.customData?.["Notes"] || lead.customData?.notes || 'No notes available'}

                  </p>

                </div>

              </div>



              {/* Additional Lead Information */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Priority</label>

                  <div className="mt-1">

                    <Badge

                      color={

                        (lead.customData?.["Lead Priority"] || lead.customData?.leadPriority) === 'Hot' ? 'red' :

                          (lead.customData?.["Lead Priority"] || lead.customData?.leadPriority) === 'Warm' ? 'orange' :

                            (lead.customData?.["Lead Priority"] || lead.customData?.leadPriority) === 'Cold' ? 'blue' : 'gray'

                      }

                      size="sm"

                    >

                      {lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || 'Not Set'}

                    </Badge>

                  </div>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Property Type</label>

                  <p className="text-gray-900 dark:text-white mt-1">

                    {lead.customData?.["Property Type"] || lead.customData?.propertyType || 'N/A'}

                  </p>

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuration</label>

                  <p className="text-gray-900 dark:text-white mt-1">

                    {lead.customData?.["Configuration"] || lead.customData?.configuration || 'N/A'}

                  </p>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Funding Mode</label>

                  <p className="text-gray-900 dark:text-white mt-1">

                    {lead.customData?.["Funding Mode"] || lead.customData?.fundingMode || 'N/A'}

                  </p>

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>

                  <p className="text-gray-900 dark:text-white mt-1">

                    {lead.customData?.["Gender"] || lead.customData?.gender || 'N/A'}

                  </p>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget</label>

                  <p className="text-gray-900 dark:text-white mt-1">

                    {lead.customData?.["Budget"] || lead.customData?.budget || 'N/A'}

                  </p>

                </div>

              </div>

              {/* Lead Status Fields */}
              {lead.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lead Status Fields</h3>
                  {(() => {
                    console.log('Current Status:', lead.currentStatus);
                    console.log('Form Fields:', lead.currentStatus?.formFields);
                    console.log('Lead customData:', lead.customData);
                    console.log('Dynamic fields data:', lead.currentStatus?.formFields?.map(field => ({
                      name: field.name,
                      type: field.type,
                      options: field.options,
                      value: lead.customData?.[field.name],
                      isArray: Array.isArray(lead.customData?.[field.name])
                    })));
                    return null;
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.currentStatus.formFields.map((field) => (
                      <div key={field.name}>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.name}</label>
                          <div className="mt-1">
                            {field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Available Options:</div>
                                <div className="flex flex-wrap gap-2">
                                  {field.options.map((option: string, index: number) => {
                                    const isSelected = Array.isArray(lead.customData?.[field.name]) 
                                      ? lead.customData[field.name].includes(option)
                                      : lead.customData?.[field.name] === option;
                                    
                                    return (
                                      <div key={index} className="flex items-center gap-2">
                                        <span 
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${isSelected
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
                                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                                          }`}
                                        >
                                          {isSelected ? '☑' : '☐'} {option}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                {(!lead.customData?.[field.name] || (Array.isArray(lead.customData[field.name]) && lead.customData[field.name].length === 0)) && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    No options selected
                                  </div>
                                )}
                              </div>
                            ) : field.type === 'checkbox' && (!field.options || field.options.length === 0) ? (
                              <div className="text-gray-500 dark:text-gray-400 text-sm">
                                {Array.isArray(lead.customData?.[field.name]) 
                                  ? lead.customData[field.name].join(', ') || 'No options selected'
                                  : lead.customData?.[field.name] || 'N/A'
                                }
                              </div>
                            ) : field.type === 'select' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                  {lead.customData[field.name]}
                                </span>
                              </div>
                            ) : field.type === 'date' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:calendar-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-white">
                                  {new Date(lead.customData[field.name]).toLocaleDateString()}
                                </span>
                              </div>
                            ) : field.type === 'datetime' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:calendar-add-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-white">
                                  {new Date(lead.customData[field.name]).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                            ) : field.type === 'time' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:clock-circle-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-white">
                                  {(() => {
                                    try {
                                      // Handle time-only values or datetime values
                                      const timeValue = lead.customData[field.name];
                                      if (timeValue.includes('T') || timeValue.includes(':')) {
                                        const date = new Date(timeValue.includes('T') ? timeValue : `2000-01-01T${timeValue}`);
                                        return date.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        });
                                      }
                                      return timeValue;
                                    } catch {
                                      return lead.customData[field.name];
                                    }
                                  })()}
                                </span>
                              </div>
                            ) : field.type === 'number' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:calculator-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-white font-mono">
                                  {lead.customData[field.name]}
                                </span>
                              </div>
                            ) : field.type === 'email' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:letter-unread-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <a 
                                  href={`mailto:${lead.customData[field.name]}`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {lead.customData[field.name]}
                                </a>
                              </div>
                            ) : field.type === 'tel' && lead.customData?.[field.name] ? (
                              <div className="flex items-center gap-2">
                                <Icon icon="solar:phone-line-duotone" className="text-gray-500 dark:text-gray-400" />
                                <a 
                                  href={`tel:${lead.customData[field.name]}`}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {lead.customData[field.name]}
                                </a>
                              </div>
                            ) : field.type === 'textarea' && lead.customData?.[field.name] ? (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                <p className="text-gray-900 dark:text-white text-sm whitespace-pre-wrap">
                                  {lead.customData[field.name]}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-900 dark:text-white">
                                {(() => {
                                  const value = lead.customData?.[field.name] || 'N/A';
                                  console.log('Field:', field.name, 'Value:', value, 'All customData:', lead.customData);
                                  return value;
                                })()}
                              </p>
                            )}
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </Card>



          {/* Lead Details */}

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:chart-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Details</h3>

            </div>

            <div className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lead Source</label>

                  <div className="mt-1">

                    <Badge color="blue" size="sm">

                      {lead ? getSourceName(lead) : 'N/A'}

                    </Badge>

                  </div>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project</label>

                  <div className="mt-1">

                    <Badge color="purple" size="sm">

                      {lead.project?.name || 'N/A'}

                    </Badge>

                  </div>

                </div>

              </div>



              <div>

                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>

                <div className="flex items-center gap-2 mt-1">

                  {/* <Badge color="green" size="sm">

                     {lead.currentStatus?.name || 'N/A'}

                   </Badge> */}

                  {lead.statusHistory && lead.statusHistory.length > 0 && (

                    <Badge color="blue" size="sm">

                      {lead.statusHistory[lead.statusHistory.length - 1]?.status?.name || 'N/A'}

                    </Badge>

                  )}

                  <Badge color="gray" size="sm">

                    {lead.statusHistory?.length || 0} Changes

                  </Badge>

                </div>

              </div>





              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created Date</label>

                  <p className="text-gray-900 dark:text-white">

                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'}

                  </p>

                </div>

                <div>

                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>

                  <p className="text-gray-900 dark:text-white">

                    {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'}

                  </p>

                </div>

              </div>

            </div>

          </Card>



          {/* Status History */}

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:history-line-duotone" className="text-orange-600 dark:text-orange-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Status Timeline</h3>

            </div>

            <div className="space-y-4">

              {!lead.currentStatus && (!lead.statusHistory || lead.statusHistory.length === 0) ? (

                <div className="text-center py-4">

                  <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-2xl text-gray-400 mb-2" />

                  <p className="text-gray-500 dark:text-gray-400">No status information available</p>

                </div>

              ) : (

                <div className="relative">

                  {/* Current Status - Show first */}

                  {lead.currentStatus && (

                    <div className="relative flex gap-4 pb-6">

                      {/* Timeline line */}

                      {lead.statusHistory && lead.statusHistory.length > 0 && (

                        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>

                      )}



                      {/* Timeline dot */}

                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">

                        <Icon icon="solar:check-circle-line-duotone" className="text-green-600 dark:text-green-400 text-sm" />

                      </div>



                      {/* Content */}

                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 mb-2">

                          <Badge color="green" size="sm">

                            {lead.currentStatus.name}

                          </Badge>

                          <Badge color="blue" size="sm">

                            Current

                          </Badge>

                          <span className="text-xs text-gray-500 dark:text-gray-400">

                            {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'}

                          </span>

                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">

                          Current status of this lead

                        </p>

                      </div>

                    </div>

                  )}



                  {/* Status History - Show in reverse order (newest first) */}

                  {lead.statusHistory && lead.statusHistory.length > 0 && (

                    <>

                      {lead.statusHistory.slice().reverse().map((historyItem, index) => (

                        <div key={historyItem._id} className="relative flex gap-4 pb-6 last:pb-0">

                          {/* Timeline line */}

                          {index < lead.statusHistory.length - 1 && (

                            <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>

                          )}



                          {/* Timeline dot */}

                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">

                            <Icon icon="solar:history-line-duotone" className="text-blue-600 dark:text-blue-400 text-sm" />

                          </div>



                          {/* Content */}

                          <div className="flex-1 min-w-0">

                            <div className="flex items-center gap-2 mb-2">

                              <Badge color="blue" size="sm">

                                {historyItem.status?.name || 'Unknown Status'}

                              </Badge>

                              <span className="text-xs text-gray-500 dark:text-gray-400">

                                {historyItem.changedAt ? new Date(historyItem.changedAt).toLocaleString() : 'Unknown Date'}

                              </span>

                            </div>



                            {historyItem.data && Object.keys(historyItem.data).length > 0 && (

                              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">

                                <div className="text-sm text-gray-600 dark:text-gray-400">

                                  {Object.entries(historyItem.data).map(([key, value]) => (

                                    <div key={key} className="flex justify-between py-1">

                                      <span className="font-medium">{key}:</span>

                                      <span className="text-right max-w-[200px] truncate">{String(value) || 'N/A'}</span>

                                    </div>

                                  ))}

                                </div>

                              </div>

                            )}

                          </div>

                        </div>

                      ))}

                    </>

                  )}

                </div>

              )}

            </div>

          </Card>



          {/* All Available Statuses */}

          {/* <Card>

            <div className="flex items-center mb-4">

              <div className="bg-indigo-100 dark:bg-indigo-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:list-check-line-duotone" className="text-indigo-600 dark:text-indigo-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Available Statuses</h3>

            </div>

            <div className="space-y-3">

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">

                Here are all the statuses available for leads in the system:

              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {leadStatuses.map((status, index) => (

                  <div 

                    key={status._id || index} 

                    className={`p-3 rounded-lg border-2 transition-all ${

                      lead.currentStatus?._id === status._id 

                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 

                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'

                    }`}

                  >

                    <div className="flex items-center gap-2 mb-2">

                      <Badge 

                        color={lead.currentStatus?._id === status._id ? 'green' : 'gray'} 

                        size="sm"

                      >

                        {status.name}

                      </Badge>

                      {status.is_final_status && (

                        <Badge color="red" size="sm">

                          Final

                        </Badge>

                      )}

                      {lead.currentStatus?._id === status._id && (

                        <Badge color="blue" size="sm">

                          Current

                        </Badge>

                      )}

                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">

                      Fields: {status.formFields?.length || 0} required

                    </p>

                    {status.formFields && status.formFields.length > 0 && (

                      <div className="mt-2">

                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Required Fields:</p>

                        <div className="flex flex-wrap gap-1">

                          {status.formFields.slice(0, 3).map((field: any, fieldIndex: number) => (

                            <span key={fieldIndex} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">

                              {field.name}

                            </span>

                          ))}

                          {status.formFields.length > 3 && (

                            <span className="text-xs text-gray-500 dark:text-gray-400">

                              +{status.formFields.length - 3} more

                            </span>

                          )}

                        </div>

                      </div>

                    )}

                  </div>

                ))}

                {leadStatuses.length === 0 && (

                  <div className="col-span-full text-center py-4">

                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-2xl text-gray-400 mb-2" />

                    <p className="text-gray-500 dark:text-gray-400">No statuses available</p>

                  </div>

                )}

              </div>

            </div>

          </Card> */}

        </div>









        {/* Activities Timeline */}

        <div className="space-y-6">

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:clock-circle-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />

              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Activity Timeline</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track all changes and activities for this lead</p>
              </div>
            </div>

            <div className="space-y-4">

              {activities.length === 0 ? (

                <div className="text-center py-8">

                  <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-3xl text-gray-400 mb-3" />

                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No Activities Found</p>

                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">

                    Activities will appear here as they are recorded

                  </p>

                </div>

              ) : (

                <div className="relative">

                  {activities.map((activity, index) => (

                    <div key={activity._id} className="relative flex gap-4 pb-6 last:pb-0">

                      {/* Timeline line */}

                      {index < activities.length - 1 && (

                        <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-700"></div>

                      )}



                      {/* Timeline dot */}

                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(activity.action) === 'green' ? 'bg-green-100 dark:bg-green-900/20' :

                          getActionColor(activity.action) === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :

                            getActionColor(activity.action) === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :

                              getActionColor(activity.action) === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :

                                'bg-gray-100 dark:bg-gray-900/20'

                        }`}>

                        <Icon

                          icon={getActionIcon(activity.action)}

                          className={`text-sm ${getActionColor(activity.action) === 'green' ? 'text-green-600 dark:text-green-400' :

                              getActionColor(activity.action) === 'blue' ? 'text-blue-600 dark:text-blue-400' :

                                getActionColor(activity.action) === 'orange' ? 'text-orange-600 dark:text-orange-400' :

                                  getActionColor(activity.action) === 'purple' ? 'text-purple-600 dark:text-purple-400' :

                                    'text-gray-600 dark:text-gray-400'

                            }`}

                        />

                      </div>



                      {/* Content */}

                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 mb-2">

                          <span className="text-sm font-medium text-gray-900 dark:text-white">

                            {formatActionText(activity)}

                          </span>

                          <Badge

                            color={

                              getActionColor(activity.action) === 'green' ? 'green' :

                                getActionColor(activity.action) === 'blue' ? 'blue' :

                                  getActionColor(activity.action) === 'orange' ? 'orange' :

                                    getActionColor(activity.action) === 'purple' ? 'purple' :

                                      'gray'

                            }

                            size="sm"

                          >

                            {activity.action}

                          </Badge>

                          <span className="text-xs text-gray-500 dark:text-gray-400">

                            {new Date(activity.timestamp).toLocaleString()}

                          </span>

                        </div>



                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">

                          {formatDetails(activity)}

                        </div>

                        {/* Lead Status Fields for this activity */}
                        {/* {lead?.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon icon="solar:settings-line-duotone" className="text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status Fields:</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {lead.currentStatus.formFields.map((field) => (
                                <div key={field.name} className="flex justify-between py-1">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">{field.name}:</span>
                                  <span className="text-gray-900 dark:text-white max-w-[150px] truncate">{lead.customData?.[field.name] || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )} */}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">

                          <div className="flex items-center gap-1">

                            <Icon icon="solar:clock-circle-line-duotone" className="w-3 h-3" />
                            <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-1">

                            <Icon icon="solar:time-line-duotone" className="w-3 h-3" />
                            <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                          </div>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </Card>

          {/* Lead Status Fields in Activity Timeline */}
          {/* {lead?.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 && (
            <Card>
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                  <Icon icon="solar:settings-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Status Fields</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current status-specific field values</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.currentStatus.formFields.map((field) => (
                  <div key={field.name}>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.name}</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {lead.customData?.[field.name] || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )} */}

          {/* Lead Analytics */}

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-indigo-100 dark:bg-indigo-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:chart-2-line-duotone" className="text-indigo-600 dark:text-indigo-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lead Analytics</h3>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">

                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">

                  {activities.length}

                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>

              </div>

              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">

                <div className="text-2xl font-bold text-green-600 dark:text-green-400">

                  {lead.statusHistory?.length || 0}

                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">Status Changes</div>

              </div>

            </div>

          </Card>



          {/* Communication History */}

          <Card>

            <div className="flex items-center mb-4">

              <div className="bg-teal-100 dark:bg-teal-900/20 p-2 rounded-lg mr-3">

                <Icon icon="solar:chat-line-duotone" className="text-teal-600 dark:text-teal-400 text-xl" />

              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communication History</h3>

            </div>

            <div className="space-y-4">

              <div className="text-center py-8">

                <Icon icon="solar:chat-line-duotone" className="mx-auto text-3xl text-gray-400 mb-3" />

                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No Communications Yet</p>

                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">

                  Call, email, or message interactions will appear here

                </p>

                <div className="flex gap-2 justify-center mt-4">

                  <Button size="sm" color="success" onClick={() => {/* Add call functionality */ }}>

                    <Icon icon="solar:phone-line-duotone" className="mr-1" />

                    Log Call

                  </Button>

                  <Button size="sm" color="warning" onClick={() => {/* Add email functionality */ }}>

                    <Icon icon="solar:letter-unread-line-duotone" className="mr-1" />

                    Log Email

                  </Button>

                  <Button size="sm" color="info" onClick={() => {/* Add message functionality */ }}>

                    <Icon icon="solar:chat-round-line-duotone" className="mr-1" />

                    Log Message

                  </Button>

                </div>

              </div>

            </div>

          </Card>

        </div>

      </div>



      {/* Edit Lead Modal */}

      <Modal show={isEditModalOpen} onClose={handleCloseEditModal} size="4xl">

        <Modal.Header>Edit Lead</Modal.Header>

        <form onSubmit={handleEditSubmit}>

          <Modal.Body>

            <div className="space-y-6">

              {/* Basic Information */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <Label htmlFor="firstName" value="First Name" />

                  <TextInput

                    id="firstName"

                    value={editFormData.firstName}

                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}

                    placeholder="Enter first name"

                    required

                  />

                </div>

                <div>

                  <Label htmlFor="email" value="Email" />

                  <TextInput

                    id="email"

                    type="email"

                    value={editFormData.email}

                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}

                    placeholder="Enter email address"

                    required

                  />

                </div>

              </div>



              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <Label htmlFor="phone" value="Phone" />

                  <TextInput

                    id="phone"

                    value={editFormData.phone}

                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}

                    placeholder="Enter phone number"

                  />

                </div>

              </div>



              <div>

                <Label htmlFor="notes" value="Notes" />

                <Textarea

                  id="notes"

                  value={editFormData.notes}

                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}

                  placeholder="Enter notes about this lead"

                  rows={3}

                />

              </div>













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

                      <Label htmlFor="leadPriority" value="Lead Priority" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="leadPriority"

                        value={editFormData.leadPriority}

                        onChange={(e) => setEditFormData({ ...editFormData, leadPriority: e.target.value })}

                        className="w-full"

                      >

                        <option value="">Select Priority</option>

                        <option value="Hot">Hot</option>

                        <option value="Warm">Warm</option>

                        <option value="Cold">Cold</option>

                      </Select>

                    </div>

                    <div className="space-y-2">

                      <Label htmlFor="propertyType" value="Property Type" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="propertyType"

                        value={editFormData.propertyType}

                        onChange={(e) => setEditFormData({ ...editFormData, propertyType: e.target.value })}

                        className="w-full"

                      >

                        <option value="">Select Property Type</option>

                        <option value="residential">Residential</option>

                        <option value="commercial">Commercial</option>

                      </Select>

                    </div>

                  </div>



                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="space-y-2">

                      <Label htmlFor="configuration" value="Configuration" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="configuration"

                        value={editFormData.configuration}

                        onChange={(e) => setEditFormData({ ...editFormData, configuration: e.target.value })}

                        className="w-full"

                      >

                        <option value="">Select Configuration</option>

                        <option value="1 BHK">1 BHK</option>

                        <option value="2 BHK">2 BHK</option>

                        <option value="3 BHK">3 BHK</option>

                        <option value="2+1 BHK">2+1 BHK</option>

                        <option value="2+2 BHK">2+2 BHK</option>

                        <option value="commercial office">Commercial Office</option>

                        <option value="Duplex">Duplex</option>

                        <option value="unknown">Unknown</option>

                      </Select>

                    </div>

                    <div className="space-y-2">

                      <Label htmlFor="fundingMode" value="Funding Mode" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="fundingMode"

                        value={editFormData.fundingMode}

                        onChange={(e) => setEditFormData({ ...editFormData, fundingMode: e.target.value })}

                        className="w-full"

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

                      <Label htmlFor="gender" value="Gender" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="gender"

                        value={editFormData.gender}

                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}

                        className="w-full"

                      >

                        <option value="">Select Gender</option>

                        <option value="Male">Male</option>

                        <option value="Female">Female</option>

                      </Select>

                    </div>

                    <div className="space-y-2">

                      <Label htmlFor="budget" value="Budget" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                      <Select

                        id="budget"

                        value={editFormData.budget}

                        onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}

                        className="w-full"

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





              {/* Lead Details */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>

                  <Label htmlFor="leadSource" value="Lead Source" />

                  <Select

                    id="leadSource"

                    value={editFormData.leadSource}

                    onChange={(e) => setEditFormData({ ...editFormData, leadSource: e.target.value })}

                  >

                    <option value="">Select Lead Source</option>

                    {leadSources.map((source) => (

                      <option key={source._id} value={source._id}>

                        {source.name}

                      </option>

                    ))}

                  </Select>

                </div>



                <div>

                  <Label htmlFor="project" value="Project" />

                  <Select

                    id="project"

                    value={editFormData.project}

                    onChange={(e) => setEditFormData({ ...editFormData, project: e.target.value })}

                  >

                    <option value="">Select Project</option>

                    {projects.map((project) => (

                      <option key={project._id} value={project._id}>

                        {project.name}

                      </option>

                    ))}

                  </Select>

                </div>
              </div>



              {/* Lead Status and Associated Fields */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg mr-4">
                    <Icon icon="solar:check-circle-line-duotone" className="text-white text-2xl" />
                  </div>
                  <div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Status: {lead?.currentStatus?.name || 'No Status'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Edit the fields associated with this status</p>
                  </div>
                </div>

                {/* Dynamic Required Fields based on current status */}
                {lead?.currentStatus?.formFields && lead.currentStatus.formFields.length > 0 ? (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Icon icon="solar:settings-line-duotone" className="text-blue-600 dark:text-blue-400" />
                        Fields for "{lead.currentStatus.name}" Status
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lead.currentStatus.formFields.map((field: FormField) => (
                          <div key={field._id} className="space-y-2">
                            <Label
                              htmlFor={`statusField_${field._id}`}
                              value={field.name}
                              className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                            >
                              {field.name}
                              {field.required && (
                                <span className="text-red-500 text-xs bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
                              )}
                            </Label>
                            {field.type === 'select' && field.options && field.options.length > 0 ? (
                              <Select

                                id={`statusField_${field._id}`}
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                className="w-full"
                                required={field.required}
                              >
                                <option value="">Select {field.name}</option>
                                {field.options.map((option: any, index: number) => (
                                  <option key={index} value={option.value || option}>
                                    {option.label || option}
                                  </option>

                                ))}

                              </Select>

                            ) : field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                              <div className="space-y-2">
                                {field.options.map((option: any, index: number) => {
                                  const optionValue = option.value || option;
                                  const currentValues = editFormData[field.name as keyof typeof editFormData] || '';
                                  const isChecked = Array.isArray(currentValues) 
                                    ? currentValues.includes(optionValue)
                                    : currentValues === optionValue;
                                  
                                  return (
                                    <div key={index} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        id={`${field._id}_${index}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const currentValues = editFormData[field.name as keyof typeof editFormData] || '';
                                          let newValues;
                                          
                                          if (Array.isArray(currentValues)) {
                                            if (e.target.checked) {
                                              newValues = [...currentValues, optionValue];
                                            } else {
                                              newValues = currentValues.filter((v: string) => v !== optionValue);
                                            }
                                          } else {
                                            newValues = e.target.checked ? [optionValue] : [];
                                          }
                                          
                                          setEditFormData({ ...editFormData, [field.name]: newValues });
                                        }}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                      />
                                      <label htmlFor={`${field._id}_${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        {option.label || option}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : field.type === 'textarea' ? (
                              <Textarea
                                id={`statusField_${field._id}`}
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                rows={3}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'number' ? (
                              <TextInput
                                id={`statusField_${field._id}`}
                                type="number"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'date' ? (
                              <DateTimePicker
                                id={`statusField_${field._id}`}
                                type="date"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(value) => setEditFormData({ ...editFormData, [field.name]: value })}
                                placeholder={`Select ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'datetime' ? (
                              <DateTimePicker
                                id={`statusField_${field._id}`}
                                type="datetime"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(value) => setEditFormData({ ...editFormData, [field.name]: value })}
                                placeholder={`Select ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'time' ? (
                              <DateTimePicker
                                id={`statusField_${field._id}`}
                                type="time"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(value) => setEditFormData({ ...editFormData, [field.name]: value })}
                                placeholder={`Select ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'email' ? (
                              <TextInput
                                id={`statusField_${field._id}`}
                                type="email"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : field.type === 'tel' ? (
                              <TextInput
                                id={`statusField_${field._id}`}
                                type="tel"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            ) : (
                              <TextInput
                                id={`statusField_${field._id}`}
                                type="text"
                                value={editFormData[field.name as keyof typeof editFormData] || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, [field.name]: e.target.value })}
                                placeholder={`Enter ${field.name.toLowerCase()}`}
                                className="w-full"
                                required={field.required}
                              />
                            )}
                          </div>

                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-3xl text-gray-400 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No specific fields required for this status</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This status doesn't have any associated form fields</p>
                  </div>
                )}
              </div>

            </div>

          </Modal.Body>

          <Modal.Footer className="flex flex-col sm:flex-row gap-2">

            <Button

              type="button"

              color="gray"

              onClick={handleCloseEditModal}

              disabled={isSubmitting}

              className="w-full sm:w-auto"

            >

              Cancel

            </Button>

            <Button

              type="submit"

              color="info"

              disabled={isSubmitting}

              className="flex items-center gap-2 w-full sm:w-auto"

            >

              {isSubmitting ? (

                <>

                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>

                  Updating Details...

                </>

              ) : (

                <>

                  <Icon icon="solar:pen-line-duotone" className="w-4 h-4" />

                  Update Details

                </>

              )}

            </Button>

          </Modal.Footer>

        </form>

      </Modal>



      {/* Enhanced Status Update Modal */}
      <Modal show={isStatusModalOpen} onClose={handleCloseStatusModal} size="6xl">
        <Modal.Header>
              <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <Icon icon="solar:refresh-line-duotone" className="text-white text-xl" />
                </div>
                <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update Lead Status</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Change the status and add additional information</p>
            </div>
          </div>
        </Modal.Header>
        
        <Modal.Body className="max-h-[80vh] overflow-y-auto">
          <div className="space-y-8">
            {/* Current Status Display */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-lg">
                  <Icon icon="solar:check-circle-line-duotone" className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Current Status</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge color="green" size="lg">
                      {lead?.currentStatus?.name || 'No Status'}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Last updated: {lead && lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>



            {/* Lead Details Preview - Commented out for simpler UI, uncomment if needed in future */}
            {/* 
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">

              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Current Lead Details</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Name:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">

                    {lead?.customData?.["First Name"] || ''} {lead?.customData?.["Last Name"] || ''}

                  </span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Email:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Email"] || 'N/A'}</span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Phone:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Phone"] || 'N/A'}</span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Priority:</span>

                  <span className="ml-2">

                    <Badge

                      color={

                        lead?.customData?.["Lead Priority"] === 'Hot' ? 'red' :

                          lead?.customData?.["Lead Priority"] === 'Warm' ? 'orange' :

                            lead?.customData?.["Lead Priority"] === 'Cold' ? 'blue' : 'gray'

                      }

                      size="sm"

                    >

                      {lead?.customData?.["Lead Priority"] || 'Not Set'}

                    </Badge>

                  </span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Property Type:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Property Type"] || lead?.customData?.propertyType || 'N/A'}</span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Configuration:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Configuration"] || lead?.customData?.configuration || 'N/A'}</span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Funding Mode:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Funding Mode"] || lead?.customData?.fundingMode || 'N/A'}</span>

                </div>

                <div>

                  <span className="text-gray-600 dark:text-gray-400">Budget:</span>

                  <span className="ml-2 text-gray-900 dark:text-white">{lead?.customData?.["Budget"] || lead?.customData?.budget || 'N/A'}</span>

                </div>

              </div>

            </div>
            */}



            {/* Status Selection */}

            <div className="space-y-4">

              <div>

                <Label htmlFor="newStatusId" value="Select New Status" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                <Select

                  id="newStatusId"
                  value={statusFormData.newStatusId}
                  onChange={(e) => {
                    const newStatusId = e.target.value;
                    console.log('🔄 onChange: Status changed from', statusFormData.newStatusId, 'to', newStatusId);
                    // Reset dynamic fields and increment reset key to force remount
                    setDynamicFields({});
                    setFieldResetKey(prev => prev + 1);
                    setStatusFormData({ newStatusId, statusRemark: statusFormData.statusRemark });
                  }}

                  className="w-full mt-2"

                >

                  <option value="">Choose a new status...</option>

                  {leadStatuses.map((status) => (

                    <option key={status._id} value={status._id}>

                      {status.name}

                    </option>

                  ))}

                </Select>

              </div>



              <div>

                <Label htmlFor="statusRemark" value="Status Remark (Optional)" className="text-sm font-medium text-gray-700 dark:text-gray-300" />

                <Textarea

                  id="statusRemark"

                  value={statusFormData.statusRemark}

                  onChange={(e) => setStatusFormData({ ...statusFormData, statusRemark: e.target.value })}

                  placeholder="Add a remark for this status change..."

                  rows={3}

                  className="w-full mt-2"

                />

              </div>

              {/* Dynamic Fields for Selected Status */}
              {statusFormData.newStatusId && (() => {
                const selectedStatus = leadStatuses.find(status => status._id === statusFormData.newStatusId);
                const filteredFields = selectedStatus?.formFields || [];
                
                return filteredFields.length > 0 ? (
                  <div key={`status-fields-${statusFormData.newStatusId}-${fieldResetKey}`} className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-lg mr-4">
                        <Icon icon="solar:settings-line-duotone" className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Fields for "{selectedStatus.name}" Status</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fill in the required fields for this status</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredFields.map((field: FormField) => {
                        return (
                          <div 
                            key={field._id} 
                            className="space-y-2"
                          >
                          <Label
                            htmlFor={`statusField_${field._id}`}
                            value={field.name}
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            {field.name}
                            {field.required && (
                              <span className="text-red-500 text-xs bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
                            )}
                          </Label>
                          {field.type === 'select' && field.options && field.options.length > 0 ? (
                            <Select
                              id={`statusField_${field._id}`}
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              className="w-full"
                              required={field.required}
                            >
                              <option value="">Select {field.name}</option>
                              {field.options.map((option: any, index: number) => (
                                <option key={index} value={option.value || option}>
                                  {option.label || option}
                                </option>
                              ))}
                            </Select>
                          ) : field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                            <div className="space-y-2">
                              {field.options.map((option: any, index: number) => {
                                const optionValue = option.value || option;
                                const currentValues = dynamicFields[field.name] || [];
                                const isChecked = Array.isArray(currentValues) 
                                  ? currentValues.includes(optionValue)
                                  : currentValues === optionValue;
                                
                                return (
                                  <div key={index} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`${field._id}_${index}`}
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentValues = dynamicFields[field.name] || [];
                                        let newValues;
                                        
                                        if (Array.isArray(currentValues)) {
                                          if (e.target.checked) {
                                            newValues = [...currentValues, optionValue];
                                          } else {
                                            newValues = currentValues.filter((v: string) => v !== optionValue);
                                          }
                                        } else {
                                          newValues = e.target.checked ? [optionValue] : [];
                                        }
                                        
                                        setDynamicFields({ ...dynamicFields, [field.name]: newValues });
                                      }}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor={`${field._id}_${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                      {option.label || option}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          ) : field.type === 'textarea' ? (
                            <Textarea
                              id={`statusField_${field._id}`}
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              rows={3}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'number' ? (
                            <TextInput
                              id={`statusField_${field._id}`}
                              type="number"
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'date' ? (
                            <DateTimePicker
                              id={`statusField_${field._id}`}
                              type="date"
                              value={dynamicFields[field.name] || ''}
                              onChange={(value) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: value });
                              }}
                              placeholder={`Select ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'datetime' ? (
                            <DateTimePicker
                              id={`statusField_${field._id}`}
                              type="datetime"
                              value={dynamicFields[field.name] || ''}
                              onChange={(value) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: value });
                              }}
                              placeholder={`Select ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'time' ? (
                            <DateTimePicker
                              id={`statusField_${field._id}`}
                              type="time"
                              value={dynamicFields[field.name] || ''}
                              onChange={(value) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: value });
                              }}
                              placeholder={`Select ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'email' ? (
                            <TextInput
                              id={`statusField_${field._id}`}
                              type="email"
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : field.type === 'tel' ? (
                            <TextInput
                              id={`statusField_${field._id}`}
                              type="tel"
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          ) : (
                            <TextInput
                              id={`statusField_${field._id}`}
                              type="text"
                              value={dynamicFields[field.name] || ''}
                              onChange={(e) => {
                                setDynamicFields({ ...dynamicFields, [field.name]: e.target.value });
                              }}
                              placeholder={`Enter ${field.name.toLowerCase()}`}
                              className="w-full"
                              required={field.required}
                            />
                          )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

            </div>



            {/* Status Change Info */}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">

              <div className="flex items-start gap-3">

                <Icon icon="solar:info-circle-line-duotone" className="text-blue-600 dark:text-blue-400 text-lg mt-0.5" />

                <div>

                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">Status Change Information</h5>

                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">

                    Changing the status will update the lead's current status and create a new entry in the status history.

                    All current lead data will be preserved during the status change.

                  </p>

                </div>

              </div>

            </div>

          </div>

        </Modal.Body>

        <Modal.Footer className="flex flex-col sm:flex-row gap-2">

          <Button

            type="button"

            color="gray"

            onClick={handleCloseStatusModal}

            disabled={isSubmitting}

            className="w-full sm:w-auto"

          >

            Cancel

          </Button>

          <Button

            type="button"

            color="warning"

            onClick={handleStatusUpdate}

            disabled={isSubmitting || !statusFormData.newStatusId}

            className="flex items-center gap-2 w-full sm:w-auto"

          >

            {isSubmitting ? (

              <>

                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>

                Updating Status...

              </>

            ) : (

              <>

                <Icon icon="solar:refresh-line-duotone" className="w-4 h-4" />

                Update Status

              </>

            )}

          </Button>

        </Modal.Footer>

      </Modal>


      

    </div>

  );

};



export default LeadDetailPage;
