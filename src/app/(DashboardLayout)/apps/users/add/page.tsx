"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select, Checkbox } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";

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
  const [isAssigningProject, setIsAssigningProject] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [showProjectAssignment, setShowProjectAssignment] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    companyName: "",
    projectId: "",
    projectName: "",
    roleName: "",
    assignToProject: false,
    multipleProjects: false,
    selectedProjectIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to find user ID in response
  const findPossibleId = (obj: any): string | null => {
    const idFields = ["_id", "id", "userId", "user_id", "userid"];
    for (const field of idFields) {
      if (obj[field] && typeof obj[field] === "string") return obj[field];
      if (obj.user && obj.user[field] && typeof obj.user[field] === "string") return obj.user[field];
    }
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && typeof obj[key] === "object" && obj[key] !== null) {
        const found = findPossibleId(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  // Fetch roles and projects
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
      const data = await response.json();
      const projectsList = data.projects || data;
      if (Array.isArray(projectsList)) {
        setProjects(projectsList);
        console.log("Available projects:", projectsList.map(p => ({ id: p._id, name: p.name })));
      } else {
        console.error("Invalid projects data format:", data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
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
    if (!formData.roleName) newErrors.roleName = "Role is required";
    if (formData.assignToProject) {
      if (formData.multipleProjects) {
        if (formData.selectedProjectIds.length === 0) {
          newErrors.projectId = "At least one project must be selected";
        }
      } else if (!formData.projectId) {
        newErrors.projectId = "Project is required when assigning to project";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // Get the selected role to extract the level
      const selectedRole = roles.find(role => role.name === formData.roleName);
      
      const createUserPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mobile: formData.mobile,
        companyName: formData.companyName,
        roleName: formData.roleName,
        level: selectedRole?.level || 1, // Default to level 1 if role not found
        projects: formData.assignToProject
          ? formData.multipleProjects
            ? formData.selectedProjectIds.map(id => ({ projectId: id }))
            : formData.projectId
              ? [{ projectId: formData.projectId }]
              : []
          : [],
      };

      console.log("Sending payload:", JSON.stringify(createUserPayload, null, 2));
      console.log("Projects array:", createUserPayload.projects);
      console.log("Projects array type:", typeof createUserPayload.projects);
      console.log("Projects array length:", createUserPayload.projects.length);

      const response = await fetch(API_ENDPOINTS.CREATE_USER_WITH_PROJECTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createUserPayload),
      });

      const data = await response.json();
      console.log("Full API response:", JSON.stringify(data, null, 2));

      if (response.ok) {
        let userId = findPossibleId(data);
        if (!userId) {
          alert("User created but no user ID returned");
          router.push("/apps/users");
          return;
        }
        setCreatedUserId(userId);

        if (formData.assignToProject && createUserPayload.projects.length > 0) {
          if (data.summary?.projectsAssigned > 0) {
            const projectNames = data.projectAssignments?.map((pa: any) => pa.projectName).join(", ") || "Unknown";
            alert(`User created and assigned to ${data.summary.projectsAssigned} project(s): ${projectNames}`);
            router.push("/apps/users");
          } else {
            console.error("Project assignment failed. Expected project IDs:", createUserPayload.projects);
            alert(
              `User created successfully, but failed to assign to projects: ${createUserPayload.projects.join(
                ", ",
              )}. Please try assigning manually.`,
            );
            setShowProjectAssignment(true);
          }
        } else {
          alert("User created successfully!");
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

  // Assign user to project manually
  const assignUserToProject = async (userId: string, projectId: string) => {
    setIsAssigningProject(true);
    try {
      const response = await fetch(API_ENDPOINTS.ASSIGN_PROJECT_MEMBER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, userId }),
      });
      const data = await response.json();
      console.log("Assign project response:", JSON.stringify(data, null, 2));
      if (response.ok) {
        alert("User assigned to project successfully!");
        router.push("/apps/users");
      } else {
        alert(`Failed to assign user to project: ${data.message || data.error || "Unknown error"}`);
      }
    } catch (assignError) {
      console.error("Error assigning user to project:", assignError);
      alert("Failed to assign user to project");
    } finally {
      setIsAssigningProject(false);
    }
  };

  const handleAssignToProject = async () => {
    if (!formData.projectId) {
      setErrors(prev => ({ ...prev, projectId: "Please select a project" }));
      return;
    }
    if (createdUserId) {
      await assignUserToProject(createdUserId, formData.projectId);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      mobile: "",
      companyName: "",
      projectId: "",
      projectName: "",
      roleName: "",
      assignToProject: false,
      multipleProjects: false,
      selectedProjectIds: [],
    });
    setErrors({});
    setCreatedUserId(null);
    setShowProjectAssignment(false);
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p._id === projectId);
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        projectId: selectedProject._id,
        projectName: selectedProject.name,
      }));
    }
    if (errors.projectId) {
      setErrors(prev => ({ ...prev, projectId: "" }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button color="gray" size="sm" onClick={() => router.back()}>
          <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h1>
          <p className="text-gray-600 dark:text-gray-400">Create a new user account with optional project assignment</p>
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
              onChange={e => handleInputChange("name", e.target.value)}
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
              onChange={e => handleInputChange("email", e.target.value)}
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
              onChange={e => handleInputChange("password", e.target.value)}
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
              onChange={e => handleInputChange("mobile", e.target.value)}
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
              onChange={e => handleInputChange("companyName", e.target.value)}
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
              onChange={e => handleInputChange("roleName", e.target.value)}
              color={errors.roleName ? "failure" : "gray"}
              helperText={errors.roleName}
            >
              <option value="">Select a role</option>
              {roles.map(role => (
                <option key={role._id} value={role.name}>
                  {role.name.toUpperCase()} (Level {role.level})
                </option>
              ))}
            </Select>
          </div>

          {/* Project Assignment Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="assignToProject"
                checked={formData.assignToProject}
                onChange={e => handleInputChange("assignToProject", e.target.checked)}
              />
              <Label htmlFor="assignToProject" className="text-sm">
                Assign user to projects immediately
              </Label>
            </div>
            {formData.assignToProject && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multipleProjects"
                  checked={formData.multipleProjects}
                  onChange={e => handleInputChange("multipleProjects", e.target.checked)}
                />
                <Label htmlFor="multipleProjects" className="text-sm">
                  Assign to multiple projects
                </Label>
              </div>
            )}
          </div>

          {/* Project Assignment (Conditional) */}
          {formData.assignToProject && (
            <div>
              {formData.multipleProjects ? (
                <div>
                  <div className="mb-2 block">
                    <Label value="Select Projects *" />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {projects.map(project => (
                      <div key={project._id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`project-${project._id}`}
                          value={project._id}
                          checked={formData.selectedProjectIds.includes(project._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedProjectIds: [...prev.selectedProjectIds, project._id],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedProjectIds: prev.selectedProjectIds.filter(id => id !== project._id),
                              }));
                            }
                          }}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <Label htmlFor={`project-${project._id}`} className="text-sm cursor-pointer">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {formData.selectedProjectIds.length > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {formData.selectedProjectIds.length} project(s) selected
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-2 block">
                    <Label htmlFor="projectId" value="Select Project *" />
                  </div>
                  <Select
                    id="projectId"
                    value={formData.projectId}
                    onChange={e => handleProjectChange(e.target.value)}
                    color={errors.projectId ? "failure" : "gray"}
                    helperText={errors.projectId}
                  >
                    <option value="">Select a project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">Select a project to assign this user to</p>
                </div>
              )}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" color="primary" size="lg" disabled={isLoading} className="flex-1">
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
            <Button type="button" color="gray" size="lg" onClick={() => router.push("/apps/users")} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Project Assignment Section (Fallback) */}
      {showProjectAssignment && createdUserId && (
        <Card className="max-w-2xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign User to Project</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User created successfully! You can now assign them to a project or do it later.
              </p>
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">User Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {formData.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {formData.roleName}
                  </div>
                  <div>
                    <span className="font-medium">Mobile:</span> {formData.mobile}
                  </div>
                  {formData.companyName && (
                    <div>
                      <span className="font-medium">Company:</span> {formData.companyName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="projectAssignment" value="Select Project" />
              </div>
              <Select
                id="projectAssignment"
                value={formData.projectId}
                onChange={e => handleProjectChange(e.target.value)}
                color={errors.projectId ? "failure" : "gray"}
                helperText={errors.projectId}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAssignToProject}
                disabled={isAssigningProject || !formData.projectId}
                color="primary"
                size="sm"
              >
                {isAssigningProject ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:link-circle-line-duotone" className="mr-2" />
                    Assign to Project
                  </>
                )}
              </Button>
              <Button onClick={() => router.push("/apps/users")} color="gray" size="sm">
                Go to Users
              </Button>
              <Button onClick={resetForm} color="success" size="sm">
                <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                Create Another User
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AddUserPage;