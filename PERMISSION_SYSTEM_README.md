# User-Based Permission System

This document describes the implementation of a comprehensive user-based permission system that works alongside role-based permissions.

## Overview

The permission system allows for:
- **Role-based permissions**: Default permissions assigned to user roles
- **User-specific permissions**: Individual permissions that can override or supplement role permissions
- **Granular control**: Fine-grained permissions for different operations
- **Real-time updates**: Permissions are fetched and updated in real-time

## API Endpoints

The system expects the following backend API endpoints:

### Get User Permissions
```
GET /api/permissions/user/{userId}/permissions
```

**Response:**
```json
{
  "allowed": ["leads:create", "leads:update", "notifications:read"],
  "denied": ["leads:delete", "users:manage"]
}
```

### Update User Permissions
```
PUT /api/permissions/user/{userId}/permissions
```

**Request Body:**
```json
{
  "allowed": ["leads:create", "leads:update", "notifications:read"],
  "denied": ["leads:delete", "users:manage"]
}
```

## Permission Structure

### Available Permissions

The system defines permissions in the format `resource:action`:

#### Lead Management
- `leads:create` - Create new leads
- `leads:read` - View leads
- `leads:update` - Edit existing leads
- `leads:delete` - Delete leads

#### User Management
- `users:manage` - Full user management access
- `users:read` - View user information
- `users:create` - Create new users
- `users:update` - Update user information
- `users:delete` - Delete users

#### Project Management
- `projects:read` - View projects
- `projects:create` - Create new projects
- `projects:update` - Update projects
- `projects:delete` - Delete projects

#### Notifications
- `notifications:read` - View notifications
- `notifications:create` - Create notifications
- `notifications:update` - Update notifications
- `notifications:delete` - Delete notifications

#### Roles
- `roles:read` - View roles
- `roles:create` - Create roles
- `roles:update` - Update roles
- `roles:delete` - Delete roles

#### Lead Sources
- `lead-sources:read` - View lead sources
- `lead-sources:create` - Create lead sources
- `lead-sources:update` - Update lead sources
- `lead-sources:delete` - Delete lead sources

#### Lead Statuses
- `lead-statuses:read` - View lead statuses
- `lead-statuses:create` - Create lead statuses
- `lead-statuses:update` - Update lead statuses
- `lead-statuses:delete` - Delete lead statuses

## Usage

### 1. Using Permission Hooks

```tsx
import { useLeadPermissions, useHasPermission } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/app/types/permissions';

function MyComponent() {
  const { canCreateLeads, canReadLeads, canUpdateLeads, canDeleteLeads } = useLeadPermissions();
  const { hasPermission } = useHasPermission(PERMISSIONS.LEADS_CREATE);

  return (
    <div>
      {canCreateLeads && <button>Create Lead</button>}
      {canReadLeads && <div>Lead List</div>}
      {canUpdateLeads && <button>Edit Lead</button>}
      {canDeleteLeads && <button>Delete Lead</button>}
    </div>
  );
}
```

### 2. Using Permission Guards

```tsx
import PermissionGuard, { LeadCreateGuard, LeadReadGuard } from '@/app/components/permissions/PermissionGuard';
import { PERMISSIONS } from '@/app/types/permissions';

function MyComponent() {
  return (
    <div>
      {/* Single permission check */}
      <PermissionGuard permission={PERMISSIONS.LEADS_CREATE}>
        <button>Create Lead</button>
      </PermissionGuard>

      {/* Multiple permissions (all required) */}
      <PermissionGuard 
        permissions={[PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_UPDATE]} 
        requireAll={true}
      >
        <button>Edit Lead</button>
      </PermissionGuard>

      {/* Multiple permissions (any required) */}
      <PermissionGuard 
        permissions={[PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_CREATE]} 
        requireAll={false}
      >
        <button>View or Create Lead</button>
      </PermissionGuard>

      {/* Convenience components */}
      <LeadCreateGuard>
        <button>Create Lead</button>
      </LeadCreateGuard>

      <LeadReadGuard fallback={<div>No access to view leads</div>}>
        <div>Lead List</div>
      </LeadReadGuard>
    </div>
  );
}
```

### 3. Using Permission Context Directly

```tsx
import { usePermissions } from '@/app/context/PermissionContext';
import { PERMISSIONS } from '@/app/types/permissions';

function MyComponent() {
  const { hasPermission, hasAllPermissions, hasAnyPermission, userPermissions } = usePermissions();

  return (
    <div>
      {hasPermission(PERMISSIONS.LEADS_CREATE) && <button>Create Lead</button>}
      {hasAllPermissions([PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_UPDATE]) && <button>Edit Lead</button>}
      {hasAnyPermission([PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_CREATE]) && <button>View or Create Lead</button>}
    </div>
  );
}
```

## Components

### PermissionStatus
Displays current user's permission status with a summary.

```tsx
import PermissionStatus from '@/app/components/permissions/PermissionStatus';

<PermissionStatus 
  onManagePermissions={() => setShowManager(true)}
  showManageButton={true}
/>
```

### UserPermissionManager
Modal component for managing user permissions.

```tsx
import UserPermissionManager from '@/app/components/permissions/UserPermissionManager';

<UserPermissionManager
  userId="user123"
  userName="John Doe"
  onClose={() => setShowManager(false)}
  onUpdate={() => refreshPermissions()}
/>
```

## Implementation Details

### Permission Resolution Logic

1. **Denied permissions take precedence**: If a permission is in the `denied` array, the user cannot perform that action regardless of role permissions.

2. **Allowed permissions override defaults**: If a permission is in the `allowed` array, the user can perform that action.

3. **Default behavior**: If a permission is neither allowed nor denied, the system defaults to denying access.

### Error Handling

- Network errors are handled gracefully with fallback to default permissions
- 404 errors (user permissions not found) result in empty permission sets
- Loading states are shown while permissions are being fetched

### Performance Considerations

- Permissions are cached in context and only refetched when needed
- Permission checks are optimized with early returns
- Context updates are batched to prevent unnecessary re-renders

## Backend Requirements

The backend should implement:

1. **User Permission Storage**: Store user-specific permissions in the database
2. **Permission Resolution**: Combine role-based and user-specific permissions
3. **API Endpoints**: Provide the required GET and PUT endpoints
4. **Authentication**: Ensure only authorized users can view/modify permissions
5. **Validation**: Validate permission strings and user IDs

## Example Backend Implementation

```javascript
// Express.js example
app.get('/api/permissions/user/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userPermissions = await getUserPermissions(userId);
    
    res.json({
      allowed: userPermissions.allowed || [],
      denied: userPermissions.denied || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

app.put('/api/permissions/user/:userId/permissions', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { allowed, denied } = req.body;
    
    await updateUserPermissions(userId, { allowed, denied });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});
```

## Testing

The system includes a dedicated permissions page at `/apps/permissions` that allows you to:
- View current user permissions
- Test permission checks
- Manage permissions (if you have the appropriate access)
- View raw API responses
- Test different permission scenarios

## Security Considerations

1. **Server-side validation**: Always validate permissions on the backend
2. **Permission inheritance**: Consider how user permissions interact with role permissions
3. **Audit logging**: Log permission changes for security auditing
4. **Rate limiting**: Implement rate limiting on permission update endpoints
5. **Input validation**: Validate permission strings to prevent injection attacks

