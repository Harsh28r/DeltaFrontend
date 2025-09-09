"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";
import { useRouter } from "next/navigation";

interface Role {
  _id: string;
  name: string;
  level: number;
  permissions: string[];
  createdAt: string;
  __v: number;
}

const RolesPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");

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
        if (data.message === "No token, authorization denied") {
          // Handle token expiration or invalid token
          console.error("Token is invalid or expired");
        }
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || role.level.toString() === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        const response = await fetch(API_ENDPOINTS.ROLE_BY_ID(roleId), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // Success - trigger sidebar refresh and update local state
          createRefreshEvent();
          setRoles(roles.filter(role => role._id !== roleId));
        } else {
          const data = await response.json();
          alert(`Failed to delete role: ${data.message}`);
        }
      } catch (error) {
        console.error("Error deleting role:", error);
        alert("Failed to delete role");
      }
    }
  };

  const handleEditRole = (roleId: string) => {
    console.log("Edit button clicked for role ID:", roleId);
    console.log("Navigating to:", `/apps/roles/edit/${roleId}`);
    router.push(`/apps/roles/edit/${roleId}`);
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

  const getPermissionsText = (permissions: string[]) => {
    if (permissions.length === 0) return "No permissions";
    if (permissions.length > 3) {
      return `${permissions.slice(0, 3).join(", ")} +${permissions.length - 3} more`;
    }
    return permissions.join(", ");
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
        </div>
        <Link href="/apps/roles/add">
          <Button color="primary" size="sm">
            <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
            Add New Role
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search roles..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Roles Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Role Name</Table.HeadCell>
              <Table.HeadCell>Level</Table.HeadCell>
              <Table.HeadCell>Permissions</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {filteredRoles.map((role) => (
                <Table.Row key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Table.Cell className="font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </Table.Cell>
                  <Table.Cell>
                    {getLevelBadge(role.level)}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    <span className="text-sm">{getPermissionsText(role.permissions)}</span>
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button 
                        size="xs" 
                        color="info"
                        className="flex items-center gap-1"
                        title="Edit Role"
                        onClick={() => handleEditRole(role._id)}
                      >
                        <Icon icon="solar:pen-line-duotone" className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button 
                        size="xs" 
                        color="failure"
                        onClick={() => handleDeleteRole(role._id)}
                        className="flex items-center gap-1"
                        title="Delete Role"
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default RolesPage;
