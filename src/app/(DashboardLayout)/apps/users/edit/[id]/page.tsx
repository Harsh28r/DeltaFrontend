"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

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
}

interface UserHistory {
  user: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    companyName: string;
    currentRole: {
      name: string;
      level: number;
      permissions: string[];
      roleId: string;
    };
    accountCreated: string;
    accountStatus: string;
  };
  timeline: {
    events: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      status: string;
      timestamp: string;
      details: any;
      icon: string;
      color: string;
    }>;
    stats: {
      totalEvents: number;
      accountAge: number;
      totalProjects: number;
      currentRole: string;
      currentLevel: number;
      permissionsCount: number;
    };
    summary: {
      journey: string;
      totalMilestones: number;
      currentStatus: string;
    };
  };
  currentRole: {
    name: string;
    level: number;
    permissions: string[];
    roleId: string;
  };
  projectSummary: {
    total: number;
    owned: number;
    managed: number;
    member: number;
  };
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
}

interface Role {
  _id: string;
  name: string;
  level: number;
}

const EditUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistory | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    companyName: "",
    roleName: "",
    projectId: "",
    projectName: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectAssignments, setProjectAssignments] = useState<{[key: string]: {projectId: string, projectName: string}}>({});

  const userId = params.id as string;

  // Fetch user data, roles, and projects
  useEffect(() => {
    if (token && userId) {
      fetchUserHistory();
      fetchRoles();
      fetchProjects();
      fetchProjectAssignments();
    }
  }, [token, userId]);

  // Update form data when project assignments are available
  useEffect(() => {
    if (user && Object.keys(projectAssignments).length > 0) {
      // If user doesn't have project info but we have it in assignments, update form
      if (!user.projectId && projectAssignments[user._id]) {
        setFormData(prev => ({
          ...prev,
          projectId: projectAssignments[user._id].projectId,
          projectName: projectAssignments[user._id].projectName
        }));
      }
    }
  }, [user, projectAssignments]);

  const fetchUserHistory = async () => {
    try {
      if (!token) {
        console.error("No authentication token available");
        router.push("/auth/auth1/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_HISTORY(userId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed - token expired or invalid");
          localStorage.removeItem("token");
          router.push("/auth/auth1/login");
          return;
        }
        
        const data = await response.json();
        alert(`Failed to fetch user history: ${data.message || response.statusText}`);
        router.push("/apps/users");
        return;
      }
      
      const data = await response.json();
      console.log("Fetched user history:", data);
      
      setUserHistory(data);
      
      // Set user data for backward compatibility
      setUser({
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        mobile: data.user.mobile,
        companyName: data.user.companyName,
        roleName: data.user.currentRole.name,
        projectId: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectId || "",
        projectName: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectName || "",
        createdAt: data.user.accountCreated
      });
      
      // Set form data with current values
      const formDataToSet = {
        name: data.user.name || "",
        email: data.user.email || "",
        mobile: data.user.mobile || "",
        companyName: data.user.companyName || "",
        roleName: data.user.currentRole.name || "",
        projectId: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectId || "",
        projectName: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectName || ""
      };
      
      console.log("Setting form data:", formDataToSet);
      setFormData(formDataToSet);
    } catch (error) {
      console.error("Error fetching user history:", error);
      alert("Failed to fetch user history data");
      router.push("/apps/users");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        const userData = data.user || data;
        console.log("Fetched user data:", userData);
        setUser(userData);
        
        // Get project info from user data or project assignments
        let projectId = userData.projectId || "";
        let projectName = userData.projectName || "";
        
        // If no project info in user data, try to get from project assignments
        if (!projectId && projectAssignments[userId]) {
          projectId = projectAssignments[userId].projectId;
          projectName = projectAssignments[userId].projectName;
          console.log("Using project assignment data:", { projectId, projectName });
        }
        
        const formDataToSet = {
          name: userData.name || "",
          email: userData.email || "",
          mobile: userData.mobile || "",
          companyName: userData.companyName || "",
          roleName: userData.roleName || "",
          projectId: projectId,
          projectName: projectName
        };
        
        console.log("Setting form data:", formDataToSet);
        setFormData(formDataToSet);
      } else {
        alert(`Failed to fetch user: ${data.message}`);
        router.push("/apps/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      alert("Failed to fetch user data");
      router.push("/apps/users");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchRoles = async () => {
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
        setRoles(data.roles || data);
      } else {
        console.error("Failed to fetch roles:", data.message);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
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
      const data = await response.json();
      
      if (response.ok) {
        setProjects(data.projects || data);
      } else {
        console.error("Failed to fetch projects:", data.message);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
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
        
        setProjectAssignments(assignmentMap);
        console.log("Project assignments extracted:", assignmentMap);
        console.log("Current user ID:", userId);
        console.log("User's project assignment:", assignmentMap[userId]);
      } else {
        console.error("Failed to fetch projects:", projectsResponse.status, projectsResponse.statusText);
      }
    } catch (error) {
      console.error("Error fetching project assignments:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    if (!formData.roleName) {
      newErrors.roleName = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // First update the user
      const response = await fetch(API_ENDPOINTS.UPDATE_USER(userId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // If project assignment changed, handle project assignment
        if (formData.projectId && formData.projectId !== user?.projectId) {
          try {
            const assignPayload = {
              projectId: formData.projectId,
              userId: userId
            };
            
            console.log("Assigning user to project:", assignPayload);
            
            const assignResponse = await fetch(API_ENDPOINTS.ASSIGN_PROJECT_MEMBER, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(assignPayload),
            });

            const assignData = await assignResponse.json();
            
            if (assignResponse.ok) {
              alert("User updated and assigned to project successfully!");
              // Trigger refresh event for other pages
              createRefreshEvent();
            } else {
              alert(`User updated but failed to assign to project: ${assignData.message || assignData.error || 'Unknown error'}`);
            }
          } catch (error) {
            console.error("Error assigning project:", error);
            alert("User updated but failed to assign to project. Please try again.");
          }
        } else {
          alert("User updated successfully!");
        }
        
        // Trigger refresh event for other pages (like role modules)
        createRefreshEvent();
        
        router.push("/apps/users");
      } else {
        alert(`Failed to update user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            User not found
          </h2>
          <Button onClick={() => router.push("/apps/users")}>
            Back to Users
          </Button>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit User</h1>
          <p className="text-gray-600 dark:text-gray-400">Update user information</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        {/* Current User Information */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current User Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Current Role:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {user.roleName ? user.roleName.toUpperCase() : "Not assigned"}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Current Project:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {user.projectName || projectAssignments[user._id]?.projectName || "Not assigned"}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Form Role:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formData.roleName || "Not set"}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Form Project:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formData.projectName || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="name" value="Full Name *" />
            </div>
            <TextInput
              id="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              color={errors.name ? "failure" : "gray"}
              helperText={errors.name}
            />
          </div>

          {/* Email */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="email" value="Email Address *" />
            </div>
            <TextInput
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              color={errors.email ? "failure" : "gray"}
              helperText={errors.email}
            />
          </div>

          {/* Mobile */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="mobile" value="Mobile Number *" />
            </div>
            <TextInput
              id="mobile"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={(e) => handleInputChange("mobile", e.target.value)}
              color={errors.mobile ? "failure" : "gray"}
              helperText={errors.mobile}
            />
          </div>

          {/* Company Name */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="companyName" value="Company Name" />
            </div>
            <TextInput
              id="companyName"
              type="text"
              placeholder="Enter company name (optional)"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
            />
          </div>

          {/* Role */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="roleName" value="Role *" />
            </div>
            <Select
              id="roleName"
              value={formData.roleName}
              onChange={(e) => handleInputChange("roleName", e.target.value)}
              color={errors.roleName ? "failure" : "gray"}
              helperText={errors.roleName}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role._id} value={role.name}>
                  {role.name.toUpperCase()} (Level {role.level})
                </option>
              ))}
            </Select>
          </div>

          {/* Project Assignment */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="projectId" value="Project Assignment" />
            </div>
            <Select
              id="projectId"
              value={formData.projectId}
              onChange={(e) => {
                const selectedProject = projects.find(p => p._id === e.target.value);
                handleInputChange("projectId", e.target.value);
                handleInputChange("projectName", selectedProject?.name || "");
              }}
            >
              <option value="">No Project Assigned</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              color="primary" 
              size="lg"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating User...
                </>
              ) : (
                <>
                  <Icon icon="solar:pen-line-duotone" className="mr-2" />
                  Update User
                </>
              )}
            </Button>
            <Button 
              type="button" 
              color="gray" 
              size="lg"
              onClick={() => router.push("/apps/users")}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditUserPage;
