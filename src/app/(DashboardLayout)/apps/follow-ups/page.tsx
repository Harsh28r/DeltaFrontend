"use client";
import React, { useState, useEffect } from "react";
import { Button, Label, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

// Follow-up interfaces
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
    _id?: string;
    status?: string;
    statusId?: string;
    currentStatus?: {
      _id: string;
      name: string;
    };
    customData?: {
      "First Name"?: string;
      "Last Name"?: string;
      Email?: string;
      Phone?: string;
      "Summary of the conversation"?: string;
      [key: string]: any;
    };
    project: string;
    assignedTo: {
      _id?: string;
      id?: string;
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

export interface FollowUpsStats {
  stats: {
    total: number;
    pending: number;
    overdue: number;
    today: number;
    upcoming: number;
    completed: number;
  };
}

const FollowUpsPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUpsData | null>(null);
  const [followUpsStats, setFollowUpsStats] = useState<FollowUpsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch follow-ups data
  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!token) return;

      try {
        setIsLoading(true);

        const [followUpsResponse, followUpsStatsResponse] = await Promise.all([
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

        if (followUpsResponse.ok && followUpsStatsResponse.ok) {
          const [followUpsData, followUpsStatsData] = await Promise.all([
            followUpsResponse.json(),
            followUpsStatsResponse.json()
          ]);

          console.log('📊 Follow-ups Response:', followUpsData);
          console.log('📈 Follow-ups Stats:', followUpsStatsData);
          console.log('📋 Today Follow-ups:', followUpsData?.followUps?.today);
          console.log('📋 Tomorrow Follow-ups:', followUpsData?.followUps?.tomorrow);
          console.log('📋 Upcoming Follow-ups:', followUpsData?.followUps?.upcoming);
          console.log('📋 Pending Follow-ups:', followUpsData?.followUps?.pending);

          setFollowUps(followUpsData);
          setFollowUpsStats(followUpsStatsData);
        } else {
          console.error('❌ Follow-ups API Error:', {
            followUpsStatus: followUpsResponse.status,
            statsStatus: followUpsStatsResponse.status
          });
        }
      } catch (error) {
        console.error("❌ Error fetching follow-ups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowUps();
  }, [token]);

  // Helper functions for follow-ups categorization
  const getTodaysFollowUps = () => {
    const todayArray = followUps?.followUps?.today;
    console.log('🔍 getTodaysFollowUps:', { todayArray, isArray: Array.isArray(todayArray), length: todayArray?.length });
    if (!todayArray || !Array.isArray(todayArray)) return [];
    return todayArray;
  };

  const getTomorrowsFollowUps = () => {
    const tomorrowArray = followUps?.followUps?.tomorrow;
    console.log('🔍 getTomorrowsFollowUps:', { tomorrowArray, isArray: Array.isArray(tomorrowArray), length: tomorrowArray?.length });
    if (!tomorrowArray || !Array.isArray(tomorrowArray)) return [];
    return tomorrowArray;
  };

  const getUpcomingFollowUps = () => {
    const upcomingArray = followUps?.followUps?.upcoming;
    console.log('🔍 getUpcomingFollowUps:', { upcomingArray, isArray: Array.isArray(upcomingArray), length: upcomingArray?.length });
    if (!upcomingArray || !Array.isArray(upcomingArray)) return [];
    return upcomingArray;
  };

  const getPendingFollowUps = () => {
    const pendingArray = followUps?.followUps?.pending;
    console.log('🔍 getPendingFollowUps:', { pendingArray, isArray: Array.isArray(pendingArray), length: pendingArray?.length });
    if (!pendingArray || !Array.isArray(pendingArray)) return [];
    return pendingArray;
  };

  // Filtered follow-ups functions
  const getFilteredTodaysFollowUps = () => {
    const todaysFollowUps = getTodaysFollowUps();
    console.log('🔍 DEBUG - Today Filter:', todayFilter);
    console.log('🔍 DEBUG - All Today Follow-ups:', todaysFollowUps);
    console.log('🔍 DEBUG - Today Follow-ups Count:', todaysFollowUps.length);
    console.log('🔍 DEBUG - Follow-ups with leads:', todaysFollowUps.filter(f => f.lead).length);
    console.log('🔍 DEBUG - Follow-ups without leads:', todaysFollowUps.filter(f => !f.lead).length);
    
    const filtered = todayFilter === 'all' ? todaysFollowUps : todaysFollowUps.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === todayFilter
    );
    console.log('🔍 DEBUG - Filtered Today Follow-ups:', filtered);
    console.log('🔍 DEBUG - Filtered Count:', filtered.length);
    
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

    const allFollowUps = [
      ...(Array.isArray(followUps.followUps.today) ? followUps.followUps.today : []),
      ...(Array.isArray(followUps.followUps.tomorrow) ? followUps.followUps.tomorrow : []),
      ...(Array.isArray(followUps.followUps.upcoming) ? followUps.followUps.upcoming : []),
      ...(Array.isArray(followUps.followUps.pending) ? followUps.followUps.pending : [])
    ];

    const statuses = new Set(
      allFollowUps
        .filter(followUp => followUp.lead)
        .map(followUp => followUp.lead.status || followUp.lead.currentStatus?.name)
        .filter(status => status)
    );
    return Array.from(statuses).sort();
  };

  // Navigate to lead detail page
  const handleLeadClick = (leadId: string) => {
    console.log('🔗 Navigating to lead:', leadId);
    router.push(`/apps/leads/${leadId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      {/* Follow-up Dashboard */}
      <div>
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
              {followUps?.summary?.total || 0} Follow-ups
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
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100"> {followUps?.summary?.total || 0}</p>
                </div>
                <Icon icon="solar:list-line-duotone" className="text-blue-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Today</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100"> {followUps?.summary?.today || 0}</p>
                </div>
                <Icon icon="solar:clock-circle-line-duotone" className="text-red-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Upcoming</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100"> {followUps?.summary?.upcoming || 0}</p>
                </div>
                <Icon icon="solar:calendar-line-duotone" className="text-yellow-500 text-xl" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Pending</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100"> {followUps?.summary?.pending || 0}</p>
                </div>
                <Icon icon="solar:clock-circle-line-duotone" className="text-blue-500 text-xl" />
              </div>
            </div>

            {/* <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
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
            </div> */}


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
                  {(() => {
                    const filtered = getFilteredTodaysFollowUps();
                    const withLeads = filtered.filter(followUp => followUp.lead);
                    console.log('🎯 RENDER - Filtered Today:', filtered.length);
                    console.log('🎯 RENDER - With Leads:', withLeads.length);
                    console.log('🎯 RENDER - Items to display:', withLeads);
                    return withLeads;
                  })().map(followUp => (
                    <tr
                      key={followUp.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id || followUp.lead._id || '')}
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
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id || followUp.lead._id || '')}
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

          {/* Upcoming Follow-ups (after tomorrow) */}
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:calendar-mark-line-duotone" className="text-blue-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Follow-ups</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">{getTotalFilteredUpcomingFollowUps().length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="upcomingFilter" value="Filter by Status:" className="text-sm text-gray-600 dark:text-gray-400" />
                <Select
                  id="upcomingFilter"
                  value={upcomingFilter}
                  onChange={(e) => setUpcomingFilter(e.target.value)}
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
                  {getFilteredUpcomingFollowUps().filter(followUp => followUp.lead).map(followUp => (
                    <tr
                      key={followUp.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id || followUp.lead._id || '')}
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

              {getFilteredUpcomingFollowUps().length === 0 && (
                <div className="text-center py-8">
                  <Icon icon="solar:check-circle-line-duotone" className="text-green-500 text-3xl mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">No upcoming follow-ups!</p>
                </div>
              )}
            </div>

            {/* Show More Button for Upcoming Follow-ups */}
            {getTotalFilteredUpcomingFollowUps().length > 2 && (
              <div className="mt-4 text-center">
                <Button
                  color="light"
                  size="sm"
                  onClick={() => setShowMoreUpcoming(!showMoreUpcoming)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Icon icon={showMoreUpcoming ? "solar:arrow-up-line-duotone" : "solar:arrow-down-line-duotone"} className="text-sm" />
                  {showMoreUpcoming ? 'Show Less' : `Show More (${getTotalFilteredUpcomingFollowUps().length - 2} more)`}
                </Button>
              </div>
            )}
          </div>

          {/* Pending Follow-ups (Overdue) */}
          <div className="border-l-4 border-orange-500 pl-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:danger-triangle-line-duotone" className="text-orange-500 text-lg" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Follow-ups (Overdue)</h3>
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">{getTotalFilteredPendingFollowUps().length}</span>
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
                    <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Name </th>
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
                      onClick={() => followUp.lead && handleLeadClick(followUp.lead.id || followUp.lead._id || '')}
                    >
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
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
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {followUp.lead.status || followUp.lead.currentStatus?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium text-orange-600 dark:text-orange-400">{followUp.dateTime.date}</div>
                          <div className="text-xs text-orange-500 dark:text-orange-500">{followUp.dateTime.time}</div>
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
                  <p className="text-gray-500 dark:text-gray-400">No overdue follow-ups!</p>
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
    </div>
  );
};

export default FollowUpsPage;
