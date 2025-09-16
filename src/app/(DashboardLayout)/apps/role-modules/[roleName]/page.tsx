"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, subscribeToRefresh } from "@/lib/config";

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
  roleName: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  projects?: Array<{
    projectId: string;
    projectName: string;
  }>;
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
  const [projectAssignments, setProjectAssignments] = useState<{[key: string]: {projectId: string, projectName: string}}>({});
  const [existingRoles, setExistingRoles] = useState<Array<{name: string, level: number}>>([]);

  const roleName = decodeURIComponent(params.roleName as string);

  // Fetch users from backend
  useEffect(() => {
    if (token && roleName) {
      fetchRoleData();
      fetchProjectAssignments();
      fetchExistingRoles();
    }
  }, [token, roleName]);

  // Listen for refresh events from other pages (like user edits)
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log("Refresh event received, updating role module data...");
      if (token && roleName) {
        fetchProjectAssignments();
        fetchRoleUsers();
      }
    });

    return unsubscribe;
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
        router.push("/auth/auth1/signin");
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
          router.push("/auth/auth1/signin");
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
        router.push("/auth/auth1/signin");
      } else {
        router.push("/apps/roles");
      }
    }
  };

  const fetchRoleUsers = async () => {
    try {
      setIsLoading(true);
      
      // TEMPORARY: Using projects endpoint until backend implements /api/superadmin/users/role/{roleName}
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const projects = data.projects || data;
      
      // Extract users with the specific role from all projects and group by email
      const userMap: {[email: string]: any} = {};
      
      projects.forEach((project: any) => {
        if (project.members && Array.isArray(project.members)) {
          project.members.forEach((member: any) => {
            if (member._id && 
                (member.roleName === roleName || member.role === roleName)) {
              const email = member.email || 'No email';
              
              if (userMap[email]) {
                // User already exists, add project to their list
                userMap[email].projects.push({
                  projectId: project._id,
                  projectName: project.name
                });
              } else {
                // New user, create entry
                userMap[email] = {
                  _id: member._id,
                  name: member.name || member.email || 'Unknown User',
                  email: email,
                  mobile: member.mobile || 'No mobile',
                  companyName: member.companyName || 'No company',
                  roleName: member.roleName || member.role || roleName,
                  createdAt: member.createdAt || member.joinedAt || new Date().toISOString(),
                  projects: [{
                    projectId: project._id,
                    projectName: project.name
                  }]
                };
              }
            }
          });
        }
      });
      
      // Convert map to array
      const roleUsers = Object.values(userMap);
      
      console.log(`Users with role ${roleName} (grouped by email):`, roleUsers);
      setUsers(roleUsers);
      setUserCount(roleUsers.length);
      
    } catch (error) {
      console.error("Error fetching role users:", error);
      setUsers([]);
      setUserCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectAssignments = async () => {
    try {
      if (!token) {
        console.error("No authentication token available");
        return;
      }

      // Fetch all projects to get project names and members
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!projectsResponse.ok) {
        if (projectsResponse.status === 401) {
          console.error("Authentication failed - token expired or invalid");
          localStorage.removeItem("token");
          router.push("/auth/auth1/signin");
          return;
        }
        console.error("Failed to fetch projects:", projectsResponse.status, projectsResponse.statusText);
        return;
      }
      
      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || projectsData;
      
      // Create a map of project IDs to project names
      const projectMap: {[key: string]: string} = {};
      projects.forEach((project: any) => {
        projectMap[project._id] = project.name;
      });
      
      // Extract member assignments from each project
      const assignmentMap: {[key: string]: {projectId: string, projectName: string}} = {};
      
      projects.forEach((project: any) => {
        if (project.members && Array.isArray(project.members)) {
          project.members.forEach((member: any) => {
            if (member._id) {
              assignmentMap[member._id] = {
                projectId: project._id,
                projectName: project.name
              };
            }
          });
        }
      });
      
      console.log("Project assignments extracted:", assignmentMap);
      setProjectAssignments(assignmentMap);
    } catch (error) {
      console.error("Error fetching project assignments:", error);
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/auth/auth1/signin");
      }
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
      5: "gray"
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
           <Link href={`/apps/role-modules/${roleName}/add`}>
             <Button color="primary" size="sm">
               <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
               Add New {role.name.toUpperCase()} User
             </Button>
           </Link>
         </div>
       </div>

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
         </div>
         
         {/* Search and Filters */}
         <div className="flex flex-col sm:flex-row gap-4 mb-4">
           <div className="flex-1">
             <input
               type="text"
               placeholder="Search users by name, email, mobile, or project..."
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
                 // Get projects from both user data and fetched assignments
                 const userProjects = users.map(user => user.projectName).filter(Boolean);
                 const assignmentProjects = Object.values(projectAssignments).map(assignment => assignment.projectName).filter(Boolean);
                 const allProjects = [...new Set([...userProjects, ...assignmentProjects])];
                 
                 return allProjects.map(project => (
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
                     
                     // Get project ID from first selected user
                     const firstUser = users.find(u => u._id === selectedUserIds[0]);
                     if (firstUser) {
                       bulkPayload.projectId = firstUser.projectId || projectAssignments[firstUser._id]?.projectId || "";
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
                         selectedUserIds.includes(u._id) ? { ...u, roleName: newRole } : u
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
             </div>
           </div>
                  ) : (
           <div className="overflow-x-auto">
             {(() => {
                               const filteredUsers = users.filter(user => {
                  const matchesSearch = 
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.mobile.includes(searchTerm) ||
                    (user.projectName && user.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (projectAssignments[user._id]?.projectName && projectAssignments[user._id].projectName.toLowerCase().includes(searchTerm.toLowerCase()));
                  
                  // Check project filter against both user data and fetched assignments
                  const userProjectName = user.projectName || projectAssignments[user._id]?.projectName;
                  const matchesProject = filterProject === "all" || userProjectName === filterProject;
                  
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
                               // First try to get project info from user data
                               if (user.projectName) {
                                 return (
                                   <Badge color="info" size="sm">
                                     {user.projectName}
                                   </Badge>
                                 );
                               }
                               
                               // Then try to get from fetched project assignments
                               const assignment = projectAssignments[user._id];
                               if (assignment && assignment.projectName) {
                                 return (
                                   <Badge color="info" size="sm">
                                     {assignment.projectName}
                                   </Badge>
                                 );
                               }
                               
                               // Finally, show not assigned
                               return (
                                 <span className="text-gray-400 text-sm">Not Assigned</span>
                               );
                             })()}
                           </td>
                           <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                             {new Date(user.createdAt).toLocaleDateString()}
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
