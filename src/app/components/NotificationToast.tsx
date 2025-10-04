"use client";
import React from 'react';
import { Toast } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useNotification } from '@/app/context/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'solar:check-circle-line-duotone';
      case 'error':
        return 'solar:close-circle-line-duotone';
      case 'warning':
        return 'solar:danger-triangle-line-duotone';
      case 'info':
      default:
        return 'solar:info-circle-line-duotone';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Toast key={notification.id} className="shadow-lg border-l-4 border-l-current">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon 
                icon={getIcon(notification.type)} 
                className={`text-lg ${getIconColor(notification.type)}`} 
              />
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {notification.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {notification.message}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatTime(notification.timestamp)}
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icon icon="solar:close-circle-line-duotone" className="text-sm" />
              </button>
            </div>
          </div>
        </Toast>
      ))}
    </div>
  );
};

export default NotificationToast;
