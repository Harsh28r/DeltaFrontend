# Dynamic Role-Based User Management Module

This module provides comprehensive user management functionality for the DeltaFrontend application with a **dynamic role-based system**. When you create a role (like "tl", "hr", "developer"), it automatically becomes a module in the SuperAdmin section where you can manage all users with that specific role.

## 🎯 **Key Features**

- **Dynamic Role Modules**: Each role automatically becomes a module in the sidebar
- **Role-Specific User Management**: View, add, and manage users for each role separately
- **Automatic Role Assignment**: Users are automatically assigned to their respective role modules
- **Real-time Updates**: Sidebar automatically refreshes when new roles are created
- **Integrated API**: Works with `http://localhost:5000/api/superadmin/create-user`

## 🏗️ **How It Works**

### 1. **Create a Role** (e.g., "tl")
- Go to **Apps** → **Roles** → **Add Role**
- Create role with name "tl", level, and permissions

### 2. **Role Automatically Appears in Sidebar**
- **Apps** → **SuperAdmin** → **tl** (automatically created)
- **tl** module now has:
  - **All TL Users** - View all users with "tl" role
  - **Add TL User** - Create new users with "tl" role

### 3. **Manage Role-Specific Users**
- Each role module shows only users with that role
- Add users directly to specific roles
- View and manage role-specific user lists

## 📁 **File Structure**

```
src/app/(DashboardLayout)/apps/
├── roles/                           # Role management
│   ├── page.tsx                    # List all roles
│   ├── add/page.tsx                # Create new role
│   └── edit/[id]/page.tsx          # Edit existing role
├── role-modules/                    # Dynamic role modules
│   └── [roleId]/                   # Dynamic role ID
│       ├── page.tsx                # Role module dashboard
│       ├── users/page.tsx          # Users for this role
│       └── add/page.tsx            # Add user to this role
└── users/                          # General user management
    ├── page.tsx                    # All users
    ├── add/page.tsx                # Add any user
    ├── edit/[id]/page.tsx          # Edit user
    └── view/[id]/page.tsx          # View user

src/app/(DashboardLayout)/layout/vertical/sidebar/
└── Sidebaritems.ts                 # Dynamic sidebar generation

src/hooks/
└── useUsers.ts                     # User management hooks

src/lib/
└── config.ts                       # API endpoints
```

## 🧭 **Navigation Structure**

```
Apps
├── SuperAdmin
│   ├── tl                          # TL Role Module (auto-created)
│   │   ├── All TL Users           # View all TL users
│   │   └── Add TL User            # Add new TL user
│   ├── hr                          # HR Role Module (auto-created)
│   │   ├── All HR Users           # View all HR users
│   │   └── Add HR User            # Add new HR user
│   └── [other roles...]           # Other roles automatically appear
├── Roles                           # Manage roles
│   ├── List Roles                 # View all roles
│   └── Add Role                   # Create new role
└── Users                          # General user management
    ├── List Users                 # View all users
    └── Add User                   # Add any user
```

## 🚀 **Usage Examples**

### **Example 1: Create "TL" Role and Manage TL Users**

1. **Create Role**:
   - Go to **Apps** → **Roles** → **Add Role**
   - Name: "tl", Level: 2, Permissions: ["manage_team", "view_reports"]

2. **Role Automatically Appears**:
   - **Apps** → **SuperAdmin** → **tl** now exists
   - Click **tl** to see TL module dashboard

3. **Add TL Users**:
   - Click **Add TL User** in TL module
   - Form automatically pre-selects "tl" role
   - Create users like "Jane2" with "tl" role

4. **View TL Users**:
   - Click **All TL Users** to see all users with "tl" role
   - Search, filter, and manage TL users

### **Example 2: Create "HR" Role and Manage HR Users**

1. **Create Role**:
   - Go to **Apps** → **Roles** → **Add Role**
   - Name: "hr", Level: 3, Permissions: ["manage_users", "view_salary"]

2. **HR Module Automatically Created**:
   - **Apps** → **SuperAdmin** → **hr** now exists
   - Manage all HR users in one place

