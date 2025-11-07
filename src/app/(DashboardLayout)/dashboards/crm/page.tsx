"use client";
import React, { useState, useEffect } from "react";
import { Card, Badge, Button, Alert, Modal, TextInput, Label, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";
import ChartCard from "@/app/components/dashboards/crm/ChartCard";
import DateTimePicker from "@/components/DateTimePicker";
// import ProjectPerformanceAnalytics from "@/app/components/dashboards/analytics/ProjectPerformanceAnalytics";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";
import LeadAnalyticsChart from "../../apps/leads/fresh/LeadAnalyticsChart";
import LeadStatusChart from "../../apps/leads/fresh/LeadStatusChart";



// Types for the API response
interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: string;
  estimatedRevenue: number;
  totalFreshLeads: number;
  totalLeadsThisMonth: number;
  freshLeadsThisMonth: number;
  totalProjects :number

}

interface ChartData {
  leadsByStatus: Array<{
    _id: string;
    name: string;
    count: number;
    // percentage: number;
  }>;
  topSources: Array<{
    _id: string | null;
    name: string | null;
    count: number;
  }>;
  topPartners: Array<{
    _id: string | null;
    name: string | null;
    count: number;
  }>;
  leadsBySource: Array<{
    _id: string | null;
    name: string;
    count: number;
  }>;
}

interface CPSourcingUser {
  _id: string;
  name: string;
  email: string;
  userId?: string;
  channelPartnerId?: {
    _id: string;
    name: string;
  };
  projectId?: {
    _id: string;
    name: string;
  };
}

interface Lead {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  project: {
    _id: string;
    name: string;
  };
  channelPartner: {
    _id: string;
    name: string;
  } | null;
  leadSource: {
    _id: string;
    name: string;
  };
  currentStatus: {
    _id: string;
    name: string;
    is_final_status: boolean;
  };
  customData: {
    "First Name"?: string;
    "Last Name"?: string;
    Email?: string;
    Phone?: string;
    "Lead Priority"?: string;
    "Property Type"?: string;
    Configuration?: string;
    "Funding Mode"?: string;
    Gender?: string;
    Budget?: string;
    Notes?: string;
    Remark?: string;
    "Booking Date"?: string;
    "Channel Partner"?: string;
    "Channel Partner Sourcing"?: string;
    // Bulk upload lowercase fields
    name?: string;
    email?: string;
    phone?: string;
    contact?: string;
    leadPriority?: string;
    propertyType?: string;
    configuration?: string;
    fundingMode?: string;
    gender?: string;
    budget?: string;
    notes?: string;
    [key: string]: any; // Allow any additional fields
  };
  cpSourcingId: string | {
    _id: string;
    userId: {
      _id: string;
      name: string;
    };
  } | null;
  statusHistory: Array<{
    status: string;
    data: any;
    changedAt: string;
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
  propertyType: string;
  location: string;
  price: number;
  daysOpen: number;
}

interface UserPerformance {
  _id: string;
  name: string;
  email: string;
  totalLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  finalStatuses: Array<{
    _id: string;
    name: string;
    formFields: Array<{
      name: string;
      type: string;
      required: boolean;
      options: any[];
      _id: string;
    }>;
    is_final_status: boolean;
    is_default_status: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }>;
  conversionRate: number;
}

interface ProjectSummary {
  _id: string;
  projectName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgPrice: number;
  totalRevenue: number;
  finalStatusBreakdown: {
    [key: string]: number;
  };
}


export interface FollowUp {
  id: string;
  title: string;
  description: string;
  dateTime: {
    iso: string;
    formatted: string;
    date: string;
    time: string;
    relative: string;
    timestamp: number;
  };
  status: 'sent' | 'pending';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  lead: {
    id: string;
    status?: string; // This is the lead status name like "New", "Negotiation", etc.
    statusId?: string; // This is the status ID
    currentStatus?: {
      _id: string;
      name: string;
    };
    customData?: {
      "First Name"?: string;
      "Last Name"?: string;
      Email?: string;
      Phone?: string;
      "Lead Priority"?: string;
      "Property Type"?: string;
      Configuration?: string;
      "Funding Mode"?: string;
      Gender?: string;
      Budget?: string;
      Notes?: string;
      Remark?: string;
      "Booking Date"?: string;
      "Channel Partner"?: string;
      "Channel Partner Sourcing"?: string;
      "Next Meeting Date Time"?: string;
      "Next Follow-up Date Time"?: string;
      "Call Back Date"?: string;
      "Visit Date"?: string;
      "Summary of the conversation"?: string;
      // Bulk upload lowercase fields
      name?: string;
      email?: string;
      phone?: string;
      contact?: string;
      leadPriority?: string;
      propertyType?: string;
      configuration?: string;
      fundingMode?: string;
      gender?: string;
      budget?: string;
      notes?: string;
      [key: string]: any;
    };
    project: string;
    assignedTo: {
      _id: string;
      name: string;
      email: string;
    };
    channelPartner?: string;
    leadSource: string;
  };
  createdAt: {
    iso: string;
    formatted: string;
    date: string;
    time: string;
    relative: string;
    timestamp: number;
  };
}

export interface FollowUpsData {
  followUps: {
    today: FollowUp[];
    tomorrow: FollowUp[];
    upcoming: FollowUp[];
    pending: FollowUp[];
  };
  summary: {
    pending: number;
    today: number;
    tomorrow: number;
    upcoming: number;
    total: number;
  };
  timestamp?: string;
}

interface DashboardData {
  stats: DashboardStats;
  charts: ChartData;
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  performance: UserPerformance[];
  projectSummary: ProjectSummary[];
  followUps?: FollowUpsData;
}

const CrmDashboard = () => {
  const { token, user } = useAuth();
  const { socket, connected } = useWebSocket();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelPartners, setChannelPartners] = useState<any[]>([]);
  const [cpSourcingOptions, setCpSourcingOptions] = useState<CPSourcingUser[]>([]);

