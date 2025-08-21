"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Table } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
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

const RoleModuleDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const { token } = useAuth();
  
  const [role, setRole] = useState<Role | null>(null);
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

  useEffect(() => {
    if (token && roleId) {
      fetchRole();
    }
  }, [token, roleId]);

  const fetchRole = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.ROLE_BY_ID(roleId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRole(data.role || data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch role");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelBadge = (level: number) => {
    const levelColors = {
      1: "info",
      2: "warning", 
      3: "success",
      4: "purple",
      5: "gray"
    } as const;
    
    return (
      <Badge color={levelColors[level as keyof typeof levelColors] || "gray"}>
        Level {level}
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <Icon icon="solar:warning-circle-line-duotone" className="text-6xl text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Module</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Link href="/apps/role-modules">
            <Button color="primary">
              <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
              Back to Modules
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <Icon icon="solar:shield-user-outline" className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Module Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested role module could not be found.</p>
          <Link href="/apps/role-modules">
            <Button color="primary">
              <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
              Back to Modules
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{role.name} Module</h1>
          <p className="text-gray-600 dark:text-gray-400">SuperAdmin Role Module Details</p>
        </div>
        <div className="flex gap-2">
          <Link href="/apps/role-modules">
            <Button color="gray" size="sm">
              <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
              Back to Modules
            </Button>
          </Link>
          <Link href={`/apps/roles/edit/${role._id}`}>
            <Button color="warning" size="sm">
              <Icon icon="solar:pen-line-duotone" className="mr-2" />
              Edit Module
            </Button>
          </Link>
        </div>
      </div>

      {/* Module Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon icon="solar:shield-user-outline" className="text-primary text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
              {getLevelBadge(role.level)}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge color="success">Active</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Permissions:</span>
              <span className="font-medium">{role.permissions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{new Date(role.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span>{role.__v}</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href={`/apps/roles/edit/${role._id}`}>
              <Button color="warning" className="w-full justify-start">
                <Icon icon="solar:pen-line-duotone" className="mr-2" />
                Edit Module
              </Button>
            </Link>
            <Link href="/apps/roles">
              <Button color="info" className="w-full justify-start">
                <Icon icon="solar:list-line-duotone" className="mr-2" />
                View All Roles
              </Button>
            </Link>
            <Link href="/apps/roles/add">
              <Button color="primary" className="w-full justify-start">
                <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                Create New Role
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-4">Module Statistics</h3>
          <div className="space-y-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{role.permissions.length}</div>
              <div className="text-sm text-blue-600">Total Permissions</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{role.level}</div>
              <div className="text-sm text-green-600">Access Level</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Permissions */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Module Permissions</h3>
        {role.permissions.length === 0 ? (
          <div className="text-center py-8">
            <Icon icon="solar:shield-user-outline" className="text-4xl text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No permissions assigned to this module.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(getPermissionDetails(role.permissions)).map(([category, permissions]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Icon icon="solar:folder-line-duotone" className="mr-2 text-primary" />
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
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
      </Card>

      {/* Module Information Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Module Information</h3>
        <Table>
          <Table.Body>
            <Table.Row>
              <Table.Cell className="font-medium">Module Name</Table.Cell>
              <Table.Cell>{role.name}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="font-medium">Access Level</Table.Cell>
              <Table.Cell>{getLevelBadge(role.level)}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="font-medium">Total Permissions</Table.Cell>
              <Table.Cell>{role.permissions.length}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="font-medium">Created Date</Table.Cell>
              <Table.Cell>{new Date(role.createdAt).toLocaleDateString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="font-medium">Last Modified</Table.Cell>
              <Table.Cell>{new Date(role.createdAt).toLocaleDateString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell className="font-medium">Version</Table.Cell>
              <Table.Cell>{role.__v}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
};

export default RoleModuleDetailPage;
