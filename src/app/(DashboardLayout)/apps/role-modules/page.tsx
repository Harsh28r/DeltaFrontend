"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Modal } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface Role {
  _id: string;
  name: string;
  level: number;
  permissions: string[];
  createdAt: string;
  __v: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const RoleModulesPage = () => {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showModal, setShowModal] = useState(false);

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
    { id: "view_settings", name: "View Settings", description: "Can view system settings", category: "System Settings" },
    
    // Lead Management
    { id: "leads:create", name: "Create Leads", description: "Can create lead sources and statuses", category: "Lead Management" },
    { id: "leads:read", name: "View Leads", description: "Can view lead sources and statuses", category: "Lead Management" },
    { id: "leads:update", name: "Update Leads", description: "Can update lead sources and statuses", category: "Lead Management" },
    { id: "leads:delete", name: "Delete Leads", description: "Can delete lead sources and statuses", category: "Lead Management" },
    
    // Lead Sources
    { id: "lead-sources:create", name: "Create Lead Sources", description: "Can create lead sources", category: "Lead Management" },
    { id: "lead-sources:read", name: "View Lead Sources", description: "Can view lead sources", category: "Lead Management" },
    { id: "lead-sources:update", name: "Update Lead Sources", description: "Can update lead sources", category: "Lead Management" },
    { id: "lead-sources:delete", name: "Delete Lead Sources", description: "Can delete lead sources", category: "Lead Management" },
    
    // Lead Statuses
    { id: "lead-statuses:create", name: "Create Lead Statuses", description: "Can create lead statuses", category: "Lead Management" },
    { id: "lead-statuses:read", name: "View Lead Statuses", description: "Can view lead statuses", category: "Lead Management" },
    { id: "lead-statuses:update", name: "Update Lead Statuses", description: "Can update lead statuses", category: "Lead Management" },
    { id: "lead-statuses:delete", name: "Delete Lead Statuses", description: "Can delete lead statuses", category: "Lead Management" }
  ];

  // Fetch roles from backend
  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token]);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelBadge = (level?: number | string) => {
    const normalizedLevel = typeof level === "string" ? parseInt(level, 10) : level;
    const levelColors: Record<number, string> = {
      1: "info",
      2: "warning",
      3: "success",
      4: "purple",
      5: "gray",
    };

    const color = normalizedLevel && levelColors[normalizedLevel] ? levelColors[normalizedLevel] : "gray";
    const label = normalizedLevel ? `Level ${normalizedLevel}` : "Level N/A";

    return (
      <Badge color={color}>
        {label}
      </Badge>
    );
  };

  const getPermissionDetails = (permissionIds: string[]) => {
    const permissionDetails = permissionIds.map(id => {
      const permission = availablePermissions.find(p => p.id === id);
      return permission || { id, name: id, description: "Unknown permission", category: "Unknown" };
    });

    // Group by category
    const grouped = permissionDetails.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  };

  const openRoleDetails = (role: Role) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Modules</h1>
          <p className="text-gray-600 dark:text-gray-400">Dynamic modules based on created roles</p>
        </div>
        <Link href="/apps/role-modules/create">
          <Button color="primary" size="sm">
            <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
            Create New Module
          </Button>
        </Link>
      </div>

      {/* Role Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role._id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openRoleDetails(role)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon icon="solar:shield-user-outline" className="text-primary text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  {getLevelBadge(role.level)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Permissions:</strong> {role.permissions.length} granted
                </p>
                {role.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} color="gray" size="sm">
                        {permission}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge color="gray" size="sm">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(role.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="xs" color="info" className="flex-1">
                <Icon icon="solar:eye-line-duotone" className="mr-1" />
                View Details
              </Button>
              <Link href={`/apps/roles/edit/${role._id}`}>
                <Button size="xs" color="warning">
                  <Icon icon="solar:pen-line-duotone" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* No Roles Message */}
      {roles.length === 0 && (
        <Card className="text-center py-12">
          <Icon icon="solar:shield-user-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Role Modules Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first role to see it appear as a module here.
          </p>
          <Link href="/apps/roles/add">
            <Button color="primary">
              <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
              Create First Role
            </Button>
          </Link>
        </Card>
      )}

      {/* Role Details Modal */}
      <Modal show={showModal} onClose={closeModal} size="4xl">
        <Modal.Header>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon icon="solar:shield-user-outline" className="text-primary" />
            </div>
            <span className="text-xl font-semibold">
              {selectedRole?.name} Module Details
            </span>
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedRole && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Role Name:</span>
                      <span className="font-medium">{selectedRole.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Level:</span>
                      <span>{getLevelBadge(selectedRole.level)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span>{new Date(selectedRole.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Version:</span>
                      <span>{selectedRole.__v}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Permissions Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Permissions:</span>
                      <Badge color="primary">{selectedRole.permissions.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <Badge color="success">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Permissions</h4>
                {selectedRole.permissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No permissions assigned to this role.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(getPermissionDetails(selectedRole.permissions)).map(([category, permissions]) => (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                          <Icon icon="solar:folder-line-duotone" className="mr-2 text-primary" />
                          {category}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Icon icon="solar:check-circle-line-duotone" className="text-green-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-sm">{permission.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{permission.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-between w-full">
            <Link href={`/apps/roles/edit/${selectedRole?._id}`}>
              <Button color="warning">
                <Icon icon="solar:pen-line-duotone" className="mr-2" />
                Edit Role
              </Button>
            </Link>
            <Button color="gray" onClick={closeModal}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoleModulesPage;
