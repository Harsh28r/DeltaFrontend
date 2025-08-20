"use client";
import React, { useState } from "react";
import { Alert, Button, Label, TextInput } from "flowbite-react";

type ProjectForm = {
  name: string;
  location: string;
  developBy: string;
  logo?: string;  // Make logo optional
};

const ProjectAddForm = () => {
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    location: "",
    developBy: "",
    logo: "",  // Keep empty string as default
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });

  const getAuthToken = (): string | null => {
    try {
      // Prefer auth_token stored by login, then common keys in local/session storage
      const possibleKeys = ["auth_token", "accessToken", "token", "authToken", "jwt"];
      if (typeof window !== "undefined") {
        for (const key of possibleKeys) {
          const ls = localStorage.getItem(key);
          if (ls) return ls;
        }
        for (const key of possibleKeys) {
          const ss = sessionStorage.getItem(key);
          if (ss) return ss;
        }
      }
      // Fallback to cookies
      if (typeof document !== "undefined") {
        const cookieMatch = document.cookie.match(/(?:^|;\s*)(?:auth_token|token|accessToken)=([^;]+)/);
        if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleChange = (key: keyof ProjectForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("No token found. Please sign in first.");
      }
      const sanitizedToken = token.replace(/^"|"$/g, "").trim();
      
      // Only send logo if it has a value
      const formData = {
        name: form.name,
        location: form.location,
        developBy: form.developBy,
        ...(form.logo && form.logo.trim() && { logo: form.logo.trim() })
      };

      try {
        console.debug(
          "Sending Authorization header:",
          `Bearer ${sanitizedToken.slice(0, 6)}...${sanitizedToken.slice(-4)}`
        );
      } catch {}
      
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sanitizedToken}`,
        },
        body: JSON.stringify(formData),
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || `Request failed with ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      setStatus({ type: "success", message: "Project created successfully." });
      // Reset form after success
      setForm({ name: "", location: "", developBy: "", logo: "" });
    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
      {status.type === "success" ? (
        <div className="col-span-12">
          <Alert color="success">{status.message}</Alert>
        </div>
      ) : null}
      {status.type === "error" ? (
        <div className="col-span-12">
          <Alert color="failure">{status.message}</Alert>
        </div>
      ) : null}
      <div className="lg:col-span-6 col-span-12">
        <Label htmlFor="name" value="Project Name" />
        <TextInput id="name" placeholder="Project B" value={form.name} onChange={handleChange("name")} required disabled={submitting} />
      </div>
      <div className="lg:col-span-6 col-span-12">
        <Label htmlFor="location" value="Location" />
        <TextInput id="location" placeholder="Navi Mumbai" value={form.location} onChange={handleChange("location")} required disabled={submitting} />
      </div>
      <div className="lg:col-span-6 col-span-12">
        <Label htmlFor="developBy" value="Developed By" />
        <TextInput id="developBy" placeholder="DeltaYards" value={form.developBy} onChange={handleChange("developBy")} required disabled={submitting} />
      </div>
      <div className="lg:col-span-6 col-span-12">
        <Label htmlFor="logo" value="Logo URL (Optional)" />
        <TextInput id="logo" placeholder="https://example.com/logo.png" value={form.logo} onChange={handleChange("logo")} disabled={submitting} />
      </div>
      <div className="col-span-12">
        <Button type="submit" color="primary" className="w-fit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Project"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectAddForm;


