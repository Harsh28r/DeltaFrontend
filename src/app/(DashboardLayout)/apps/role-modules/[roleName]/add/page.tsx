"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

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

interface FormData {
  name: string;
  email: string;
  password: string;
  mobile: string;
  projectId: string;
  projectName: string;
  roleName: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  projectId?: string;
  projectName?: string;
  roleName?: string;
}

const AddUserPage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (obj.user && obj.user[field] && typeof obj[field] === 'string') {
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
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    mobile: "",
    projectId: "",
    projectName: "",
    roleName: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const roleName = params.roleName as string;

  useEffect(() => {
    if (token && roleName) {
      fetchRoleData();
      fetchProjects();
    }
  }, [token, roleName]);

  useEffect(() => {
    if (role) {
      // Pre-fill the role name when role data is available
      setFormData(prev => ({
        ...prev,
        roleName: role.name
      }));
      setIsLoading(false);
    }
  }, [role]);

  const fetchRoleData = async () => {
    try {
      // Get all roles to find the one with matching name
      const response = await fetch(API_ENDPOINTS.ROLES, {
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
      const roles = data.roles || data;
      
      if (Array.isArray(roles)) {
        const foundRole = roles.find((r: Role) => r.name.toLowerCase() === roleName.toLowerCase());
        if (foundRole) {
          setRole(foundRole);
        } else {
          console.error("Role not found with name:", roleName);
        }
      } else {
        console.error("Invalid roles data format:", data);
      }
    } catch (error) {
      console.error("Error fetching role:", error);
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

    if (!formData.projectId.trim()) {
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

    setIsSubmitting(true);

    try {
      // Create user with project assignment
      const userPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        roleName: formData.roleName,
        level: role?.level , // Use role level or default to 1
        projects: formData.projectId ? [formData.projectId] : [],
      };
      
      const response = await fetch(API_ENDPOINTS.CREATE_USER_WITH_PROJECTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userPayload),
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
              router.push(`/apps/role-modules/${roleName}`);
              return;
            }
          }
          
          if (!formData.projectId) {
            console.error("No project ID selected");
            alert("User created but no project ID selected for assignment");
            router.push(`/apps/role-modules/${roleName}`);
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
            createRefreshEvent();
            alert("User created and assigned to project successfully!");
            router.push(`/apps/role-modules/${roleName}`);
          } else {
            const assignData = await assignResponse.json();
            console.error("Project assignment failed:", {
              status: assignResponse.status,
              statusText: assignResponse.statusText,
              data: assignData
            });
            alert(`User created but failed to assign to project: ${assignData.message || assignData.error || 'Unknown error'}`);
            router.push(`/apps/role-modules/${roleName}`);
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
          router.push(`/apps/role-modules/${roleName}`);
        }
      } else {
        alert(`Failed to create user: ${data.message}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
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
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add New {role.name.toUpperCase()} User
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a new {role.name} user with super admin privileges
          </p>
        </div>
        <Link href={`/apps/role-modules/${roleName}`}>
          <Button color="gray" size="sm">
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back to {role.name.toUpperCase()} Users
          </Button>
        </Link>
      </div>

      {/* Role Info Card */}
      <Card>
        <div className="text-center">
          <Icon 
            icon="solar:users-group-rounded-line-duotone" 
            className="text-4xl text-blue-600 mx-auto mb-3" 
          />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Creating User for {role.name.toUpperCase()} Role
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This user will be assigned the {role.name.toUpperCase()} role with level {role.level}
          </p>
        </div>
      </Card>

      {/* Add User Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" value="Full Name *" />
              <TextInput
                id="name"
                type="text"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                color={errors.name ? "failure" : "gray"}
                helperText={errors.name}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" value="Email Address *" />
              <TextInput
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                color={errors.email ? "failure" : "gray"}
                helperText={errors.email}
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" value="Password *" />
              <TextInput
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                color={errors.password ? "failure" : "gray"}
                helperText={errors.password}
                required
              />
            </div>

            {/* Mobile */}
            <div>
              <Label htmlFor="mobile" value="Mobile Number *" />
              <TextInput
                id="mobile"
                type="tel"
                placeholder="Enter mobile number"
                value={formData.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                color={errors.mobile ? "failure" : "gray"}
                helperText={errors.mobile}
                required
              />
            </div>

            {/* Project Assignment */}
            <div>
              <Label htmlFor="projectId" value="Assign Project *" />
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
                    setErrors(prev => ({
                      ...prev,
                      projectId: undefined
                    }));
                  }
                }}
                color={errors.projectId ? "failure" : "gray"}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-600 mt-1">{errors.projectId}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Select a project to assign this user to
              </p>
            </div>

            {/* Role Name (Read-only) */}
            <div>
              <Label htmlFor="roleName" value="Role *" />
              <TextInput
                id="roleName"
                type="text"
                value={formData.roleName}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-1">
                Role is automatically set to {role.name.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Link href={`/apps/role-modules/${roleName}`}>
              <Button color="gray" type="button">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddUserPage;
