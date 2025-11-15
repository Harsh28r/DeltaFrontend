
import { Icon } from "@iconify/react";
import { Badge, Button, Dropdown } from "flowbite-react";
import React, { useState, useEffect } from "react";
import * as Notification from "./Data";
import SimpleBar from "simplebar-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_BASE_URL } from "@/lib/config";
import NotificationsModal from "../sidebar/NotificationsModal";
import NotificationDetailModal from "../sidebar/NotificationDetailModal";

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

const Notifications = () => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notifications/${user.id}?page=1&limit=10`, {
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
      case 'urgent': return 'text-error';
      case 'high': return 'text-warning';
      case 'normal': return 'text-primary';
      case 'low': return 'text-secondary';
      default: return 'text-secondary';
    }
  };

  // Helper function to get priority background color
  const getPriorityBgColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-lighterror dark:bg-lighterror';
      case 'high': return 'bg-lightwarning dark:bg-lightwarning';
      case 'normal': return 'bg-lightprimary dark:bg-lightprimary';
      case 'low': return 'bg-lightsecondary dark:bg-lightsecondary';
      default: return 'bg-lightsecondary dark:bg-lightsecondary';
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
    <div className="relative group/menu">
      <Dropdown
        label=""
        className="w-screen sm:w-[360px] py-6  rounded-sm"
        dismissOnClick={false}
        renderTrigger={() => (
          <div className="relative">
            <span className="h-10 w-10 hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
              <Icon icon="solar:bell-bing-line-duotone" height={20} />
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full absolute end-1 top-1 bg-error text-[10px] h-4 w-4 flex justify-center items-center text-white">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      >
        <div className="flex items-center px-6 justify-between">
          <h3 className="mb-0 text-lg font-semibold text-ld">Notifications</h3>
          {unreadCount > 0 && (
            <Badge color={"primary"}>{unreadCount} new</Badge>
          )}
        </div>

        <SimpleBar className="max-h-80 mt-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="solar:loading-line-duotone" className="text-2xl animate-spin mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          ) : notifications && notifications.notifications.length > 0 ? (
            notifications.notifications.map((notification, index) => (
              <Dropdown.Item
                key={notification._id}
                className={`px-6 py-3 flex justify-between items-center group/link w-full cursor-pointer ${
                  notification.read ? 'bg-hover' : 'bg-blue-50 dark:bg-blue-900'
                }`}
                onClick={() => {
                  setSelectedNotification(notification);
                  setDetailModalOpen(true);
                  // Mark as read is handled in NotificationDetailModal
                }}
              >
                <div className="flex items-center w-full">
                  <div
                    className={`h-11 w-11 flex-shrink-0 rounded-full flex justify-center items-center ${
                      notification.read 
                        ? 'bg-gray-200 dark:bg-gray-700' 
                        : getPriorityBgColor(notification.priority)
                    }`}
                  >
                    <Icon 
                      icon={getNotificationIcon(notification.type)} 
                      height={20} 
                      className={notification.read ? 'text-gray-600 dark:text-gray-400' : getPriorityColor(notification.priority)} 
                    />
                  </div>
                  <div className="ps-4 flex justify-between w-full">
                    <div className="w-3/4 text-start">
                      <h5 className={`mb-1 text-sm group-hover/link:text-primary ${
                        notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title || 'No Title'}
                      </h5>
                      <div className={`text-xs line-clamp-1 ${
                        notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.message || 'No message'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {notification.createdBy?.name || 'Unknown User'}
                      </div>
                    </div>

                    <div className="text-xs block self-start pt-1.5 text-gray-500 dark:text-gray-400">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                  )}
                </div>
              </Dropdown.Item>
            ))
          ) : (
            <div className="text-center py-8">
              <Icon icon="solar:bell-off-line-duotone" className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No notifications available</p>
            </div>
          )}
        </SimpleBar>
        <div className="pt-5 px-6">
          <Button
            color={"primary"}
            className="w-full border border-primary text-primary hover:bg-primary hover:text-white"
            pill
            outline
            onClick={() => setModalOpen(true)}
          >
            See All Notifications
          </Button>
        </div>
      </Dropdown>

      {/* Notifications Modal */}
      <NotificationsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />

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
    </div>
  );
};

export default Notifications;
