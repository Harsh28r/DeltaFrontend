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
    // User Management
    { id: "users:manage", name: "Manage Users", description: "Can create, edit, and delete users", category: "User Management" },
    { id: "users:read", name: "View Users", description: "Can view user information", category: "User Management" },
    { id: "users:create", name: "Create Users", description: "Can create new users", category: "User Management" },
    { id: "users:update", name: "Update Users", description: "Can update user information", category: "User Management" },
    { id: "users:delete", name: "Delete Users", description: "Can delete users", category: "User Management" },
    
    // Role Management
    { id: "roles:read", name: "View Roles", description: "Can view role information", category: "Role Management" },
    { id: "roles:create", name: "Create Roles", description: "Can create new roles", category: "Role Management" },
    { id: "roles:update", name: "Update Roles", description: "Can update role information", category: "Role Management" },
    { id: "roles:delete", name: "Delete Roles", description: "Can delete roles", category: "Role Management" },
    
    // Project Management
    { id: "projects:read", name: "View Projects", description: "Can view project details", category: "Project Management" },
    { id: "projects:create", name: "Create Projects", description: "Can create new projects", category: "Project Management" },
    { id: "projects:update", name: "Update Projects", description: "Can update project information", category: "Project Management" },
    { id: "projects:delete", name: "Delete Projects", description: "Can delete projects", category: "Project Management" },
    
    // User Projects
    { id: "user-projects:read", name: "Read User Projects", description: "Can view user project assignments", category: "User Projects" },
    { id: "user-projects:assign", name: "Assign User Projects", description: "Can assign users to projects", category: "User Projects" },
    { id: "user-projects:remove", name: "Remove User Projects", description: "Can remove users from projects", category: "User Projects" },
    { id: "user-projects:bulk-update", name: "Bulk Update User Projects", description: "Can update multiple user project assignments", category: "User Projects" },
    { id: "user-projects:bulk-delete", name: "Bulk Delete User Projects", description: "Can delete multiple user project assignments", category: "User Projects" },
    
    // Notifications
    { id: "notifications:read", name: "Read Notifications", description: "Can read notifications", category: "Notifications" },
    { id: "notifications:create", name: "Create Notifications", description: "Can create notifications", category: "Notifications" },
    { id: "notifications:update", name: "Update Notifications", description: "Can update notifications", category: "Notifications" },
    { id: "notifications:delete", name: "Delete Notifications", description: "Can delete notifications", category: "Notifications" },
    { id: "notifications:bulk-update", name: "Bulk Update Notifications", description: "Can update multiple notifications", category: "Notifications" },
    { id: "notifications:bulk-delete", name: "Bulk Delete Notifications", description: "Can delete multiple notifications", category: "Notifications" },
    
    // Leads Management
    { id: "leads:create", name: "Create Leads", description: "Can create new leads", category: "Leads Management" },
    { id: "leads:read", name: "Read Leads", description: "Can view lead information", category: "Leads Management" },
    { id: "leads:update", name: "Update Leads", description: "Can update lead information", category: "Leads Management" },
    { id: "leads:delete", name: "Delete Leads", description: "Can delete leads", category: "Leads Management" },
    { id: "leads:bulk", name: "Bulk Leads Operations", description: "Can perform bulk operations on leads", category: "Leads Management" },
    { id: "leads:transfer", name: "Transfer Leads", description: "Can transfer leads between users", category: "Leads Management" },
    { id: "leads:bulk-delete", name: "Bulk Delete Leads", description: "Can delete multiple leads", category: "Leads Management" },
    
    // Lead Sources Management
    { id: "leadssource:create", name: "Create Lead Sources", description: "Can create new lead sources (Superadmin only)", category: "Lead Sources Management" },
    { id: "leadssource:read_all", name: "Read All Lead Sources", description: "Can view all lead sources", category: "Lead Sources Management" },
    { id: "leadssource:read", name: "Read Lead Sources", description: "Can view lead source information", category: "Lead Sources Management" },
    { id: "leadssource:update", name: "Update Lead Sources", description: "Can update lead source information (Superadmin only)", category: "Lead Sources Management" },
    { id: "leadssource:delete", name: "Delete Lead Sources", description: "Can delete lead sources (Superadmin only)", category: "Lead Sources Management" },
    
    // Lead Status Management
    { id: "leadsstatus:create", name: "Create Lead Statuses", description: "Can create new lead statuses (Superadmin only)", category: "Lead Status Management" },
    { id: "leadsstatus:read_all", name: "Read All Lead Statuses", description: "Can view all lead statuses", category: "Lead Status Management" },
    { id: "leadsstatus:read", name: "Read Lead Statuses", description: "Can view lead status information", category: "Lead Status Management" },
    { id: "leadsstatus:update", name: "Update Lead Statuses", description: "Can update lead status information (Superadmin only)", category: "Lead Status Management" },
    { id: "leadsstatus:delete", name: "Delete Lead Statuses", description: "Can delete lead statuses (Superadmin only)", category: "Lead Status Management" },
    
    // Channel Partners Management
    { id: "channel-partner:create", name: "Create Channel Partners", description: "Can create new channel partners (Superadmin only)", category: "Channel Partners Management" },
    { id: "channel-partner:read_all", name: "Read All Channel Partners", description: "Can view all channel partners", category: "Channel Partners Management" },
    { id: "channel-partner:read", name: "Read Channel Partners", description: "Can view channel partner information", category: "Channel Partners Management" },
    { id: "channel-partner:update", name: "Update Channel Partners", description: "Can update channel partner information (Superadmin only)", category: "Channel Partners Management" },
    { id: "channel-partner:delete", name: "Delete Channel Partners", description: "Can delete channel partners (Superadmin only)", category: "Channel Partners Management" },
    { id: "channel-partner:bulk-create", name: "Bulk Create Channel Partners", description: "Can create multiple channel partners (Superadmin only)", category: "Channel Partners Management" },
    { id: "channel-partner:bulk-update", name: "Bulk Update Channel Partners", description: "Can update multiple channel partners (Superadmin only)", category: "Channel Partners Management" },
    { id: "channel-partner:bulk-delete", name: "Bulk Delete Channel Partners", description: "Can delete multiple channel partners (Superadmin only)", category: "Channel Partners Management" },
    { id: "leads:status:update", name: "Update Lead Statuses", description: "Can update lead status information ", category: "Lead Status Management" },
    // CP Sourcing Management
    { id: "cp-sourcing:create", name: "Create CP Sourcing", description: "Can create new CP sourcing records", category: "CP Sourcing Management" },
    { id: "cp-sourcing:read", name: "Read CP Sourcing", description: "Can view CP sourcing information", category: "CP Sourcing Management" },
    { id: "cp-sourcing:update", name: "Update CP Sourcing", description: "Can update CP sourcing information", category: "CP Sourcing Management" },
    { id: "cp-sourcing:delete", name: "Delete CP Sourcing", description: "Can delete CP sourcing records", category: "CP Sourcing Management" },
    { id: "cp-sourcing:bulk-create", name: "Bulk Create CP Sourcing", description: "Can create multiple CP sourcing records", category: "CP Sourcing Management" },
    { id: "cp-sourcing:bulk-update", name: "Bulk Update CP Sourcing", description: "Can update multiple CP sourcing records", category: "CP Sourcing Management" },
    { id: "cp-sourcing:bulk-delete", name: "Bulk Delete CP Sourcing", description: "Can delete multiple CP sourcing records", category: "CP Sourcing Management" },
    
    // Lead Activities Management
    { id: "lead-activities:read", name: "Read Lead Activities", description: "Can view lead activity information", category: "Lead Activities Management" },
    { id: "lead-activities:bulk-update", name: "Bulk Update Lead Activities", description: "Can update multiple lead activities (Superadmin only)", category: "Lead Activities Management" },
    { id: "lead-activities:bulk-delete", name: "Bulk Delete Lead Activities", description: "Can delete multiple lead activities (Superadmin only)", category: "Lead Activities Management" },
    
    // User Reporting Management
    { id: "user-reporting:create", name: "Create User Reporting", description: "Can create user reporting structures", category: "User Reporting Management" },
    { id: "user-reporting:read", name: "Read User Reporting", description: "Can view user reporting information", category: "User Reporting Management" },
    { id: "user-reporting:update", name: "Update User Reporting", description: "Can update user reporting structures", category: "User Reporting Management" },
    { id: "user-reporting:delete", name: "Delete User Reporting", description: "Can delete user reporting structures", category: "User Reporting Management" },
    { id: "user-reporting:bulk-update", name: "Bulk Update User Reporting", description: "Can update multiple user reporting structures", category: "User Reporting Management" },
    { id: "user-reporting:bulk-delete", name :"Bulk Delete User Reporting", description: "Can delete multiple user reporting structures", category: "User Reporting Management" },
    
    // Follow-up Management
    { id: "followups:create", name: "Create Follow-ups", description: "Can create new follow-ups", category: "Follow-up Management" },
    { id: "followups:read", name: "Read Follow-ups", description: "Can view follow-up information", category: "Follow-up Management" },
    { id: "followups:update", name: "Update Follow-ups", description: "Can update follow-up information", category: "Follow-up Management" },
    { id: "followups:delete", name: "Delete Follow-ups", description: "Can delete follow-ups", category: "Follow-up Management" },

    // Attendance Management
    { id: "attendance:create", name: "Create Attendance", description: "Can create new attendance records", category: "Attendance Management" },
    { id: "attendance:read", name: "Read Attendance", description: "Can view attendance information", category: "Attendance Management" },
    { id: "attendance:update", name: "Update Attendance", description: "Can update attendance information", category: "Attendance Management" },
    { id: "attendance:delete", name: "Delete Attendance", description: "Can delete attendance records", category: "Attendance Management" },
    { id: "attendance:read_all", name: "Read All Attendance", description: "Can view all attendance records", category: "Attendance Management" },

    // Reporting
    { id: "reporting:read", name: "Read Reporting", description: "Can access reporting and analytics", category: "Reporting" }
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
                    <option value={5}>Level 5 </option>
                    <option value={6}>Level 6 </option>
                    <option value={7}>Level 7 </option>
                    <option value={8}>Level 8 </option>
                    <option value={9}>Level 9 </option>
                    <option value={10}>Level 10 </option>
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
