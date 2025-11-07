"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, Select, TextInput, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL, getApiBaseUrlRuntime } from "@/lib/config";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
}

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

const AssignProjectPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchProjects();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Using the with-projects endpoint to get all users with their project assignments
      // Use runtime function for client-side to ensure correct URL
      let apiUrl: string;
      try {
        apiUrl = typeof window !== 'undefined' ? getApiBaseUrlRuntime() : API_BASE_URL;
        if (!apiUrl || apiUrl === 'undefined') {
          apiUrl = API_BASE_URL || 'https://api.realtechmktg.com';
        }
      } catch (error) {
        console.warn('Error getting API URL, using fallback:', error);
        apiUrl = API_BASE_URL || 'https://api.realtechmktg.com';
      }
      const response = await fetch(`${apiUrl}/api/superadmin/users/with-projects`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Users with projects response:", data);
        
        // Process the response data
        let processedUsers: User[] = [];
        
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
        setUsers(processedUsers);
      } else {
        console.error("Failed to fetch users");
        setMessage({ type: 'error', text: 'Failed to load users' });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  };


  
  const fetchProjects = async () => {
    try {
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
      const projectsList = data.projects || data;
      
      if (Array.isArray(projectsList)) {
        setProjects(projectsList);
      } else {
        console.error("Invalid projects data format:", data);
        setMessage({ type: 'error', text: 'Failed to load projects' });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    }
  };

  const handleAssignToProjects = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    if (selectedProjectIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one project' });
      return;
    }

    setIsAssigning(true);
    setMessage(null);

    try {
      const assignPayload = {
        userId: selectedUserId,
        projects: selectedProjectIds.map(projectId => ({ projectId }))
      };
      
      console.log("Assigning user to projects:", assignPayload);
      
      const assignResponse = await fetch(API_ENDPOINTS.UPDATE_USER_PROJECTS, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignPayload),
      });

      const assignData = await assignResponse.json();
      console.log("Assignment response:", assignData);

      if (assignResponse.ok) {
        setMessage({ type: 'success', text: `User assigned to ${selectedProjectIds.length} project(s) successfully!` });
        // Reset selections
        setSelectedUserId("");
        setSelectedProjectIds([]);
        setSelectedUser(null);
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({ 
          type: 'error', 
          text: `Failed to assign user to projects: ${assignData.message || assignData.error || 'Unknown error'}` 
        });
      }
    } catch (assignError) {
      console.error("Error assigning user to projects:", assignError);
      setMessage({ type: 'error', text: 'Failed to assign user to projects' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFromProject = async (userId: string, projectIdToRemove: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) {
      setMessage({ type: 'error', text: 'User not found' });
      return;
    }

    const projectToRemove = projects.find(p => p._id === projectIdToRemove);
    const projectName = projectToRemove?.name || 'the project';

    if (window.confirm(`Are you sure you want to remove ${user.name} from "${projectName}"?`)) {
      setIsRemoving(true);
      setMessage(null);

      try {
        // Get user's current project assignments
        const currentProjects = user.projectAssignments || [];
        
        // Remove the specific project from the user's assignments
        const remainingProjects = currentProjects
          .filter(assignment => assignment.projectId !== projectIdToRemove)
          .map(assignment => ({ projectId: assignment.projectId }));

        const removePayload = {
          userId: userId,
          projects: remainingProjects // Only remaining projects
        };
        
        console.log("Removing user from specific project:", removePayload);
        console.log("Project to remove:", projectIdToRemove);
        console.log("Remaining projects:", remainingProjects);
        
        const removeResponse = await fetch(API_ENDPOINTS.UPDATE_USER_PROJECTS, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(removePayload),
        });

        const removeData = await removeResponse.json();
        console.log("Removal response:", removeData);

        if (removeResponse.ok) {
          setMessage({ type: 'success', text: `User removed from "${projectName}" successfully!` });
          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage(null);
          }, 3000);
        } else {
          setMessage({ 
            type: 'error', 
            text: `Failed to remove user from project: ${removeData.message || removeData.error || 'Unknown error'}` 
          });
        }
      } catch (removeError) {
        console.error("Error removing user from project:", removeError);
        setMessage({ type: 'error', text: 'Failed to remove user from project' });
      } finally {
        setIsRemoving(false);
      }
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u._id === userId);
    setSelectedUser(user || null);
    
    // Pre-check the projects that the user is already assigned to
    if (user && user.projectAssignments) {
      const alreadyAssignedProjectIds = user.projectAssignments.map(assignment => assignment.projectId);
      setSelectedProjectIds(alreadyAssignedProjectIds);
      console.log("Pre-checking existing project assignments:", alreadyAssignedProjectIds);
    } else {
      setSelectedProjectIds([]);
    }
    
    setMessage(null);
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
    setMessage(null);
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(projects.map(p => p._id));
  };

  const handleClearAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const handleResetToCurrentAssignments = () => {
    if (selectedUser && selectedUser.projectAssignments) {
      const alreadyAssignedProjectIds = selectedUser.projectAssignments.map(assignment => assignment.projectId);
      setSelectedProjectIds(alreadyAssignedProjectIds);
      console.log("Reset to current assignments:", alreadyAssignedProjectIds);
    } else {
      setSelectedProjectIds([]);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.currentRole.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mobile && user.mobile.includes(searchTerm)) ||
    (user.companyName && user.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          color="gray" 
          size="sm"
          onClick={() => router.back()}
        >
          <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assign User to Project</h1>
          <p className="text-gray-600 dark:text-gray-400">Assign existing users to projects</p>
        </div>
      </div>

      {/* Assignment Form */}
      <Card className="max-w-2xl">
        <div className="space-y-6">
          {message && (
            <Alert color={message.type === 'success' ? 'success' : 'failure'}>
              {message.text}
            </Alert>
          )}

          {/* User Selection */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="userSearch" value="Search Users" />
            </div>
            <TextInput
              id="userSearch"
              type="text"
              placeholder="Search by name, email, role, mobile, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="userSelect" value="Select User *" />
            </div>
            <Select
              id="userSelect"
              value={selectedUserId}
              onChange={(e) => handleUserChange(e.target.value)}
              required
            >
              <option value="">Choose a user</option>
              {filteredUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) - {user.currentRole.name} - {user.isAssignedToProject ? 'Has Projects' : 'No Projects'}
                </option>
              ))}
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              {filteredUsers.length} users found
            </p>
          </div>

          {/* Project Selection */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="projectSelect" value="Select Projects *" />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  color="info" 
                  onClick={handleSelectAllProjects}
                  disabled={!selectedUserId}
                >
                  Select All
                </Button>
                <Button 
                  size="sm" 
                  color="gray" 
                  onClick={handleClearAllProjects}
                  disabled={!selectedUserId}
                >
                  Clear All
                </Button>
                <Button 
                  size="sm" 
                  color="warning" 
                  onClick={handleResetToCurrentAssignments}
                  disabled={!selectedUserId || !selectedUser}
                >
                  Reset to Current
                </Button>
                <span className="text-sm text-gray-500 self-center">
                  {selectedProjectIds.length} project(s) selected
                </span>
              </div>
              
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {projects.map((project) => {
                  const isSelected = selectedProjectIds.includes(project._id);
                  const wasAlreadyAssigned = selectedUser && selectedUser.projectAssignments?.some(
                    assignment => assignment.projectId === project._id
                  );
                  
                  return (
                    <label key={project._id} className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded ${
                      wasAlreadyAssigned && isSelected ? 'bg-blue-50' : ''
                    }`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleProjectToggle(project._id)}
                        disabled={!selectedUserId}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                      />
                      <span className={`text-sm ${
                        wasAlreadyAssigned && isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                      }`}>
                        {project.name}
                        {wasAlreadyAssigned && isSelected && (
                          <span className="ml-1 text-xs text-blue-600">(currently assigned)</span>
                        )}
                      </span>
                      {project.description && (
                        <span className="text-xs text-gray-500">- {project.description}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button 
              onClick={handleAssignToProjects}
              disabled={isAssigning || !selectedUserId || selectedProjectIds.length === 0}
              color="primary"
              size="lg"
              className="flex-1"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Icon icon="solar:link-circle-line-duotone" className="mr-2" />
                  Assign User to {selectedProjectIds.length} Project{selectedProjectIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            <Button 
              onClick={() => router.push("/apps/users")}
              color="gray"
              size="lg"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      {/* Selected User Information */}
      {selectedUser && (
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Selected User Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.currentRole.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedUser.mobile || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Projects:</span>
                  <div className="mt-1">
                    {selectedUser.projectAssignments && selectedUser.projectAssignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.projectAssignments.map((assignment, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                            {assignment.projectName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No current projects</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected Projects:</span>
                  <div className="mt-1">
                    {selectedProjectIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedProjectIds.map(projectId => {
                          const project = projects.find(p => p._id === projectId);
                          return project ? (
                            <span key={projectId} className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                              {project.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No projects selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isAssignedToProject).length}
          </div>
          <div className="text-sm text-gray-600">Assigned to Projects</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-600">
            {users.filter(u => !u.isAssignedToProject).length}
          </div>
          <div className="text-sm text-gray-600">Unassigned</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-600">
            {users.reduce((total, user) => total + (user.projectAssignments?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Assignments</div>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total users: {users.length} | Filtered: {filteredUsers.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Mobile</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Project Assignments</th>
                  <th className="px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                        {user.currentRole.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.mobile || '-'}</td>
                    <td className="px-6 py-4">{user.companyName || '-'}</td>
                    <td className="px-6 py-4">
                      {user.projectAssignments && user.projectAssignments.length > 0 ? (
                        <div className="space-y-1">
                          {user.projectAssignments.map((assignment, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                                {assignment.projectName}
                              </span>
                              <Button
                                size="xs"
                                color="failure"
                                onClick={() => handleRemoveFromProject(user._id, assignment.projectId)}
                                disabled={isRemoving}
                                title="Remove from project"
                              >
                                <Icon icon="solar:close-circle-line-duotone" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-gray-900 dark:text-gray-300">
                          No Projects
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(user.accountCreated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssignProjectPage;
