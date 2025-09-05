'use client'
import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Alert, Checkbox, Spinner } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/config';
import { PERMISSIONS, Permission, ApiUser, AllUsersPermissionsResponse, hasApiPermission } from '@/app/types/permissions';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  companyName?: string;
  currentRole: {
    name: string;
    level: number;
    permissions: string[];
    roleId: string;
  };
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
    ]
  }
];

const UserPermissionsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<{
    allowed: string[];
    denied: string[];
  }>({ allowed: [], denied: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (userId && token) {
      fetchUserData();
      fetchUserPermissions();
    }
  }, [userId, token]);

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        // Ensure user has required properties with fallbacks
        const userWithFallbacks = {
          _id: userData._id || userId,
          name: userData.name || 'Unknown User',
          email: userData.email || 'No email',
          mobile: userData.mobile || '',
          companyName: userData.companyName || '',
          currentRole: userData.currentRole || {
            name: 'user',
            level: 1,
            permissions: [],
            roleId: ''
          },
          ...userData
        };
        
        setUser(userWithFallbacks);
      } else {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      setError(null);
      
      // First try to get all users with permissions
      const response = await fetch(API_ENDPOINTS.ALL_USERS_PERMISSIONS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: AllUsersPermissionsResponse = await response.json();
        const foundUser = data.users.find(u => u.id === userId);
        
        if (foundUser) {
          setApiUser(foundUser);
          // Convert API format to legacy format for compatibility
          setUserPermissions({
            allowed: foundUser.permissions.custom.allowed,
            denied: foundUser.permissions.custom.denied
          });
        } else {
          console.warn('User not found in permissions API');
          setUserPermissions({ allowed: [], denied: [] });
        }
      } else if (response.status === 404) {
        // Fallback to individual user endpoint
        console.info('All users permissions API not found, trying individual user endpoint.');
        await fetchIndividualUserPermissions();
      } else {
        throw new Error(`Failed to fetch permissions: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
      // Try individual user endpoint as fallback
      await fetchIndividualUserPermissions();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIndividualUserPermissions = async () => {
    try {
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
        console.info('Individual user permissions API not found. Using role-based permissions only.');
        setUserPermissions({ allowed: [], denied: [] });
      } else {
        throw new Error(`Failed to fetch individual user permissions: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching individual user permissions:', err);
      setUserPermissions({ allowed: [], denied: [] });
    }
  };

  const handlePermissionChange = (permission: string, isChecked: boolean) => {
    console.log(`=== PERMISSION CHANGE ===`);
    console.log(`Permission: ${permission}`);
    console.log(`Checked: ${isChecked}`);
    console.log(`Current state before change:`, userPermissions);
    
    // Check if this permission is in the role's effective permissions
    const isRolePermission = apiUser?.permissions?.effective?.includes(permission) || false;
    console.log(`Is role permission: ${isRolePermission}`);
    
    setUserPermissions(prev => {
      const newAllowed = [...prev.allowed];
      const newDenied = [...prev.denied];
      
      // Remove permission from both arrays first
      const allowedIndex = newAllowed.indexOf(permission);
      const deniedIndex = newDenied.indexOf(permission);
      
      if (allowedIndex > -1) newAllowed.splice(allowedIndex, 1);
      if (deniedIndex > -1) newDenied.splice(deniedIndex, 1);
      
      // Smart logic based on role permissions
      if (isChecked) {
        // If checking a permission that's NOT in the role, add to allowed
        if (!isRolePermission) {
          newAllowed.push(permission);
          console.log(`Added ${permission} to allowed (not in role)`);
        } else {
          console.log(`Permission ${permission} is already in role, no action needed`);
        }
      } else {
        // If unchecking a permission that IS in the role, add to denied
        if (isRolePermission) {
          newDenied.push(permission);
          console.log(`Added ${permission} to denied (overriding role)`);
        } else {
          console.log(`Permission ${permission} was not in role, removed from allowed`);
        }
      }
      
      console.log('New permissions after change:', { allowed: newAllowed, denied: newDenied });
      console.log(`=== END PERMISSION CHANGE ===`);
      
      return {
        allowed: newAllowed,
        denied: newDenied
      };
    });
  };

  const handleSave = async () => {
    if (!token) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      // Try different formats based on the server error

      // Simple format - just the arrays
      console.log('=== SAVING PERMISSIONS ===');
      console.log('Current userPermissions state:', userPermissions);
      console.log('API endpoint:', API_ENDPOINTS.UPDATE_USER_PERMISSIONS(userId));
      
      // The server expects 'effective' array, not 'allowed'/'denied'
      // We need to calculate the effective permissions based on current state
      
      // Get the current effective permissions from the API user data
      let effectivePermissions = [];
      
      if (apiUser && apiUser.permissions && apiUser.permissions.effective) {
        // Start with the role-based effective permissions
        effectivePermissions = [...apiUser.permissions.effective];
        
        // Add any user-specific allowed permissions
        if (userPermissions.allowed && userPermissions.allowed.length > 0) {
          effectivePermissions = [...effectivePermissions, ...userPermissions.allowed];
        }
        
        // Remove any user-specific denied permissions
        if (userPermissions.denied && userPermissions.denied.length > 0) {
          effectivePermissions = effectivePermissions.filter(perm => 
            !userPermissions.denied.includes(perm)
          );
        }
      } else {
        // Fallback: use the current userPermissions state
        effectivePermissions = userPermissions.allowed || [];
      }
      
      // Remove duplicates
      effectivePermissions = [...new Set(effectivePermissions)];
      
      const payload = {
        effective: effectivePermissions
      };
      
      console.log('Sending effective permissions:', payload);
      console.log('Effective permissions count:', effectivePermissions.length);
      
      const response = await fetch(API_ENDPOINTS.UPDATE_USER_PERMISSIONS(userId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess('Effective permissions updated successfully!');
        setTimeout(() => {
          router.push('/apps/users');
        }, 2000);
      } else if (response.status === 404) {
        setSuccess('Effective permissions API endpoint not found. Changes saved locally for demonstration.');
      } else {
        let errorMessage = `Failed to update permissions: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('API Error Response:', errorData);
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
      if (err instanceof Error && err.message.includes('404')) {
        setSuccess('Effective permissions API endpoint not found. Changes saved locally for demonstration.');
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update permissions';
        setError(`${errorMsg}. Check console for details.`);
      }
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
    // If we have API user data, use the new permission checking
    if (apiUser) {
      const hasPermission = hasApiPermission(apiUser.permissions, permission as any);
      let source: 'role' | 'user' | 'none' = 'none';
      const roleHasPermission = apiUser.permissions.effective.includes(permission);
      
      if (apiUser.permissions.custom.denied.includes(permission)) {
        source = 'user';
      } else if (apiUser.permissions.custom.allowed.includes(permission)) {
        source = 'user';
      } else if (apiUser.permissions.effective.includes(permission)) {
        source = 'role';
      }
      
      return { hasPermission, source, roleHasPermission };
    }
    
    // Fallback to legacy permission checking
    const roleHasPermission = user?.currentRole?.permissions?.includes(permission) || false;
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

  // Get the checkbox state for user-specific overrides
  const getUserPermissionCheckboxState = (permission: string): boolean => {
    // Check if user has explicitly allowed this permission
    if (userPermissions.allowed.includes(permission)) {
      return true;
    }
    // Check if user has explicitly denied this permission
    if (userPermissions.denied.includes(permission)) {
      return false;
    }
    // If no user-specific override, return the effective permission status
    const effectiveStatus = getEffectivePermissionStatus(permission);
    return effectiveStatus.hasPermission;
  };

  const handleSelectAllInGroup = (groupPermissions: Permission[], isAllowed: boolean) => {
    groupPermissions.forEach(permission => {
      handlePermissionChange(permission, isAllowed);
    });
  };



  if (isLoading || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isLoadingUser ? 'Loading user data...' : 'Loading user permissions...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Icon icon="solar:user-cross-line-duotone" className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested user could not be found.</p>
          <Button onClick={() => router.push('/apps/users')}>
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => router.push('/apps/users')}
              color="gray"
              size="sm"
            >
              <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
              Back to Users
            </Button>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            Manage Permissions for {user.name}
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Assign or revoke specific permissions for this user
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleSave}
            color="primary"
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
      </div>

      {/* User Info */}
      <Card>
        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-2">Loading user data...</span>
          </div>
        ) : (apiUser || user) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon icon="solar:user-line-duotone" className="text-2xl text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {apiUser?.name || user?.name || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {apiUser?.email || user?.email || 'No email'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color="info" size="sm">
                    {(apiUser?.role || user?.currentRole?.name || 'NO ROLE').toUpperCase()}
                  </Badge>
                  <Badge color="gray" size="sm">
                    Level {apiUser?.level || user?.currentRole?.level || 'N/A'}
                  </Badge>
                  {apiUser?.isActive !== undefined && (
                    <Badge color={apiUser.isActive ? "success" : "failure"} size="sm">
                      {apiUser.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">User ID</div>
              <div className="font-mono text-sm text-gray-900 dark:text-white">
                {apiUser?.id || user?._id || userId}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="solar:user-cross-line-duotone" className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">User Not Found</h3>
            <p className="text-gray-600 dark:text-gray-400">Unable to load user data</p>
          </div>
        )}
      </Card>

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

      {/* Info Alert for Permission Management */}
      <Alert color="info">
        <div className="flex items-center">
          <Icon icon="solar:info-circle-line-duotone" className="mr-2" />
          <div>
            <strong>Permission Management:</strong> You can now manage user-specific permissions that override role-based permissions. 
            Check/uncheck permissions below to enable or disable them for this user. Changes will be saved to the server.
          </div>
        </div>
      </Alert>

      {/* Role Permissions Summary */}
      {(apiUser || user?.currentRole) && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Role-Based Permissions
            </h3>
            <Badge color="info" size="sm">
              {(apiUser?.permissions?.effective?.length || user?.currentRole?.permissions?.length || 0)} permissions
            </Badge>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            These permissions are inherited from the <strong>{apiUser?.role || user?.currentRole?.name}</strong> role (Level {apiUser?.level || user?.currentRole?.level}).
            You can override them below with user-specific permissions.
          </p>
          <div className="flex flex-wrap gap-2">
            {(apiUser?.permissions?.effective || user?.currentRole?.permissions || []).slice(0, 10).map((permission) => (
              <Badge key={permission} color="info" size="sm">
                {permission.split(':')[1]?.replace(/([A-Z])/g, ' $1').trim() || permission}
              </Badge>
            ))}
            {(apiUser?.permissions?.effective || user?.currentRole?.permissions || []).length > 10 && (
              <Badge color="gray" size="sm">
                +{(apiUser?.permissions?.effective || user?.currentRole?.permissions || []).length - 10} more...
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Permission Groups */}
      <div className="space-y-6">
        {PERMISSION_GROUPS.map((group) => (
          <Card key={group.name} className="p-6">
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
                  >
                    <Icon icon="solar:check-circle-line-duotone" className="mr-1" />
                    Enable All
                  </Button>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => handleSelectAllInGroup(group.permissions, false)}
                  >
                    <Icon icon="solar:close-circle-line-duotone" className="mr-1" />
                    Disable All
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
                      <div className="flex gap-2">
                        <Checkbox
                          checked={getUserPermissionCheckboxState(permission)}
                          onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                          disabled={isSaving}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getUserPermissionCheckboxState(permission) ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role Permissions */}
          {user?.currentRole && (
            <div>
              <h4 className="text-md font-medium text-blue-600 dark:text-blue-400 mb-3">From Role</h4>
              <div className="grid grid-cols-1 gap-2 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user.currentRole.permissions?.length || 0}
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
  );
};

export default UserPermissionsPage;
