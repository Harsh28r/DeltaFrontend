"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge } from "flowbite-react";
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

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  companyName: string;
  roleName: string;
  createdAt: string;
  __v: number;
}

const RoleUsersPage = () => {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState<string>("all");

  const roleName = params.roleName as string;

  useEffect(() => {
    if (token && roleName) {
      fetchRoleData();
    }
  }, [token, roleName]);

  useEffect(() => {
    if (role) {
      fetchRoleUsers();
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

  const fetchRoleUsers = async () => {
    try {
      // Use the new API endpoint to get users by role
      const response = await fetch(API_ENDPOINTS.USERS_BY_ROLE(role?.name || ''), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        const roleUsers = data.users || data;
        setUsers(roleUsers);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile.includes(searchTerm);
    const matchesCompany = filterCompany === "all" || user.companyName === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(API_ENDPOINTS.DELETE_USER(userId), {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          createRefreshEvent();
          setUsers(users.filter(user => user._id !== userId));
        } else {
          const data = await response.json();
          alert(`Failed to delete user: ${data.message}`);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user");
      }
    }
  };

  const getUniqueCompanies = () => {
    const companies = [...new Set(users.map(user => user.companyName))];
    return companies.filter(company => company);
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
             {role.name.toUpperCase()}
           </h1>
           <p className="text-gray-600 dark:text-gray-400">
             Manage all {role.name.toUpperCase()}
           </p>
         </div>
        <div className="flex gap-2">
          <Link href={`/apps/role-modules/${roleName}/add`}>
            <Button color="primary" size="sm">
              <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
              Add New {role.name.toUpperCase()} User
            </Button>
          </Link>
          <Button 
            color="gray" 
            size="sm"
            onClick={() => router.back()}
          >
            <Icon icon="solar:arrow-left-line-duotone" className="mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search ${role.name} users by name, email, or mobile...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            >
              <option value="all">All Companies</option>
              {getUniqueCompanies().map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Mobile</Table.HeadCell>
              <Table.HeadCell>Company</Table.HeadCell>
              <Table.HeadCell>Role</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {filteredUsers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Icon icon="solar:users-group-rounded-line-duotone" className="text-4xl mx-auto mb-2" />
                      <p>No {role.name} users found</p>
                      <p className="text-sm">Create the first {role.name} user to get started</p>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredUsers.map((user) => (
                  <Table.Row key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </Table.Cell>
                    <Table.Cell className="text-gray-600 dark:text-gray-400">
                      {user.email}
                    </Table.Cell>
                    <Table.Cell className="text-gray-600 dark:text-gray-400">
                      {user.mobile}
                    </Table.Cell>
                    <Table.Cell className="text-gray-600 dark:text-gray-400">
                      {user.companyName || "N/A"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="info">
                        {user.roleName.toUpperCase()}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Link href={`/apps/users/edit/${user._id}`}>
                          <Button size="xs" color="info">
                            <Icon icon="solar:pen-line-duotone" />
                          </Button>
                        </Link>
                        <Link href={`/apps/users/view/${user._id}`}>
                          <Button size="xs" color="success">
                            <Icon icon="solar:eye-line-duotone" />
                          </Button>
                        </Link>
                        <Button 
                          size="xs" 
                          color="failure"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Icon icon="solar:trash-bin-trash-line-duotone" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </Card>

             {/* Summary */}
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {filteredUsers.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {filteredUsers.length === 1 ? 'user' : 'users'} created by super admin with {role.name.toUpperCase()} role
            </div>
          </div>
        </Card>
    </div>
  );
};

export default RoleUsersPage;
