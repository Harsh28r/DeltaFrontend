"use client";
import React, { useState, useEffect } from "react";
import { Card, Badge, Button, Alert, Modal, TextInput, Label, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { API_BASE_URL } from "@/lib/config";
import ChartCard from "@/app/components/dashboards/crm/ChartCard";
import DateTimePicker from "@/components/DateTimePicker";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

// Types for the API response
interface DashboardStats {
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: string;
  estimatedRevenue: number;
}

interface ChartData {
  leadsByStatus: Array<{
    _id: string;
    name: string;
    count: number;
    percentage: number;
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


interface FollowUp {
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

interface FollowUpsData {
  followUps: FollowUp[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
  summary: {
    total: number;
    type: string;
  };
}

interface FollowUpsStats {
  stats: {
    total: number;
    pending: number;
    overdue: number;
    today: number;
    upcoming: number;
    completed: number;
  };
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
  followUpsStats?: FollowUpsStats;
}

const CrmDashboard = () => {
  const { token, user } = useAuth();
  const { socket, connected } = useWebSocket();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
  
  // Reminder notification state
  const [showReminderNotification, setShowReminderNotification] = useState(false);
  const [reminderLeads, setReminderLeads] = useState<Lead[]>([]);
  const [reminderType, setReminderType] = useState<'today' | 'overdue' | 'upcoming'>('today');
  
  // Filter states for each section
  const [todayFilter, setTodayFilter] = useState<string>('all');
  const [tomorrowFilter, setTomorrowFilter] = useState<string>('all');
  const [pendingFilter, setPendingFilter] = useState<string>('all');
  
  // Show more states for each section
  const [showMoreToday, setShowMoreToday] = useState(false);
  const [showMoreTomorrow, setShowMoreTomorrow] = useState(false);
  const [showMorePending, setShowMorePending] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Fetch stats, leads, performance, project summary, channel partners, CP sourcing data, follow-ups, and follow-ups stats
        const [statsResponse, leadsResponse, performanceResponse, projectSummaryResponse, channelPartnersResponse, cpSourcingResponse, followUpsResponse, followUpsStatsResponse] = await Promise.all([
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
          }),
          fetch(`${API_BASE_URL}/api/follow-ups/stats`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
        ]);

        if (!statsResponse.ok || !leadsResponse.ok || !performanceResponse.ok || !projectSummaryResponse.ok || !channelPartnersResponse.ok || !cpSourcingResponse.ok || !followUpsResponse.ok || !followUpsStatsResponse.ok) {
          throw new Error(`HTTP error! status: ${statsResponse.status} / ${leadsResponse.status} / ${performanceResponse.status} / ${projectSummaryResponse.status} / ${channelPartnersResponse.status} / ${cpSourcingResponse.status} / ${followUpsResponse.status} / ${followUpsStatsResponse.status}`);
        }

        const [statsData, leadsData, performanceData, projectSummaryData, channelPartnersData, cpSourcingData, followUpsData, followUpsStatsData] = await Promise.all([
          statsResponse.json(),
          leadsResponse.json(),
          performanceResponse.json(),
          projectSummaryResponse.json(),
          channelPartnersResponse.json(),
          cpSourcingResponse.json(),
          followUpsResponse.json(),
          followUpsStatsResponse.json()
        ]);

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
          followUpsStats: followUpsStatsData
        };

        setDashboardData(combinedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  const { stats, charts, leads, pagination, performance, projectSummary, followUps, followUpsStats } = dashboardData;

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

  // Helper functions for follow-ups categorization
  const getTodaysFollowUps = () => {
    if (!followUps?.followUps) return [];
    const today = new Date();
    return followUps.followUps.filter(followUp => {
      const followUpDate = new Date(followUp.dateTime.iso);
      return followUpDate.toDateString() === today.toDateString();
    });
  };

  const getTomorrowsFollowUps = () => {
    if (!followUps?.followUps) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return followUps.followUps.filter(followUp => {
      const followUpDate = new Date(followUp.dateTime.iso);
      return followUpDate.toDateString() === tomorrow.toDateString();
    });
  };

  const getPendingFollowUps = () => {
    if (!followUps?.followUps) return [];
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return followUps.followUps.filter(followUp => {
      const followUpDate = new Date(followUp.dateTime.iso);
      return followUpDate > tomorrow;
    });
  };

  const getOverdueFollowUps = () => {
    if (!followUps?.followUps) return [];
    const today = new Date();
    return followUps.followUps.filter(followUp => {
      const followUpDate = new Date(followUp.dateTime.iso);
      return followUpDate < today;
    });
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

  const getTotalFilteredPendingFollowUps = () => {
    const pendingFollowUps = getPendingFollowUps();
    return pendingFilter === 'all' ? pendingFollowUps : pendingFollowUps.filter(followUp => 
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === pendingFilter
    );
  };

  // Get unique statuses for filter options
  const getUniqueStatuses = () => {
    if (!followUps?.followUps) return [];
    const statuses = new Set(
      followUps.followUps
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
        <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Lead Pipeline</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalLeads}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total  Leads</p>
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

        {/* Conversion Performance */}
        <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Conversion Rate</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{stats.conversionRate}%</p>
              {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Industry Benchmark: 25%</p> */}
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-xl">
              <Icon icon="solar:chart-line-duotone" className="text-3xl text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:trend-up-line-duotone" className="text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">Above Industry Average</span>
          </div>
        </Card>

        {/* Total Projects */}
        <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Projects</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {projectSummary.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Portfolio</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-xl">
              <Icon icon="solar:buildings-line-duotone" className="text-3xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:trend-up-line-duotone" className="text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">Portfolio Growth</span>
          </div>
        </Card>

        {/* Team Performance */}
        <Card className="p-6 border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Team Efficiency</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">7</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active Team Members</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900 rounded-xl">
              <Icon icon="solar:users-group-two-rounded-line-duotone" className="text-3xl text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Icon icon="solar:trend-up-line-duotone" className="text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">High Performance Team</span>
          </div>
        </Card>
      </div>

      {/* Strategic Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Pipeline Analysis */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lead Pipeline Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current lead distribution and conversion funnel</p>
            </div>
            <Icon icon="solar:pie-chart-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <ChartCard
            title=""
            icon=""
            data={charts.leadsByStatus.map((status, index) => ({
              name: status.name,
              value: status.count,
              percentage: status.percentage,
              color: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : '#F59E0B'
            }))}
            type="pie"
            className="p-0"
          />
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Pipeline Health</span>
              <Badge color="success" size="sm">Excellent</Badge>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
              {stats.conversionRate}% conversion rate exceeds industry standards
            </p>
          </div>
        </Card>

        {/* Channel Performance Analysis */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Channel Partner Performance</h3>
              {/* <p className="text-sm text-gray-600 dark:text-gray-400">Lead source effectiveness and ROI analysis</p> */}
            </div>
            <Icon icon="solar:chart-2-line-duotone" className="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <ChartCard
            title=""
            icon=""
            data={getProcessedSourceData().map((source, index) => ({
              name: source.name,
              value: source.count,
              color: index === 0 ? '#8B5CF6' : index === 1 ? '#06B6D4' : '#F59E0B'
            }))}
            type="bar"
            className="p-0"
          />
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Channel ROI</span>
              <Badge color="info" size="sm">High Performance</Badge>
            </div>
            <p className="text-xs text-green-700 dark:text-green-200 mt-1">
              Channel Partners generating {getProcessedSourceData()[0]?.count || 0} leads
            </p>
          </div>
        </Card>
      </div>

      {/* Market Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lead Quality Analysis */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Lead Quality Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Priority distribution and lead scoring</p>
            </div>
            <Icon icon="solar:chart-2-line-duotone" className="text-2xl text-purple-600 dark:text-purple-400" />
          </div>
          <ChartCard
            title=""
            icon=""
            data={(() => {
              const priorityCounts = leads.reduce((acc, lead) => {
                const priority = lead.customData["Lead Priority"] || lead.customData.leadPriority || 'Not Set';
                acc[priority] = (acc[priority] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              return Object.entries(priorityCounts).map(([priority, count], index) => ({
                name: priority,
                value: count,
                color: getPriorityColor(priority) === 'failure' ? '#EF4444' : 
                       getPriorityColor(priority) === 'warning' ? '#F59E0B' : '#3B82F6'
              }));
            })()}
            type="pie"
            className="p-0"
          />
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-red-50 dark:bg-red-900 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {leads.filter(lead => (lead.customData["Lead Priority"] || lead.customData.leadPriority) === 'Hot').length}
              </p>
              <p className="text-xs text-red-700 dark:text-red-200">Hot Leads</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {leads.filter(lead => (lead.customData["Lead Priority"] || lead.customData.leadPriority) === 'Warm').length}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-200">Warm Leads</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {leads.filter(lead => (lead.customData["Lead Priority"] || lead.customData.leadPriority) === 'Cold').length}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-200">Cold Leads</p>
            </div>
          </div>
        </Card>

        {/* Portfolio Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Portfolio Performance</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Project-wise lead generation and conversion</p>
            </div>
            <Icon icon="solar:buildings-line-duotone" className="text-2xl text-green-600 dark:text-green-400" />
          </div>
          <ChartCard
            title=""
            icon=""
            data={projectSummary.map((project, index) => ({
              name: project.projectName,
              value: project.convertedLeads, // Show converted leads based on final status
              color: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#8B5CF6'
            }))}
            type="bar"
            className="p-0"
          />
          <div className="mt-4 space-y-2">
            {projectSummary.map((project) => (
              <div key={project._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{project.projectName}</span>
                  <Badge color="info" size="sm">{project.conversionRate}%</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{project.convertedLeads}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Final Closure</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Business KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Days to Close */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Days to Close</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const closedLeads = leads.filter(lead => lead.currentStatus.is_final_status);
                  if (closedLeads.length === 0) return 'N/A';
                  const avgDays = closedLeads.reduce((sum, lead) => sum + lead.daysOpen, 0) / closedLeads.length;
                  return Math.round(avgDays);
                })()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Icon icon="solar:clock-circle-line-duotone" className="text-2xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        {/* Hot Leads Count */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hot Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leads.filter(lead => (lead.customData["Lead Priority"] || lead.customData.leadPriority) === 'Hot').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <Icon icon="solar:fire-line-duotone" className="text-2xl text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* Channel Partner Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Partner Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leads.filter(lead => 
                  lead.channelPartner || 
                  lead.customData?.["Channel Partner"] || 
                  lead.customData?.["Channel Partner Sourcing"]
                ).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Icon icon="solar:users-group-two-rounded-line-duotone" className="text-2xl text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Budget Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Value Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leads.filter(lead => (lead.customData.Budget || lead.customData.budget) === 'Above 5 Crores').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <Icon icon="solar:dollar-minimalistic-line-duotone" className="text-2xl text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>


      {/* Organizational Performance Section */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Organizational Performance</h3>
            <p className="text-gray-600 dark:text-gray-400">Team efficiency metrics and performance analytics</p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon icon="solar:users-group-rounded-line-duotone" className="text-2xl text-blue-600 dark:text-blue-400" />
            <Badge color="success" size="lg">High Performance Team</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Performance Analytics */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Conversion Performance Matrix</h4>
            <ChartCard
              title=""
              icon=""
              data={performance.map((user, index) => ({
                name: user.name,
                value: user.conversionRate,
                color: index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#8B5CF6'
              }))}
              type="bar"
              className="p-0"
            />
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Team Average</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(performance.reduce((sum, user) => sum + user.conversionRate, 0) / performance.length)}%
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">
                Exceeds industry benchmark of 25%
              </p>
            </div>
          </div>
          
          {/* Performance Scorecard */}
          {/* <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Individual Scorecards</h4>
            <div className="space-y-4">
              {performance.map((user, index) => (
                <div key={user._id} className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-green-100 dark:bg-green-900' : 
                        index === 1 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                      }`}>
                        <Icon icon="solar:user-line-duotone" className={`text-xl ${
                          index === 0 ? 'text-green-600 dark:text-green-400' : 
                          index === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
                        }`} />
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        color={user.conversionRate >= 80 ? "success" : user.conversionRate >= 50 ? "warning" : "failure"}
                        size="lg"
                      >
                        {user.conversionRate}% Conversion
                      </Badge>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {user.conversionRate >= 80 ? 'Excellent' : user.conversionRate >= 50 ? 'Good' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.totalLeads}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Leads</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{user.convertedLeads}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Converted</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{user.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Revenue</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </Card>

      {/* Follow-up Dashboard */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Icon icon="solar:calendar-add-line-duotone" className="text-orange-500 text-2xl" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-up Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Track leads with upcoming follow-ups and appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:clock-circle-line-duotone" className="text-orange-500 text-lg" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {followUpsStats?.stats?.total || followUps?.summary?.total || 0} Follow-ups
            </span>
          </div>
        </div>

        {/* Follow-ups Statistics */}
        {followUpsStats?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{followUpsStats.stats.total}</p>
                </div>
                <Icon icon="solar:list-line-duotone" className="text-blue-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Today</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{followUpsStats.stats.today}</p>
                </div>
                <Icon icon="solar:clock-circle-line-duotone" className="text-red-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Upcoming</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{followUpsStats.stats.upcoming}</p>
                </div>
                <Icon icon="solar:calendar-line-duotone" className="text-yellow-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{followUpsStats.stats.pending}</p>
                </div>
                <Icon icon="solar:clock-circle-line-duotone" className="text-blue-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Overdue</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{followUpsStats.stats.overdue}</p>
                </div>
                <Icon icon="solar:danger-circle-line-duotone" className="text-orange-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Completed</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{followUpsStats.stats.completed}</p>
                </div>
                <Icon icon="solar:check-circle-line-duotone" className="text-green-500 text-xl" />
              </div>
            </div>
          </div>
        )}

        {/* Follow-up Lists */}
        <div className="space-y-8">
          {/* Today's Follow-ups */}
          <div className="border-l-4 border-red-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:clock-circle-line-duotone" className="text-red-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Follow-ups</h3>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">{getTotalFilteredTodaysFollowUps().length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="todayFilter" value="Filter by Status:" className="text-sm text-gray-600 dark:text-gray-400" />
                <Select
                  id="todayFilter"
                  value={todayFilter}
                  onChange={(e) => setTodayFilter(e.target.value)}
                  className="w-32"
                >
                  <option value="all">All Status</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Assigned To</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Processed By</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Mobile</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Next Schedule</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Comment</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredTodaysFollowUps().filter(followUp => followUp.lead).map(followUp => (
                    <tr 
                      key={followUp.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {(followUp.lead.customData?.["First Name"] || followUp.lead.customData?.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {followUp.lead.customData?.["First Name"] || followUp.lead.customData?.name || 'Unknown'} {followUp.lead.customData?.["Last Name"] || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Phone"] || followUp.lead.customData?.phone || followUp.lead.customData?.contact || 'N/A'}</td>
                      <td className="px-2 py-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {followUp.lead.status || followUp.lead.currentStatus?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium">{followUp.dateTime.date}</div>
                          <div className="text-xs text-gray-500">{followUp.dateTime.time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {followUp.lead.customData?.["Summary of the conversation"] || followUp.description || followUp.lead.customData?.["Notes"] || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Email"] || followUp.lead.customData?.email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredTodaysFollowUps().length === 0 && (
                <div className="text-center py-8">
                  <Icon icon="solar:check-circle-line-duotone" className="text-green-500 text-3xl mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No follow-ups for today!</p>
                </div>
              )}
            </div>
            
            {/* Show More Button for Today's Follow-ups */}
            {getTotalFilteredTodaysFollowUps().length > 2 && (
              <div className="mt-4 text-center">
                <Button
                  color="light"
                  size="sm"
                  onClick={() => setShowMoreToday(!showMoreToday)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Icon icon={showMoreToday ? "solar:arrow-up-line-duotone" : "solar:arrow-down-line-duotone"} className="text-sm" />
                  {showMoreToday ? 'Show Less' : `Show More (${getTotalFilteredTodaysFollowUps().length - 2} more)`}
                </Button>
              </div>
            )}
          </div>

          {/* Tomorrow's Follow-ups */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:calendar-line-duotone" className="text-yellow-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tomorrow's Follow-ups</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">{getTotalFilteredTomorrowsFollowUps().length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="tomorrowFilter" value="Filter by Status:" className="text-sm text-gray-600 dark:text-gray-400" />
                <Select
                  id="tomorrowFilter"
                  value={tomorrowFilter}
                  onChange={(e) => setTomorrowFilter(e.target.value)}
                  className="w-32"
                >
                  <option value="all">All Status</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Assigned To</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Processed By</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Mobile</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Next Schedule</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Comment</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredTomorrowsFollowUps().filter(followUp => followUp.lead).map(followUp => (
                    <tr 
                      key={followUp.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {(followUp.lead.customData?.["First Name"] || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {followUp.lead.customData?.["First Name"] || 'Unknown'} {followUp.lead.customData?.["Last Name"] || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Phone"] || followUp.lead.customData?.phone || followUp.lead.customData?.contact || 'N/A'}</td>
                      <td className="px-2 py-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {followUp.lead.status || followUp.lead.currentStatus?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium">{followUp.dateTime.date}</div>
                          <div className="text-xs text-gray-500">{followUp.dateTime.time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {followUp.lead.customData?.["Summary of the conversation"] || followUp.description || followUp.lead.customData?.["Notes"] || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Email"] || followUp.lead.customData?.email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredTomorrowsFollowUps().length === 0 && (
                <div className="text-center py-8">
                  <Icon icon="solar:check-circle-line-duotone" className="text-green-500 text-3xl mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No follow-ups for tomorrow!</p>
                </div>
              )}
            </div>
            
            {/* Show More Button for Tomorrow's Follow-ups */}
            {getTotalFilteredTomorrowsFollowUps().length > 2 && (
              <div className="mt-4 text-center">
                <Button
                  color="light"
                  size="sm"
                  onClick={() => setShowMoreTomorrow(!showMoreTomorrow)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Icon icon={showMoreTomorrow ? "solar:arrow-up-line-duotone" : "solar:arrow-down-line-duotone"} className="text-sm" />
                  {showMoreTomorrow ? 'Show Less' : `Show More (${getTotalFilteredTomorrowsFollowUps().length - 2} more)`}
                </Button>
              </div>
            )}
          </div>

          {/* Pending Follow-ups */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:clock-circle-line-duotone" className="text-blue-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Follow-ups</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">{getTotalFilteredPendingFollowUps().length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="pendingFilter" value="Filter by Status:" className="text-sm text-gray-600 dark:text-gray-400" />
                <Select
                  id="pendingFilter"
                  value={pendingFilter}
                  onChange={(e) => setPendingFilter(e.target.value)}
                  className="w-32"
                >
                  <option value="all">All Status</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Assigned To</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Processed By</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Mobile</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Next Schedule</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Comment</th>
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredPendingFollowUps().filter(followUp => followUp.lead).map(followUp => (
                    <tr 
                      key={followUp.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {(followUp.lead.customData?.["First Name"] || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {followUp.lead.customData?.["First Name"] || 'Unknown'} {followUp.lead.customData?.["Last Name"] || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.assignedTo.name}</td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Phone"] || followUp.lead.customData?.phone || followUp.lead.customData?.contact || 'N/A'}</td>
                      <td className="px-2 py-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {followUp.lead.status || followUp.lead.currentStatus?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium">{followUp.dateTime.date}</div>
                          <div className="text-xs text-gray-500">{followUp.dateTime.time}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {followUp.lead.customData?.["Summary of the conversation"] || followUp.description || followUp.lead.customData?.["Notes"] || 'N/A'}
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">{followUp.lead.customData?.["Email"] || followUp.lead.customData?.email || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {getFilteredPendingFollowUps().length === 0 && (
                <div className="text-center py-8">
                  <Icon icon="solar:check-circle-line-duotone" className="text-green-500 text-3xl mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No pending follow-ups!</p>
                </div>
              )}
            </div>
            
            {/* Show More Button for Pending Follow-ups */}
            {getTotalFilteredPendingFollowUps().length > 2 && (
              <div className="mt-4 text-center">
                <Button
                  color="light"
                  size="sm"
                  onClick={() => setShowMorePending(!showMorePending)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Icon icon={showMorePending ? "solar:arrow-up-line-duotone" : "solar:arrow-down-line-duotone"} className="text-sm" />
                  {showMorePending ? 'Show Less' : `Show More (${getTotalFilteredPendingFollowUps().length - 2} more)`}
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Lead Details Modal */}
      <Modal show={isFollowUpModalOpen} onClose={handleCloseFollowUpModal} size="lg">
        <Modal.Header>
          <div className="flex items-center gap-2">
            <Icon icon="solar:user-line-duotone" className="text-blue-600 text-xl" />
            <span>Lead Details</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectedLead && (
            <div className="space-y-6">
              {/* Lead Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-6 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {(selectedLead?.customData?.["First Name"] || selectedLead?.customData?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedLead?.customData?.["First Name"] || selectedLead?.customData?.name || 'Unknown'} {selectedLead?.customData?.["Last Name"] || ''}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">{selectedLead?.project.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge color="info" size="sm">{selectedLead?.currentStatus.name}</Badge>
                      <Badge 
                        color={
                          (selectedLead?.customData?.["Lead Priority"] || selectedLead?.customData?.leadPriority) === 'Hot' ? 'failure' :
                          (selectedLead?.customData?.["Lead Priority"] || selectedLead?.customData?.leadPriority) === 'Warm' ? 'warning' : 'success'
                        } 
                        size="sm"
                      >
                        {selectedLead?.customData?.["Lead Priority"] || selectedLead?.customData?.leadPriority || 'Low'} Priority
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Icon icon="solar:phone-line-duotone" className="text-blue-500" />
                    Contact Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Phone"] || selectedLead?.customData?.phone || selectedLead?.customData?.contact || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Email"] || selectedLead?.customData?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Assigned To:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.user.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Icon icon="solar:buildings-line-duotone" className="text-green-500" />
                    Project Details
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Project:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.project.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lead Source:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.leadSource.name}</p>
                    </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Property Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Property Type"] || selectedLead?.customData?.propertyType || 'N/A'}</p>
                  </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Icon icon="solar:settings-line-duotone" className="text-purple-500" />
                  Additional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Configuration:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Configuration"] || selectedLead?.customData?.configuration || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Funding Mode:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Funding Mode"] || selectedLead?.customData?.fundingMode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Budget:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Budget"] || selectedLead?.customData?.budget || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gender:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.customData?.["Gender"] || selectedLead?.customData?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Days Open:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedLead?.daysOpen || 0} days</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(selectedLead?.customData?.["Notes"] || selectedLead?.customData?.["Remark"]) && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Icon icon="solar:notes-line-duotone" className="text-orange-500" />
                    Notes
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedLead?.customData?.["Notes"] || selectedLead?.customData?.notes || selectedLead?.customData?.["Remark"] || 'No notes available'}
                  </p>
                </div>
              )}

              {/* Follow-up Section */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Icon icon="solar:calendar-add-line-duotone" className="text-orange-500" />
                  Set Follow-up
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="followUpDate" value="Follow-up Date & Time" className="block mb-2" />
                    <DateTimePicker
                      id="followUpDate"
                      type="datetime"
                      value={followUpDate}
                      onChange={setFollowUpDate}
                      placeholder="Select follow-up date and time"
                      className="w-full"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="followUpNotes" value="Follow-up Notes (Optional)" className="block mb-2" />
                    <TextInput
                      id="followUpNotes"
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      placeholder="Add any notes about this follow-up..."
                      className="w-full"
                    />
                  </div>

                  {/* Alert */}
                  {followUpAlert && (
                    <Alert color={followUpAlert.type} className="mb-4">
                      <Icon 
                        icon={followUpAlert?.type === 'success' ? 'solar:check-circle-line-duotone' : 'solar:danger-circle-line-duotone'} 
                        className="mr-2" 
                      />
                      {followUpAlert?.message}
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-between">
            <Button
              color="gray"
              onClick={handleCloseFollowUpModal}
              disabled={isSubmittingFollowUp}
            >
              Close
            </Button>
            <Button
              color="blue"
              onClick={handleSubmitFollowUp}
              disabled={isSubmittingFollowUp || !followUpDate}
              className="flex items-center gap-2"
            >
              {isSubmittingFollowUp ? (
                <>
                  <Icon icon="solar:loading-line-duotone" className="animate-spin text-sm" />
                  Setting Follow-up...
                </>
              ) : (
                <>
                  <Icon icon="solar:calendar-add-line-duotone" className="text-sm" />
                  Set Follow-up
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      </div>
  );
};

export default CrmDashboard;