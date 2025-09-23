'use client'
import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Textarea, Checkbox, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/app/context/AuthContext';
import { usePermissions } from '@/app/context/PermissionContext';
import { API_ENDPOINTS } from '@/lib/config';
import { PERMISSIONS, Permission } from '@/app/types/permissions';

interface UserPermissionManagerProps {
  userId: string;
  userName: string;
  userRole?: {
    name: string;
    level: number;
    permissions: string[];
  };
  onClose: () => void;
  onUpdate?: () => void;
}

interface PermissionGroup {
  name: string;
  permissions: Permission[];
  description: string;
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'Lead Management',
    description: 'Manage sales leads and prospects',
    permissions: [
      PERMISSIONS.LEADS_CREATE,
      PERMISSIONS.LEADS_READ,
      PERMISSIONS.LEADS_UPDATE,
      PERMISSIONS.LEADS_DELETE,
      PERMISSIONS.LEADS_BULK,
      PERMISSIONS.LEADS_TRANSFER,
      PERMISSIONS.LEADS_BULK_DELETE,
    ]
  },
  {
    name: 'User Management',
    description: 'Manage user accounts and access',
    permissions: [
      PERMISSIONS.USERS_MANAGE,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
    ]
  },
  {
    name: 'Project Management',
    description: 'Manage projects and assignments',
    permissions: [
      PERMISSIONS.PROJECTS_READ,
      PERMISSIONS.PROJECTS_CREATE,
      PERMISSIONS.PROJECTS_UPDATE,
      PERMISSIONS.PROJECTS_DELETE,
    ]
  },
  {
    name: 'Notifications',
    description: 'Manage notifications and alerts',
    permissions: [
      PERMISSIONS.NOTIFICATIONS_READ,
      PERMISSIONS.NOTIFICATIONS_CREATE,
      PERMISSIONS.NOTIFICATIONS_UPDATE,
      PERMISSIONS.NOTIFICATIONS_DELETE,
      PERMISSIONS.NOTIFICATIONS_BULK_UPDATE,
      PERMISSIONS.NOTIFICATIONS_BULK_DELETE,
    ]
  },
  {
    name: 'Roles',
    description: 'Manage user roles and permissions',
    permissions: [
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.ROLES_CREATE,
      PERMISSIONS.ROLES_UPDATE,
      PERMISSIONS.ROLES_DELETE,
    ]
  },
  {
    name: 'Lead Sources',
    description: 'Manage lead source configurations',
    permissions: [
      PERMISSIONS.LEAD_SOURCES_READ,
      PERMISSIONS.LEAD_SOURCES_CREATE,
      PERMISSIONS.LEAD_SOURCES_UPDATE,
      PERMISSIONS.LEAD_SOURCES_DELETE,
      PERMISSIONS.LEAD_SOURCES_READ_ALL,
    ]
  },
  {
    name: 'Lead Statuses',
    description: 'Manage lead status configurations',
    permissions: [
      PERMISSIONS.LEAD_STATUSES_READ,
      PERMISSIONS.LEAD_STATUSES_CREATE,
      PERMISSIONS.LEAD_STATUSES_UPDATE,
      PERMISSIONS.LEAD_STATUSES_DELETE,
      PERMISSIONS.LEAD_STATUSES_READ_ALL,
    ]
  },
  {
    name: 'Channel Partners',
    description: 'Manage channel partner relationships',
    permissions: [
      PERMISSIONS.CHANNEL_PARTNER_CREATE,
      PERMISSIONS.CHANNEL_PARTNER_READ_ALL,
      PERMISSIONS.CHANNEL_PARTNER_READ,
      PERMISSIONS.CHANNEL_PARTNER_UPDATE,
      PERMISSIONS.CHANNEL_PARTNER_DELETE,
      PERMISSIONS.CHANNEL_PARTNER_BULK_CREATE,
      PERMISSIONS.CHANNEL_PARTNER_BULK_UPDATE,
      PERMISSIONS.CHANNEL_PARTNER_BULK_DELETE,
    ]
  },
  {
    name: 'CP Sourcing',
    description: 'Manage channel partner sourcing activities',
    permissions: [
      PERMISSIONS.CP_SOURCING_CREATE,
      PERMISSIONS.CP_SOURCING_READ,
      PERMISSIONS.CP_SOURCING_UPDATE,
      PERMISSIONS.CP_SOURCING_DELETE,
      PERMISSIONS.CP_SOURCING_BULK_CREATE,
      PERMISSIONS.CP_SOURCING_BULK_UPDATE,
      PERMISSIONS.CP_SOURCING_BULK_DELETE,
    ]
  },
  {
    name: 'Lead Activities',
    description: 'Manage lead activities and interactions',
    permissions: [
      PERMISSIONS.LEAD_ACTIVITIES_READ,
      PERMISSIONS.LEAD_ACTIVITIES_BULK_UPDATE,
      PERMISSIONS.LEAD_ACTIVITIES_BULK_DELETE,
    ]
  },
  {
    name: 'User Reporting',
    description: 'Manage user reporting structures',
    permissions: [
      PERMISSIONS.USER_REPORTING_CREATE,
      PERMISSIONS.USER_REPORTING_READ,
      PERMISSIONS.USER_REPORTING_UPDATE,
      PERMISSIONS.USER_REPORTING_DELETE,
      PERMISSIONS.USER_REPORTING_BULK_UPDATE,
      PERMISSIONS.USER_REPORTING_BULK_DELETE,
    ]
  }
];

