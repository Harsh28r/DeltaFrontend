"use client";
import React, { useEffect, useState } from "react";
import CardBox from "@/app/components/shared/CardBox";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/config";
import { useWebSocket } from "@/app/context/WebSocketContext";

type Project = {
  _id: string;
  name: string;
  location?: string;
  logo?: string;
  developBy?: string;
};

const ProjectList: React.FC = () => {
  const { socket, connected } = useWebSocket();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ENDPOINTS.PROJECTS, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          mode: "cors",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed with ${res.status}`);
        }
        const json = await res.json().catch(() => ({}));
        const list: Project[] = Array.isArray(json)
          ? json
          : (json?.data || json?.projects || []);
        if (mounted) setProjects(list || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load projects");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProjects();
    return () => {
      mounted = false;
    };
  }, []);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('🔌 No socket available for projects list');
      return;
    }

    console.log('🔌 Setting up projects event listeners');

    // Listen for project events
    socket.on('project-created', (data) => {
      console.log('🆕 New project created:', data);
      setProjects(prev => {
        const newProjects = [data.project, ...prev];
        console.log('📝 Updated projects list:', newProjects);
        return newProjects;
      });
    });

    socket.on('project-updated', (data) => {
      console.log('✏️ Project updated:', data);
      setProjects(prev => {
        const updatedProjects = prev.map(project =>
          project._id === data.project._id ? data.project : project
        );
        console.log('📝 Updated projects list:', updatedProjects);
        return updatedProjects;
      });
    });

    socket.on('project-deleted', (data) => {
      console.log('🗑️ Project deleted:', data);
      setProjects(prev => {
        const filteredProjects = prev.filter(project => project._id !== data.projectId);
        console.log('📝 Updated projects list:', filteredProjects);
        return filteredProjects;
      });
    });

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up projects event listeners');
      socket.off('project-created');
      socket.off('project-updated');
      socket.off('project-deleted');
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 text-sm text-darklink">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 text-error text-sm">{error}</div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 text-sm text-darklink">No projects found.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {projects.map((p) => (
        <div key={p._id} className="lg:col-span-4 md:col-span-6 col-span-12">
          <CardBox className="p-6">
            <div className="flex items-center gap-4">
              {p.logo && p.logo.trim() ? (
                <div className="relative">
                  <Image
                    src={p.logo}
                    alt={p.name}
                    width={56}
                    height={56}
                    className="rounded-md object-cover"
                    onError={() => {
                      // Image failed to load - Next.js will handle this gracefully
                    }}
                    unoptimized={true}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-md bg-ld flex items-center justify-center text-sm text-darklink">
                  Logo
                </div>
              )}
              <div>
                <h5 className="text-base font-semibold">{p.name}</h5>
                <p className="text-xs text-darklink">{p.location || "—"}</p>
                <p className="text-[11px] text-darklink mt-1">
                  Developed by: {p.developBy || "—"}
                </p>
              </div>
            </div>
          </CardBox>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;