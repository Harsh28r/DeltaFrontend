// NOTE: duplicate implementation removed below. Keeping the comprehensive edit UI that follows.

"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  _id: string;
  name: string;
  level: number;
  permissions: string[];
  createdAt: string;
  __v: number;
}

const EditRolePage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { token } = useAuth();

  const [formData, setFormData] = useState<Role>({
    _id: "",
    name: "",
    level: 1,
    permissions: [],
    createdAt: "",
    __v: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available permissions grouped by category
  const availablePermissions: Permission[] = [
    // Project Management
    { id: "manage_project", name: "Manage Project", description: "Can create, edit, and delete projects", category: "Project Management" },
    { id: "view_project", name: "View Project", description: "Can view project details", category: "Project Management" },
    
    // Team Management
    { id: "manage_team", name: "Manage Team", description: "Can manage team members and assignments", category: "Team Management" },
    { id: "view_team", name: "View Team", description: "Can view team information", category: "Team Management" },
    { id: "view_team_dashboard", name: "View Team Dashboard", description: "Can access team dashboard", category: "Team Management" },
    
    // Sales & Analytics
    { id: "view_sales_data", name: "View Sales Data", description: "Can view sales reports and analytics", category: "Sales & Analytics" },
    { id: "manage_sales", name: "Manage Sales", description: "Can manage sales operations", category: "Sales & Analytics" },
    
    // User Management
    { id: "manage_users", name: "Manage Users", description: "Can create, edit, and delete users", category: "User Management" },
    { id: "view_users", name: "View Users", description: "Can view user information", category: "User Management" },
    
    // Role Management
    { id: "manage_roles", name: "Manage Roles", description: "Can create, edit, and delete roles", category: "Role Management" },
    { id: "view_roles", name: "View Roles", description: "Can view role information", category: "Role Management" },
    
    // Content Management
    { id: "manage_content", name: "Manage Content", description: "Can create, edit, and delete content", category: "Content Management" },
    { id: "view_content", name: "View Content", description: "Can view content", category: "Content Management" },
    
    // Reports
    { id: "view_reports", name: "View Reports", description: "Can view system reports", category: "Reports" },
    { id: "export_reports", name: "Export Reports", description: "Can export reports", category: "Reports" },
    
    // System Settings
    { id: "manage_settings", name: "Manage Settings", description: "Can modify system settings", category: "System Settings" },
    { id: "view_settings", name: "View Settings", description: "Can view system settings", category: "System Settings" }
  ];

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  useEffect(() => {
    // Fetch role data from backend
    const fetchRole = async () => {
      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(API_ENDPOINTS.ROLE_BY_ID(roleId), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          // Try parse JSON; fallback to text if necessary
          let data: any = null;
          try {
            data = await response.json();
          } catch (_) {
            data = null;
          }
          const role = data?.role ?? data;
          if (role && role._id) {
            setFormData(role);
            setError(null);
          } else {
            setError("Unexpected response shape from server. Role not found in payload.");
          }
        } else {
          // Read response body as text for better diagnostics
          let bodyText = "";
          try {
            bodyText = await response.text();
          } catch (_) {}
          console.error("Failed to fetch role:", response.status, response.statusText, bodyText);
          setError(`Failed to load role (${response.status}). ${bodyText || response.statusText}`);
        }
      } catch (error) {
        console.error("Error fetching role:", error);
        setError("Network error loading role");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRole();
  }, [roleId, token]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const handleSelectAll = (category: string, checked: boolean) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...new Set([...prev.permissions, ...categoryPermissions])]
        : prev.permissions.filter(id => !categoryPermissions.includes(id))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.ROLE_BY_ID(roleId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          level: formData.level,
          permissions: formData.permissions
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - trigger sidebar refresh and show success inline (no redirect)
        createRefreshEvent();
        setError(null);
        // Optionally show a transient success indicator by briefly disabling the button
      } else {
        // Handle error response
        if (data.message === "Role already exists") {
          setError(`Role "${formData.name}" already exists. Please choose a different name.`);
        } else if (data.message === "No token, authorization denied") {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(data.message || "Failed to update role");
        }
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Role</h1>
          <p className="text-gray-600 dark:text-gray-400">Modify role: {formData.name}</p>
        </div>
        <Link href="/apps/roles">
          <Button color="gray" size="sm">
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back to Roles
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" value="Role Name *" />
                  <TextInput
                    id="name"
                    type="text"
                    placeholder="Enter role name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="level" value="Level *" />
                  <Select
                    id="level"
                    value={formData.level}
                    onChange={(e) => handleInputChange("level", parseInt(e.target.value))}
                  >
                    <option value={1}>Level 1 </option>
                    <option value={2}>Level 2 </option>
                    <option value={3}>Level 3</option>
                    <option value={4}>Level 4 </option>
                    {/* <option value={5}>Level 5 - Manager</option>     */}
                  </Select>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Created:</strong> {new Date(formData.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Version:</strong> {formData.__v}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Permissions</h3>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                      <input
                        type="checkbox"
                        checked={permissions.every(p => formData.permissions.includes(p.id))}
                        onChange={(e) => handleSelectAll(category, e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor={permission.id} className="font-medium">
                              {permission.name}
                            </Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6">
          <Link href="/apps/roles">
            <Button color="gray" type="button">
              Cancel
            </Button>
          </Link>
          <Button 
            color="primary" 
            type="submit" 
            disabled={isSubmitting || !formData.name}
            isProcessing={isSubmitting}
          >
            {isSubmitting ? "Updating Role..." : "Update Role"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditRolePage;
