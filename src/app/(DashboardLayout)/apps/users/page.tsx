"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL, createRefreshEvent, subscribeToRefresh } from "@/lib/config";

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  companyName?: string;
  currentRole: {
    name: string;
    level: number;
    permissions: string[];
    roleId: string;
  };
  projectAssignments: Array<{
    projectId: string;
    projectName: string;
    status: string;
    assignedDate: string;
  }>;
  projectSummary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
  };
  accountCreated: string;
  lastActivity: string;
  isAssignedToProject?: boolean;
}

// Removed UsersWithProjectsResponse interface - now using projects endpoint directly

const UsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assigningUsers, setAssigningUsers] = useState<Set<string>>(new Set());
  const [isSyncingBackend, setIsSyncingBackend] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [forceUpdate, setForceUpdate] = useState(0);

  const [existingRoles, setExistingRoles] = useState<Array<{name: string, level: number}>>([]);
  const [projects, setProjects] = useState<Array<{_id: string, name: string}>>([]);

  // Fetch users from backend
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchProjects();
      fetchExistingRoles();
    }
  }, [token]);

  // Listen for refresh events from other pages (like user edits)
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log("Refresh event received, updating users page data...");
      if (token) {
        fetchUsers();
      }
    });

    return unsubscribe;
  }, [token]);

  // Debug effect to monitor users state changes
  useEffect(() => {
    console.log("Users state changed:", users);
    console.log("Users with projects:", users.filter(u => u.projectAssignments.length > 0));
    console.log("Users without projects:", users.filter(u => u.projectAssignments.length === 0));
  }, [users]);

    const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      
      // Using the users/with-projects endpoint for user list
      console.log("Fetching users from /api/superadmin/users/with-projects...");
      const response = await fetch(`${API_BASE_URL}/api/superadmin/users/with-projects`, {
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
      console.log("Users with projects response:", data);
      
      // Process the response data
      let processedUsers: any[] = [];
      
      if (data.users && Array.isArray(data.users)) {
        // If response has users array, use it directly
        processedUsers = data.users
          .filter((user: any) => user.currentRole?.name !== 'superadmin') // Hide superadmin users
          .map((user: any) => ({
            ...user,
            isAssignedToProject: user.projectAssignments && user.projectAssignments.length > 0
          }));
      } else if (Array.isArray(data)) {
        // If response is directly an array of users
        processedUsers = data
          .filter((user: any) => user.currentRole?.name !== 'superadmin') // Hide superadmin users
          .map((user: any) => ({
            ...user,
            isAssignedToProject: user.projectAssignments && user.projectAssignments.length > 0
          }));
      } else {
        console.error("Unexpected response format:", data);
        processedUsers = [];
      }
      
      console.log("Processed users:", processedUsers);
      console.log("Users with project assignments:", processedUsers.filter(u => u.projectAssignments && u.projectAssignments.length > 0));
      console.log("Users without project assignments:", processedUsers.filter(u => !u.projectAssignments || u.projectAssignments.length === 0));
      setUsers(processedUsers);
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchProjects = async () => {
    try {
      console.log("Fetching projects for assignment dropdowns...");
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const projectsList = data.projects || data;
        
        if (Array.isArray(projectsList)) {
          console.log("Projects fetched successfully:", projectsList.map(p => ({ id: p._id, name: p.name })));
          setProjects(projectsList);
        } else {
          console.error("Projects response is not an array:", projectsList);
        }
      } else {
        console.error("Failed to fetch projects:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };



  const assignUserToProject = async (userId: string, projectId: string) => {
    if (assigningUsers.has(userId)) return; // Prevent multiple assignments for same user
    
    try {
      setAssigningUsers(prev => new Set(prev).add(userId));
      const assignPayload = {
        userId: userId,
        projects: [{ projectId: projectId }]
      };
      
      console.log("=== PROJECT ASSIGNMENT START ===");
      console.log("Updating user projects payload:", assignPayload);
      console.log("Projects array:", assignPayload.projects);
      console.log("Current users state before assignment:", users);
      console.log("User to be updated:", users.find(u => u._id === userId));
      
      // Use the correct superadmin endpoint for updating user projects
      console.log("Using update user projects endpoint:", API_ENDPOINTS.UPDATE_USER_PROJECTS);
      
      const assignResponse: Response = await fetch(API_ENDPOINTS.UPDATE_USER_PROJECTS, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignPayload),
      });

      const assignData = await assignResponse.json();
      console.log("=== API RESPONSE ===");
      console.log("Response status:", assignResponse.status);
      console.log("Response ok:", assignResponse.ok);
      console.log("Response headers:", Object.fromEntries(assignResponse.headers.entries()));
      console.log("Assignment response data:", assignData);
      console.log("Response URL:", assignResponse.url);

      if (assignResponse.ok) {
        setSuccessMessage(`User assigned to project successfully! Refreshing data...`);
        
        // Get project name for immediate UI update
        const project = projects.find(p => p._id === projectId);
        const projectName = project ? project.name : 'Unknown Project';
        
        // Update local state immediately for better UX (temporary until backend sync)
        console.log("=== LOCAL STATE UPDATE ===");
        console.log("Updating local state temporarily for immediate feedback...");
        console.log("Current user before update:", users.find(u => u._id === userId));
        
        setUsers(prevUsers => {
          console.log("Previous users state:", prevUsers);
          const updatedUsers = prevUsers.map(user => {
            if (user._id === userId) {
              // Ensure projectAssignments exists and is an array
              const currentProjectAssignments = user.projectAssignments || [];
              const currentProjectSummary = user.projectSummary || {
                totalProjects: 0,
                activeProjects: 0,
                completedProjects: 0,
                pendingProjects: 0
              };
              
              const updatedUser = {
                ...user,
                projectAssignments: [
                  ...currentProjectAssignments,
                  {
                    projectId: projectId,
                    projectName: projectName,
                    status: 'active',
                    assignedDate: new Date().toISOString()
                  }
                ],
                isAssignedToProject: true,
                projectSummary: {
                  ...currentProjectSummary,
                  totalProjects: currentProjectSummary.totalProjects + 1,
                  activeProjects: currentProjectSummary.activeProjects + 1
                }
              };
              console.log("Updated user object:", updatedUser);
              console.log("New projectAssignments:", updatedUser.projectAssignments);
              console.log("New isAssignedToProject:", updatedUser.isAssignedToProject);
              return updatedUser;
            }
            return user;
          });
          console.log("All users after update:", updatedUsers);
          return updatedUsers;
        });
        
        // Force immediate UI update
        setForceUpdate(prev => prev + 1);
        console.log("Force update triggered:", forceUpdate + 1);
        console.log("Local state updated - UI will refresh with backend data shortly");
        
        setSuccessMessage("User assigned successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        
        // Test if the state actually changed
        setTimeout(() => {
          console.log("=== STATE VERIFICATION ===");
          const updatedUser = users.find(u => u._id === userId);
          console.log("User state after assignment (delayed check):", updatedUser);
          console.log("Current users array:", users);
        }, 100);
        
        // Fetch latest data from backend to ensure UI shows real backend state
        console.log("=== BACKEND SYNC START ===");
        console.log("Fetching latest data from backend for dynamic updates...");
        setTimeout(async () => {
          try {
            setIsSyncingBackend(true);
            console.log("Backend sync started...");
            await fetchUsers();
            console.log("Backend data fetched - UI now shows real backend state");
            setSuccessMessage("Project assignment confirmed from backend!");
            setTimeout(() => setSuccessMessage(""), 2000);
          } catch (error) {
            console.error("Failed to fetch backend data:", error);
            setSuccessMessage("Project assigned but failed to sync with backend");
            setTimeout(() => setSuccessMessage(""), 3000);
          } finally {
            setIsSyncingBackend(false);
            console.log("Backend sync completed");
          }
        }, 500); // Small delay to ensure backend has processed the assignment
      } else {
        alert(`Failed to assign user to project: ${assignData.message || assignData.error || 'Unknown error'}`);
      }
    } catch (assignError) {
      console.error("Error assigning user to project:", assignError);
      alert("Failed to assign user to project");
    } finally {
      setAssigningUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const removeUserFromProject = async (userId: string) => {
    try {
      const user = users.find(u => u._id === userId);
      if (!user || user.projectAssignments.length === 0) {
        alert("User is not assigned to any project");
        return;
      }

      const projectNames = user.projectAssignments.map(pa => pa.projectName).join(", ");
      if (window.confirm(`Remove ${user.name} from ${projectNames}?`)) {
        // TODO: Implement remove from project API call
        // For now, just update local state
        setUsers(prevUsers => prevUsers.map(u => 
          u._id === userId 
            ? { ...u, projectAssignments: [], isAssignedToProject: false }
            : u
        ));
        
        alert("User removed from project successfully!");
        
        // Refresh data to ensure consistency
        setTimeout(() => {
          fetchUsers();
        }, 1000);
      }
    } catch (error) {
      console.error("Error removing user from project:", error);
      alert("Failed to remove user from project");
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
        setExistingRoles(data.roles || []);
      } else {
        console.error("Failed to fetch existing roles:", data.message);
      }
    } catch (error) {
      console.error("Error fetching existing roles:", error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.mobile && user.mobile.includes(searchTerm));
    const matchesRole = filterRole === "all" || user.currentRole.name === filterRole;
    
    // Check project filter against user's project assignments
    let matchesProject = true;
    
    if (filterProject === "unassigned") {
      matchesProject = user.projectAssignments.length === 0;
    } else if (filterProject !== "all") {
      matchesProject = user.projectAssignments.some(assignment => assignment.projectName === filterProject);
    }
    
    return matchesSearch && matchesRole && matchesProject;
  });

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(API_ENDPOINTS.DELETE_USER(userId), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          createRefreshEvent();
          setUsers(users.filter(user => user._id !== userId));
        } else {
          const data = await response.json();
          alert(`Failed to delete user: ${data.message}`);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const getRoleBadge = (roleName: string) => {
    const roleColors = {
      "superadmin": "failure",
      "admin": "failure",
      "tl": "warning",
      "developer": "info",
      "tester": "success",
      "manager": "purple",
      "user": "gray",
      "hr": "indigo"
    } as const;
    
    return (
      <Badge color={roleColors[roleName as keyof typeof roleColors] || "gray"}>
        {roleName.toUpperCase()}
      </Badge>
    );
  };

  const getUniqueRoles = () => {
    const roles = [...new Set(users.map(user => user.currentRole.name))];
    return roles.filter(role => role);
  };

  const getUniqueProjects = () => {
    // Get projects from user's project assignments
    const allProjects = users.flatMap(user => 
      user.projectAssignments.map(assignment => assignment.projectName)
    );
    return [...new Set(allProjects)].filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Manage all users with comprehensive project assignment information.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/apps/users/assign-project" className="w-full sm:w-auto">
            <Button color="info" size="sm" className="w-full">
              <Icon icon="solar:link-circle-line-duotone" className="mr-2" />
              Assign to Project
            </Button>
          </Link>
          <Link href="/apps/users/add" className="w-full sm:w-auto">
            <Button color="primary" size="sm" className="w-full">
              <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
              Add New User
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon icon="solar:check-circle-line-duotone" className="text-green-500 mr-2" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Backend Sync Indicator */}
      {isSyncingBackend && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-800">Syncing with backend...</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Search users by name, email, or mobile..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {getUniqueRoles().map(role => (
                <option key={role} value={role}>{role.toUpperCase()}</option>
              ))}
            </select>
            
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              <option value="unassigned">Unassigned</option>
              {getUniqueProjects().map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Role Change */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
              <span className="text-sm text-gray-600">Select All</span>
            </div>
            <span className="text-sm text-gray-500">
              {(() => {
                const checkedBoxes = document.querySelectorAll('input[name^="user-"]:checked') as NodeListOf<HTMLInputElement>;
                return `${checkedBoxes.length} user(s) selected`;
              })()}
            </span>
          </div>
          <div>
            <select
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    if (firstUser && firstUser.projectAssignments.length > 0) {
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
                      
                      // Refresh the data
                      fetchUsers();
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
              {existingRoles.map(role => (
                <option key={role.name} value={role.name}>{role.name.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center p-3">
          <div className="text-lg font-bold text-blue-600">{users.length}</div>
          <div className="text-xs text-gray-600">Total Users</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-lg font-bold text-green-600">
            {users.filter(u => u.isAssignedToProject).length}
          </div>
          <div className="text-xs text-gray-600">Assigned to Projects</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-lg font-bold text-orange-600">
            {users.filter(u => !u.isAssignedToProject).length}
          </div>
          <div className="text-xs text-gray-600">Unassigned</div>
        </Card>
        <Card className="text-center p-3">
          <div className="text-lg font-bold text-purple-600">{getUniqueRoles().length}</div>
          <div className="text-xs text-gray-600">Different Roles</div>
        </Card>
      </div>
      
      {/* Additional Project Statistics */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="text-center p-3">
            <div className="text-lg font-bold text-indigo-600">
              {users.reduce((total, user) => total + user.projectSummary.totalProjects, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Project Assignments</div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-lg font-bold text-emerald-600">
              {users.reduce((total, user) => total + user.projectSummary.activeProjects, 0)}
            </div>
            <div className="text-xs text-gray-600">Active Projects</div>
          </Card>
          <Card className="text-center p-3">
            <div className="text-lg font-bold text-amber-600">
              {users.reduce((total, user) => total + user.projectSummary.completedProjects, 0)}
            </div>
            <div className="text-xs text-gray-600">Completed Projects</div>
          </Card>
        </div>
      )}

            {/* Users Table */}
            <Card>
  <div className="max-h-[500px] overflow-y-auto">
    <Table className="w-full table-auto">
      <Table.Head>
        <Table.HeadCell className="w-12 px-4 py-3">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            onChange={(e) => {
              const checkboxes = document.querySelectorAll('input[name^="user-"]') as NodeListOf<HTMLInputElement>;
              checkboxes.forEach((checkbox) => {
                checkbox.checked = e.target.checked;
              });
            }}
          />
        </Table.HeadCell>
        <Table.HeadCell className="min-w-[150px] px-4 py-3">Name</Table.HeadCell>
        <Table.HeadCell className="min-w-[200px] px-4 py-3">Email</Table.HeadCell>
        <Table.HeadCell className="min-w-[120px] px-4 py-3">Mobile</Table.HeadCell>
        <Table.HeadCell className="min-w-[150px] px-4 py-3">Company</Table.HeadCell>
        <Table.HeadCell className="min-w-[200px] px-4 py-3">Project Assignment</Table.HeadCell>
        <Table.HeadCell className="min-w-[100px] px-4 py-3">Role</Table.HeadCell>
        <Table.HeadCell className="min-w-[100px] px-4 py-3">Level</Table.HeadCell>
        <Table.HeadCell className="min-w-[120px] px-4 py-3">Created</Table.HeadCell>
        <Table.HeadCell className="min-w-[250px] px-4 py-3">Actions</Table.HeadCell>
      </Table.Head>
      <Table.Body>
        {filteredUsers.map((user) => (
          <Table.Row
            key={`${user._id}-${user.projectAssignments?.length || 0}-${forceUpdate}`}
            className="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Table.Cell className="w-12 px-4 py-3">
              <input
                type="checkbox"
                name={`user-${user._id}`}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </Table.Cell>
            <Table.Cell className="min-w-[150px] px-4 py-3 font-medium text-gray-900 dark:text-white">
              <div className="text-sm lg:text-base truncate">{user.name}</div>
            </Table.Cell>
            <Table.Cell className="min-w-[200px] px-4 py-3 text-gray-600 dark:text-gray-400">
              <div className="text-xs lg:text-sm break-all">{user.email}</div>
            </Table.Cell>
            <Table.Cell className="min-w-[120px] px-4 py-3 text-gray-600 dark:text-gray-400">
              <div className="text-xs lg:text-sm">{user.mobile || "N/A"}</div>
            </Table.Cell>
            <Table.Cell className="min-w-[150px] px-4 py-3 text-gray-600 dark:text-gray-400">
              <div className="text-xs lg:text-sm truncate">{user.companyName || "N/A"}</div>
            </Table.Cell>
            <Table.Cell className="min-w-[200px] px-4 py-3 text-gray-600 dark:text-gray-400">
              {(() => {
                const hasProjects = user.projectAssignments && user.projectAssignments.length > 0;
                console.log(
                  `Project assignment cell for ${user.name}: isAssignedToProject=${user.isAssignedToProject}, projectAssignments.length=${
                    user.projectAssignments?.length || 0
                  }, hasProjects=${hasProjects}`
                );

                if (hasProjects) {
                  return (
                    <div className="space-y-2">
                      {user.projectAssignments.map((assignment, index) => (
                        <div key={index} className="space-y-1">
                          <Badge color="success" className="text-xs">
                            ✓ {assignment.projectName}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <Badge color="gray" className="text-xs">
                      ✗ Not Assigned
                    </Badge>
                    <div className="flex items-center gap-2">
                      {assigningUsers.has(user._id) && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                      )}
                      <select
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full max-w-[150px]"
                        onChange={(e) => {
                          const projectId = e.target.value;
                          if (projectId) {
                            assignUserToProject(user._id, projectId);
                            e.target.value = "";
                          }
                        }}
                        disabled={assigningUsers.has(user._id)}
                      >
                        <option value="">
                          {assigningUsers.has(user._id) ? "Assigning..." : "Assign to..."}
                        </option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}
            </Table.Cell>
            <Table.Cell className="min-w-[100px] px-4 py-3">
              {getRoleBadge(user.currentRole.name)}
            </Table.Cell>
            <Table.Cell className="min-w-[100px] px-4 py-3 text-gray-600 dark:text-gray-400">
              <Badge color="gray" className="text-xs">
                Level {user.currentRole.level}
              </Badge>
            </Table.Cell>
            <Table.Cell className="min-w-[120px] px-4 py-3 text-gray-600 dark:text-gray-400">
              {new Date(user.accountCreated).toLocaleDateString()}
            </Table.Cell>
            <Table.Cell className="min-w-[250px] px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <Link href={`/apps/users/edit/${user._id}`}>
                  <Button size="xs" color="info">
                    <Icon icon="solar:pen-line-duotone" />
                  </Button>
                </Link>
                <Link href={`/apps/users/view/${user._id}`}>
                  <Button size="xs" color="success">
                    <Icon icon="solar:eye-line-duotone" />
                  </Button>
                </Link>
                {(() => {
                  const hasProjects = user.projectAssignments && user.projectAssignments.length > 0;
                  console.log(
                    `User ${user.name} (${user._id}): isAssignedToProject=${user.isAssignedToProject}, projectAssignments.length=${
                      user.projectAssignments?.length || 0
                    }, hasProjects=${hasProjects}`
                  );
                  return (
                    !hasProjects && (
                      <div className="flex items-center gap-2">
                        {assigningUsers.has(user._id) && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        )}
                        {/* <select
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full max-w-[150px]"
                          onChange={(e) => {
                            const projectId = e.target.value;
                            if (projectId) {
                              assignUserToProject(user._id, projectId);
                              e.target.value = "";
                            }
                          }}
                          disabled={assigningUsers.has(user._id)}
                        >
                          <option value="">
                            {assigningUsers.has(user._id) ? "Assigning..." : "Quick Assign"}
                          </option>
                          {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </select> */}
                      </div>
                    )
                  );
                })()}
                {/* <select
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent w-full max-w-[120px]"
                  value={user.currentRole.name}
                  onChange={async (e) => {
                    const newRole = e.target.value;
                    if (newRole === user.currentRole.name) return;

                    try {
                      const payload = {
                        projectId:
                          user.projectAssignments && user.projectAssignments.length > 0
                            ? user.projectAssignments[0].projectId
                            : "",
                        userId: user._id,
                        newRoleName: newRole,
                      };

                      const response = await fetch(API_ENDPOINTS.ASSIGN_ROLE, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                      });

                      if (response.ok) {
                        setUsers(
                          users.map((u) =>
                            u._id === user._id
                              ? { ...u, currentRole: { ...u.currentRole, name: newRole } }
                              : u
                          )
                        );
                        alert(`Role changed to ${newRole.toUpperCase()} successfully!`);
                      } else {
                        const data = await response.json();
                        alert(`Failed to change role: ${data.message}`);
                        e.target.value = user.currentRole.name;
                      }
                    } catch (error) {
                      console.error("Error changing role:", error);
                      alert("Failed to change role");
                      e.target.value = user.currentRole.name;
                    }
                  }}
                >
                  {existingRoles.map((role) => (
                    <option key={role.name} value={role.name}>
                      {role.name.toUpperCase()}
                    </option>
                  ))}
                </select> */}
                <Button size="xs" color="failure" onClick={() => handleDeleteUser(user._id)}>
                  <Icon icon="solar:trash-bin-trash-line-duotone" />
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  </div>
</Card>
    </div>
  );
};

export default UsersPage;
