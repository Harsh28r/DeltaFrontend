"use client";
import React, { useContext } from "react";
import { Sidebar } from "flowbite-react";
import { IconSidebar } from "./IconSidebar";
import { useSidebarData } from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";

import SimpleBar from "simplebar-react";
import SideProfile from "./SideProfile/SideProfile";
import { CustomizerContext } from "@/app/context/CustomizerContext";

const MobileSidebar = () => {
  const { selectedIconId, setSelectedIconId } =
    useContext(CustomizerContext) || {};
  const { sidebarData, isLoading } = useSidebarData();
  
  const selectedContent = sidebarData.find(
    (data) => data.id === selectedIconId
  );

  if (isLoading) {
    return (
      <div>
        <div className="minisidebar-icon border-e border-ld bg-white dark:bg-darkgray fixed start-0 z-[1] ">
          <IconSidebar />
          <SideProfile />
        </div>
        <Sidebar
          className="fixed menu-sidebar pt-8 bg-white dark:bg-darkgray transition-all"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Sidebar>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="minisidebar-icon border-e border-ld bg-white dark:bg-darkgray fixed start-0 z-[1] ">
          <IconSidebar />
          <SideProfile />
        </div>
        <Sidebar
          className="fixed menu-sidebar pt-8 bg-white dark:bg-darkgray transition-all"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <SimpleBar className="h-[calc(100vh_-_85px)]">
            <Sidebar.Items className="ps-4 pe-4">
              <Sidebar.ItemGroup className="sidebar-nav">
                {selectedContent &&
                  selectedContent.items?.map((item, index) => (
                    <React.Fragment key={index}>
                      <h5 className="text-link font-semibold text-sm caption">
                        {item.heading}
                      </h5>
                      {item.children?.map((child, index) => (
                        <React.Fragment key={child.id && index}>
                          {child.children ? (
                            <NavCollapse item={child} />
                          ) : (
                            <NavItems item={child} />
                          )}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
              </Sidebar.ItemGroup>
            </Sidebar.Items>
          </SimpleBar>
        </Sidebar>
      </div>
    </>
  );
};

export default MobileSidebar;
