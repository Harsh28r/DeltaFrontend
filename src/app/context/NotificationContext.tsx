"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useWebSocket } from './WebSocketContext';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useWebSocket();

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Set up global WebSocket event listeners
  React.useEffect(() => {
    if (!socket) return;

    // Lead events
    socket.on('lead-created', (data) => {
      addNotification({
        type: 'success',
        title: 'New Lead Created',
        message: `Lead "${data.lead.name || data.lead.title || 'Unknown'}" has been created by ${data.createdBy?.name || 'Someone'}`,
        data
      });
    });

    socket.on('lead-updated', (data) => {
      addNotification({
        type: 'info',
        title: 'Lead Updated',
        message: `Lead "${data.lead.name || data.lead.title || 'Unknown'}" has been updated by ${data.updatedBy?.name || 'Someone'}`,
        data
      });
    });

    socket.on('lead-assigned', (data) => {
      addNotification({
        type: 'info',
        title: 'Lead Assigned',
        message: `Lead "${data.lead.name || data.lead.title || 'Unknown'}" has been assigned to you by ${data.assignedBy?.name || 'Someone'}`,
        data
      });
    });

    socket.on('lead-status-changed', (data) => {
      addNotification({
        type: 'warning',
        title: 'Lead Status Changed',
        message: `Lead "${data.lead.name || data.lead.title || 'Unknown'}" status changed to "${data.lead.status}" by ${data.changedBy?.name || 'Someone'}`,
        data
      });
    });

    socket.on('lead-deleted', (data) => {
      addNotification({
        type: 'error',
        title: 'Lead Deleted',
        message: `Lead has been deleted by ${data.deletedBy?.name || 'Someone'}`,
        data
      });
    });

    // Reminder events
    socket.on('reminder-created', (data) => {
      addNotification({
        type: 'success',
        title: 'New Reminder',
        message: `Reminder "${data.reminder.title}" has been created`,
        data
      });
    });

    socket.on('reminder-updated', (data) => {
      addNotification({
        type: 'info',
        title: 'Reminder Updated',
        message: `Reminder "${data.reminder.title}" has been updated`,
        data
      });
    });

    socket.on('reminder-deleted', (data) => {
      addNotification({
        type: 'error',
        title: 'Reminder Deleted',
        message: `Reminder has been deleted`,
        data
      });
    });

    socket.on('reminder-status-changed', (data) => {
      addNotification({
        type: 'warning',
        title: 'Reminder Status Changed',
        message: `Reminder "${data.reminder.title}" status changed to "${data.reminder.status}"`,
        data
      });
    });

    // General notifications
    socket.on('notification', (data) => {
      addNotification({
        type: data.type || 'info',
        title: data.title || 'Notification',
        message: data.message || 'You have a new notification',
        data
      });
    });

    // Project events
    socket.on('project-updated', (data) => {
      addNotification({
        type: 'info',
        title: 'Project Updated',
        message: `Project "${data.project.name}" has been updated by ${data.updatedBy?.name || 'Someone'}`,
        data
      });
    });

    socket.on('project-member-added', (data) => {
      addNotification({
        type: 'success',
        title: 'New Team Member',
        message: `${data.member.name} has been added to the project`,
        data
      });
    });

    // Cleanup
    return () => {
      socket.off('lead-created');
      socket.off('lead-updated');
      socket.off('lead-assigned');
      socket.off('lead-status-changed');
      socket.off('lead-deleted');
      socket.off('reminder-created');
      socket.off('reminder-updated');
      socket.off('reminder-deleted');
      socket.off('reminder-status-changed');
      socket.off('notification');
      socket.off('project-updated');
      socket.off('project-member-added');
    };
  }, [socket, addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