const UserPermissionManager: React.FC<UserPermissionManagerProps> = ({
  userId,
  userName,
  userRole,
  onClose,
  onUpdate
}) => {
  const { token } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [userPermissions, setUserPermissions] = useState<{
    allowed: string[];
    denied: string[];
  }>({ allowed: [], denied: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPermissions();
  }, [userId, token]);

  const fetchUserPermissions = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.USER_PERMISSIONS(userId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserPermissions({
          allowed: data.allowed || [],
          denied: data.denied || []
        });
      } else if (response.status === 404) {
        // API endpoint doesn't exist yet, set default permissions
        console.info('Permission API endpoint not found (404). Using role-based permissions only.');
        setUserPermissions({ allowed: [], denied: [] });
        // Don't show this as an error since it's expected
        // setError('Permission API not implemented yet. Showing role-based permissions only.');
      } else {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, isEnabled: boolean) => {
    setUserPermissions(prev => {
      const newAllowed = prev.allowed.filter(p => p !== permission);
      const newDenied = prev.denied.filter(p => p !== permission);
      
      if (isEnabled) {
        // Add to allowed permissions
        newAllowed.push(permission);
      } else {
        // Add to denied permissions (explicitly deny)
        newDenied.push(permission);
      }
      
      return {
        allowed: newAllowed,
        denied: newDenied
      };
    });
  };

  const handleSelectAllInGroup = (groupPermissions: Permission[], isAllowed: boolean) => {
    groupPermissions.forEach(permission => {
      handlePermissionChange(permission, isAllowed);
    });
  };

  const handleSave = async () => {
    if (!token) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(API_ENDPOINTS.UPDATE_USER_PERMISSIONS(userId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowed: userPermissions.allowed,
          denied: userPermissions.denied
        }),
      });

      if (response.ok) {
        setSuccess('Permissions updated successfully!');
        await refreshPermissions();
        if (onUpdate) onUpdate();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update permissions: ${response.status}`);
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionStatus = (permission: string): 'allowed' | 'denied' | 'none' => {
    if (userPermissions.allowed.includes(permission)) return 'allowed';
    if (userPermissions.denied.includes(permission)) return 'denied';
    return 'none';
  };

  const getEffectivePermissionStatus = (permission: string): {
    hasPermission: boolean;
    source: 'role' | 'user' | 'none';
    roleHasPermission: boolean;
  } => {
    const roleHasPermission = userRole?.permissions?.includes(permission) || false;
    const userStatus = getPermissionStatus(permission);
    
    // If user has explicit permission (allowed or denied), that takes precedence
    if (userStatus !== 'none') {
      return {
        hasPermission: userStatus === 'allowed',
        source: 'user',
        roleHasPermission
      };
    }
    
    // Otherwise, use role permission
    return {
      hasPermission: roleHasPermission,
      source: roleHasPermission ? 'role' : 'none',
      roleHasPermission
    };
  };

  const getPermissionBadgeColor = (status: 'allowed' | 'denied' | 'none') => {
    switch (status) {
      case 'allowed': return 'success';
      case 'denied': return 'failure';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Modal show onClose={onClose} size="7xl">
        <Modal.Header>Manage Permissions for {userName}</Modal.Header>
        <Modal.Body>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-2">Loading permissions...</span>
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show onClose={onClose} size="7xl">
      <Modal.Header>
        <div className="flex items-center justify-between w-full">
          <div>
            <span>Manage Permissions for {userName}</span>
            {userRole && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Role: <Badge color="info" size="xs">{userRole.name.toUpperCase()}</Badge> 
                (Level {userRole.level}) - {userRole.permissions?.length || 0} role permissions
              </div>
            )}
          </div>
          <Badge color="info" size="sm">
            User ID: {userId}
          </Badge>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          {/* Alerts */}
          {error && (
            <Alert color="failure" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert color="success" onDismiss={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Role Permissions Summary */}
          {userRole && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Role-Based Permissions
                </h3>
                <Badge color="info" size="sm">
                  {userRole.permissions?.length || 0} permissions
                </Badge>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                These permissions are inherited from the <strong>{userRole.name}</strong> role (Level {userRole.level}).
                You can override them below with user-specific permissions.
              </p>
              <div className="flex flex-wrap gap-2">
                {userRole.permissions?.slice(0, 10).map((permission) => (
                  <Badge key={permission} color="info" size="sm">
                    {permission.split(':')[1]?.replace(/([A-Z])/g, ' $1').trim() || permission}
                  </Badge>
                ))}
                {userRole.permissions && userRole.permissions.length > 10 && (
                  <Badge color="gray" size="sm">
                    +{userRole.permissions.length - 10} more...
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Permission Groups */}
          {PERMISSION_GROUPS.map((group) => (
            <Card key={group.name} className="p-4">
                          <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {group.name}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    color="success"
                    onClick={() => handleSelectAllInGroup(group.permissions, true)}
                    disabled={isSaving}
                  >
                    <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                    Allow All
                  </Button>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => handleSelectAllInGroup(group.permissions, false)}
                    disabled={isSaving}
                  >
                    <Icon icon="solar:close-circle-line-duotone" className="mr-1" />
                    Deny All
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group.description}
              </p>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.permissions.map((permission) => {
                  const effectiveStatus = getEffectivePermissionStatus(permission);
                  
                  return (
                    <div key={permission} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {permission.split(':')[1]?.replace(/([A-Z])/g, ' $1').trim() || permission}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {permission}
                        </div>
                        <div className="flex items-center gap-2">
                          {effectiveStatus.roleHasPermission && (
                            <Badge color="info" size="xs">
                              From Role
                            </Badge>
                          )}
                          {effectiveStatus.source === 'user' && (
                            <Badge color="warning" size="xs">
                              User Specific
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge 
                            color={effectiveStatus.hasPermission ? 'success' : 'failure'} 
                            size="sm"
                          >
                            {effectiveStatus.hasPermission ? 'Allowed' : 'Denied'}
                          </Badge>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {effectiveStatus.source === 'role' ? 'From Role' : 
                             effectiveStatus.source === 'user' ? 'User Specific' : 'Not Set'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={effectiveStatus.hasPermission}
                            onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                            disabled={isSaving}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          {/* Summary */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Permissions */}
              {userRole && (
                <div>
                  <h4 className="text-md font-medium text-blue-600 dark:text-blue-400 mb-3">From Role</h4>
                  <div className="grid grid-cols-1 gap-2 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {userRole.permissions?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Role Permissions</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* User Overrides */}
              <div>
                <h4 className="text-md font-medium text-orange-600 dark:text-orange-400 mb-3">User Overrides</h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {userPermissions.allowed.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Allowed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {userPermissions.denied.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Denied</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Effective Permissions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Effective Permissions
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Role permissions + User overrides = Total effective permissions
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-between w-full">
          <Button color="gray" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
            )}
            Save Permissions
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default UserPermissionManager;
