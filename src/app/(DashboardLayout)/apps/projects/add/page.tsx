import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import { Metadata } from "next";
import ProjectAddForm from "../../../../components/apps/projects/ProjectAddForm";

const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Add Project" },
];

export const metadata: Metadata = { title: "Add Project" };

const AddProjectPage = () => {
  return (
    <>
      <BreadcrumbComp title="Add Project" items={BCrumb} />
      <ProjectAddForm />
    </>
  );
};

export default AddProjectPage;


