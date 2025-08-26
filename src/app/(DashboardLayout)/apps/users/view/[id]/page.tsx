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

interface UserHistory {
  user: {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    companyName: string;
    currentRole: {
      name: string;
      level: number;
      permissions: string[];
      roleId: string;
    };
    accountCreated: string;
    accountStatus: string;
  };
  timeline: {
    events: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      status: string;
      timestamp: string;
      details: any;
      icon: string;
      color: string;
    }>;
    stats: {
      totalEvents: number;
      accountAge: number;
      totalProjects: number;
      currentRole: string;
      currentLevel: number;
      permissionsCount: number;
    };
    summary: {
      journey: string;
      totalMilestones: number;
      currentStatus: string;
    };
  };
  currentRole: {
    name: string;
    level: number;
    permissions: string[];
    roleId: string;
  };
  projectSummary: {
    total: number;
    owned: number;
    managed: number;
    member: number;
  };
}

const ViewUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const [isFetching, setIsFetching] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userHistory, setUserHistory] = useState<UserHistory | null>(null);
  const [projectAssignments, setProjectAssignments] = useState<{[key: string]: {projectId: string, projectName: string}}>({});

  const userId = params.id as string;

  // Fetch user data and project assignments
  useEffect(() => {
    if (token && userId) {
      fetchUserHistory();
      fetchProjectAssignments();
    }
  }, [token, userId]);

  const fetchUserData = async () => {
    try {
      if (!token) {
        console.error("No authentication token available");
        router.push("/auth/auth1/signin");
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed - token expired or invalid");
          localStorage.removeItem("token");
          router.push("/auth/auth1/signin");
          return;
        }
        
        const data = await response.json();
        alert(`Failed to fetch user: ${data.message || response.statusText}`);
        router.push("/apps/users");
        return;
      }
      
      const data = await response.json();
      setUser(data.user || data);
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

  const fetchUserHistory = async () => {
    try {
      if (!token) {
        console.error("No authentication token available");
        router.push("/auth/auth1/login");
        return;
      }

      const response = await fetch(API_ENDPOINTS.USER_HISTORY(userId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication failed - token expired or invalid");
          localStorage.removeItem("token");
          router.push("/auth/auth1/login");
          return;
        }
        
        const data = await response.json();
        alert(`Failed to fetch user history: ${data.message || response.statusText}`);
        router.push("/apps/users");
        return;
      }
      
      const data = await response.json();
      console.log("Fetched user history:", data);
      console.log("Timeline events:", data.timeline?.events);
      console.log("Project assignment events:", data.timeline?.events?.filter((e: any) => e.type === 'project_assignment'));
      console.log("First project assignment:", data.timeline?.events?.find((e: any) => e.type === 'project_assignment'));
      
      setUserHistory(data);
      
      // Also set the user data for backward compatibility
      setUser({
        _id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        mobile: data.user.mobile,
        companyName: data.user.companyName,
        roleName: data.user.currentRole.name,
        projectId: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectId || "",
        projectName: data.timeline?.events?.find((e: any) => e.type === 'project_assignment')?.details?.projectName || "",
        createdAt: data.user.accountCreated
      });
    } catch (error) {
      console.error("Error fetching user history:", error);
      alert("Failed to fetch user history data");
      router.push("/apps/users");
    } finally {
      setIsFetching(false);
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
                {user.name || "Not specified"}
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
                {user.email || "Not specified"}
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
                {user.mobile || "Not specified"}
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
                {userHistory?.user.currentRole.name ? userHistory.user.currentRole.name.toUpperCase() : (user.roleName ? user.roleName.toUpperCase() : "No Role Assigned")}
              </span>
              {userHistory?.user.currentRole && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <p>Level: {userHistory.user.currentRole.level}</p>
                  <p>Role ID: {userHistory.user.currentRole.roleId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Assignment */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Project Assignment
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              {userHistory?.timeline?.events && userHistory.timeline.events.filter((e: any) => e.type === 'project_assignment').length > 0 ? (
                <div className="space-y-2">
                  {userHistory.timeline.events
                    .filter((e: any) => e.type === 'project_assignment')
                    .map((event, index) => (
                      <div key={event.id} className="p-2 bg-white dark:bg-gray-600 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {event.details.projectName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {event.details.roleInProject}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <p>Location: {event.details.location}</p>
                          <p>Developed by: {event.details.developBy}</p>
                          <p>Joined: {new Date(event.timestamp).toLocaleDateString()}</p>
                          <p>Status: {event.details.projectStatus}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : user.projectName ? (
                <div className="p-2 bg-white dark:bg-gray-600 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {user.projectName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Member
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Project ID: {user.projectId}</p>
                    <p>Status: Active</p>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 text-sm">Not Assigned to any project</span>
              )}
            </div>
          </div>

          {/* Created Date */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Created Date
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
              <span className="text-gray-900 dark:text-white">
                {userHistory?.user.accountCreated ? new Date(userHistory.user.accountCreated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : (user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : "Date not available")}
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
