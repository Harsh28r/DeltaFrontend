import React from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import ProjectList from "@/app/components/apps/projects/ProjectList";
import { Metadata } from "next";

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Projects" },
];

export const metadata: Metadata = {
  title: "Projects",
};

const ProjectsPage = () => {
  return (
    <>
      <BreadcrumbComp title="Projects" items={BCrumb} />
      <ProjectList />
    </>
  );
};

export default ProjectsPage;


