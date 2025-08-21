"use client";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

const AuthLogin = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (!email || !password) {
        throw new Error("Please enter email and password");
      }
      const res = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({} as any));

      const token = (data && (data.token || data.accessToken)) as string | undefined;
      const user = data?.user as
        | { id: string; name: string; email: string; mobile?: string; companyName?: string; role?: string; level?: number }
        | undefined;

      if (!res.ok || !token) {
        const msg = (data && (data.message || data.error)) || "Invalid username or password";
        throw new Error(msg);
      }

      if (token && user) {
        // Use the authentication context to handle login
        login(token, user, remember);
      }

      // Check for redirect parameter or use default
      const redirectPath = searchParams.get('redirect') || (data && (data.redirect as string)) || "/";
      router.push(redirectPath);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form className="mt-6" onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email" value="Email" />
          </div>
          <TextInput
            id="email"
            type="email"
            sizing="md"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-1">
          <div className="mb-2 block">
            <Label htmlFor="userpwd" value="Password" />
          </div>
          <TextInput
            id="userpwd"
            type="password"
            sizing="md"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between my-4">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" className="checkbox" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} />
            <Label htmlFor="remember" className="opacity-90 font-normal cursor-pointer">
              Remember this Device
            </Label>
          </div>
        </div>
        {error ? (
          <p className="text-error text-sm mb-3">{error}</p>
        ) : null}
        <Button color={"primary"} type="submit" className="w-full" isProcessing={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
