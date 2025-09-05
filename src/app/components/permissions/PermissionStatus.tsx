'use client'
import React from 'react';
import { Card, Badge, Button } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { usePermissions } from '@/app/context/PermissionContext';
import { PERMISSIONS } from '@/app/types/permissions';

interface PermissionStatusProps {
  onManagePermissions?: () => void;
  showManageButton?: boolean;
}

const PermissionStatus: React.FC<PermissionStatusProps> = ({
  onManagePermissions,
  showManageButton = false
}) => {
  const { userPermissions, isLoading, error } = usePermissions();

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading permissions...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <Icon icon="solar:danger-circle-line-duotone" className="mr-2" />
          <span>Error loading permissions: {error}</span>
        </div>
      </Card>
    );
  }

  if (!userPermissions) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-2xl mb-2" />
          <p>No permission data available</p>
        </div>
      </Card>
    );
  }

  const allowedCount = userPermissions.allowed.length;
  const deniedCount = userPermissions.denied.length;
  const totalPermissions = Object.values(PERMISSIONS).length;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your Permissions
        </h3>
        {showManageButton && onManagePermissions && (
          <Button size="sm" color="primary" onClick={onManagePermissions}>
            <Icon icon="solar:settings-line-duotone" className="mr-1" />
            Manage
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {allowedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Allowed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {deniedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Denied</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {totalPermissions - allowedCount - deniedCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Not Set</div>
        </div>
      </div>

      {/* Quick permission overview */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Quick Overview:</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PERMISSIONS).map(([key, permission]) => {
            const isAllowed = userPermissions.allowed.includes(permission);
            const isDenied = userPermissions.denied.includes(permission);
            
            if (!isAllowed && !isDenied) return null;
            
            return (
              <Badge
                key={permission}
                color={isAllowed ? 'success' : 'failure'}
                size="sm"
              >
                {key.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default PermissionStatus;
