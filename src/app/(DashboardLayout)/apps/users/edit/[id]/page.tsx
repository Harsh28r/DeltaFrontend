"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

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

  const userId = params.id as string;

  // Fetch user data, roles, and projects
  useEffect(() => {
    if (token && userId) {
      fetchUserData();
      fetchRoles();
      fetchProjects();
    }
  }, [token, userId]);

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
        setUser(data.user || data);
        setFormData({
          name: data.user?.name || data.name || "",
          email: data.user?.email || data.email || "",
          mobile: data.user?.mobile || data.mobile || "",
          companyName: data.user?.companyName || data.companyName || "",
          roleName: data.user?.roleName || data.roleName || "",
          projectId: data.user?.projectId || data.projectId || "",
          projectName: data.user?.projectName || data.projectName || ""
        });
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
