

import { Sidebar } from "flowbite-react";
import React from "react";
import { ChildItem } from "../Sidebaritems";
import NavItems from "../NavItems";
import { Icon } from "@iconify/react";
import { HiOutlineChevronDown } from "react-icons/hi";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

interface NavCollapseProps {
  item: ChildItem;
}

const NavCollapse: React.FC<NavCollapseProps> = ({ item }: any) => {
  const pathname = usePathname();
  const activeDD = item.children.find((t: { url: string; }) => t.url === pathname)
  const { t } = useTranslation();
  return (
    <>
      <Sidebar.Collapse
        label={t(`${item.name}`)}
        open={activeDD ? true : false}
        icon={() => <Icon icon={item.icon} height={18} />}
        className={activeDD ? '!text-primary bg-lightprimary ' : ''}
        renderChevronIcon={(theme, open) => {
          const IconComponent = open
            ? HiOutlineChevronDown
            : HiOutlineChevronDown;
          return (
            <IconComponent
              aria-hidden
              className={twMerge(theme.label.icon.open[open ? "on" : "off"])}
            />
          );
        }}
      >
        {/* Render child items */}
        {item.children && item.children.length > 0 && (
          <Sidebar.ItemGroup className="sidebar-dropdown">
            {item.children.map((child: any, index: number) => {
              const uniqueKey = child.id || `${item.id}-child-${index}`;
              return child.children ? (
                <NavCollapse key={uniqueKey} item={child} />
              ) : (
                <NavItems key={uniqueKey} item={child} />
              );
            })}
          </Sidebar.ItemGroup>
        )}
      </Sidebar.Collapse>
    </>
  );
};

export default NavCollapse;
