"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label } from "flowbite-react";
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

const ViewUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [projectAssignments, setProjectAssignments] = useState<{[key: string]: {projectId: string, projectName: string}}>({});

  const userId = params.id as string;

  // Fetch user data and project assignments
  useEffect(() => {
    if (token && userId) {
      fetchUserData();
      fetchProjectAssignments();
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

  const fetchProjectAssignments = async () => {
    try {
      // Fetch all projects to get project names and members
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projects = projectsData.projects || projectsData;
        
        // Extract member assignments from each project
        const assignmentMap: {[key: string]: {projectId: string, projectName: string}} = {};
        
        projects.forEach((project: any) => {
          if (project.members && Array.isArray(project.members)) {
            project.members.forEach((member: any) => {
              if (member._id) {
                assignmentMap[member._id] = {
                  projectId: project._id,
                  projectName: project.name
                };
              }
            });
          }
        });
        
        setProjectAssignments(assignmentMap);
      }
    } catch (error) {
      console.error("Error fetching project assignments:", error);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Details</h1>
          <p className="text-gray-600 dark:text-gray-400">View user information</p>
        </div>
      </div>

      {/* User Information */}
      <Card className="max-w-2xl">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white font-medium">
                {user.name}
              </span>
            </div>
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white">
                {user.email}
              </span>
            </div>
          </div>

          {/* Mobile */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mobile Number
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white">
                {user.mobile}
              </span>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Name
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white">
                {user.companyName || "Not specified"}
              </span>
            </div>
          </div>

          {/* Role */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {user.roleName.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Project Assignment */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Assignment
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              {(() => {
                // First try to get project info from user data
                if (user.projectName) {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {user.projectName}
                    </span>
                  );
                }
                
                // Then try to get from fetched project assignments
                const assignment = projectAssignments[user._id];
                if (assignment && assignment.projectName) {
                  return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {assignment.projectName}
                    </span>
                  );
                }
                
                // Finally, show not assigned
                return (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    Not Assigned
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Created Date */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created Date
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              color="info" 
              size="lg"
              onClick={() => router.push(`/apps/users/edit/${user._id}`)}
              className="flex-1"
            >
              <Icon icon="solar:pen-line-duotone" className="mr-2" />
              Edit User
            </Button>
            <Button 
              color="gray" 
              size="lg"
              onClick={() => router.push("/apps/users")}
              className="flex-1"
            >
              Back to Users
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ViewUserPage;
