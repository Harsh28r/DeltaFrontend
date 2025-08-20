import React from "react";
import BreadcrumbComp from "@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp";
import { Metadata } from "next";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Add Post",
  },
];

export const metadata: Metadata = {
  title: "Add Post",
};

const AddPostPage = () => {
  return (
    <>
      <BreadcrumbComp title="Add Post" items={BCrumb} />
      <div className="p-6 border border-ld rounded-md">
        <p className="text-sm text-darklink">Implement your add post form here.</p>
      </div>
    </>
  );
};

export default AddPostPage;



