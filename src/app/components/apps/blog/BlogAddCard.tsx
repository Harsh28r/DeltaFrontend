"use client";
import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import CardBox from "../../shared/CardBox";

const BlogAddCard = () => {
  return (
    <div className="lg:col-span-4 md:col-span-6 col-span-12">
      <CardBox className="flex items-center justify-center min-h-[320px]">
        <Link href="/apps/blog/addpost" className="flex flex-col items-center text-primary">
          <Icon icon="solar:add-circle-line-duotone" height="56" />
          <span className="mt-3 font-medium">Add New Post</span>
        </Link>
      </CardBox>
    </div>
  );
};

export default BlogAddCard;


