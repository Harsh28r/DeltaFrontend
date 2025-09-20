"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL, subscribeToRefresh } from "@/lib/config";

interface Role {
  _id: string;
  name: string;
  level: number;
  permissions: string[];
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  companyName: string;
  currentRole: {
    _id: string;
    name: string;
    level: number;
  };
  projectAssignments: Array<{
    projectId: string;
    projectName: string;
  }>;
  projectSummary: {
    totalProjects: number;
    assignedProjects: number;
    unassignedProjects: number;
  };
  accountCreated: string;
  lastActivity: string;
  isAssignedToProject: boolean;
}

const RoleModulePage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [existingRoles, setExistingRoles] = useState<Array<{name: string, level: number}>>([]);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const roleName = decodeURIComponent(params.roleName as string);
  
  // Debug role name from URL
  console.log("🔗 URL Role Name Debug:", {
    raw: params.roleName,
    decoded: roleName,
    encoded: encodeURIComponent(roleName)
  });

  // Fetch users from backend
  useEffect(() => {
    if (token && roleName) {
      fetchRoleData();
      fetchExistingRoles();
    }
  }, [token, roleName]);

  // Listen for refresh events from other pages (like user edits)
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log("🔄 Refresh event received, updating role module data...");
      if (token && roleName) {
        setIsLoading(true);
        setRefreshMessage("Data refreshed from assign-project form!");
        fetchRoleUsers();
        // Clear refresh message after 3 seconds
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    });

    return unsubscribe;
  }, [token, roleName]);

  // Auto-refresh every 30 seconds to get real-time updates
  useEffect(() => {
    if (!token || !roleName) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing role users data...");
      fetchRoleUsers();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [token, roleName]);

  useEffect(() => {
    if (role) {
      fetchRoleUsers();
    }
  }, [role]);

  const fetchRoleData = async () => {
    try {
      if (!token) {
        console.error("No authentication token available");
        router.push("/auth/auth1/login");
        return;
      }

      // Get all roles to find the one with matching name
      const response = await fetch(API_ENDPOINTS.ROLES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed - token expired or invalid");
          // Clear token and redirect to login
          localStorage.removeItem("token");
          router.push("/auth/auth1/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const roles = data.roles || data;
      
      if (Array.isArray(roles)) {
        const foundRole = roles.find((r: Role) => r.name.toLowerCase() === roleName.toLowerCase());
        if (foundRole) {
          setRole(foundRole);
        } else {
          console.error("Role not found with name:", roleName);
          // Redirect to roles list if role doesn't exist
          router.push("/apps/roles");
        }
      } else {
        console.error("Invalid roles data format:", data);
        router.push("/apps/roles");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/auth/auth1/login");
      } else {
        router.push("/apps/roles");
      }
    }
  };

  const fetchRoleUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log("🔄 Fetching role users with real-time project data...");
      
      // Use the same endpoint as user list page for real-time data
      const apiUrl = `${API_BASE_URL}/api/superadmin/users/with-projects`;
      console.log("🌐 Making API call to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log("📡 API Response status:", response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("📊 Users with projects response:", data);
      console.log("📊 Response data type:", typeof data);
      console.log("📊 Response has users property:", !!data.users);
      console.log("📊 Response is array:", Array.isArray(data));
      
      // Process the response data (same logic as user list page)
      let allUsers: any[] = [];
      
      if (data.users && Array.isArray(data.users)) {
        allUsers = data.users;
        console.log("✅ Using data.users array, count:", allUsers.length);
      } else if (Array.isArray(data)) {
        allUsers = data;
        console.log("✅ Using data as array, count:", allUsers.length);
      } else {
        console.error("❌ Unexpected response format:", data);
        allUsers = [];
      }
      
      console.log("👥 Total users found:", allUsers.length);
      
      console.log("🎯 Looking for role:", roleName);
      console.log("🔍 Role name variations:", {
        original: roleName,
        lowercase: roleName.toLowerCase(),
        trimmed: roleName.trim(),
        decoded: decodeURIComponent(roleName)
      });
      
      // Filter users by the specific role
      const targetRoleLower = roleName.toLowerCase().trim();
      const allRolesFound = new Set<string>();
      
      // Collect all roles found for debugging
      allUsers.forEach((user: any) => {
        const userRole = user.currentRole?.name;
        if (userRole) {
          allRolesFound.add(userRole);
        }
      });
      
      console.log("📝 All roles found in users:", Array.from(allRolesFound));
      
      const roleUsers = allUsers.filter((user: any) => {
        const userRole = user.currentRole?.name || user.roleName || user.role;
        const userRoleLower = userRole ? userRole.toLowerCase().trim() : '';
        
        console.log(`👤 User: ${user.name}, Role: "${userRole}", Role Lower: "${userRoleLower}"`);
        
        return userRole && userRoleLower === targetRoleLower;
      });
      
      console.log(`✅ Found ${roleUsers.length} users with role "${roleName}":`, roleUsers);
      console.log("📋 Project assignments:", roleUsers.map((u: any) => ({
        name: u.name,
        projects: u.projectAssignments ? u.projectAssignments.map((p: any) => p.projectName) : []
      })));
      
      setUsers(roleUsers);
      setUserCount(roleUsers.length);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("❌ Error fetching role users:", error);
      setUsers([]);
      setUserCount(0);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchExistingRoles = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ROLES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const roles = data.roles || data;
        if (Array.isArray(roles)) {
          // Filter out restricted roles and current role
          const restrictedRoles = ['superadmin']; // Add more restricted roles here
          const availableRoles = roles.filter((r: Role) => 
            !restrictedRoles.includes(r.name.toLowerCase()) && 
            r.name.toLowerCase() !== roleName.toLowerCase() // Exclude current role
          );
          setExistingRoles(availableRoles.map((r: Role) => ({ name: r.name, level: r.level })));
        }
      } else {
        console.error("Failed to fetch existing roles:", data.message);
      }
    } catch (error) {
      console.error("Error fetching existing roles:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Role not found
          </h2>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getLevelBadge = (level: number) => {
    const levelColors = {
      1: "info",
      2: "warning", 
      3: "success",
      4: "purple",
      5: "gray", 
      6: "info",
      7: "yellow",
      8: "blue",
      9: "purple",
      10: "pink"
    } as const;
    
    return (
      <Badge color={levelColors[level as keyof typeof levelColors] || "gray"}>
        Level {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
             {/* Header */}
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
             {role.name.toUpperCase()} Users
           </h1>
           <p className="text-gray-600 dark:text-gray-400">
             Manage {role.name.toUpperCase()} users created by super admin
           </p>
         </div>
         <div className="flex gap-2">
           <Button 
             color="info" 
             size="sm" 
             onClick={() => {
               console.log("Header refresh triggered");
               fetchRoleUsers();
             }}
             disabled={isLoading}
           >
             <Icon icon="solar:refresh-line-duotone" className="mr-2" />
             {isLoading ? 'Refreshing...' : 'Refresh Data'}
           </Button>
           {lastUpdated && (
             <div className="text-xs text-gray-500 dark:text-gray-400">
               Last updated: {lastUpdated.toLocaleTimeString()}
             </div>
           )}
           <Link href={`/apps/role-modules/${roleName}/add`}>
             <Button color="primary" size="sm">
               <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
               Add New {role.name.toUpperCase()} User
             </Button>
           </Link>
         </div>
       </div>

      {/* Refresh Message */}
      {refreshMessage && (
        <Alert color="success" className="mb-4">
          <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
          {refreshMessage}
        </Alert>
      )}

      {/* Role Information */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Role Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Name:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {role.name.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Level:
                </span>
                <span className="ml-2">
                  {getLevelBadge(role.level)}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(role.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              User Statistics
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Users:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {userCount}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permissions:
                </span>
                <div className="mt-1">
                  {role.permissions && role.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission, index) => (
                        <Badge key={index} color="gray" size="sm">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">No permissions set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

             {/* Quick Actions */}
       <Card>
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
           Quick Actions
         </h3>
         <div className="grid grid-cols-1 gap-4">
           <Link href={`/apps/role-modules/${roleName}/add`}>
             <Card className="hover:shadow-lg transition-shadow cursor-pointer">
               <div className="text-center">
                 <Icon 
                   icon="solar:add-circle-line-duotone" 
                   className="text-3xl text-blue-600 mx-auto mb-2" 
                 />
                 <h4 className="font-medium text-gray-900 dark:text-white">
                   Add New {role.name.toUpperCase()} User
                 </h4>
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                   Create a new {role.name} user with super admin privileges
                 </p>
               </div>
             </Card>
           </Link>
         </div>
       </Card>

                    {/* Users Table */}
       <Card>
         <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
             {role.name.toUpperCase()} Users List
           </h3>
           <div className="flex items-center gap-2">
             <Button 
               color="info" 
               size="sm" 
               onClick={() => {
                 console.log("Manual refresh triggered");
                 fetchRoleUsers();
               }}
               disabled={isLoading}
             >
               <Icon icon="solar:refresh-line-duotone" className="mr-2" />
               {isLoading ? 'Refreshing...' : 'Refresh'}
             </Button>
             {lastUpdated && (
               <span className="text-xs text-gray-500 dark:text-gray-400">
                 Updated: {lastUpdated.toLocaleTimeString()}
               </span>
             )}
           </div>
         </div>
         
         {/* Search and Filters */}
         <div className="flex flex-col sm:flex-row gap-4 mb-4">
           <div className="flex-1">
             <input
               type="text"
               placeholder="Search users by name, email, mobile, or any project..."
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex gap-2">
             <select
               className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               value={filterProject}
               onChange={(e) => setFilterProject(e.target.value)}
             >
               <option value="all">All Projects</option>
               {(() => {
                 // Get projects from projectAssignments
                 const allProjects = users.flatMap(user => 
                   user.projectAssignments ? user.projectAssignments.map(p => p.projectName) : []
                 ).filter(Boolean);
                 
                 // Remove duplicates
                 const uniqueProjects = [...new Set(allProjects)];
                 
                 return uniqueProjects.map(project => (
                   <option key={project} value={project}>{project}</option>
                 ));
               })()}
             </select>
           </div>
         </div>

         {/* Bulk Role Change */}
         <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <input
                 type="checkbox"
                 className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                 onChange={(e) => {
                   const checkboxes = document.querySelectorAll('input[name^="user-"]') as NodeListOf<HTMLInputElement>;
                   checkboxes.forEach(checkbox => {
                     checkbox.checked = e.target.checked;
                   });
                 }}
               />
               <span className="text-sm text-gray-600 dark:text-gray-300">Select All</span>
             </div>
             <span className="text-sm text-gray-500 dark:text-gray-400">
               {(() => {
                 const checkedBoxes = document.querySelectorAll('input[name^="user-"]:checked') as NodeListOf<HTMLInputElement>;
                 return `${checkedBoxes.length} user(s) selected`;
               })()}
             </span>
             <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
               Current Role: {role.name.toUpperCase()}
             </span>
           </div>
           <div className="flex gap-2">
             <select
               className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               onChange={async (e) => {
                 const newRole = e.target.value;
                 if (!newRole) return;
                 
                 const checkedBoxes = document.querySelectorAll('input[name^="user-"]:checked') as NodeListOf<HTMLInputElement>;
                 if (checkedBoxes.length === 0) {
                   alert("Please select users first");
                   return;
                 }
                 
                 if (window.confirm(`Change role to ${newRole.toUpperCase()} for ${checkedBoxes.length} selected user(s)?`)) {
                   const selectedUserIds = Array.from(checkedBoxes).map(cb => cb.name.replace('user-', ''));
                   
                   try {
                     // Prepare bulk payload
                     const bulkPayload = {
                       projectId: "", // Will be set from first user or can be made configurable
                       userIds: selectedUserIds,
                       newRoleName: newRole
                     };
                     
                     // Get project ID from first selected user's project assignments
                     const firstUser = users.find(u => u._id === selectedUserIds[0]);
                     if (firstUser && firstUser.projectAssignments && firstUser.projectAssignments.length > 0) {
                       bulkPayload.projectId = firstUser.projectAssignments[0].projectId;
                     }
                     
                     // Make bulk API call
                     const response = await fetch(API_ENDPOINTS.BULK_ASSIGN_ROLE, {
                       method: "POST",
                       headers: {
                         "Content-Type": "application/json",
                         Authorization: `Bearer ${token}`,
                       },
                       body: JSON.stringify(bulkPayload),
                     });
                     
                     const data = await response.json();
                     
                     if (response.ok) {
                       // Update local state
                       setUsers(users.map(u => 
                         selectedUserIds.includes(u._id) ? { 
                           ...u, 
                           currentRole: { ...u.currentRole, name: newRole }
                         } : u
                       ));
                       
                       // Uncheck all checkboxes
                       checkedBoxes.forEach(cb => cb.checked = false);
                       
                       // Show success message
                       if (data.successCount !== undefined) {
                         alert(`Bulk role change completed!\nSuccess: ${data.successCount}\nFailed: ${data.failCount || 0}`);
                       } else {
                         alert(`Bulk role change completed for ${selectedUserIds.length} users!`);
                       }
                       
                       // Refresh the page to show updated data
                       fetchRoleUsers();
                     } else {
                       alert(`Failed to change roles: ${data.message || 'Unknown error'}`);
                     }
                   } catch (error) {
                     console.error("Error in bulk role change:", error);
                     alert("Bulk role change failed. Please try again.");
                   }
                 }
                 
                 // Reset dropdown
                 e.target.value = "";
               }}
             >
               <option value="">Change Role to...</option>
               {existingRoles.map(existingRole => (
                 <option key={existingRole.name} value={existingRole.name}>
                   {existingRole.name.toUpperCase()} (Level {existingRole.level})
                 </option>
               ))}
             </select>
           </div>
         </div>
         
         {users.length === 0 ? (
           <div className="text-center py-8">
             <div className="text-gray-500 dark:text-gray-400">
               <Icon icon="solar:users-group-rounded-line-duotone" className="text-4xl mx-auto mb-2" />
               <p>No {role.name} users found</p>
               <p className="text-sm">Create the first {role.name} user to get started</p>
               <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left max-w-md mx-auto">
                 <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Debug Info:</p>
                 <p className="text-xs text-blue-600 dark:text-blue-400">
                   Looking for role: "{role.name}"<br/>
                   Check console for available roles in projects
                 </p>
               </div>
             </div>
           </div>
                  ) : (
           <div className="overflow-x-auto">
             {(() => {
                               const filteredUsers = users.filter(user => {
                  // Search in projectAssignments for this user
                  const userProjectNames = user.projectAssignments ? 
                    user.projectAssignments.map(p => p.projectName).join(' ') : '';
                  
                  const matchesSearch = 
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.mobile.includes(searchTerm) ||
                    userProjectNames.toLowerCase().includes(searchTerm.toLowerCase());
                  
                  // Check project filter against user's project assignments
                  const allUserProjects = user.projectAssignments ? 
                    user.projectAssignments.map(p => p.projectName) : [];
                  
                  const matchesProject = filterProject === "all" || allUserProjects.includes(filterProject);
                  
                  return matchesSearch && matchesProject;
                });
               
               return (
                 <>
                   <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                     Showing {filteredUsers.length} of {users.length} users
                   </div>
                   <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                       <tr>
                         <th className="px-6 py-3 w-4">
                           <input
                             type="checkbox"
                             className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                             onChange={(e) => {
                               const checkboxes = document.querySelectorAll('input[name^="user-"]') as NodeListOf<HTMLInputElement>;
                               checkboxes.forEach(checkbox => {
                                 checkbox.checked = e.target.checked;
                               });
                             }}
                           />
                         </th>
                         <th className="px-6 py-3">Name</th>
                         <th className="px-6 py-3">Email</th>
                         <th className="px-6 py-3">Mobile</th>
                         <th className="px-6 py-3">Project</th>
                         <th className="px-6 py-3">Created</th>
                         <th className="px-6 py-3">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredUsers.map((user) => (
                         <tr key={user._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                           <td className="px-6 py-4 w-4">
                             <input
                               type="checkbox"
                               name={`user-${user._id}`}
                               className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                             />
                           </td>
                           <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                             {user.name}
                           </td>
                           <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                             {user.email}
                           </td>
                                                       <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                              {user.mobile}
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                             {(() => {
                               // Use projectAssignments from the with-projects API
                               if (user.projectAssignments && user.projectAssignments.length > 0) {
                                 return (
                                   <div className="flex flex-wrap gap-1">
                                     {user.projectAssignments.map((assignment, index) => (
                                       <Badge key={index} color="info" size="sm">
                                         {assignment.projectName}
                                       </Badge>
                                     ))}
                                   </div>
                                 );
                               }
                               
                               // Show not assigned if no projects
                               return (
                                 <span className="text-gray-400 text-sm">Not Assigned</span>
                               );
                             })()}
                           </td>
                           <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                             {new Date(user.accountCreated).toLocaleDateString()}
                           </td>
                           <td className="px-6 py-4">
                             <div className="flex gap-2">
                               <Link href={`/apps/users/view/${user._id}`}>
                                 <Button size="xs" color="info" title="View User">
                                   <Icon icon="solar:eye-line-duotone" />
                                 </Button>
                               </Link>
                               <Link href={`/apps/users/edit/${user._id}`}>
                                 <Button size="xs" color="warning" title="Edit User">
                                   <Icon icon="solar:pen-line-duotone" />
                                 </Button>
                               </Link>
                               <Link href={`/apps/users/permissions/${user._id}`}>
                                 <Button size="xs" color="success" title="Edit Permissions">
                                   <Icon icon="solar:settings-line-duotone" />
                                 </Button>
                               </Link>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </>
               );
             })()}
           </div>
         )}
       </Card>
    </div>
  );
};

export default RoleModulePage;
