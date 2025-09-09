"use client";
import React, { useState, useEffect } from "react";
import { Card, Badge, Button, Alert, Timeline } from "flowbite-react";
import { Icon } from "@iconify/react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";
import { useAuth } from "@/app/context/AuthContext";

interface LeadActivity {
  _id: string;
  lead?: {
    _id: string;
    currentStatus: string;
  } | null;
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

const LeadActivities = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchActivities = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.LEAD_ACTIVITIES, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(Array.isArray(data) ? data : []);
      } else {
        setError(`Failed to fetch activities: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setError('Network error: Failed to fetch activities');
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [token]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return 'solar:add-circle-line-duotone';
      case 'updated':
        return 'solar:pen-line-duotone';
      case 'deleted':
        return 'solar:trash-bin-trash-line-duotone';
      case 'transferred':
        return 'solar:transfer-horizontal-line-duotone';
      case 'status_changed':
        return 'solar:refresh-line-duotone';
      case 'leadstatus_created':
        return 'solar:settings-line-duotone';
      case 'leadstatus_deleted':
        return 'solar:settings-2-line-duotone';
      case 'leadsource_created':
        return 'solar:source-code-line-duotone';
      case 'leadsource_deleted':
        return 'solar:source-code-2-line-duotone';
      default:
        return 'solar:info-circle-line-duotone';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'green';
      case 'updated':
        return 'blue';
      case 'deleted':
        return 'red';
      case 'transferred':
        return 'purple';
      case 'status_changed':
        return 'yellow';
      case 'leadstatus_created':
      case 'leadsource_created':
        return 'indigo';
      case 'leadstatus_deleted':
      case 'leadsource_deleted':
        return 'pink';
      default:
        return 'gray';
    }
  };

  const formatActionText = (action: string) => {
    switch (action) {
      case 'created':
        return 'Created Lead';
      case 'updated':
        return 'Updated Lead';
      case 'deleted':
        return 'Deleted Lead';
      case 'transferred':
        return 'Transferred Lead';
      case 'status_changed':
        return 'Changed Status';
      case 'leadstatus_created':
        return 'Created Lead Status';
      case 'leadstatus_deleted':
        return 'Deleted Lead Status';
      case 'leadsource_created':
        return 'Created Lead Source';
      case 'leadsource_deleted':
        return 'Deleted Lead Source';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDetails = (activity: LeadActivity) => {
    const { action, details } = activity;
    
    switch (action) {
      case 'created':
        if (details.data) {
          const leadData = details.data;
          return (
            <div className="text-sm">
              <div><strong>Lead:</strong> {leadData.customData?.["First Name"]} {leadData.customData?.["Last Name"]}</div>
              <div><strong>Email:</strong> {leadData.customData?.["Email"]}</div>
              <div><strong>Phone:</strong> {leadData.customData?.["Phone"]}</div>
              {leadData.customData?.["Notes"] && (
                <div><strong>Notes:</strong> {leadData.customData.Notes}</div>
              )}
            </div>
          );
        }
        break;
        
      case 'transferred':
        return (
          <div className="text-sm">
            <div><strong>From User:</strong> {details.fromUser}</div>
            <div><strong>To User:</strong> {details.toUser}</div>
            {details.projectId && <div><strong>Project:</strong> {details.projectId}</div>}
            {details.oldProject && <div><strong>Old Project:</strong> {details.oldProject}</div>}
            {details.newProject && <div><strong>New Project:</strong> {details.newProject}</div>}
          </div>
        );
        
      case 'status_changed':
        return (
          <div className="text-sm">
            <div><strong>Old Status:</strong> {details.oldStatus}</div>
            <div><strong>New Status:</strong> {details.newStatus}</div>
            {details.newData && Object.keys(details.newData).length > 0 && (
              <div><strong>New Data:</strong> {JSON.stringify(details.newData, null, 2)}</div>
            )}
          </div>
        );
        
      case 'deleted':
        if (details.data) {
          const leadData = details.data;
          return (
            <div className="text-sm">
              <div><strong>Deleted Lead:</strong> {leadData.customData?.["First Name"]} {leadData.customData?.["Last Name"]}</div>
              <div><strong>Email:</strong> {leadData.customData?.["Email"]}</div>
            </div>
          );
        }
        break;
        
      case 'leadstatus_created':
      case 'leadstatus_deleted':
        if (details.data) {
          return (
            <div className="text-sm">
              <div><strong>Status Name:</strong> {details.data.name}</div>
              <div><strong>Final Status:</strong> {details.data.is_final_status ? 'Yes' : 'No'}</div>
            </div>
          );
        }
        break;
        
      case 'leadsource_created':
      case 'leadsource_deleted':
        if (details.data) {
          return (
            <div className="text-sm">
              <div><strong>Source Name:</strong> {details.data.name}</div>
            </div>
          );
        }
        break;
    }
    
    return <div className="text-sm text-gray-500">No additional details</div>;
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === "all") return true;
    return activity.action === filter;
  });

  const actionFilters = [
    { value: "all", label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "updated", label: "Updated" },
    { value: "deleted", label: "Deleted" },
    { value: "transferred", label: "Transferred" },
    { value: "status_changed", label: "Status Changed" },
    { value: "leadstatus_created", label: "Status Created" },
    { value: "leadstatus_deleted", label: "Status Deleted" },
    { value: "leadsource_created", label: "Source Created" },
    { value: "leadsource_deleted", label: "Source Deleted" },
  ];

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading activities...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Activities</h2>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Track all lead-related activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchActivities} 
            color="gray"
            disabled={isLoading}
            title="Refresh activities"
          >
            <Icon icon="solar:refresh-line-duotone" className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {actionFilters.map((filterOption) => (
            <Button
              key={filterOption.value}
              size="sm"
              color={filter === filterOption.value ? "primary" : "gray"}
              onClick={() => setFilter(filterOption.value)}
            >
              {filterOption.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Activities Timeline */}
      <Card>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
              <p>No activities found</p>
              <p className="text-sm">
                {activities.length === 0 
                  ? "No activities available in the system"
                  : "No activities match your current filter"
                }
              </p>
            </div>
          </div>
        ) : (
          <Timeline>
            {filteredActivities.map((activity, index) => (
              <Timeline.Item key={activity._id}>
                <Timeline.Point
                  icon={() => (
                    <Icon 
                      icon={getActionIcon(activity.action)} 
                      className="text-white"
                    />
                  )}
                  color={getActionColor(activity.action)}
                />
                <Timeline.Content>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge color={getActionColor(activity.action)} size="sm">
                        {formatActionText(activity.action)}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        by {activity.user.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {formatDetails(activity)}
                  </div>
                  
                  {activity.lead && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Lead ID: {activity.lead._id}
                    </div>
                  )}
                </Timeline.Content>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </div>
  );
};

export default LeadActivities;