3. **Add HR Users**:
   - Use **Add HR User** to create HR staff
   - All users automatically assigned "hr" role

## 🔧 **API Integration**

### **Creating a User for Specific Role**

```typescript
const userData = {
  name: "Jane2",
  email: "jane2@example.com",
  password: "Pass@123",
  mobile: "9877577657",
  companyName: "",
  roleName: "tl"  // Automatically set when adding from TL module
};

const response = await fetch('http://localhost:5000/api/superadmin/create-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(userData)
});
```

### **API Endpoints Used**

- `GET /api/superadmin/roles` - Fetch all roles
- `POST /api/superadmin/create-user` - Create user with role
- `GET /api/superadmin/users` - Fetch all users
- `GET /api/superadmin/roles/:id` - Get specific role
- `PUT /api/superadmin/users/:id` - Update user
- `DELETE /api/superadmin/users/:id` - Delete user

## ✨ **Dynamic Features**

### **Automatic Sidebar Generation**
- New roles automatically appear in SuperAdmin section
- Each role gets its own module with users and add user options
- Sidebar refreshes automatically when roles are added/removed

### **Role-Specific User Management**
- View only users with specific role
- Add users directly to specific roles
- Role is pre-selected and locked in add forms
- Role-specific search and filtering

### **Smart Navigation**
- Breadcrumbs show role context
- Back buttons navigate within role module
- Quick actions for each role

## 🎨 **User Interface Features**

### **Role Module Dashboard**
- Role information and statistics
- User count for that role
- Quick action cards
- Recent users preview

### **Role-Specific User Lists**
- Filtered by role automatically
- Search within role users
- Company filtering
- Role-specific actions

### **Smart Forms**
- Role pre-selected and locked
- Role-specific validation
- Clear role context
- Automatic role assignment

## 🔄 **Real-time Updates**

### **Sidebar Refresh System**
- When new roles are created, sidebar automatically updates
- New role modules appear immediately
- No manual refresh needed

### **User Count Updates**
- Real-time user counts for each role
- Automatic updates when users are added/removed
- Live statistics in role dashboards

## 🛡️ **Security & Validation**

- **Authentication Required**: All operations require valid JWT token
- **Role Validation**: Users can only be assigned to existing roles
- **Input Sanitization**: Comprehensive form validation
- **Permission Control**: Role-based access control

## 🚀 **Getting Started**

### **1. Create Your First Role**
1. Go to **Apps** → **Roles** → **Add Role**
2. Create a role (e.g., "tl", "hr", "developer")
3. Set level and permissions

### **2. Access Role Module**
1. Go to **Apps** → **SuperAdmin**
2. Your new role now appears as a module
3. Click on it to access role dashboard

### **3. Add Users to Role**
1. In role module, click **Add [Role] User**
2. Fill form (role is pre-selected)
3. User automatically gets assigned to that role

### **4. Manage Role Users**
1. Click **All [Role] Users** to see role users
2. Search, filter, edit, and delete users
3. All operations are role-specific

## 🔮 **Future Enhancements**

- **Bulk Role Assignment**: Assign multiple users to roles at once
- **Role Hierarchies**: Parent-child role relationships
- **Advanced Permissions**: Granular permission management
- **Role Templates**: Pre-defined role configurations
- **User Role History**: Track role changes over time
- **Role Analytics**: Usage statistics and insights

## 🐛 **Troubleshooting**

### **Role Not Appearing in Sidebar**
- Check if role was created successfully
- Verify role has a valid name and level
- Refresh the page or wait for automatic update

### **Users Not Showing in Role Module**
- Verify user has correct roleName
- Check if role name matches exactly
- Ensure user was created successfully

### **API Errors**
- Verify backend server is running on `localhost:5000`
- Check JWT token validity
- Ensure proper API endpoint configuration

## 📞 **Support**

For issues with the Dynamic Role-Based User Management:
1. Check browser console for errors
2. Verify role creation was successful
3. Ensure API endpoints are accessible
4. Check authentication token status

---

**This system automatically creates a module for every role you create, making user management intuitive and role-specific!** 🎉
