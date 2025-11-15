"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Badge, Button, Modal } from "flowbite-react";
import { useAuth } from "@/app/context/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import NotificationDetailModal from "./NotificationDetailModal";

// Notification types
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
    projectId?: string;
    oldStatusId?: string;
    newStatusId?: string;
    changedBy?: string;
    changedByName?: string;
    changedByEmail?: string;
    leadOwner?: string;
    actorUserId?: string;
  };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  timestamp: string;
  updatedAt: string;
}

interface NotificationResponse {
  notifications: NotificationData[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsModal = ({ isOpen, onClose }: NotificationsModalProps) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!token || !user) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notifications/${user.id}?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    if (!token) {
      console.error('No token available');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Update local state
        if (notifications) {
          const updatedNotifications = notifications.notifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          );
          setNotifications({
            ...notifications,
            notifications: updatedNotifications
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to mark notification as read:', response.status, errorData);
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token || !notifications) return;

    try {
      const unreadNotifications = notifications.notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification => 
        fetch(`${API_BASE_URL}/api/notifications/${notification._id}/read`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      );

      await Promise.all(promises);

      // Update local state
      const updatedNotifications = notifications.notifications.map(notification => ({
        ...notification,
        read: true
      }));
      setNotifications({
        ...notifications,
        notifications: updatedNotifications
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Helper function to get notification icon based on type
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

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'failure';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch notifications when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token, user]);

  // Helper to check if notification is unread
  const isUnread = (notification: NotificationData) => {
    return !notification.read;
  };

  const unreadCount = notifications?.notifications.filter(n => !n.read).length || 0;

  return (
    <Modal show={isOpen} onClose={onClose} size="4xl">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <Icon icon="solar:bell-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">All Notifications</span>
          {unreadCount > 0 && (
            <Badge color="info" size="sm">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
      </Modal.Header>
      
      <Modal.Body className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:loading-line-duotone" className="text-3xl animate-spin mr-3" />
            <span className="text-gray-600 dark:text-gray-400">Loading notifications...</span>
          </div>
        ) : notifications && notifications.notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  !isUnread(notification)
                    ? 'bg-gray-50 dark:bg-gray-800 border-l-gray-300 dark:border-l-gray-600' 
                    : 'bg-blue-50 dark:bg-blue-900 border-l-blue-500 dark:border-l-blue-400'
                }`}
                onClick={() => {
                  setSelectedNotification(notification);
                  setDetailModalOpen(true);
                  // Mark as read is handled in NotificationDetailModal
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    !isUnread(notification)
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : 'bg-blue-100 dark:bg-blue-800'
                  }`}>
                    <Icon 
                      icon={getNotificationIcon(notification.type)} 
                      className={`text-lg ${
                        !isUnread(notification)
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      }`} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-semibold ${
                        !isUnread(notification)
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title || 'No Title'}
                      </h4>
                      <Badge 
                        color={getPriorityColor(notification.priority)} 
                        size="xs"
                      >
                        {notification.priority}
                      </Badge>
                      {isUnread(notification) && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm ${
                      !isUnread(notification)
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message || 'No message'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:user-line-duotone" className="text-xs" />
                        {notification.createdBy?.name || 'Unknown User'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon icon="solar:clock-circle-line-duotone" className="text-xs" />
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.data.leadId && typeof notification.data.leadId === 'string' && notification.data.leadId.trim() && (
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:user-id-line-duotone" className="text-xs" />
                          Lead ID: {notification.data.leadId.slice(-8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {notifications.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {notifications.pagination.currentPage} of {notifications.pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    color="light"
                    disabled={notifications.pagination.currentPage === 1}
                    onClick={() => fetchNotifications(notifications.pagination.currentPage - 1)}
                  >
                    <Icon icon="solar:arrow-left-line-duotone" className="mr-1" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    color="light"
                    disabled={notifications.pagination.currentPage === notifications.pagination.totalPages}
                    onClick={() => fetchNotifications(notifications.pagination.currentPage + 1)}
                  >
                    Next
                    <Icon icon="solar:arrow-right-line-duotone" className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Icon icon="solar:bell-off-line-duotone" className="text-6xl text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Notifications Available</h4>
            <p className="text-gray-500 dark:text-gray-500">
              You don't have any notifications at the moment.
            </p>
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                color="primary"
                onClick={markAllAsRead}
              >
                <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                Mark All as Read
              </Button>
            )}
            <Button
              size="sm"
              color="light"
              onClick={() => fetchNotifications(currentPage)}
              disabled={loading}
            >
              <Icon icon="solar:refresh-line-duotone" className="mr-1" />
              Refresh
            </Button>
          </div>
          <Button
            size="sm"
            color="gray"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Modal.Footer>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedNotification(null);
        }}
        onMarkAsRead={markNotificationAsRead}
      />
    </Modal>
  );
};

export default NotificationsModal;
