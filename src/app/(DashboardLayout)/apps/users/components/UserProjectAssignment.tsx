"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Label, Select, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
}

interface UserProjectAssignmentProps {
  userId?: string;
  userName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const UserProjectAssignment: React.FC<UserProjectAssignmentProps> = ({
  userId,
  userName,
  onSuccess,
  onCancel
}) => {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
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
      const projectsList = data.projects || data;
      
      if (Array.isArray(projectsList)) {
        setProjects(projectsList);
      } else {
        console.error("Invalid projects data format:", data);
        setMessage({ type: 'error', text: 'Failed to load projects' });
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setMessage({ type: 'error', text: 'Failed to load projects' });
    }
  };

  const handleAssignToProject = async () => {
    if (!selectedProjectId) {
      setMessage({ type: 'error', text: 'Please select a project' });
      return;
    }

    if (!userId) {
      setMessage({ type: 'error', text: 'No user ID provided' });
      return;
    }

    setIsAssigning(true);
    setMessage(null);

    try {
      const assignPayload = {
        projectId: selectedProjectId,
        userId: userId
      };
      
      const assignResponse = await fetch(API_ENDPOINTS.ASSIGN_PROJECT_MEMBER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignPayload),
      });

      if (assignResponse.ok) {
        setMessage({ type: 'success', text: 'User assigned to project successfully!' });
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        const assignData = await assignResponse.json();
        setMessage({ 
          type: 'error', 
          text: `Failed to assign user to project: ${assignData.message || assignData.error || 'Unknown error'}` 
        });
      }
    } catch (assignError) {
      console.error("Error assigning user to project:", assignError);
      setMessage({ type: 'error', text: 'Failed to assign user to project' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setMessage(null);
  };

  if (isLoading) {
    return (
      <Card className="max-w-md">
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assign User to Project
          </h3>
          {userName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assigning: <span className="font-medium">{userName}</span>
            </p>
          )}
        </div>

        {message && (
          <Alert color={message.type === 'success' ? 'success' : 'failure'}>
            {message.text}
          </Alert>
        )}

        <div>
          <div className="mb-2 block">
            <Label htmlFor="projectSelect" value="Select Project *" />
          </div>
          <Select
            id="projectSelect"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            required
          >
            <option value="">Choose a project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleAssignToProject}
            disabled={isAssigning || !selectedProjectId}
            color="primary"
            size="sm"
            className="flex-1"
          >
            {isAssigning ? (
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
          {onCancel && (
            <Button 
              onClick={onCancel}
              color="gray"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserProjectAssignment;
