"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, Select, TextInput, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

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
  role: string;
  companyName?: string;
  createdAt: string;
}

const AssignProjectPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchProjects();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      // Using the users by role endpoint to get all users
      const response = await fetch(`${API_ENDPOINTS.API_BASE_URL}/api/superadmin/users/by-role`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Flatten all users from different roles into a single array
        const allUsers: User[] = [];
        Object.values(data.usersByRole).forEach((roleData: any) => {
          if (roleData.users && Array.isArray(roleData.users)) {
            allUsers.push(...roleData.users);
          }
        });
        setUsers(allUsers);
      } else {
        console.error("Failed to fetch users");
        setMessage({ type: 'error', text: 'Failed to load users' });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: 'error', text: 'Failed to load users' });
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

  const handleAssignToProject = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    if (!selectedProjectId) {
      setMessage({ type: 'error', text: 'Please select a project' });
      return;
    }

    setIsAssigning(true);
    setMessage(null);

    try {
      const assignPayload = {
        projectId: selectedProjectId,
        userId: selectedUserId
      };
      
      const assignResponse = await fetch(API_ENDPOINTS.ASSIGN_PROJECT_MEMBER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignPayload),
      });

      if (assignResponse.ok) {
        setMessage({ type: 'success', text: 'User assigned to project successfully!' });
        // Reset selections
        setSelectedUserId("");
        setSelectedProjectId("");
        // Refresh users list
        setTimeout(() => {
          fetchUsers();
          setMessage(null);
        }, 2000);
      } else {
        const assignData = await assignResponse.json();
        setMessage({ 
          type: 'error', 
          text: `Failed to assign user to project: ${assignData.message || assignData.error || 'Unknown error'}` 
        });
      }
    } catch (assignError) {
      console.error("Error assigning user to project:", assignError);
      setMessage({ type: 'error', text: 'Failed to assign user to project' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setMessage(null);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setMessage(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
              placeholder="Search by name, email, or role..."
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
                  {user.name} ({user.email}) - {user.role}
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
              <Label htmlFor="projectSelect" value="Select Project *" />
            </div>
            <Select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              required
            >
              <option value="">Choose a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button 
              onClick={handleAssignToProject}
              disabled={isAssigning || !selectedUserId || !selectedProjectId}
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
                  Assign User to Project
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

      {/* Users List */}
      <Card>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total users: {users.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Company</th>
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
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{user.companyName || '-'}</td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString()}
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
