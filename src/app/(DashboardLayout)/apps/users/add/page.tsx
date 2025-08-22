"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface Role {
  _id: string;
  name: string;
  level: number;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
}

const AddUserPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Helper functions to find user ID in response
  const getAllNestedKeys = (obj: any, prefix = ''): string[] => {
    const keys: string[] = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        keys.push(fullKey);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...getAllNestedKeys(obj[key], fullKey));
        }
      }
    }
    return keys;
  };

  const findPossibleId = (obj: any): string | null => {
    // Look for common ID field names
    const idFields = ['_id', 'id', 'userId', 'user_id', 'userid'];
    
    for (const field of idFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
      if (obj.user && obj.user[field] && typeof obj.user[field] === 'string') {
        return obj.user[field];
      }
    }
    
    // Recursively search nested objects
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
        const found = findPossibleId(obj[key]);
        if (found) return found;
      }
    }
    
    return null;
  };
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    companyName: "",
    projectId: "",
    projectName: "",
    roleName: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available roles and projects
  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchProjects();
    }
  }, [token]);

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const projectsList = data.projects || data;
      
      if (Array.isArray(projectsList)) {
        setProjects(projectsList);
      } else {
        console.error("Invalid projects data format:", data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
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

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    if (!formData.roleName) {
      newErrors.roleName = "Role is required";
    }

    if (!formData.projectId) {
      newErrors.projectId = "Project assignment is required";
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
      // First, create the user
      const response = await fetch(API_ENDPOINTS.CREATE_USER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // User created successfully, now assign them to the project
        try {
          console.log("Full response data:", data);
          console.log("Response structure:", {
            hasUser: !!data.user,
            userKeys: data.user ? Object.keys(data.user) : [],
            topLevelKeys: Object.keys(data),
            userObject: data.user
          });
          
          // Try different possible response structures
          let userId = null;
          if (data.user && data.user._id) {
            userId = data.user._id;
          } else if (data._id) {
            userId = data._id;
          } else if (data.user && typeof data.user === 'string') {
            userId = data.user; // In case user is just the ID string
          }
          
          if (!userId) {
            console.error("No user ID found in response:", data);
            console.error("Available data paths:", {
              'data.user._id': data.user?._id,
              'data._id': data._id,
              'data.user (if string)': typeof data.user === 'string' ? data.user : 'not a string'
            });
            
            // Try to find any ID-like field in the response
            const allKeys = getAllNestedKeys(data);
            console.log("All nested keys:", allKeys);
            
            // Look for any field that might contain an ID
            const possibleId = findPossibleId(data);
            if (possibleId) {
              console.log("Found possible ID:", possibleId);
              userId = possibleId;
            } else {
              alert("User created but no user ID returned for project assignment");
              router.push("/apps/users");
              return;
            }
          }
          
          if (!formData.projectId) {
            console.error("No project ID selected");
            alert("User created but no project ID selected for assignment");
            router.push("/apps/users");
            return;
          }
          
          const assignPayload = {
            projectId: formData.projectId,
            userId: userId
          };
          
          console.log("Assigning user to project:", assignPayload);
          console.log("User creation response:", data);
          
          const assignResponse = await fetch(API_ENDPOINTS.ASSIGN_PROJECT_MEMBER, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(assignPayload),
          });

          if (assignResponse.ok) {
            alert("User created and assigned to project successfully!");
            router.push("/apps/users");
          } else {
            const assignData = await assignResponse.json();
            console.error("Project assignment failed:", {
              status: assignResponse.status,
              statusText: assignResponse.statusText,
              data: assignData
            });
            alert(`User created but failed to assign to project: ${assignData.message || assignData.error || 'Unknown error'}`);
            router.push("/apps/users");
          }
        } catch (assignError) {
          console.error("Error assigning user to project:", assignError);
          console.error("Full error details:", {
            error: assignError,
            projectId: formData.projectId,
            userId: data.user?._id || data._id,
            userData: data
          });
          alert("User created but failed to assign to project");
          router.push("/apps/users");
        }
      } else {
        alert(`Failed to create user: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a new user account and assign to a project</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
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

          {/* Password */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="password" value="Password *" />
            </div>
            <TextInput
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              color={errors.password ? "failure" : "gray"}
              helperText={errors.password}
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

          {/* Project Assignment */}
          <div>
            <div className="mb-2 block">
              <Label htmlFor="projectId" value="Assign Project *" />
            </div>
            <Select
              id="projectId"
              value={formData.projectId}
              onChange={(e) => {
                const selectedProject = projects.find(p => p._id === e.target.value);
                if (selectedProject) {
                  setFormData(prev => ({
                    ...prev,
                    projectId: selectedProject._id,
                    projectName: selectedProject.name
                  }));
                }
                // Clear error when user selects a project
                if (errors.projectId) {
                  setErrors(prev => ({ ...prev, projectId: "" }));
                }
              }}
              color={errors.projectId ? "failure" : "gray"}
              helperText={errors.projectId}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <p className="text-sm text-gray-500 mt-1">
              Select a project to assign this user to
            </p>
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
                  Creating User...
                </>
              ) : (
                <>
                  <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                  Create User
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

export default AddUserPage;
