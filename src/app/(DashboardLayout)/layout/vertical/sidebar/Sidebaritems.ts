"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, subscribeToRefresh } from "@/lib/config";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
}

import { uniqueId } from "lodash";

// Hook to get dynamic sidebar data with roles
export const useSidebarData = () => {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch roles from backend
  const fetchRoles = async () => {
    try {
      // Check if token exists and is valid
      if (!token || token.trim() === '') {
        console.log("No token available, skipping roles fetch");
        setRoles([]);
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping roles fetch");
        setRoles([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.ROLES, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.status === 401) {
        // Token is invalid or expired
        console.log("Token expired or invalid, clearing roles");
        setRoles([]);
        setIsLoading(false);
        return;
      }
      
      if (response.status === 404) {
        // User not found
        console.log("User not found, clearing roles");
        setRoles([]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.roles || data);
      } else {
        console.error("Failed to fetch roles:", data.message);
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch roles when token changes and user is authenticated
  useEffect(() => {
    if (token && token.trim() !== '' && isAuthenticated && !authLoading) {
      // Wrap in try-catch to prevent unhandled errors
      try {
        fetchRoles();
      } catch (error) {
        console.error("Error in useEffect when fetching roles:", error);
        setRoles([]);
        setIsLoading(false);
      }
    } else {
      setRoles([]);
      setIsLoading(false);
    }
  }, [token, isAuthenticated, authLoading]);

  // Listen for refresh events (when new roles are added)
  useEffect(() => {
    if (token && token.trim() !== '' && isAuthenticated && !authLoading) {
      const unsubscribe = subscribeToRefresh(() => {
        // Wrap in try-catch to prevent unhandled errors
        try {
          fetchRoles();
        } catch (error) {
          console.error("Error in refresh event when fetching roles:", error);
          setRoles([]);
          setIsLoading(false);
        }
      });
      return unsubscribe;
    }
  }, [token, isAuthenticated, authLoading]);

  // Create dynamic role items for SuperAdmin
  const getDynamicRoleItems = () => {
    if (authLoading) {
      return [
        {
          name: "Loading Roles...",
          id: "loading-roles",
          icon: "solar:loading-line-duotone",
          url: "#",
        }
      ];
    }
    
    if (!isAuthenticated) {
      return [
        {
          name: "Authentication Required",
          id: "auth-required",
          icon: "solar:lock-line-duotone",
          url: "/auth/auth1/login",
        }
      ];
    }
    
    if (isLoading) {
      return [
        {
          name: "Loading Roles...",
          id: "loading-roles",
          icon: "solar:loading-line-duotone",
          url: "#",
        }
      ];
    }
    
    if (roles.length === 0) {
      return [
        {
          name: "No Roles Found",
          id: "no-roles",
          icon: "solar:info-circle-line-duotone",
          url: "/apps/roles/add",
        }
      ];
    }

    return roles
      .filter(role => role.name && role.name.toLowerCase() !== 'superadmin') // Filter out superadmin role and invalid roles
      .map(role => ({
        name: role.name.toUpperCase(),
        id: `role-${role._id}`,
        icon: "solar:users-group-rounded-line-duotone",
        url: `/apps/role-modules/${role.name}`,
      }));
  };

  const sidebarData: MenuItem[] = [
    {
      id: 1,
      name: "Dashboard",
      items: [
        {
          heading: "Dashboards",
          children: [
            {
              name: "CRM",
              icon: "solar:layers-line-duotone",
              id: uniqueId(),
              url: "/dashboards/crm",
            },
           

            
          ],
        },
        {
          heading: "Apps",
          children: [
            // {
            //   id: uniqueId(),
            //   name: "Contacts",
            //   icon: "solar:phone-line-duotone",
            //   url: "/apps/contacts",
            // },
            // {
            //   name: "Ecommerce",
            //   id: uniqueId(),
            //   icon: "solar:cart-3-line-duotone",
            //   children: [
            //     {
            //       id: uniqueId(),
            //       name: "Shop",
            //       url: "/apps/ecommerce/shop",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Details",
            //       url: "/apps/ecommerce/detail/1",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "List",
            //       url: "/apps/ecommerce/list",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Checkout",
            //       url: "/apps/ecommerce/checkout",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Add Product",
            //       url: "/apps/ecommerce/addproduct",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Edit Product",
            //       url: "/apps/ecommerce/editproduct",
            //     },
            //   ],
            // },
            {
              name: "Projects",
              id: uniqueId(),
              icon: "solar:widget-add-line-duotone",
              children: [
                {
                  id: uniqueId(),
                  name: "Add Project",
                  url: "/apps/projects",
                },
                // {
                //   id: uniqueId(),
                //   name: "List Project",
                //   url: "/apps/projects/list",
                // },
              ],
            },
            {
              name: "Roles",
              id: uniqueId(),
              icon: "solar:shield-user-outline",
              children: [
                {
                  id: uniqueId(),
                  name: "List Roles",
                  url: "/apps/roles",
                },
                {
                  id: uniqueId(),
                  name: "Add Role",
                  url: "/apps/roles/add",
                },
              ],
            },
            {
              name: "Users",
              id: uniqueId(),
              icon: "solar:users-group-rounded-line-duotone",
              children: [
                {
                  id: uniqueId(),
                  name: "List Users",
                  url: "/apps/users",
                },
                {
                  id: uniqueId(),
                  name: "Add User",
                  url: "/apps/users/add",
                },
              ],
            },
            {
              name: "Leads",
              id: uniqueId(),
              icon: "solar:target-line-duotone",
              children: [
                {
                  id: uniqueId(),
                  name: "Leads Management",
                  url: "/apps/lead-management",
                },
                {
                  id: uniqueId(),
                  name: "All Leads",
                  url: "/apps/leads",
                },
                {
                  id: uniqueId(),
                  name: "Leads Activities",
                  url: "/apps/lead-activities",
                },
              ],
            },
            {
              name: "Follow-ups",
              id: uniqueId(),
              icon: "solar:calendar-line-duotone",
              url: "/apps/follow-ups",
            },
            {
              name: "Channel Partners",
              id: uniqueId(),
              icon: "solar:handshake-line-duotone",
              children: [
                {
                  id: uniqueId(),
                  name: "List Partners",
                  url: "/apps/channel-partners",
                },
                {
                  id: uniqueId(),
                  name: "Add Partner",
                  url: "/apps/channel-partners/add",
                },
              ],
            },
            {
              name: "CP Sourcing",
              id: uniqueId(),
              icon: "solar:target-line-duotone",
              children: [
                {
                  id: uniqueId(),
                  name: "List Sourcing",
                  url: "/apps/cp-sourcing",
                },
                {
                  id: uniqueId(),
                  name: "Add Sourcing",
                  url: "/apps/cp-sourcing/add",
                },
              ],
            },
            {
              name: "SuperAdmin",
              id: uniqueId(),
              icon: "solar:shield-user-outline",
              children: [
                // Dynamic role items will be inserted here (excluding superadmin role)
                ...getDynamicRoleItems(),
              ],
            },

           
            // {
            //   name: "User Profile",
            //   id: uniqueId(),
            //   icon: "solar:shield-user-outline",
            //   children: [
            //     {
            //       id: uniqueId(),
            //       name: "Profile",
            //       url: "/apps/user-profile/profile",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Followers",
            //       url: "/apps/user-profile/followers",
            //     },
            //     {
            //       id: uniqueId(),
            //       name: "Friends",
            //       url: "/apps/user-profile/friends",
            //     },
            //   ],
            // },
            // {
            //   id: uniqueId(),
            //   name: "Gallery",
            //   icon: "solar:gallery-line-duotone",
            //   url: "/apps/gallery",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Pricing",
            //   icon: "solar:tag-price-line-duotone",
            //   url: "/apps/pricing",
            // },
            // {
            //   id: uniqueId(),
            //   name: "FAQ",
            //   icon: "solar:question-circle-line-duotone",
            //   url: "/apps/faq",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Timeline",
            //   icon: "solar:clock-circle-line-duotone",
            //   url: "/apps/timeline",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Treeview",
            //   icon: "solar:tree-line-duotone",
            //   url: "/apps/treeview",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Invoice",
            //   icon: "solar:file-text-line-duotone",
            //   url: "/apps/invoice",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Testimonials",
            //   icon: "solar:chat-round-dots-line-duotone",
            //   url: "/apps/testimonials",
            // },
            // {
            //   id: uniqueId(),
            //   name: "404",
            //   icon: "solar:file-line-duotone",
            //   url: "/apps/404",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Coming Soon",
            //   icon: "solar:clock-circle-line-duotone",
            //   url: "/apps/coming-soon",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Maintenance",
            //   icon: "solar:settings-line-duotone",
            //   url: "/apps/maintenance",
            // },
            // {
            //   id: uniqueId(),
            //   name: "Starter",
            //   icon: "solar:rocket-line-duotone",
            //   url: "/apps/starter",
            // },
          ],
        },
        // {
        //   heading: "Pages",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Help Center",
        //       icon: "solar:question-circle-line-duotone",
        //       url: "/pages/help-center",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Landing",
        //       icon: "solar:rocket-line-duotone",
        //       url: "/pages/landing",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Pricing",
        //       icon: "solar:tag-price-line-duotone",
        //       url: "/pages/pricing",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "404",
        //       icon: "solar:file-line-duotone",
        //       url: "/pages/404",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Coming Soon",
        //       icon: "solar:clock-circle-line-duotone",
        //       url: "/pages/coming-soon",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Maintenance",
        //       icon: "solar:settings-line-duotone",
        //       url: "/pages/maintenance",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Starter",
        //       icon: "solar:rocket-line-duotone",
        //       url: "/pages/starter",
        //     },
        //   ],
        // },
        // {
        //   heading: "Authentication",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Sign In",
        //       icon: "solar:login-2-line-duotone",
        //       url: "/auth/auth1/login",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Sign Up",
        //       icon: "solar:user-plus-line-duotone",
        //       url: "/auth/auth1/register",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Forgot Password",
        //       icon: "solar:lock-password-line-duotone",
        //       url: "/auth/auth1/forgot-password",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Reset Password",
        //       icon: "solar:lock-password-line-duotone",
        //       url: "/auth/auth1/reset-password",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Two Factor",
        //       icon: "solar:shield-keyhole-line-duotone",
        //       url: "/auth/auth1/two-factor",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Lock Screen",
        //       icon: "solar:lock-line-duotone",
        //       url: "/auth/auth1/lock-screen",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Logout",
        //       icon: "solar:logout-2-line-duotone",
        //       url: "/auth/auth1/logout",
        //     },
        //   ],
        // },
        // {
        //   heading: "Layouts",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Default",
        //       icon: "solar:widget-add-line-duotone",
        //       url: "/layouts/default",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Sidebar",
        //       icon: "solar:sidebar-line-duotone",
        //       url: "/layouts/sidebar",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Header",
        //       icon: "solar:header-line-duotone",
        //       url: "/layouts/header",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Footer",
        //       icon: "solar:footer-line-duotone",
        //       url: "/layouts/footer",
        //     },
        //   ],
        // },
        // {
        //   heading: "Components",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Alerts",
        //       icon: "solar:bell-line-duotone",
        //       url: "/components/alerts",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Badges",
        //       icon: "solar:badge-line-duotone",
        //       url: "/components/badges",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Breadcrumbs",
        //       icon: "solar:breadcrumb-line-duotone",
        //       url: "/components/breadcrumbs",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Buttons",
        //       icon: "solar:button-line-duotone",
        //       url: "/components/buttons",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Cards",
        //       icon: "solar:card-line-duotone",
        //       url: "/components/cards",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Carousel",
        //       icon: "solar:carousel-line-duotone",
        //       url: "/components/carousel",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Collapse",
        //       icon: "solar:collapse-line-duotone",
        //       url: "/components/collapse",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Dropdowns",
        //       icon: "solar:dropdown-line-duotone",
        //       url: "/components/dropdowns",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Forms",
        //       icon: "solar:form-line-duotone",
        //       url: "/components/forms",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "List Group",
        //       icon: "solar:list-line-duotone",
        //       url: "/components/list-group",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Modal",
        //       icon: "solar:modal-line-duotone",
        //       url: "/components/modal",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Navbar",
        //       icon: "solar:navbar-line-duotone",
        //       url: "/components/navbar",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Offcanvas",
        //       icon: "solar:offcanvas-line-duotone",
        //       url: "/components/offcanvas",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Pagination",
        //       icon: "solar:pagination-line-duotone",
        //       url: "/components/pagination",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Popovers",
        //       icon: "solar:popover-line-duotone",
        //       url: "/components/popovers",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Progress",
        //       icon: "solar:progress-line-duotone",
        //       url: "/components/progress",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Spinners",
        //       icon: "solar:spinner-line-duotone",
        //       url: "/components/spinners",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Tables",
        //       icon: "solar:table-line-duotone",
        //       url: "/components/tables",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Tabs",
        //       icon: "solar:tabs-line-duotone",
        //       url: "/components/tabs",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Tooltips",
        //       icon: "solar:tooltip-line-duotone",
        //       url: "/components/tooltips",
        //     },
        //   ],
        // },
        // {
        //   heading: "Utilities",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Background",
        //       icon: "solar:background-line-duotone",
        //       url: "/utilities/background",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Borders",
        //       icon: "solar:border-line-duotone",
        //       url: "/utilities/borders",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Colors",
        //       icon: "solar:color-line-duotone",
        //       url: "/utilities/colors",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Display",
        //       icon: "solar:display-line-duotone",
        //       url: "/utilities/display",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Flex",
        //       icon: "solar:flex-line-duotone",
        //       url: "/utilities/flex",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Float",
        //       icon: "solar:float-line-duotone",
        //       url: "/utilities/float",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Grid",
        //       icon: "solar:grid-line-duotone",
        //       url: "/utilities/grid",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Position",
        //       icon: "solar:position-line-duotone",
        //       url: "/utilities/position",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Shadows",
        //       icon: "solar:shadow-line-duotone",
        //       url: "/utilities/shadows",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Sizing",
        //       icon: "solar:sizing-line-duotone",
        //       url: "/utilities/sizing",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Spacing",
        //       icon: "solar:spacing-line-duotone",
        //       url: "/utilities/spacing",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Text",
        //       icon: "solar:text-line-duotone",
        //       url: "/utilities/text",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Vertical Align",
        //       icon: "solar:vertical-align-line-duotone",
        //       url: "/utilities/vertical-align",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Visibility",
        //       icon: "solar:visibility-line-duotone",
        //       url: "/utilities/visibility",
        //     },
        //   ],
        // },
        // {
        //   heading: "Extras",
        //   children: [
        //     {
        //       id: uniqueId(),
        //       name: "Charts",
        //       icon: "solar:chart-line-duotone",
        //       url: "/extras/charts",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Icons",
        //       icon: "solar:icon-line-duotone",
        //       url: "/extras/icons",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Maps",
        //       icon: "solar:map-line-duotone",
        //       url: "/extras/maps",
        //     },
        //     {
        //       id: uniqueId(),
        //       name: "Tables",
        //       icon: "solar:table-line-duotone",
        //       url: "/extras/tables",
        //     },
        //   ],
        // },
      ],
    },
  ];

  return { sidebarData, isLoading };
};

// Static sidebar data for components that don't need dynamic functionality
export const staticSidebarData: MenuItem[] = [
  {
    id: 1,
    name: "Dashboard",
    items: [
      {
        heading: "Dashboards",
        children: [
          {
            name: "eCommerce",
            icon: "solar:widget-add-line-duotone",
            id: uniqueId(),
            url: "/",
          },
          {
            name: "Analytics",
            icon: "solar:chart-line-duotone",
            id: uniqueId(),
            url: "/dashboards/analytics",
          },
          {
            name: "SuperAdmin",
            id: uniqueId(),
            icon: "solar:home-angle-linear",
            children: [
              {
                name: "Admin",
                id: uniqueId(),
                url: "/frontend-pages/homepage",
              },
              {
                name: "About Us",
                id: uniqueId(),
                url: "/frontend-pages/aboutus",
              },
              {
                name: "Blog",
                id: uniqueId(),
                url: "/frontend-pages/blog",
              },
              {
                name: "Blog Details",
                id: uniqueId(),
                url: "/frontend-pages/blog/detail/streaming-video-way-before-it-was-cool-go-dark-tomorrow",
              },
              {
                name: "Contact Us",
                id: uniqueId(),
                url: "/frontend-pages/contact",
              },
              {
                name: "Portfolio",
                id: uniqueId(),
                url: "/frontend-pages/portfolio",
              },
              {
                name: "Pricing",
                id: uniqueId(),
                url: "/frontend-pages/pricing",
              },
            ],
          },
          {
            name: "CRM",
            icon: "solar:layers-line-duotone",
            id: uniqueId(),
            url: "/dashboards/crm",
          },
        ],
      },
      {
        heading: "Apps",
        children: [
          // {
          //   id: uniqueId(),
          //   name: "Contacts",
          //   icon: "solar:phone-line-duotone",
          //   url: "/apps/contacts",
          // },
          // {
          //   name: "Ecommerce",
          //   id: uniqueId(),
          //   icon: "solar:cart-3-line-duotone",
          //   children: [
          //     {
          //       id: uniqueId(),
          //       name: "Shop",
          //       url: "/apps/ecommerce/shop",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Details",
          //       url: "/apps/ecommerce/detail/1",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "List",
          //       url: "/apps/ecommerce/list",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Checkout",
          //       url: "/apps/ecommerce/checkout",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Add Product",
          //       url: "/apps/ecommerce/addproduct",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Edit Product",
          //       url: "/apps/ecommerce/editproduct",
          //     },
          //   ],
          // },
          {
            name: "Projects",
            id: uniqueId(),
            icon: "solar:widget-add-line-duotone",
            children: [
              {
                id: uniqueId(),
                name: "Add Project",
                url: "/apps/projects",
              },
              // {
              //   id: uniqueId(),
              //   name: "List Project",
              //   url: "/apps/projects/list",
              // },
            ],
          },
          {
            name: "Roles",
            id: uniqueId(),
            icon: "solar:shield-user-outline",
            children: [
              {
                id: uniqueId(),
                name: "List Roles",
                url: "/apps/roles",
              },
              {
                id: uniqueId(),
                name: "Add Role",
                url: "/apps/roles/add",
              },
            ],
          },
          {
            name: "Users",
            id: uniqueId(),
            icon: "solar:shield-user-outline",
            children: [
              {
                id: uniqueId(),
                name: "Add Users",
                url: "/apps/users/add",
              },
              {
                id: uniqueId(),
                name: "List Users",
                url: "/apps/users",
              },
            ],
          },
        
          // {
          //   name: "User Profile",
          //   id: uniqueId(),
          //   icon: "solar:shield-user-outline",
          //   children: [
          //     {
          //       id: uniqueId(),
          //       name: "Profile",
          //       url: "/apps/user-profile/profile",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Followers",
          //       url: "/apps/user-profile/followers",
          //     },
          //     {
          //       id: uniqueId(),
          //       name: "Friends",
          //       url: "/apps/user-profile/friends",
          //     },
          //   ],
          // },
          // {
          //   id: uniqueId(),
          //   name: "Gallery",
          //   icon: "solar:gallery-line-duotone",
          //   url: "/apps/gallery",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Pricing",
          //   icon: "solar:tag-price-line-duotone",
          //   url: "/apps/pricing",
          // },
          // {
          //   id: uniqueId(),
          //   name: "FAQ",
          //   icon: "solar:question-circle-line-duotone",
          //   url: "/apps/faq",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Timeline",
          //   icon: "solar:clock-circle-line-duotone",
          //   url: "/apps/timeline",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Treeview",
          //   icon: "solar:tree-line-duotone",
          //   url: "/apps/treeview",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Invoice",
          //   icon: "solar:file-text-line-duotone",
          //   url: "/apps/invoice",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Testimonials",
          //   icon: "solar:chat-round-dots-line-duotone",
          //   url: "/apps/testimonials",
          // },
          // {
          //   id: uniqueId(),
          //   name: "404",
          //   icon: "solar:file-line-duotone",
          //   url: "/apps/404",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Coming Soon",
          //   icon: "solar:clock-circle-line-duotone",
          //   url: "/apps/coming-soon",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Maintenance",
          //   icon: "solar:settings-line-duotone",
          //   url: "/apps/maintenance",
          // },
          // {
          //   id: uniqueId(),
          //   name: "Starter",
          //   icon: "solar:rocket-line-duotone",
          //   url: "/apps/starter",
          // },
        ],
      },
      {
        heading: "Pages",
        children: [
          {
            id: uniqueId(),
            name: "Help Center",
            icon: "solar:question-circle-line-duotone",
            url: "/pages/help-center",
          },
          {
            id: uniqueId(),
            name: "Landing",
            icon: "solar:rocket-line-duotone",
            url: "/pages/landing",
          },
          {
            id: uniqueId(),
            name: "Pricing",
            icon: "solar:tag-price-line-duotone",
            url: "/pages/pricing",
          },
          {
            id: uniqueId(),
            name: "404",
            icon: "solar:file-line-duotone",
            url: "/pages/404",
          },
          {
            id: uniqueId(),
            name: "Coming Soon",
            icon: "solar:clock-circle-line-duotone",
            url: "/pages/coming-soon",
          },
          {
            id: uniqueId(),
            name: "Maintenance",
            icon: "solar:settings-line-duotone",
            url: "/pages/maintenance",
          },
          {
            id: uniqueId(),
            name: "Starter",
            icon: "solar:rocket-line-duotone",
            url: "/pages/starter",
          },
        ],
      },
      {
        heading: "Authentication",
        children: [
          {
            id: uniqueId(),
            name: "Sign In",
            icon: "solar:login-2-line-duotone",
            url: "/auth/auth1/login",
          },
          {
            id: uniqueId(),
            name: "Sign Up",
            icon: "solar:user-plus-line-duotone",
            url: "/auth/auth1/register",
          },
          {
            id: uniqueId(),
            name: "Forgot Password",
            icon: "solar:lock-password-line-duotone",
            url: "/auth/auth1/forgot-password",
          },
          {
            id: uniqueId(),
            name: "Reset Password",
            icon: "solar:lock-password-line-duotone",
            url: "/auth/auth1/reset-password",
          },
          {
            id: uniqueId(),
            name: "Two Factor",
            icon: "solar:shield-keyhole-line-duotone",
            url: "/auth/auth1/two-factor",
          },
          {
            id: uniqueId(),
            name: "Lock Screen",
            icon: "solar:lock-line-duotone",
            url: "/auth/auth1/lock-screen",
          },
          {
            id: uniqueId(),
            name: "Logout",
            icon: "solar:logout-2-line-duotone",
            url: "/auth/auth1/logout",
          },
        ],
      },
      {
        heading: "Layouts",
        children: [
          {
            id: uniqueId(),
            name: "Default",
            icon: "solar:widget-add-line-duotone",
            url: "/layouts/default",
          },
          {
            id: uniqueId(),
            name: "Sidebar",
            icon: "solar:sidebar-line-duotone",
            url: "/layouts/sidebar",
          },
          {
            id: uniqueId(),
            name: "Header",
            icon: "solar:header-line-duotone",
            url: "/layouts/header",
          },
          {
            id: uniqueId(),
            name: "Footer",
            icon: "solar:footer-line-duotone",
            url: "/layouts/footer",
          },
        ],
      },
      {
        heading: "Components",
        children: [
          {
            id: uniqueId(),
            name: "Alerts",
            icon: "solar:bell-line-duotone",
            url: "/components/alerts",
          },
          {
            id: uniqueId(),
            name: "Badges",
            icon: "solar:badge-line-duotone",
            url: "/components/badges",
          },
          {
            id: uniqueId(),
            name: "Breadcrumbs",
            icon: "solar:breadcrumb-line-duotone",
            url: "/components/breadcrumbs",
          },
          {
            id: uniqueId(),
            name: "Buttons",
            icon: "solar:button-line-duotone",
            url: "/components/buttons",
          },
          {
            id: uniqueId(),
            name: "Cards",
            icon: "solar:card-line-duotone",
            url: "/components/cards",
          },
          {
            id: uniqueId(),
            name: "Carousel",
            icon: "solar:carousel-line-duotone",
            url: "/components/carousel",
          },
          {
            id: uniqueId(),
            name: "Collapse",
            icon: "solar:collapse-line-duotone",
            url: "/components/collapse",
          },
          {
            id: uniqueId(),
            name: "Dropdowns",
            icon: "solar:dropdown-line-duotone",
            url: "/components/dropdowns",
          },
          {
            id: uniqueId(),
            name: "Forms",
            icon: "solar:form-line-duotone",
            url: "/components/forms",
          },
          {
            id: uniqueId(),
            name: "List Group",
            icon: "solar:list-line-duotone",
            url: "/components/list-group",
          },
          {
            id: uniqueId(),
            name: "Modal",
            icon: "solar:modal-line-duotone",
            url: "/components/modal",
          },
          {
            id: uniqueId(),
            name: "Navbar",
            icon: "solar:navbar-line-duotone",
            url: "/components/navbar",
          },
          {
            id: uniqueId(),
            name: "Offcanvas",
            icon: "solar:offcanvas-line-duotone",
            url: "/components/offcanvas",
          },
          {
            id: uniqueId(),
            name: "Pagination",
            icon: "solar:pagination-line-duotone",
            url: "/components/pagination",
          },
          {
            id: uniqueId(),
            name: "Popovers",
            icon: "solar:popover-line-duotone",
            url: "/components/popovers",
          },
          {
            id: uniqueId(),
            name: "Progress",
            icon: "solar:progress-line-duotone",
            url: "/components/progress",
          },
          {
            id: uniqueId(),
            name: "Spinners",
            icon: "solar:spinner-line-duotone",
            url: "/components/spinners",
          },
          {
            id: uniqueId(),
            name: "Tables",
            icon: "solar:table-line-duotone",
            url: "/components/tables",
          },
          {
            id: uniqueId(),
            name: "Tabs",
            icon: "solar:tabs-line-duotone",
            url: "/components/tabs",
          },
          {
            id: uniqueId(),
            name: "Tooltips",
            icon: "solar:tooltip-line-duotone",
            url: "/components/tooltips",
          },
        ],
      },
      {
        heading: "Utilities",
        children: [
          {
            id: uniqueId(),
            name: "Background",
            icon: "solar:background-line-duotone",
            url: "/utilities/background",
          },
          {
            id: uniqueId(),
            name: "Borders",
            icon: "solar:border-line-duotone",
            url: "/utilities/borders",
          },
          {
            id: uniqueId(),
            name: "Colors",
            icon: "solar:color-line-duotone",
            url: "/utilities/colors",
          },
          {
            id: uniqueId(),
            name: "Display",
            icon: "solar:display-line-duotone",
              url: "/utilities/display",
            },
            {
              id: uniqueId(),
              name: "Flex",
              icon: "solar:flex-line-duotone",
              url: "/utilities/flex",
            },
            {
              id: uniqueId(),
              name: "Float",
              icon: "solar:float-line-duotone",
              url: "/utilities/float",
            },
            {
              id: uniqueId(),
              name: "Grid",
              icon: "solar:grid-line-duotone",
              url: "/utilities/grid",
            },
            {
              id: uniqueId(),
              name: "Position",
              icon: "solar:position-line-duotone",
              url: "/utilities/position",
            },
            {
              id: uniqueId(),
              name: "Shadows",
              icon: "solar:shadow-line-duotone",
              url: "/utilities/shadows",
            },
            {
              id: uniqueId(),
              name: "Sizing",
              icon: "solar:sizing-line-duotone",
              url: "/utilities/sizing",
            },
            {
              id: uniqueId(),
              name: "Spacing",
              icon: "solar:spacing-line-duotone",
              url: "/utilities/spacing",
            },
            {
              id: uniqueId(),
              name: "Text",
              icon: "solar:text-line-duotone",
              url: "/utilities/text",
            },
            {
              id: uniqueId(),
              name: "Vertical Align",
              icon: "solar:vertical-align-line-duotone",
              url: "/utilities/vertical-align",
            },
            {
              id: uniqueId(),
              name: "Visibility",
              icon: "solar:visibility-line-duotone",
              url: "/utilities/visibility",
            },
          ],
        },
        {
          heading: "Extras",
          children: [
            {
              id: uniqueId(),
              name: "Charts",
              icon: "solar:chart-line-duotone",
              url: "/extras/charts",
            },
            {
              id: uniqueId(),
              name: "Icons",
              icon: "solar:icon-line-duotone",
              url: "/extras/icons",
            },
            {
              id: uniqueId(),
              name: "Maps",
              icon: "solar:map-line-duotone",
              url: "/extras/maps",
            },
            {
              id: uniqueId(),
              name: "Tables",
              icon: "solar:table-line-duotone",
              url: "/extras/tables",
            },
          ],
        },
      ],
    },
  ];

// Default export for backward compatibility
export default useSidebarData;
