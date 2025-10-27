"use client";

import React, { useContext, useEffect } from "react";
import { Sidebar } from "flowbite-react";
// IconSidebar removed
import { useSidebarData } from "./Sidebaritems";
import NavItems from "./NavItems";
import NavCollapse from "./NavCollapse";
import SimpleBar from "simplebar-react";
import SideProfile from "./SideProfile/SideProfile";
import NotificationsModule from "./NotificationsModule";
// Unused imports removed

const SidebarLayout = () => {
  const { sidebarData, isLoading } = useSidebarData();

  if (isLoading) {
    return (
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar pt-8 bg-white dark:bg-darkgray ps-4 rtl:pe-4 rtl:ps-0"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <SimpleBar className="h-[calc(100vh_-_85px)]">
            <Sidebar.Items className="pe-4 rtl:pe-0 rtl:ps-4">
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              
              {/* Side Profile - Moved to bottom */}
              <div className="px-4 rtl:pe-4 rtl:ps-0 mt-6">
                <SideProfile />
              </div>
            </Sidebar.Items>
          </SimpleBar>
        </Sidebar>
      </div>
    );
  }

  return (
    <>
      <div className="xl:block hidden">
        <Sidebar
          className="fixed menu-sidebar pt-8 bg-white dark:bg-darkgray ps-4 rtl:pe-4 rtl:ps-0"
          aria-label="Sidebar with multi-level dropdown example"
        >
          <SimpleBar className="h-[calc(100vh_-_85px)]">
            <Sidebar.Items className="pe-4 rtl:pe-0 rtl:ps-4">
              <Sidebar.ItemGroup className="sidebar-nav">
                {sidebarData.map((data) => 
                  data.items?.map((item, index) => (
                    <React.Fragment key={index}>
                      <h5 className="text-link font-semibold text-sm caption ">
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
                  ))
                )}
              </Sidebar.ItemGroup>
              
              {/* Notifications Module */}
              <div className="px-4 rtl:pe-4 rtl:ps-0">
                <NotificationsModule />
              </div>
              
              {/* Side Profile - Moved to bottom */}
              <div className="px-4 rtl:pe-4 rtl:ps-0 mt-6">
                <SideProfile />
              </div>
            </Sidebar.Items>
          </SimpleBar>
        </Sidebar>
      </div>
    </>
  );
};

export default SidebarLayout;
