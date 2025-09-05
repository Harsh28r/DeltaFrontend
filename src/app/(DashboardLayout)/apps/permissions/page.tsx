'use client'
import React, { useState } from 'react';
import { Button, Card, Table, Badge, Modal, Alert } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/app/context/AuthContext';
import { usePermissions } from '@/app/context/PermissionContext';
import { useLeadPermissions, useUserPermissions, useProjectPermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/app/types/permissions';
import PermissionStatus from '@/app/components/permissions/PermissionStatus';
import UserPermissionManager from '@/app/components/permissions/UserPermissionManager';

const PermissionsPage = () => {
  const { user } = useAuth();
  const { userPermissions, refreshPermissions } = usePermissions();
  const [showPermissionManager, setShowPermissionManager] = useState(false);

  const leadPermissions = useLeadPermissions();
  const userPermissionsHook = useUserPermissions();
  const projectPermissions = useProjectPermissions();

  const permissionTests = [
    {
      category: 'Lead Management',
      permissions: [
        { name: 'Create Leads', permission: PERMISSIONS.LEADS_CREATE, hasPermission: leadPermissions.canCreateLeads },
        { name: 'Read Leads', permission: PERMISSIONS.LEADS_READ, hasPermission: leadPermissions.canReadLeads },
        { name: 'Update Leads', permission: PERMISSIONS.LEADS_UPDATE, hasPermission: leadPermissions.canUpdateLeads },
        { name: 'Delete Leads', permission: PERMISSIONS.LEADS_DELETE, hasPermission: leadPermissions.canDeleteLeads },
      ]
    },
    {
      category: 'User Management',
      permissions: [
        { name: 'Manage Users', permission: PERMISSIONS.USERS_MANAGE, hasPermission: userPermissionsHook.canManageUsers },
        { name: 'Read Users', permission: PERMISSIONS.USERS_READ, hasPermission: userPermissionsHook.canReadUsers },
        { name: 'Create Users', permission: PERMISSIONS.USERS_CREATE, hasPermission: userPermissionsHook.canCreateUsers },
        { name: 'Update Users', permission: PERMISSIONS.USERS_UPDATE, hasPermission: userPermissionsHook.canUpdateUsers },
        { name: 'Delete Users', permission: PERMISSIONS.USERS_DELETE, hasPermission: userPermissionsHook.canDeleteUsers },
      ]
    },
    {
      category: 'Project Management',
      permissions: [
        { name: 'Read Projects', permission: PERMISSIONS.PROJECTS_READ, hasPermission: projectPermissions.canReadProjects },
        { name: 'Create Projects', permission: PERMISSIONS.PROJECTS_CREATE, hasPermission: projectPermissions.canCreateProjects },
        { name: 'Update Projects', permission: PERMISSIONS.PROJECTS_UPDATE, hasPermission: projectPermissions.canUpdateProjects },
        { name: 'Delete Projects', permission: PERMISSIONS.PROJECTS_DELETE, hasPermission: projectPermissions.canDeleteProjects },
      ]
    }
  ];

  const handleRefreshPermissions = async () => {
    await refreshPermissions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Permission Management
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            View and manage user permissions for role-based and individual access control
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
          <Button 
            onClick={handleRefreshPermissions}
            color="gray"
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:refresh-line-duotone" className="mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => window.location.href = '/apps/users'}
            color="info"
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:users-group-two-rounded-line-duotone" className="mr-2" />
            Manage User Permissions
          </Button>
          {user && (
            <Button 
              onClick={() => setShowPermissionManager(true)}
              color="primary"
              className="w-full lg:w-auto"
            >
              <Icon icon="solar:settings-line-duotone" className="mr-2" />
              Manage My Permissions
            </Button>
          )}
        </div>
      </div>

      {/* Current User Permission Status */}
      <PermissionStatus 
        onManagePermissions={() => setShowPermissionManager(true)}
        showManageButton={true}
      />

      {/* Permission Test Results */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permission Test Results
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current permission status for different operations
          </p>
        </div>

        <div className="space-y-6">
          {permissionTests.map((category) => (
            <div key={category.category}>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                {category.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.permissions.map((test) => (
                  <div
                    key={test.permission}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {test.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {test.permission}
                      </div>
                    </div>
                    <Badge
                      color={test.hasPermission ? 'success' : 'failure'}
                      size="sm"
                    >
                      {test.hasPermission ? 'Allowed' : 'Denied'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Raw Permission Data */}
      {userPermissions && (
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Raw Permission Data
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Direct API response from the permissions endpoint
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-medium text-green-600 dark:text-green-400 mb-2">
                Allowed Permissions ({userPermissions.allowed.length})
              </h3>
              <div className="space-y-1">
                {userPermissions.allowed.length > 0 ? (
                  userPermissions.allowed.map((permission) => (
                    <Badge key={permission} color="success" size="sm" className="mr-1 mb-1">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No allowed permissions</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-red-600 dark:text-red-400 mb-2">
                Denied Permissions ({userPermissions.denied.length})
              </h3>
              <div className="space-y-1">
                {userPermissions.denied.length > 0 ? (
                  userPermissions.denied.map((permission) => (
                    <Badge key={permission} color="failure" size="sm" className="mr-1 mb-1">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No denied permissions</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* API Endpoint Information */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            API Endpoint Information
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The permission system uses the following API endpoints
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-mono text-sm">
              <div className="text-green-600 dark:text-green-400">GET</div>
              <div className="text-gray-900 dark:text-white">
                /api/permissions/user/{user?.id || '[USER_ID]'}/permissions
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                Fetch user-specific permissions
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="font-mono text-sm">
              <div className="text-blue-600 dark:text-blue-400">PUT</div>
              <div className="text-gray-900 dark:text-white">
                /api/permissions/user/{user?.id || '[USER_ID]'}/permissions
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                Update user-specific permissions
              </div>
            </div>
          </div>
        </div>

        <Alert color="info" className="mt-4">
          <div className="flex items-center">
            <Icon icon="solar:info-circle-line-duotone" className="mr-2" />
            <div>
              <strong>Note:</strong> The backend API should return permissions in the format:
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
{`{
  "allowed": ["leads:create", "leads:update", "notifications:read"],
  "denied": ["leads:delete", "users:manage"]
}`}
              </pre>
            </div>
          </div>
        </Alert>
      </Card>

      {/* Permission Manager Modal */}
      {user && showPermissionManager && (
        <UserPermissionManager
          userId={user.id}
          userName={user.name}
          onClose={() => setShowPermissionManager(false)}
          onUpdate={handleRefreshPermissions}
        />
      )}
    </div>
  );
};

export default PermissionsPage;
