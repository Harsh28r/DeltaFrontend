"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert, Timeline } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
    "Last Name"?: string;
    "Email"?: string;
    "Phone"?: string;
    "Company"?: string;
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
  options: any[];
  _id: string;
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
  lead: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

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
      } else {
        setAlertMessage({ 
          type: 'error', 
          message: `Failed to fetch lead details: ${leadResponse.status} ${leadResponse.statusText}` 
        });
      }

      // Fetch lead statuses
      const statusesResponse = await fetch(`${API_BASE_URL}/api/lead-statuses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setLeadStatuses(statusesData.leadStatuses || statusesData || []);
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
        return `From "${activity.details.oldStatus}" to "${activity.details.newStatus}"`;
      case 'transferred':
        return `From ${activity.details.fromUser} to ${activity.details.toUser}`;
      case 'created':
        return 'New lead created with initial data';
      default:
        return JSON.stringify(activity.details);
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
            onClick={() => router.push(`/apps/leads?edit=${lead._id}`)}
            className="flex items-center gap-2"
          >
            <Icon icon="solar:pen-line-duotone" />
            Edit Lead
          </Button>
          <Button
            color="success"
            onClick={() => {/* Add call functionality */}}
            className="flex items-center gap-2"
          >
            <Icon icon="solar:phone-line-duotone" />
            Call
          </Button>
          <Button
            color="warning"
            onClick={() => {/* Add email functionality */}}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {lead.leadSource?.name || 'N/A'}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
              <Icon icon="solar:target-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Owner</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {lead.user?.name || 'Unassigned'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {lead.user?.email || 'No owner assigned'}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
              <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
          </div>
        </Card>
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
                      {lead.customData?.["First Name"] || ''} {lead.customData?.["Last Name"] || ''}
                    </p>
                    {lead.customData?.["First Name"] && (
                      <Badge color="blue" size="sm">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                  <p className="text-gray-900 dark:text-white">{lead.customData?.["Company"] || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-900 dark:text-white">{lead.customData?.["Email"] || 'N/A'}</p>
                    {lead.customData?.["Email"] && (
                      <Button size="xs" color="light" onClick={() => window.open(`mailto:${lead.customData?.["Email"]}`)}>
                        <Icon icon="solar:letter-unread-line-duotone" className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-900 dark:text-white">{lead.customData?.["Phone"] || 'N/A'}</p>
                    {lead.customData?.["Phone"] && (
                      <Button size="xs" color="light" onClick={() => window.open(`tel:${lead.customData?.["Phone"]}`)}>
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
                    {lead.customData?.["Notes"] || 'No notes available'}
                  </p>
                </div>
              </div>
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
                      {lead.leadSource?.name || 'N/A'}
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
                    {lead.statusHistory[lead.statusHistory.length-1]?.status?.name || 'N/A'}
                  </Badge>
                )}
                   <Badge color="gray" size="sm">
                     {lead.statusHistory?.length || 0} Changes
                   </Badge>
                 </div>
               </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Owner</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                      <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {lead.user?.name || 'Unassigned'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lead.user?.email || 'No email available'}
                      </p>
                      {lead.user && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge color="blue" size="sm">
                            Current Owner
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Assigned to this lead
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
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
                                {historyItem.status.name}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(historyItem.changedAt).toLocaleString()}
                              </span>
                            </div>
                            
                            {Object.keys(historyItem.data).length > 0 && (
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
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
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-${getActionColor(activity.action)}-100 dark:bg-${getActionColor(activity.action)}-900/20`}>
                        <Icon 
                          icon={getActionIcon(activity.action)} 
                          className={`text-${getActionColor(activity.action)}-600 dark:text-${getActionColor(activity.action)}-400 text-sm`}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatActionText(activity)}
                          </span>
                          <Badge color={getActionColor(activity.action) as any} size="sm">
                            {activity.action}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {formatDetails(activity)}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Icon icon="solar:user-line-duotone" className="w-3 h-3" />
                            <span>{activity.user.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Icon icon="solar:letter-unread-line-duotone" className="w-3 h-3" />
                            <span>{activity.user.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

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
                  <Button size="sm" color="success" onClick={() => {/* Add call functionality */}}>
                    <Icon icon="solar:phone-line-duotone" className="mr-1" />
                    Log Call
                  </Button>
                  <Button size="sm" color="warning" onClick={() => {/* Add email functionality */}}>
                    <Icon icon="solar:letter-unread-line-duotone" className="mr-1" />
                    Log Email
                  </Button>
                  <Button size="sm" color="info" onClick={() => {/* Add message functionality */}}>
                    <Icon icon="solar:chat-round-line-duotone" className="mr-1" />
                    Log Message
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailPage;
