"use-client";
import React, { useState, useEffect, useContext } from "react";
import { Icon } from "@iconify/react";
import Miniicons from "./MiniSidebar";
import SimpleBar from "simplebar-react";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import Logo from "../../shared/logo/Logo";
import { Button, Tooltip } from "flowbite-react";

export const IconSidebar = () => {
  const { selectedIconId, setSelectedIconId, setIsCollapse } =
    useContext(CustomizerContext) || {};
  // Handle icon click
  const handleClick = (id: any) => {
    setSelectedIconId(id);
    setIsCollapse("full-sidebar");
  };

  return (
    <>
      <div className="px-4 py-6 pt-7 logo">
        <Logo />
      </div>
      <SimpleBar className="miniicons">
       
      </SimpleBar>
    </>
  );
};
