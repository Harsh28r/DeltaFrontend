"use client";
import React, { useEffect, useMemo, useState } from "react";
import CardBox from "@/app/components/shared/CardBox";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/config";

type Project = {
  _id: string;
  name: string;
  location?: string;
  logo?: string;
  developBy?: string;
};

const getAuthToken = (): string | null => {
  try {
    const keys = ["auth_token", "accessToken", "token", "authToken", "jwt"];
    if (typeof window !== "undefined") {
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) return v;
      }
      for (const k of keys) {
        const v = sessionStorage.getItem(k);
        if (v) return v;
      }
    }
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|;\s*)(?:auth_token|token|accessToken)=([^;]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
  } catch {}
  return null;
};

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => {
    const t = getAuthToken();
    return t ? t.replace(/^"|"$/g, "").trim() : null;
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) throw new Error("No token found. Please sign in first.");
        const res = await fetch(API_ENDPOINTS.PROJECTS, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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
  }, [token]);

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