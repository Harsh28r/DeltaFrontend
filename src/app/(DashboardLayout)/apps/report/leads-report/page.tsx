"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, Card, Table, Badge, Alert, Select, TextInput, Pagination } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";
import { PERMISSIONS } from "@/app/types/permissions";
import { usePermissions } from "@/app/context/PermissionContext";
import { useRouter, useSearchParams } from "next/navigation";

// Interfaces
interface LeadStatusSummary {
  statusName: string;
  count: number;
}

interface StatusBreakdown {
  running: boolean;
  lead: number;
  updatedLead: number;
  oldLead: number;
}

interface UserPerformance {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userLevel: number;
  totalLeads: number;
  freshLead: number;
  isActive?: boolean;
  statusBreakdown: {
    [statusName: string]: StatusBreakdown;
  };
}

interface AvailableStatus {
  _id: string;
  name: string;
  isFinalStatus: boolean;
  isDefaultStatus: boolean;
}

interface ReportInfo {
  generatedAt: string;
  filters: {
    startDate: string | null;
    endDate: string | null;
    projectId: string | null;
    userId: string | null;
    channelPartnerId: string | null;
    leadSourceId: string | null;
    statusId: string | null;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  };
  totalUsers: number;
  totalLeads: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface LeadReportData {
  leadStatusSummary: LeadStatusSummary[];
  userPerformance: UserPerformance[];
  availableStatuses: AvailableStatus[];
  reportInfo: ReportInfo;
}

interface Project {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface LeadSource {
  _id: string;
  name: string;
}

interface ChannelPartner {
  _id: string;
  name: string;
  firmName: string;
  phone: string;
}

const LeadReportsPage = () => {
  const { token, user } = useAuth();
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Super admin bypass - no permission checks needed
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'superadmin@deltayards.com';
  
  // Map permissions via usePermissions; superadmin bypass
  const finalPermissions = {
    canReadReports: isSuperAdmin ? true : hasPermission(PERMISSIONS.REPORTS_READ),
    permissionsLoading: false
  };

  // State
  const [reportData, setReportData] = useState<LeadReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Filter state
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [filterUserId, setFilterUserId] = useState<string>("all");
  const [filterChannelPartnerId, setFilterChannelPartnerId] = useState<string>("all");
  const [filterLeadSourceId, setFilterLeadSourceId] = useState<string>("all");
  const [filterStatusId, setFilterStatusId] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("custom");
  const [searchTerm, setSearchTerm] = useState("");

  // Reference data
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Initialize filters from URL query parameters
  useEffect(() => {
    const statusIdParam = searchParams.get('statusId');
    const userIdParam = searchParams.get('userId');

    let hasFilters = false;
    let filterMessage = '';

    if (statusIdParam) {
      setFilterStatusId(statusIdParam);
      hasFilters = true;
      filterMessage += 'Status filter applied';
    }
    
    if (userIdParam) {
      setFilterUserId(userIdParam);
      hasFilters = true;
      if (filterMessage) filterMessage += ' and ';
      filterMessage += 'User filter applied';
    }

    // Auto-apply filters when coming from charts
    if (hasFilters && token && finalPermissions.canReadReports) {
      setAlertMessage({ 
        type: 'info', 
        message: `${filterMessage} from chart selection. Click "Apply Filters" to refresh or "Clear All" to reset.` 
      });
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        fetchLeadReport();
      }, 100);
    }
  }, [searchParams]);

  // Fetch reference data on mount
  useEffect(() => {
    if (token) {
      fetchReferenceData();
    }
  }, [token]);

  // Fetch report when dependencies change or on mount
  useEffect(() => {
    if (token && finalPermissions.canReadReports) {
      fetchLeadReport();
    }
  }, [token, finalPermissions.canReadReports, currentPage, pageSize, sortOrder]);

