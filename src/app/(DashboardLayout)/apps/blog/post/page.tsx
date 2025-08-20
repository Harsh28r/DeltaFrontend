
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import ProjectAddCard from "@/app/components/apps/projects/ProjectAddCard";
import ProjectList from "@/app/components/apps/projects/ProjectList";
import { Metadata } from "next";
const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Blog app",
  },
];
export const metadata: Metadata = {
  title: "Blog Post",
};
const Blog = () => {
  return (
    <>
     <BreadcrumbComp title="Blog app" items={BCrumb} />
     <div className="grid grid-cols-12 gap-6 mb-6">
       <ProjectAddCard />
     </div>

     <ProjectList/>
    </>
  );
};
export default Blog;
