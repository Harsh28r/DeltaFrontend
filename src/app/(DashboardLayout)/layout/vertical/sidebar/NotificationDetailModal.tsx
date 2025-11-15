"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Badge, Button, Modal } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";

interface NotificationData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  recipient: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  type: string;
  title: string;
  message: string;
  data: {
    leadId?: string;
    leadIds?: string[]; // Array of lead IDs for bulk operations
    projectId?: string;
    oldStatusId?: string;
    newStatusId?: string;
    changedBy?: string;
    changedByName?: string;
    changedByEmail?: string;
    leadOwner?: string | { _id?: string; name?: string; [key: string]: any };
    actorUserId?: string;
    // Lead transfer fields
    fromUser?: string;
    toUser?: string;
    transferredBy?: string;
    transferredByName?: string;
    transferredByEmail?: string;
    [key: string]: any; // Allow any additional fields in data
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
  timestamp: string;
  updatedAt: string;
}

interface NotificationDetailModalProps {
  notification: NotificationData | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => Promise<void>;
}

const NotificationDetailModal = ({ notification, isOpen, onClose, onMarkAsRead }: NotificationDetailModalProps) => {
  const router = useRouter();
  const { token } = useAuth();
  const [oldStatusName, setOldStatusName] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  
  // User and project names
  const [fromUserName, setFromUserName] = useState<string | null>(null);
  const [toUserName, setToUserName] = useState<string | null>(null);
  const [changedByName, setChangedByName] = useState<string | null>(null);
  const [actorUserName, setActorUserName] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loadingNames, setLoadingNames] = useState(false);

  // Check if notification is read
  const isNotificationRead = () => {
    if (!notification) return true;
    return notification.read === true;
  };

  // Auto-mark as read when modal opens
  useEffect(() => {
    if (isOpen && notification && !isNotificationRead() && !hasMarkedAsRead && onMarkAsRead) {
      const markAsRead = async () => {
        try {
          await onMarkAsRead(notification._id);
          setHasMarkedAsRead(true);
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      };
      markAsRead();
    }
  }, [isOpen, notification?._id, notification?.read, hasMarkedAsRead, onMarkAsRead]);

  // Reset hasMarkedAsRead when notification changes or modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasMarkedAsRead(false);
    } else if (notification) {
      setHasMarkedAsRead(isNotificationRead());
    }
  }, [isOpen, notification?._id, notification?.read]);

  // Fetch status names if available
  useEffect(() => {
    if (notification && (notification.data.oldStatusId || notification.data.newStatusId)) {
      fetchStatusNames();
    }
  }, [notification]);

  // Fetch user and project names
  useEffect(() => {
    // Reset names when notification changes
    setFromUserName(null);
    setToUserName(null);
    setChangedByName(null);
    setActorUserName(null);
    setProjectName(null);
    
    if (notification && token) {
      fetchUserAndProjectNames();
    }
  }, [notification?._id, token]);

  const fetchStatusNames = async () => {
    if (!token || !notification) return;

    try {
      setLoadingStatus(true);
      const statusIds = [notification.data.oldStatusId, notification.data.newStatusId].filter(Boolean);
      
      if (statusIds.length === 0) return;

      const promises = statusIds.map(async (statusId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/lead-statuses/${statusId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            return { id: statusId, name: data.name || data.leadStatus?.name || 'Unknown Status' };
          }
        } catch (err) {
          console.error('Error fetching status:', err);
        }
        return null;
      });

      const results = await Promise.all(promises);
      
      if (notification.data.oldStatusId) {
        const oldStatus = results.find(r => r?.id === notification.data.oldStatusId);
        setOldStatusName(oldStatus?.name || null);
      }
      
      if (notification.data.newStatusId) {
        const newStatus = results.find(r => r?.id === notification.data.newStatusId);
        setNewStatusName(newStatus?.name || null);
      }
    } catch (err) {
      console.error('Error fetching status names:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchUserAndProjectNames = async () => {
    if (!token || !notification) return;

    try {
      setLoadingNames(true);
      const promises: Promise<void>[] = [];

      // Fetch from user name
      if (notification.data.fromUser) {
        promises.push(
          fetch(API_ENDPOINTS.USER_BY_ID(notification.data.fromUser), {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const userData = data.user || data;
                setFromUserName(userData.name || 'Unknown User');
              }
            })
            .catch((err) => {
              console.error('Error fetching from user:', err);
              setFromUserName(null);
            })
        );
      }

      // Fetch to user name
      if (notification.data.toUser) {
        promises.push(
          fetch(API_ENDPOINTS.USER_BY_ID(notification.data.toUser), {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const userData = data.user || data;
                setToUserName(userData.name || 'Unknown User');
              }
            })
            .catch((err) => {
              console.error('Error fetching to user:', err);
              setToUserName(null);
            })
        );
      }

      // Fetch changedBy user name (if it's an ID and changedByName is not provided)
      if (notification.data.changedBy && !notification.data.changedByName) {
        promises.push(
          fetch(API_ENDPOINTS.USER_BY_ID(notification.data.changedBy), {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const userData = data.user || data;
                setChangedByName(userData.name || 'Unknown User');
              }
            })
            .catch((err) => {
              console.error('Error fetching changedBy user:', err);
              setChangedByName(null);
            })
        );
      }

      // Fetch actorUserId user name
      if (notification.data.actorUserId) {
        promises.push(
          fetch(API_ENDPOINTS.USER_BY_ID(notification.data.actorUserId), {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const userData = data.user || data;
                setActorUserName(userData.name || 'Unknown User');
              }
            })
            .catch((err) => {
              console.error('Error fetching actor user:', err);
              setActorUserName(null);
            })
        );
      }

      // Fetch project name
      if (notification.data.projectId) {
        promises.push(
          fetch(API_ENDPOINTS.PROJECTS, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                const projects = data.projects || data || [];
                const project = projects.find((p: any) => p._id === notification.data.projectId);
                if (project) {
                  setProjectName(project.name || 'Unknown Project');
                }
              }
            })
            .catch((err) => {
              console.error('Error fetching project:', err);
              setProjectName(null);
            })
        );
      }

      await Promise.all(promises);
    } catch (err) {
      console.error('Error fetching user and project names:', err);
    } finally {
      setLoadingNames(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_status_change': return 'solar:chart-line-duotone';
      case 'lead_assigned': return 'solar:user-plus-line-duotone';
      case 'lead_created': return 'solar:add-circle-line-duotone';
      case 'lead_transferred': return 'solar:transfer-vertical-line-duotone';
      case 'project_update': return 'solar:buildings-line-duotone';
      default: return 'solar:bell-line-duotone';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'failure';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getRelatedPageUrl = () => {
    if (!notification) return null;

    // Only show for lead-related notifications (no project detail page exists)
    const leadId = getLeadId();
    if (leadId) {
      return `/apps/leads/${leadId}`;
    }

    return null;
  };

  const handleViewDetails = () => {
    const url = getRelatedPageUrl();
    if (url) {
      onClose();
      router.push(url);
    }
  };

  // Helper to safely extract string value (handles string or object)
  const getStringValue = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      return value._id || value.name || value.id || String(value);
    }
    return String(value);
  };

  // Helper to safely render leadOwner (could be string or object)
  const getLeadOwnerName = () => {
    if (!notification?.data.leadOwner) return null;
    return getStringValue(notification.data.leadOwner);
  };

  // Helper to safely get leadId (handles both single leadId and leadIds array)
  const getLeadId = () => {
    if (notification?.data.leadId) {
      return getStringValue(notification.data.leadId);
    }
    // If leadIds array exists, use the first one for navigation
    if (notification?.data.leadIds && Array.isArray(notification.data.leadIds) && notification.data.leadIds.length > 0) {
      return getStringValue(notification.data.leadIds[0]);
    }
    return null;
  };

  // Helper to safely get projectId
  const getProjectId = () => {
    return getStringValue(notification?.data.projectId);
  };

  if (!notification) return null;

  const relatedPageUrl = getRelatedPageUrl();

  return (
    <Modal show={isOpen} onClose={onClose} size="2xl">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <Icon 
            icon={getNotificationIcon(notification.type)} 
            className="text-2xl text-blue-600 dark:text-blue-400" 
          />
          <span className="text-xl font-bold text-gray-900 dark:text-white">Notification Details</span>
          <Badge 
            color={getPriorityColor(notification.priority)} 
            size="sm"
          >
            {notification.priority}
          </Badge>
          {!isNotificationRead() && (
            <Badge color="info" size="sm">
              Unread
            </Badge>
          )}
        </div>
      </Modal.Header>
      
      <Modal.Body className="max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Title and Message */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {notification.title || 'No Title'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {notification.message || 'No message'}
            </p>
          </div>

          {/* Activity Details based on type */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Icon icon="solar:info-circle-line-duotone" className="text-lg" />
              Activity Details
            </h4>
            
            <div className="space-y-3">
              {/* Lead Status Change */}
              {notification.type === 'lead_status_change' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:chart-line-duotone" className="text-lg text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Status Change</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">From:</span>
                    {loadingStatus ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : (
                      <Badge color="gray" size="sm">
                        {oldStatusName || 'Unknown Status'}
                      </Badge>
                    )}
                    <Icon icon="solar:arrow-right-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">To:</span>
                    {loadingStatus ? (
                      <span className="text-gray-500">Loading...</span>
                    ) : (
                      <Badge color="info" size="sm">
                        {newStatusName || 'Unknown Status'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Lead Assigned */}
              {notification.type === 'lead_assigned' && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:user-plus-line-duotone" className="text-lg text-green-600 dark:text-green-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Lead Assignment</span>
                  </div>
                  {getLeadOwnerName() && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Assigned to:</span> {getLeadOwnerName()}
                    </div>
                  )}
                </div>
              )}

              {/* Lead Created */}
              {notification.type === 'lead_created' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:add-circle-line-duotone" className="text-lg text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-gray-900 dark:text-white">New Lead Created</span>
                  </div>
                  {getLeadId() && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Lead ID:</span> {getLeadId()}
                    </div>
                  )}
                </div>
              )}

              {/* Lead Transferred */}
              {notification.type === 'lead_transferred' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:transfer-vertical-line-duotone" className="text-lg text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Lead Transfer</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {notification.data.leadIds && Array.isArray(notification.data.leadIds) && (
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Leads Transferred:</span> {notification.data.leadIds.length} lead(s)
                      </div>
                    )}
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Transfer Details:</span>{' '}
                      {loadingNames ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        <>
                          {notification.data.leadIds?.length || 0} lead(s) transferred from{' '}
                          <span className="font-semibold">{fromUserName || notification.data.fromUser || 'Unknown User'}</span>
                          {' '}to{' '}
                          <span className="font-semibold">{toUserName || notification.data.toUser || 'Unknown User'}</span>
                          {notification.data.transferredByName && (
                            <> by <span className="font-semibold">{notification.data.transferredByName}</span></>
                          )}
                        </>
                      )}
                    </div>
                    {notification.data.projectId && (
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Project:</span> {
                          loadingNames ? (
                            <span className="text-gray-500">Loading...</span>
                          ) : (
                            projectName || getProjectId() || 'Unknown Project'
                          )
                        }
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project Update */}
              {notification.type === 'project_update' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:buildings-line-duotone" className="text-lg text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Project Update</span>
                  </div>
                  {getProjectId() && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Project:</span> {
                        loadingNames ? (
                          <span className="text-gray-500">Loading...</span>
                        ) : (
                          projectName || getProjectId() || 'Unknown Project'
                        )
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Icon icon="solar:document-text-line-duotone" className="text-lg" />
              Additional Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon="solar:user-line-duotone" className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Created By:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {notification.createdBy?.name || notification.data.transferredByName || 'Unknown User'}
                  </span>
                </div>
                
                {(notification.data.changedByName || changedByName) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon icon="solar:user-check-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Changed By:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loadingNames ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        notification.data.changedByName || changedByName || 'Unknown User'
                      )}
                    </span>
                  </div>
                )}
                {notification.data.actorUserId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon icon="solar:user-id-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Actor:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loadingNames ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        actorUserName || notification.data.actorUserId
                      )}
                    </span>
                  </div>
                )}

                {notification.data.changedByEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon icon="solar:letter-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {notification.data.changedByEmail}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon icon="solar:clock-circle-line-duotone" className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Created At:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>

                {getLeadId() && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon icon="solar:user-id-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Lead ID:</span>
                    <span className="font-medium text-gray-900 dark:text-white font-mono">
                      {getLeadId()}
                    </span>
                  </div>
                )}

                {getProjectId() && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon icon="solar:buildings-line-duotone" className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Project:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {loadingNames ? (
                        <span className="text-gray-500">Loading...</span>
                      ) : (
                        projectName || getProjectId() || 'Unknown Project'
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-end w-full gap-2">
          {relatedPageUrl && (
            <Button
              size="sm"
              color="primary"
              onClick={handleViewDetails}
            >
              <Icon icon="solar:eye-line-duotone" className="mr-1" />
              View Related Details
            </Button>
          )}
          <Button
            size="sm"
            color="gray"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationDetailModal;

