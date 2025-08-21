import React from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import ProjectList from "@/app/components/apps/projects/ProjectList";
import { Metadata } from "next";
import ProjectAddCard from "@/app/components/apps/projects/ProjectAddCard";

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
      <div className="grid grid-cols-12 gap-6 mb-6">
       <ProjectAddCard />
     </div>
      <ProjectList />
    </>
  );
};

export default ProjectsPage;


