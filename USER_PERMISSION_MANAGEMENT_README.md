# User Permission Management System

This document describes the user permission management interface that allows administrators to assign individual permissions to users.

## Overview

The system provides a comprehensive interface for managing user-specific permissions with:
- **User List Integration**: Edit Permissions button in the user list
- **Dedicated Permission Page**: Full-page interface for permission management
- **Checkbox Interface**: Easy-to-use checkboxes for permission assignment
- **Group Management**: Bulk allow/deny permissions by category
- **Real-time Updates**: Immediate permission updates via API

## Features

### 1. User List Integration
- **Location**: `/apps/users`
- **Button**: "Edit Permissions" button in the Actions column
- **Icon**: Settings icon (solar:settings-line-duotone)
- **Color**: Warning (orange) to distinguish from other actions

### 2. Permission Management Page
- **URL**: `/apps/users/permissions/[userId]`
- **Features**:
  - User information display
  - Permission groups with descriptions
  - Individual permission checkboxes
  - Group-level allow/deny all buttons
  - Permission summary statistics
  - Save/Cancel functionality

### 3. Permission Groups
The system organizes permissions into logical groups:

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

## User Interface

### Permission Management Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Back to Users | User Info | Save Permissions        │
├─────────────────────────────────────────────────────────────┤
│ User Information Card                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar] User Name (Role, Level)              User ID  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Lead Management Group                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Lead Management                    [Allow All][Deny All]│ │
│ │ Manage sales leads and prospects                       │ │
│ │                                                         │ │
│ │ ☑ Create Leads                    ☑ Update Leads       │ │
│ │ ☐ Read Leads                      ☐ Delete Leads       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [Additional Permission Groups...]                           │
├─────────────────────────────────────────────────────────────┤
│ Permission Summary                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Allowed: 5    Denied: 2    Not Set: 15                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Checkbox States
- **☑ Checked**: Permission is allowed
- **☐ Unchecked**: Permission is denied
- **Badge Colors**:
  - Green: Allowed
  - Red: Denied
  - Gray: Not Set

## Usage Instructions

### For Administrators

1. **Access User List**:
   - Navigate to `/apps/users`
   - Find the user you want to manage permissions for

2. **Open Permission Management**:
   - Click the "Edit Permissions" button (settings icon) in the Actions column
   - This opens the dedicated permission management page

3. **Manage Permissions**:
   - Review user information at the top
   - Scroll through permission groups
   - Use individual checkboxes to allow/deny specific permissions
   - Use "Allow All" or "Deny All" buttons for bulk operations

4. **Save Changes**:
   - Click "Save Permissions" to apply changes
   - Changes are immediately sent to the backend API
   - Success message confirms the update

### Permission Assignment Logic

1. **Checkbox Behavior**:
   - Checking a box = Allow permission
   - Unchecking a box = Deny permission
   - No checkbox interaction = Not Set (defaults to denied)

2. **Group Operations**:
   - "Allow All" sets all permissions in the group to allowed
   - "Deny All" sets all permissions in the group to denied

3. **API Integration**:
   - Changes are sent to `PUT /api/permissions/user/{userId}/permissions`
   - Request body: `{ "allowed": [...], "denied": [...] }`

## API Requirements

The backend must implement:

### Get User Permissions
```
GET /api/permissions/user/{userId}/permissions
Response: { "allowed": [...], "denied": [...] }
```

### Update User Permissions
```
PUT /api/permissions/user/{userId}/permissions
Body: { "allowed": [...], "denied": [...] }
Response: { "success": true }
```

## Navigation

### From User List
- Click "Edit Permissions" button → Opens permission management page

### From Permission Management Page
- Click "Back to Users" → Returns to user list
- Click "Save Permissions" → Saves and returns to user list

### From Permissions Demo Page
- Click "Manage User Permissions" → Goes to user list
- Click "Manage My Permissions" → Opens modal for current user

## Error Handling

- **User Not Found**: Shows error message with back button
- **API Errors**: Displays error message with retry option
- **Network Issues**: Shows loading states and error messages
- **Validation**: Prevents saving invalid permission combinations

## Security Considerations

1. **Authentication**: All API calls require valid authentication token
2. **Authorization**: Only users with appropriate permissions can manage user permissions
3. **Validation**: Backend validates permission strings and user IDs
4. **Audit Trail**: Consider logging permission changes for security auditing

## Future Enhancements

- **Bulk Permission Management**: Select multiple users and apply permissions
- **Permission Templates**: Predefined permission sets for common roles
- **Permission History**: Track changes to user permissions over time
- **Advanced Filtering**: Filter permissions by category or type
- **Export/Import**: Export permission configurations for backup

## Troubleshooting

### Common Issues

1. **Permissions Not Loading**:
   - Check API endpoint availability
   - Verify authentication token
   - Check browser console for errors

2. **Changes Not Saving**:
   - Verify API endpoint implementation
   - Check network connectivity
   - Review error messages in UI

3. **UI Not Updating**:
   - Refresh the page
   - Check for JavaScript errors
   - Verify component state management

### Debug Information

- User ID is displayed in the permission management page
- API endpoints are logged in browser console
- Error messages provide specific failure reasons
- Loading states indicate when operations are in progress


