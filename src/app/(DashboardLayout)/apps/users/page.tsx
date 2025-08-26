"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent, subscribeToRefresh } from "@/lib/config";

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
  __v: number;
}

const UsersPage = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [projectAssignments, setProjectAssignments] = useState<{[key: string]: {projectId: string, projectName: string}}>({});
  const [existingRoles, setExistingRoles] = useState<Array<{name: string, level: number}>>([]);

  // Fetch users from backend
  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchProjectAssignments();
      fetchExistingRoles();
    }
  }, [token]);

  // Listen for refresh events from other pages (like user edits)
  useEffect(() => {
    const unsubscribe = subscribeToRefresh(() => {
      console.log("Refresh event received, updating users page data...");
      if (token) {
        fetchUsers();
        fetchProjectAssignments();
      }
    });

    return unsubscribe;
  }, [token]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || data);
      } else {
        console.error("Failed to fetch users:", data.message);
        if (data.message === "No token, authorization denied") {
          console.error("Token is invalid or expired");
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectAssignments = async () => {
    try {
      // Fetch all projects to get project names and members
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (projectsResponse.ok) {
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
        console.log("Users with project assignments:", users.filter(u => assignmentMap[u._id]));
        setProjectAssignments(assignmentMap);
      }
    } catch (error) {
      console.error("Error fetching project assignments:", error);
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
      user.mobile.includes(searchTerm);
    const matchesRole = filterRole === "all" || user.roleName === filterRole;
    
    // Check project filter against both user data and fetched assignments
    const userProjectName = user.projectName || projectAssignments[user._id]?.projectName;
    const matchesProject = filterProject === "all" || userProjectName === filterProject;
    
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
      "admin": "failure",
      "tl": "warning",
      "developer": "info",
      "tester": "success",
      "manager": "purple"
    } as const;
    
    return (
      <Badge color={roleColors[roleName as keyof typeof roleColors] || "gray"}>
        {roleName.toUpperCase()}
      </Badge>
    );
  };

  const getUniqueRoles = () => {
    const roles = [...new Set(users.map(user => user.roleName))];
    return roles.filter(role => role);
  };

  const getUniqueProjects = () => {
    // Get projects from both user data and fetched assignments
    const userProjects = users.map(user => user.projectName).filter(Boolean);
    const assignmentProjects = Object.values(projectAssignments).map(assignment => assignment.projectName).filter(Boolean);
    const allProjects = [...new Set([...userProjects, ...assignmentProjects])];
    return allProjects;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their roles</p>
        </div>
        <Link href="/apps/users/add">
          <Button color="primary" size="sm">
            <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
            Add New User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name, email, or mobile..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {getUniqueRoles().map(role => (
                <option key={role} value={role}>{role.toUpperCase()}</option>
              ))}
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {getUniqueProjects().map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Role Change */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
              <span className="text-sm text-gray-600">Select All</span>
            </div>
            <span className="text-sm text-gray-500">
              {(() => {
                const checkedBoxes = document.querySelectorAll('input[name^="user-"]:checked') as NodeListOf<HTMLInputElement>;
                return `${checkedBoxes.length} user(s) selected`;
              })()}
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
                      
                      // Refresh the data
                      fetchUsers();
                      fetchProjectAssignments();
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

      {/* Debug Information */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <div className="text-sm">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Debug Info</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium">Total Users:</span> {users.length}
            </div>
            <div>
              <span className="font-medium">Project Assignments:</span> {Object.keys(projectAssignments).length}
            </div>
            <div>
              <span className="font-medium">Available Roles:</span> {existingRoles.length}
            </div>
            <div>
              <span className="font-medium">Users with Projects:</span> {users.filter(u => u.projectName || projectAssignments[u._id]).length}
            </div>
          </div>
          {Object.keys(projectAssignments).length > 0 && (
            <div className="mt-2">
              <span className="font-medium">Project Assignments:</span>
              <div className="mt-1 space-y-1">
                {Object.entries(projectAssignments).slice(0, 5).map(([userId, assignment]) => (
                  <div key={userId} className="text-gray-600 dark:text-gray-400">
                    User: {userId.slice(-8)}... → Project: {assignment.projectName} ({assignment.projectId.slice(-8)}...)
                  </div>
                ))}
                {Object.keys(projectAssignments).length > 5 && (
                  <div className="text-gray-500">... and {Object.keys(projectAssignments).length - 5} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell className="w-4">
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
              </Table.HeadCell>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Mobile</Table.HeadCell>
              <Table.HeadCell>Project</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {filteredUsers.map((user) => (
                <Table.Row key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Table.Cell className="w-4">
                    <input
                      type="checkbox"
                      name={`user-${user._id}`}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </Table.Cell>
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {user.mobile}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {(() => {
                      // First try to get project info from user data
                      if (user.projectName) {
                        return (
                          <div className="space-y-1">
                            <Badge color="info" className="text-xs">
                              {user.projectName}
                            </Badge>
                            {user.projectId && (
                              <div className="text-xs text-gray-500">
                                ID: {user.projectId.slice(-8)}...
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // Then try to get from fetched project assignments
                      const assignment = projectAssignments[user._id];
                      if (assignment && assignment.projectName) {
                        return (
                          <div className="space-y-1">
                            <Badge color="success" className="text-xs">
                              {assignment.projectName}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              ID: {assignment.projectId.slice(-8)}...
                            </div>
                          </div>
                        );
                      }
                      
                      // Finally, show not assigned
                      return (
                        <span className="text-gray-400 text-sm">Not Assigned</span>
                      );
                    })()}
                  </Table.Cell>
                  <Table.Cell>
                    {getRoleBadge(user.roleName)}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
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
                      <select
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={user.roleName}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          if (newRole === user.roleName) return;
                          
                          try {
                            const payload = {
                              projectId: user.projectId || projectAssignments[user._id]?.projectId || "",
                              userId: user._id,
                              newRoleName: newRole
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
                              // Update local state
                              setUsers(users.map(u => 
                                u._id === user._id ? { ...u, roleName: newRole } : u
                              ));
                              alert(`Role changed to ${newRole.toUpperCase()} successfully!`);
                            } else {
                              const data = await response.json();
                              alert(`Failed to change role: ${data.message}`);
                              // Reset dropdown to original value
                              e.target.value = user.roleName;
                            }
                          } catch (error) {
                            console.error("Error changing role:", error);
                            alert("Failed to change role");
                            e.target.value = user.roleName;
                          }
                        }}
                      >
                        {existingRoles.map(role => (
                          <option key={role.name} value={role.name}>{role.name.toUpperCase()}</option>
                        ))}
                      </select>
                      <Button 
                        size="xs" 
                        color="failure"
                        onClick={() => handleDeleteUser(user._id)}
                      >
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

      {/* Role Assignment Modal */}
      {/* Removed RoleAssignmentModal usage */}
    </div>
  );
};

export default UsersPage;