  const fetchReferenceData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        const projectsList = projectsData.projects || projectsData || [];
        setProjects(projectsList);
      }

      // Fetch lead sources
      const sourcesResponse = await fetch(API_ENDPOINTS.LEAD_SOURCES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setLeadSources(sourcesData.leadSources || sourcesData || []);
      }

      // Fetch channel partners
      const channelPartnersResponse = await fetch(API_ENDPOINTS.CHANNEL_PARTNERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (channelPartnersResponse.ok) {
        const channelPartnersData = await channelPartnersResponse.json();
        const partners = channelPartnersData.channelPartners || channelPartnersData || [];
        setChannelPartners(partners);
      }

      // Fetch users (only for super admin)
      if (isSuperAdmin) {
        const usersResponse = await fetch(API_ENDPOINTS.USERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const projects = usersData.projects || usersData || [];
          
          // Extract all unique users from projects (owner, members, managers)
          const allUsers = new Map();
          
          projects.forEach((project: any) => {
            // Add owner
            if (project.owner) {
              allUsers.set(project.owner._id, {
                _id: project.owner._id,
                name: project.owner.name,
                email: project.owner.email,
                role: project.owner.role,
              });
            }
            
            // Add members
            if (project.members && Array.isArray(project.members)) {
              project.members.forEach((member: any) => {
                allUsers.set(member._id, {
                  _id: member._id,
                  name: member.name,
                  email: member.email,
                  role: member.role,
                });
              });
            }
            
            // Add managers
            if (project.managers && Array.isArray(project.managers)) {
              project.managers.forEach((manager: any) => {
                allUsers.set(manager._id, {
                  _id: manager._id,
                  name: manager.name,
                  email: manager.email,
                  role: manager.role,
                });
              });
            }
          });
          
          // Convert Map to Array
          const usersList = Array.from(allUsers.values());
          setUsers(usersList);
        }
      }

      // Fetch total users count for stats card
      try {
        const totalUsersResponse = await fetch(API_ENDPOINTS.TOTAL_USERS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (totalUsersResponse.ok) {
          const totalUsersData = await totalUsersResponse.json();
          const count =
            (typeof totalUsersData === 'number' ? totalUsersData : null) ??
            totalUsersData?.totalUsers ??
            totalUsersData?.count ??
            totalUsersData?.total ??
            (Array.isArray(totalUsersData?.users) ? totalUsersData.users.length : null) ??
            (Array.isArray(totalUsersData) ? totalUsersData.length : null);
          if (typeof count === 'number') {
            setTotalUsersCount(count);
          }
        }
      } catch (e) {
        // Non-fatal; fall back to reportInfo.totalUsers
        console.warn('Failed to fetch total users count');
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadReport = async () => {
    if (isLoadingReport) return;
    
    try {
      setIsLoadingReport(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (filterProjectId && filterProjectId !== 'all') params.append('projectId', filterProjectId);
      if (filterUserId && filterUserId !== 'all') params.append('userId', filterUserId);
      if (filterChannelPartnerId && filterChannelPartnerId !== 'all') params.append('channelPartnerId', filterChannelPartnerId);
      if (filterLeadSourceId && filterLeadSourceId !== 'all') params.append('leadSourceId', filterLeadSourceId);
      if (filterStatusId && filterStatusId !== 'all') params.append('statusId', filterStatusId);
      params.append('sortOrder', sortOrder);
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));

      const url = `${API_ENDPOINTS.LEAD_REPORTS}${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReportData(data.data);
          setLastRefresh(new Date());
        } else {
          setAlertMessage({ type: 'error', message: data.message || 'Failed to fetch report data' });
        }
      } else {
        handleReportError(response);
      }
    } catch (error) {
      console.error("Error fetching lead report:", error);
      setAlertMessage({ 
        type: 'error', 
        message: 'Network error: Failed to fetch report. Please check your connection.' 
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleReportError = (response: Response) => {
    if (response.status === 403) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Insufficient permissions: You need reports:read permission to access this page.' 
      });
    } else if (response.status === 401) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Unauthorized: Please check your authentication.' 
      });
    } else if (response.status === 500) {
      setAlertMessage({ 
        type: 'error', 
        message: 'Server Error: The report API is experiencing issues. Please try again later.' 
      });
    } else {
      setAlertMessage({ 
        type: 'error', 
        message: `Failed to fetch report: ${response.status} ${response.statusText}` 
      });
    }
  };

  const handleDatePresetChange = useCallback((preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case "today":
        const todayStr = today.toISOString().split('T')[0];
        setFilterStartDate(todayStr);
        setFilterEndDate(todayStr);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        setFilterStartDate(yesterdayStr);
        setFilterEndDate(yesterdayStr);
        break;
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        setFilterStartDate(startOfWeek.toISOString().split('T')[0]);
        setFilterEndDate(endOfWeek.toISOString().split('T')[0]);
        break;
      case "lastWeek":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        setFilterStartDate(lastWeekStart.toISOString().split('T')[0]);
        setFilterEndDate(lastWeekEnd.toISOString().split('T')[0]);
        break;
      case "thisMonth":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFilterStartDate(startOfMonth.toISOString().split('T')[0]);
        setFilterEndDate(endOfMonth.toISOString().split('T')[0]);
        break;
      case "lastMonth":
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilterStartDate(lastMonthStart.toISOString().split('T')[0]);
        setFilterEndDate(lastMonthEnd.toISOString().split('T')[0]);
        break;
      case "clear":
        setFilterStartDate("");
        setFilterEndDate("");
        break;
      default:
        // Custom - don't change dates
        break;
    }
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchLeadReport();
  }, [fetchLeadReport]);

  const handleClearFilters = useCallback(() => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterProjectId("all");
    setFilterUserId("all");
    setFilterChannelPartnerId("all");
    setFilterLeadSourceId("all");
    setFilterStatusId("all");
    setDatePreset("custom");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Filter and search users - memoized for performance
  const filteredUsers = useMemo(() => {
    const usersList = reportData?.userPerformance ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return usersList;
    }

    return usersList.filter((user) => {
      const name = (user?.userName ?? "").toLowerCase();
      const email = (user?.userEmail ?? "").toLowerCase();

      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [reportData, searchTerm]);

  // Export to CSV - memoized
  const handleExportToCSV = useCallback(() => {
    if (!reportData || filteredUsers.length === 0) {
      setAlertMessage({ type: 'error', message: 'No data to export' });
      return;
    }

    // Define CSV headers - include all statuses dynamically
    const headers = [
      'User Name',
      'User Email',
      'User Role',
      'User Level',
      'Total Leads',
      'Fresh Leads',
      ...reportData.availableStatuses.map(status => `${status.name} - Lead`),
      ...reportData.availableStatuses.map(status => `${status.name} - Updated`),
      ...reportData.availableStatuses.map(status => `${status.name} - Old`),
    ];

    // Convert data to CSV rows
    const rows = filteredUsers.map(userPerf => [
      userPerf.userName,
      userPerf.userEmail,
      userPerf.userRole,
      userPerf.userLevel.toString(),
      userPerf.totalLeads.toString(),
      userPerf.freshLead.toString(),
      ...reportData.availableStatuses.map(status => {
        const breakdown = userPerf.statusBreakdown[status.name];
        return breakdown ? breakdown.lead.toString() : '0';
      }),
      ...reportData.availableStatuses.map(status => {
        const breakdown = userPerf.statusBreakdown[status.name];
        return breakdown ? breakdown.updatedLead.toString() : '0';
      }),
      ...reportData.availableStatuses.map(status => {
        const breakdown = userPerf.statusBreakdown[status.name];
        return breakdown ? breakdown.oldLead.toString() : '0';
      }),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lead_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAlertMessage({ type: 'success', message: `Exported ${filteredUsers.length} user records to CSV` });
  }, [reportData, filteredUsers]);

  // Server pagination (use API response metadata when available)
  const pagination = reportData?.reportInfo.pagination;
  const paginatedUsers = filteredUsers; // server already paginates

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Server-driven pagination; currentPage validity is managed by API metadata

  if (isLoading || finalPermissions.permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">
          {finalPermissions.permissionsLoading ? 'Loading permissions...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // Check if user has permission to read reports
  if (!finalPermissions.canReadReports) {
    return (
      <div className="w-full flex justify-center">
        <div className="w-[90%] space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Reports</h1>
            <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
              Comprehensive lead performance reports
            </p>
          </div>
        </div>
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              <Icon icon="solar:shield-warning-line-duotone" className="mx-auto text-4xl mb-4" />
              <p className="text-lg font-medium mb-2">Access Denied</p>
              <p className="text-sm mb-4">
                You don't have permission to view reports. Please contact your administrator.
              </p>
            </div>
          </div>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-[90%] space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Lead Reports</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Comprehensive lead performance and status tracking
            {lastRefresh && (
              <span className="block lg:inline lg:ml-2 text-blue-600 dark:text-blue-400 text-xs">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
          <Button 
            onClick={fetchLeadReport} 
            color="gray"
            disabled={isLoadingReport}
            title="Refresh report"
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:refresh-line-duotone" className={`mr-2 ${isLoadingReport ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportToCSV}
            color="success"
            disabled={!reportData || filteredUsers.length === 0}
            title="Export to CSV"
            className="w-full lg:w-auto"
          >
            <Icon icon="solar:download-minimalistic-line-duotone" className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* View Graphs Button */}
      {reportData && (
        <div className="flex justify-center">
          <Button 
            onClick={() => router.push('/apps/report/leads-report/graphs')}
            color="primary"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Icon icon="solar:graph-line-duotone" className="mr-2 text-xl" />
            View Visual Analytics & Charts
          </Button>
        </div>
      )}

      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          color={alertMessage.type === 'success' ? 'success' : alertMessage.type === 'info' ? 'info' : 'failure'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Stats Cards */}
      {reportData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {reportData.reportInfo.totalLeads}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Total Leads</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {reportData.reportInfo.pagination?.totalUsers ?? totalUsersCount ?? reportData.reportInfo.totalUsers}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Total Users</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {reportData.availableStatuses.length}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Statuses</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {filteredUsers.length}
              </div>
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Filtered Users</div>
            </div>
          </Card>
        </div>
      )}

      {/* Lead Status Summary */}
      {reportData && reportData.leadStatusSummary.length > 0 && (
        <Card className="max-w-screen">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-4">Lead Status Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {reportData.leadStatusSummary.map((summary, index) => (
              <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-3 lg:p-4 border border-blue-200 dark:border-blue-700">
                <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate" title={summary.statusName}>{summary.statusName}</div>
                <div className="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.count}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="max-w-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          
          {/* Search and Date Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="w-full">
              <TextInput
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Search</p>
            </div>
            <div className="w-full">
              <TextInput
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                placeholder="Start Date"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Start Date</p>
            </div>
            <div className="w-full">
              <TextInput
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                placeholder="End Date"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">End Date</p>
            </div>
            <div className="w-full">
              <Select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="w-full"
              >
                <option value="custom">Custom Range</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="clear">Clear All</option>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Quick Filters</p>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
            <div className="w-full">
              <Select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="w-full"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">Project</p>
            </div>
            <div className="w-full">
              <Select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="w-full"
              >
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">User</p>
            </div>
            <div className="w-full">
              <Select
                value={filterLeadSourceId}
                onChange={(e) => setFilterLeadSourceId(e.target.value)}
                className="w-full"
              >
                <option value="all">All Sources</option>
                {leadSources.map(source => (
                  <option key={source._id} value={source._id}>
                    {source.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">Lead Source</p>
            </div>
            <div className="w-full">
              <Select
                value={filterChannelPartnerId}
                onChange={(e) => setFilterChannelPartnerId(e.target.value)}
                className="w-full"
              >
                <option value="all">All Partners</option>
                {channelPartners.map(partner => (
                  <option key={partner._id} value={partner._id}>
                    {partner.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">Channel Partner</p>
            </div>
            <div className="w-full">
              <Select
                value={filterStatusId}
                onChange={(e) => setFilterStatusId(e.target.value)}
                className="w-full"
              >
                <option value="all">All Statuses</option>
                {reportData?.availableStatuses.map(status => (
                  <option key={status._id} value={status._id}>
                    {status.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-gray-500 mt-1">Status</p>
            </div>
            <div className="w-full">
              <Select
                value={sortOrder}
                onChange={(e) => { setCurrentPage(1); setSortOrder((e.target.value as 'asc' | 'desc')); }}
                className="w-full"
              >
                <option value="desc">Sort: High to Low</option>
                <option value="asc">Sort: Low to High</option>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Sort Order</p>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleApplyFilters} color="primary" disabled={isLoadingReport} className="w-full sm:w-auto">
              <Icon icon="solar:filter-line-duotone" className="mr-2" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} color="gray" className="w-full sm:w-auto">
              <Icon icon="solar:refresh-line-duotone" className="mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </Card>

      {/* User Performance Table */}
      <Card className="max-w-full">
        {isLoadingReport ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading report...</p>
          </div>
        ) : !reportData ? (
          <div className="text-center py-8">
            <Icon icon="solar:document-line-duotone" className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No report data available. Please apply filters and click "Apply Filters".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell className="min-w-[150px]">User</Table.HeadCell>
                <Table.HeadCell className="min-w-[120px]">Email</Table.HeadCell>
                <Table.HeadCell className="min-w-[80px]">Role</Table.HeadCell>
                <Table.HeadCell className="min-w-[90px]">Status</Table.HeadCell>
                <Table.HeadCell className="min-w-[80px]">Total Leads</Table.HeadCell>
                <Table.HeadCell className="min-w-[80px]">Fresh Leads</Table.HeadCell>
                {reportData.availableStatuses.map(status => (
                  <Table.HeadCell key={status._id} className="min-w-[200px]" colSpan={3}>
                    <div className="text-center font-bold">{status.name}</div>
                    <div className="grid grid-cols-3 gap-2 mt-1 text-xs font-normal">
                      <div>Lead</div>
                      <div>Updated</div>
                      <div>Old</div>
                    </div>
                  </Table.HeadCell>
                ))}
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredUsers.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={6 + (reportData.availableStatuses.length * 3)} className="text-center py-8">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                        <p>No user performance data found</p>
                        <p className="text-sm">
                          {reportData.userPerformance.length === 0 
                            ? "No data available for the selected filters"
                            : "No users match your search criteria"
                          }
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  paginatedUsers.map((userPerf) => (
                    <Table.Row key={userPerf.userId} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {userPerf.userName}
                      </Table.Cell>
                      <Table.Cell className="text-sm text-gray-600 dark:text-gray-400">
                        {userPerf.userEmail}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="blue" size="sm">
                          {userPerf.userRole}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={userPerf.isActive ? 'success' : 'gray'} size="sm">
                          {userPerf.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-center font-semibold text-blue-600 dark:text-blue-400">
                        {userPerf.totalLeads === 0 ? <span className="text-gray-400">0</span> : userPerf.totalLeads}
                      </Table.Cell>
                      <Table.Cell className="text-center font-semibold text-green-600 dark:text-green-400">
                        {userPerf.freshLead}
                      </Table.Cell>
                      {reportData.availableStatuses.map(status => {
                        const breakdown = userPerf.statusBreakdown[status.name] || {
                          running: false,
                          lead: 0,
                          updatedLead: 0,
                          oldLead: 0
                        };
                        return (
                          <React.Fragment key={status._id}>
                            <Table.Cell className="text-center">
                              <span className={breakdown.running ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-400'}>
                                {breakdown.lead}
                              </span>
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <span className={breakdown.running ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400'}>
                                {breakdown.updatedLead}
                              </span>
                            </Table.Cell>
                            <Table.Cell className="text-center">
                              <span className={breakdown.running ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-400'}>
                                {breakdown.oldLead}
                              </span>
                            </Table.Cell>
                          </React.Fragment>
                        );
                      })}
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>

            {/* Pagination Footer */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              {(() => {
                const start = ((pagination?.currentPage || currentPage) - 1) * (pagination?.limit || pageSize) + 1;
                const end = start + (paginatedUsers.length || 0) - 1;
                const total = pagination?.totalUsers ?? reportData?.reportInfo.totalUsers ?? paginatedUsers.length;
                return (
                  <span>
                    Showing {Math.min(start, total)}-{Math.min(end, total)} of {total} user{total !== 1 ? 's' : ''}
                  </span>
                );
              })()}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Rows:</span>
                <Select value={String(pageSize)} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setCurrentPage(1); }} className="w-20">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </div>
              <Pagination
                currentPage={pagination?.currentPage || currentPage}
                totalPages={pagination?.totalPages || 1}
                onPageChange={(page) => setCurrentPage(Math.max(page, 1))}
                showIcons
              />
              </div>
            </div>
            )}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
};

export default LeadReportsPage;
