"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header from "./layout/vertical/header/Header";
import { Customizer } from "./layout/shared/customizer/Customizer";
import { CustomizerContext } from "../context/CustomizerContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { activeLayout, isLayout } = useContext(CustomizerContext);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/auth1/login');
    }
  }, [isAuthenticated, isLoading]); // Remove router dependency to prevent infinite re-renders

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex w-full min-h-screen">
      <div className="page-wrapper flex w-full">
        {/* Header/sidebar */}
        {activeLayout == "vertical" ? <Sidebar /> : null}
        <div className="body-wrapper w-full bg-lightgray dark:bg-dark">
          {/* Top Header  */}
          {activeLayout == "horizontal" ? (
            <Header layoutType="horizontal" />
          ) : (
            <Header layoutType="vertical" />
          )}

          {/* Body Content  */}
          <div
            className={` ${
              isLayout == "full"
                ? "w-full py-[30px] md:px-[30px] px-5"
                : "container mx-auto  py-[30px]"
            } ${activeLayout == "horizontal" ? "xl:mt-3" : ""}
            `}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