  // Follow-up management state
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpAlert, setFollowUpAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // leads
  const [totalLeads, setTotalLeads] = useState<Lead[]>([]);


  // Reminder notification state
  const [showReminderNotification, setShowReminderNotification] = useState(false);
  const [reminderLeads, setReminderLeads] = useState<Lead[]>([]);
  const [reminderType, setReminderType] = useState<'today' | 'overdue' | 'upcoming'>('today');

  // Filter states for each section
  const [todayFilter, setTodayFilter] = useState<string>('all');
  const [tomorrowFilter, setTomorrowFilter] = useState<string>('all');
  const [upcomingFilter, setUpcomingFilter] = useState<string>('all');
  const [pendingFilter, setPendingFilter] = useState<string>('all');

  // Show more states for each section
  const [showMoreToday, setShowMoreToday] = useState(false);
  const [showMoreTomorrow, setShowMoreTomorrow] = useState(false);
  const [showMoreUpcoming, setShowMoreUpcoming] = useState(false);
  const [showMorePending, setShowMorePending] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);

        // Fetch all dashboard data concurrently
        const [statsResponse, leadsResponse, performanceResponse, projectSummaryResponse, channelPartnersResponse, cpSourcingResponse, followUpsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard/stats`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/dashboard/leads`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/dashboard/user-performance`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/dashboard/project-summary`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/channel-partner/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/cp-sourcing/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE_URL}/api/follow-ups`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
       
        ]);

        // Check if all responses are ok
        if ([statsResponse, leadsResponse, performanceResponse, projectSummaryResponse, channelPartnersResponse, cpSourcingResponse, followUpsResponse].some(res => !res.ok)) {
          throw new Error(`HTTP error! status: ${statsResponse.status} / ${leadsResponse.status} / ${performanceResponse.status} / ${projectSummaryResponse.status} / ${channelPartnersResponse.status} / ${cpSourcingResponse.status} / ${followUpsResponse.status}`);
        }

        const [statsData, leadsData, performanceData, projectSummaryData, channelPartnersData, cpSourcingData, followUpsData] = await Promise.all([
          statsResponse.json(),
          leadsResponse.json(),
          performanceResponse.json(),
          projectSummaryResponse.json(),
          channelPartnersResponse.json(),
          cpSourcingResponse.json(),
          followUpsResponse.json(),
        ]);


        console.log('followUpsData', followUpsData);
        
        

        // Set channel partners and CP sourcing data
        setChannelPartners(channelPartnersData.channelPartners || channelPartnersData || []);
        setCpSourcingOptions(Array.isArray(cpSourcingData.cpSourcing) ? cpSourcingData.cpSourcing :
          Array.isArray(cpSourcingData) ? cpSourcingData : []);

        // Combine the data
        const combinedData: DashboardData = {
          stats: statsData.stats,
          charts: statsData.charts,
          leads: leadsData.leads,
          pagination: leadsData.pagination,
          performance: performanceData.performance,
          projectSummary: projectSummaryData.summary || [],
          followUps: followUpsData,
        };



        

        setDashboardData(combinedData);
        setError(null);
      } catch (err) {
        console.error("❌ CRM Dashboard - Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    const fetchLeaddata = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.LEAD_DATA(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setTotalLeads(transformLeadData(data.leads || []));

        } else {
          setAlertMessage({ type: 'error', message: `Failed to fetch fresh leads: ${response.statusText}` });
        }
      } catch (error) {
        console.error("Error fetching fresh leads:", error);
        setAlertMessage({ type: 'error', message: 'Network error while fetching fresh leads.' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchLeaddata()
  }, [token, user]);

  // Check for follow-up reminders when dashboard data loads
  useEffect(() => {
    if (dashboardData?.leads) {
      checkFollowUpReminders();
    }
  }, [dashboardData]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (!socket) {
      console.log('🔌 No socket available for CRM dashboard');
      return;
    }

    console.log('🔌 Setting up CRM dashboard event listeners');

    // Listen for lead events that should refresh dashboard
    socket.on('lead-created', (data) => {
      console.log('🆕 New lead created - refreshing dashboard:', data);
      // Refresh dashboard data when new leads are created
      window.location.reload(); // Simple refresh for now
    });

    socket.on('lead-updated', (data) => {
      console.log('✏️ Lead updated - refreshing dashboard:', data);
      // Refresh dashboard data when leads are updated
      window.location.reload(); // Simple refresh for now
    });

    socket.on('lead-deleted', (data) => {
      console.log('🗑️ Lead deleted - refreshing dashboard:', data);
      // Refresh dashboard data when leads are deleted
      window.location.reload(); // Simple refresh for now
    });

    socket.on('lead-status-changed', (data) => {
      console.log('🔄 Lead status changed - refreshing dashboard:', data);
      // Refresh dashboard data when lead status changes
      window.location.reload(); // Simple refresh for now
    });

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up CRM dashboard event listeners');
      socket.off('lead-created');
      socket.off('lead-updated');
      socket.off('lead-deleted');
      socket.off('lead-status-changed');
    };
  }, [socket]);




  const transformLeadData = (leadsData: any[]): Lead[] => {
    return leadsData.map(lead => {
      // Determine source name - PRIORITIZE leadSource field first
      let sourceName = 'N/A';

      // First check if leadSource exists and is NOT Channel Partner
      if (lead.leadSource?._id) {
        const leadSourceName = lead.leadSource?.name || '';

        // If the lead source is "Channel Partner", then show channel partner details
        if (leadSourceName.toLowerCase() === 'channel partner') {
          // Show detailed channel partner info
          if (lead.channelPartner) {
            const cpObj = typeof lead.channelPartner === 'object' ? lead.channelPartner : null;
            const cpName = cpObj?.name;
            if (cpName) {
              sourceName = `Channel Partner: ${cpName}`;
            } else {
              // fallback to custom data id mapping
              const cpIdFromCustom = lead.customData?.["Channel Partner"];
              const cp = channelPartners.find(cp => cp._id === cpIdFromCustom);
              if (cp) sourceName = `Channel Partner: ${cp.name}`;
              else sourceName = 'Channel Partner';
            }

            // Append sourcing info if available
            const cpSourcingRef = lead.cpSourcingId || lead.customData?.["Channel Partner Sourcing"];
            if (cpSourcingRef) {
              let cpSourcing: any = null;
              if (typeof cpSourcingRef === 'object' && cpSourcingRef !== null) {
                cpSourcing = cpSourcingRef;
                // Check if it has userId.name (new format)
                if (cpSourcing.userId && cpSourcing.userId.name) {
                  sourceName += ` (Sourced by: ${cpSourcing.userId.name})`;
                } else if (cpSourcing.channelPartnerId && cpSourcing.projectId) {
                  sourceName += ` (${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name})`;
                }
              } else {
                cpSourcing = Array.isArray(cpSourcingOptions) ? cpSourcingOptions.find(cp => cp._id === cpSourcingRef) : null;
                if (cpSourcing && cpSourcing.channelPartnerId && cpSourcing.projectId) {
                  sourceName += ` (${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name})`;
                }
              }
            }
          } else {
            // No channel partner details, just show the source name
            sourceName = leadSourceName;
          }
        } else {
          // It's a regular source (Website, Newspaper, etc.) - just use the name
          sourceName = leadSourceName;
        }
      } else if (lead.channelPartner) {
        // Legacy case: channel partner exists but no leadSource field
        const cpObj = typeof lead.channelPartner === 'object' ? lead.channelPartner : null;
        const cpName = cpObj?.name;
        if (cpName) {
          sourceName = `Channel Partner: ${cpName}`;
        } else {
          sourceName = 'Channel Partner';
        }
      } else {
        // Final fallback: check customData
        const cpIdFromCustom = lead.customData?.["Channel Partner"];
        if (cpIdFromCustom) {
          const cp = channelPartners.find(cp => cp._id === cpIdFromCustom);
          sourceName = cp ? `Channel Partner: ${cp.name}` : 'Channel Partner';
        }
      }

      return {
        ...lead,
        name: lead.customData?.["First Name"] || lead.customData?.name || 'N/A',
        email: lead.customData?.["Email"] || lead.customData?.email || 'N/A',
        phone: lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || 'N/A',
        company: 'N/A',
        notes: lead.customData?.["Notes"] || lead.customData?.notes || '',
        source: sourceName,
        status: lead.currentStatus?._id || 'N/A',
        projectName: lead.project?.name || 'N/A',
        LeadScore: lead.LeadScore || 0
      };
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon icon="solar:loading-line-duotone" className="text-4xl animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert color="failure" className="mb-4">
        <Icon icon="solar:danger-circle-line-duotone" className="mr-2" />
        {error}
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert color="info" className="mb-4">
        <Icon icon="solar:info-circle-line-duotone" className="mr-2" />
        No dashboard data available
      </Alert>
    );
  }

  const { stats, charts, leads, pagination, performance, projectSummary, followUps } = dashboardData;

  // Helper function to get channel partner name
  const getChannelPartnerName = (lead: Lead) => {
    // Check if this is a channel partner by looking at customData
    const channelPartnerId = lead.customData?.["Channel Partner"];
    if (channelPartnerId) {
      // Find the channel partner name
      const channelPartner = channelPartners.find(cp => cp._id === channelPartnerId);
      if (channelPartner) {
        let sourceName = `Channel Partner: ${channelPartner.name}`;

        // Add CP sourcing info if available
        const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
        if (cpSourcingId && Array.isArray(cpSourcingOptions)) {
          const cpSourcing = cpSourcingOptions.find(cp => cp._id === cpSourcingId);
          if (cpSourcing && cpSourcing.channelPartnerId && cpSourcing.projectId) {
            sourceName += ` (${cpSourcing.channelPartnerId.name} - ${cpSourcing.projectId.name})`;
          }
        }
        return sourceName;
      } else {
        // If channel partner not found, try to get name from CP sourcing data
        const cpSourcingId = lead.customData?.["Channel Partner Sourcing"];
        if (cpSourcingId && Array.isArray(cpSourcingOptions)) {
          const cpSourcing = cpSourcingOptions.find(cp => cp._id === cpSourcingId);
          if (cpSourcing && cpSourcing.channelPartnerId) {
            return `Channel Partner: ${cpSourcing.channelPartnerId.name}`;
          }
        }
        return 'Channel Partner';
      }
    } else if (lead.channelPartner) {
      // Direct channel partner reference
      let sourceName = `Channel Partner: ${lead.channelPartner.name}`;

      // Add CP sourcing user info if available
      if (lead.cpSourcingId && typeof lead.cpSourcingId === 'object' && lead.cpSourcingId.userId) {
        sourceName += ` (Sourced by: ${lead.cpSourcingId.userId.name})`;
      }

      return sourceName;
    } else if (lead.cpSourcingId && typeof lead.cpSourcingId === 'object' && lead.cpSourcingId.userId) {
      // Lead has CP sourcing with user info but no direct channel partner
      return `CP Sourcing: ${lead.cpSourcingId.userId.name}`;
    } else if (lead.leadSource?._id) {
      // Regular lead source
      return lead.leadSource?.name || 'N/A';
    }
    return 'N/A';
  };

  // Helper function to get processed source data with proper channel partner names
  const getProcessedSourceData = () => {
    const sourceCounts: { [key: string]: number } = {};

    leads.forEach(lead => {
      const sourceName = getChannelPartnerName(lead);
      sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
    });

    return Object.entries(sourceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 sources
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'hot': return 'failure';
      case 'warm': return 'warning';





      case 'cold': return 'info';
      default: return 'gray';
    }
  };

  // Navigate to lead detail page
  const handleLeadClick = (leadId: string) => {
    router.push(`/apps/leads/${leadId}`);
  };


  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper functions for follow-ups categorization - Backend already categorizes them
  const getTodaysFollowUps = () => {
    const todayArray = followUps?.followUps?.today;
    if (!todayArray || !Array.isArray(todayArray)) return [];
    return todayArray;
  };

  const getTomorrowsFollowUps = () => {
    const tomorrowArray = followUps?.followUps?.tomorrow;
    if (!tomorrowArray || !Array.isArray(tomorrowArray)) return [];
    return tomorrowArray;
  };

  const getUpcomingFollowUps = () => {
    const upcomingArray = followUps?.followUps?.upcoming;
    if (!upcomingArray || !Array.isArray(upcomingArray)) return [];
    return upcomingArray;
  };

  const getPendingFollowUps = () => {
    const pendingArray = followUps?.followUps?.pending;
    if (!pendingArray || !Array.isArray(pendingArray)) return [];
    return pendingArray;
  };

  // Filtered follow-ups functions
  const getFilteredTodaysFollowUps = () => {
    const todaysFollowUps = getTodaysFollowUps();
    const filtered = todayFilter === 'all' ? todaysFollowUps : todaysFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === todayFilter
    );
    return showMoreToday ? filtered : filtered.slice(0, 2);
  };

  const getFilteredTomorrowsFollowUps = () => {
    const tomorrowsFollowUps = getTomorrowsFollowUps();
    const filtered = tomorrowFilter === 'all' ? tomorrowsFollowUps : tomorrowsFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === tomorrowFilter
    );
    return showMoreTomorrow ? filtered : filtered.slice(0, 2);
  };

  const getFilteredUpcomingFollowUps = () => {
    const upcomingFollowUps = getUpcomingFollowUps();
    const filtered = upcomingFilter === 'all' ? upcomingFollowUps : upcomingFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === upcomingFilter
    );
    return showMoreUpcoming ? filtered : filtered.slice(0, 2);
  };

  const getFilteredPendingFollowUps = () => {
    const pendingFollowUps = getPendingFollowUps();
    const filtered = pendingFilter === 'all' ? pendingFollowUps : pendingFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === pendingFilter
    );
    return showMorePending ? filtered : filtered.slice(0, 2);
  };

  // Get total filtered counts (without limit)
  const getTotalFilteredTodaysFollowUps = () => {
    const todaysFollowUps = getTodaysFollowUps();
    return todayFilter === 'all' ? todaysFollowUps : todaysFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === todayFilter
    );
  };

  const getTotalFilteredTomorrowsFollowUps = () => {
    const tomorrowsFollowUps = getTomorrowsFollowUps();
    return tomorrowFilter === 'all' ? tomorrowsFollowUps : tomorrowsFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === tomorrowFilter
    );
  };

  const getTotalFilteredUpcomingFollowUps = () => {
    const upcomingFollowUps = getUpcomingFollowUps();
    return upcomingFilter === 'all' ? upcomingFollowUps : upcomingFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === upcomingFilter
    );
  };

  const getTotalFilteredPendingFollowUps = () => {
    const pendingFollowUps = getPendingFollowUps();
    return pendingFilter === 'all' ? pendingFollowUps : pendingFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === pendingFilter
    );
  };

  // Get unique statuses for filter options
  const getUniqueStatuses = () => {
    if (!followUps?.followUps) return [];

    // Combine all follow-ups from all categories since backend returns categorized data
    const allFollowUps = [
      ...(Array.isArray(followUps.followUps.today) ? followUps.followUps.today : []),
      ...(Array.isArray(followUps.followUps.tomorrow) ? followUps.followUps.tomorrow : []),
      ...(Array.isArray(followUps.followUps.upcoming) ? followUps.followUps.upcoming : []),
      ...(Array.isArray(followUps.followUps.pending) ? followUps.followUps.pending : [])
    ];

    const statuses = new Set(
      allFollowUps
        .filter(followUp => followUp.lead) // Filter out null leads
        .map(followUp => followUp.lead.status || followUp.lead.currentStatus?.name) // Get status name
        .filter(status => status) // Remove null/undefined values
    );
    return Array.from(statuses).sort();
  };

  // Check for follow-up reminders
  const checkFollowUpReminders = () => {
    if (!dashboardData?.leads) return;

    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const overdueLeads = dashboardData.leads.filter(lead => {
      const followUpDate = (lead.customData as any)?.["Follow-up Date"] || (lead.customData as any)?.["Booking Date"];
      if (!followUpDate) return false;
      const leadDate = new Date(followUpDate);
      return leadDate.toDateString() === yesterdayStr && !lead.currentStatus.is_final_status;
    });

    const todayLeads = dashboardData.leads.filter(lead => {
      const followUpDate = (lead.customData as any)?.["Follow-up Date"] || (lead.customData as any)?.["Booking Date"];
      if (!followUpDate) return false;
      const leadDate = new Date(followUpDate);
      return leadDate.toDateString() === todayStr && !lead.currentStatus.is_final_status;
    });

    const upcomingLeads = dashboardData.leads.filter(lead => {
      const followUpDate = (lead.customData as any)?.["Follow-up Date"] || (lead.customData as any)?.["Booking Date"];
      if (!followUpDate) return false;
      const leadDate = new Date(followUpDate);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return leadDate.toDateString() === tomorrow.toDateString() && !lead.currentStatus.is_final_status;
    });

    // Show reminder notification if there are overdue or today's follow-ups
    if (overdueLeads.length > 0) {
      setReminderLeads(overdueLeads);
      setReminderType('overdue');
      setShowReminderNotification(true);
    } else if (todayLeads.length > 0) {
      setReminderLeads(todayLeads);
      setReminderType('today');
      setShowReminderNotification(true);
    } else if (upcomingLeads.length > 0) {
      setReminderLeads(upcomingLeads);
      setReminderType('upcoming');
      setShowReminderNotification(true);
    }
  };

  // Follow-up management functions
  const handleSetFollowUp = (lead: Lead) => {
    setSelectedLead(lead);
    setFollowUpDate((lead.customData as any)?.["Follow-up Date"] || (lead.customData as any)?.["Booking Date"] || '');
    setFollowUpNotes((lead.customData as any)?.["Follow-up Notes"] || '');
    setIsFollowUpModalOpen(true);
  };

  const handleCloseFollowUpModal = () => {
    setIsFollowUpModalOpen(false);
    setSelectedLead(null);
    setFollowUpDate('');
    setFollowUpNotes('');
    setFollowUpAlert(null);
  };

  const handleDismissReminder = () => {
    setShowReminderNotification(false);
  };

  const handleShowReminders = () => {
    checkFollowUpReminders();
  };

  const handleSubmitFollowUp = async () => {
    if (!selectedLead || !followUpDate) {
      setFollowUpAlert({ type: 'error', message: 'Please select a follow-up date' });
      return;
    }

    try {
      setIsSubmittingFollowUp(true);

      const response = await fetch(`${API_BASE_URL}/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customData: {
            ...selectedLead.customData,
            "Follow-up Date": followUpDate,
            "Follow-up Notes": followUpNotes
          }
        }),
      });

      if (response.ok) {
        setFollowUpAlert({ type: 'success', message: 'Follow-up date set successfully!' });

        // Update the lead in the local state
        if (dashboardData) {
          const updatedLeads = dashboardData.leads.map(lead =>
            lead._id === selectedLead._id
              ? { ...lead, customData: { ...lead.customData, "Follow-up Date": followUpDate, "Follow-up Notes": followUpNotes } }
              : lead
          );
          setDashboardData({ ...dashboardData, leads: updatedLeads });
        }

        setTimeout(() => {
          handleCloseFollowUpModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        setFollowUpAlert({ type: 'error', message: errorData.message || 'Failed to set follow-up date' });
      }
    } catch (error) {
      console.error('Error setting follow-up:', error);
      setFollowUpAlert({ type: 'error', message: 'Failed to set follow-up date' });
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };
  
  console.log('dashboardData:', dashboardData);

  return (
    <div className="space-y-8">
      {/* Follow-up Reminder Notification */}
      {showReminderNotification && reminderLeads.length > 0 && (
        <Alert
          color={reminderType === 'overdue' ? 'failure' : reminderType === 'today' ? 'warning' : 'info'}
          className="mb-6"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Icon
                icon={
                  reminderType === 'overdue' ? 'solar:danger-circle-line-duotone' :
                    reminderType === 'today' ? 'solar:clock-circle-line-duotone' :
                      'solar:calendar-line-duotone'
                }
                className="mr-3 text-lg"
              />
              <div>
                <h3 className="font-semibold">
                  {reminderType === 'overdue' ? '🚨 Overdue Follow-ups!' :
                    reminderType === 'today' ? '⏰ Today\'s Follow-ups' :
                      '📅 Upcoming Follow-ups'}
                </h3>
                <p className="text-sm">
                  {reminderType === 'overdue' ? `${reminderLeads.length} lead(s) have overdue follow-ups` :
                    reminderType === 'today' ? `${reminderLeads.length} lead(s) need follow-up today` :
                      `${reminderLeads.length} lead(s) have follow-ups tomorrow`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                color={reminderType === 'overdue' ? 'failure' : reminderType === 'today' ? 'warning' : 'info'}
                onClick={handleDismissReminder}
                className="flex items-center gap-1"
              >
                <Icon icon="solar:close-circle-line-duotone" className="text-sm" />
                Dismiss
              </Button>
            </div>
          </div>

          {/* Quick Lead List */}
          <div className="mt-3 space-y-2">
            {reminderLeads.slice(0, 3).map(lead => (
              <div key={lead._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => handleLeadClick(lead._id)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {(lead.customData?.["First Name"] || lead.customData?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lead.customData?.["First Name"] || lead.customData?.name || 'Unknown'} - {lead.project.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Follow-up: {(lead.customData as any)?.["Follow-up Date"] || (lead.customData as any)?.["Booking Date"]}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  color="blue"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click when button is clicked
                    handleSetFollowUp(lead);
                  }}
                  className="flex items-center gap-1"
                >
                  <Icon icon="solar:calendar-add-line-duotone" className="text-sm" />
                  Set Follow-up
                </Button>
              </div>
            ))}
            {reminderLeads.length > 3 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{reminderLeads.length - 3} more leads need attention
              </p>
            )}
          </div>
        </Alert>
      )}

      {/* Executive Summary Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Management Dashboard</h1>
            {/* <p className="text-xl text-blue-100 mb-4">Real Estate Lead Management & Performance Analytics</p> */}
            <div className="flex items-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Icon icon="solar:calendar-line-duotone" className="text-xl" />
                <span>Last Updated: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon icon="solar:users-group-rounded-line-duotone" className="text-xl" />
                <span>Team Performance: {performance.length} Members</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{connected ? 'Live Updates' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              color="light"
              size="sm"
              onClick={handleShowReminders}
            >
              <Icon icon="solar:bell-line-duotone" className="mr-2" />
              Show Reminders
            </Button>
            <Button
              color="light"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <Icon icon="solar:refresh-line-duotone" className="mr-2" />
              Refresh Data
            </Button>
            <Button
              color="light"
              size="sm"
            >
              <Icon icon="solar:download-line-duotone" className="mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Lead Pipeline */} 
        <Card className="p-6 border-l-4 cursor-pointer border-l-blue-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/leads`)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">All Leads</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalLeads}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stats.totalLeadsThisMonth} Leads From This Month</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-xl">
              <Icon icon="solar:users-group-rounded-line-duotone" className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:trend-up-line-duotone" className="text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">ALL Leads</span>
          </div>
        </Card>

        {/* Total Fresh Leads */}
        <Card className="p-6 border-l-4 cursor-pointer border-l-teal-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/leads/fresh`)}>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Fresh Leads</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalFreshLeads}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stats.totalFreshLeads} Leads From This Month</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-900 rounded-xl">
              <Icon icon="solar:user-plus-rounded-line-duotone" className="text-3xl text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:star-fall-minimalistic-line-duotone" className="text-teal-500 mr-1" />
            <span className="text-teal-600 dark:text-teal-400 font-medium">Ready for Action</span>
          </div>
        </Card>

        {/* todays followups followups */}

        <Card className="p-6 border-l-4 cursor-pointer border-l-teal-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/follow-ups/view?view=today`)}>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Todays Followups</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{followUps?.summary.today}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Followups For Today</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-900 rounded-xl">
              <Icon icon="solar:clock-circle-line-duotone" className="text-red-500 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:star-fall-minimalistic-line-duotone" className="text-teal-500 mr-1" />
            <span className="text-teal-600 dark:text-teal-400 font-medium">Total Todays Followups</span>
          </div>
        </Card>



        {/* tomorrow followups */}
        <Card className="p-6 border-l-4 cursor-pointer border-l-teal-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/follow-ups/view?view=upcoming`)}>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">upcoming Followups</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{followUps?.summary.upcoming}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Upcoming Tommorow</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-900 rounded-xl">
              <Icon icon="solar:calendar-line-duotone" className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-teal-600 dark:text-teal-400 font-medium">Upcoming Followups </span>
          </div>
        </Card>


        {/* pending followups */}
        <Card className="p-6 border-l-4 cursor-pointer border-l-teal-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/follow-ups/view?view=pending`)}>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pending Followups</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{followUps?.summary.pending}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Followups Pending</p>
            </div>
            <div className="p-4 bg-teal-50 dark:bg-teal-900 rounded-xl">
              <Icon icon="solar:calendar-line-duotone" className="text-yellow-500 text-xl" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-teal-600 dark:text-teal-400 font-medium">Total Pending Followups </span>
          </div>
        </Card>



        {/* Total Projects */}
        <Card className="p-6 cursor-pointer border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/apps/projects`)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Projects</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.totalProjects} 
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">All Projects</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-xl">
              <Icon icon="solar:buildings-line-duotone" className="text-3xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:trend-up-line-duotone" className="text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">Total Projects</span>
          </div>
        </Card>


      </div>


      <LeadStatusChart leads={totalLeads} />

      {/* new graphs */}

      <LeadAnalyticsChart leads={totalLeads} />



      {/* Follow-up Dashboard */}

    </div>
  );
};

export default CrmDashboard;