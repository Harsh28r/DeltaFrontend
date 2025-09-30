"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Badge, Button } from "flowbite-react";
import { useAuth } from "@/app/context/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import NotificationsModal from "./NotificationsModal";

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

const NotificationsModule = () => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notifications/${user.id}?page=1&limit=5`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
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
  const markNotificationAsRead = async (notificationId: string) => {
    if (!token) return;

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
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lead_status_change': return 'solar:chart-line-duotone';
      case 'lead_assigned': return 'solar:user-plus-line-duotone';
      case 'lead_created': return 'solar:add-circle-line-duotone';
      case 'project_update': return 'solar:buildings-line-duotone';
      default: return 'solar:bell-line-duotone';
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-blue-500';
      case 'low': return 'text-gray-500';
      default: return 'text-gray-500';
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

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [token, user]);

  const unreadCount = notifications?.notifications.filter(n => !n.read).length || 0;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      {/* Notifications Header */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Icon icon="solar:bell-line-duotone" className="text-lg text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications</span>
          {unreadCount > 0 && (
            <Badge color="red" size="xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Icon 
          icon={expanded ? "solar:alt-arrow-up-line-duotone" : "solar:alt-arrow-down-line-duotone"} 
          className="text-sm text-gray-500 dark:text-gray-400"
        />
      </div>

      {/* Notifications Content */}
      {expanded && (
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Icon icon="solar:loading-line-duotone" className="text-lg animate-spin mr-2" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
            </div>
          ) : notifications && notifications.notifications.length > 0 ? (
            notifications.notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-3 rounded-lg border-l-2 transition-all duration-200 hover:shadow-sm cursor-pointer ${
                  notification.read 
                    ? 'bg-gray-50 dark:bg-gray-800 border-l-gray-300 dark:border-l-gray-600' 
                    : 'bg-blue-50 dark:bg-blue-900 border-l-blue-500 dark:border-l-blue-400'
                }`}
                onClick={() => !notification.read && markNotificationAsRead(notification._id)}
              >
                <div className="flex items-start space-x-2">
                  <div className={`p-1.5 rounded-full ${
                    notification.read 
                      ? 'bg-gray-200 dark:bg-gray-700' 
                      : 'bg-blue-100 dark:bg-blue-800'
                  }`}>
                    <Icon 
                      icon={getNotificationIcon(notification.type)} 
                      className={`text-sm ${
                        notification.read 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : getPriorityColor(notification.priority)
                      }`} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      <h5 className={`text-xs font-semibold line-clamp-1 ${
                        notification.read 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title || 'No Title'}
                      </h5>
                      {!notification.read && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 ${
                      notification.read 
                        ? 'text-gray-500 dark:text-gray-500' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message || 'No message'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(notification.createdAt)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {notification.createdBy?.name || 'Unknown User'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <Icon icon="solar:bell-off-line-duotone" className="text-2xl text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">No notifications</p>
            </div>
          )}
        </div>
      )}

      {/* View All Button */}
      {expanded && notifications && notifications.notifications.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            size="xs"
            color="light"
            className="w-full text-xs"
            onClick={() => setModalOpen(true)}
          >
            <Icon icon="solar:eye-line-duotone" className="mr-1" />
            View All Notifications
          </Button>
        </div>
      )}

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
};

export default NotificationsModule;
