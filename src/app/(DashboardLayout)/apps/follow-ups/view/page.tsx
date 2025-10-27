"use client";
import React, { useState, useEffect } from "react";
import { Button, Label, Select, Card, Badge } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { log } from "node:console";

// Interfaces (reusing from the original follow-ups page)
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
    total: number;
    type: string;
  };
  timestamp?: string;
}

const FollowUpViewPage = () => {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const [followUps, setFollowUps] = useState<FollowUpsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showMore, setShowMore] = useState(false);
  console.log('view', view);


  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!token) return;


      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/follow-ups`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setFollowUps(data);
          console.log("foloowup data", data);

        } else {
          console.error('Failed to fetch follow-ups:', response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error fetching follow-ups:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowUps();
  }, [token]);

  const getTitleAndData = () => {
    switch (view) {
      case 'today':
        return { title: "Today's Follow-ups", data: followUps?.followUps?.today || [], icon: 'solar:clock-circle-line-duotone', color: 'red' };
      case 'tomorrow':
        return { title: "Tomorrow's Follow-ups", data: followUps?.followUps?.tomorrow || [], icon: 'solar:calendar-line-duotone', color: 'yellow' };
      case 'upcoming':
        return { title: "Upcoming Follow-ups", data: followUps?.followUps?.upcoming || [], icon: 'solar:calendar-mark-line-duotone', color: 'blue' };
      case 'pending':
        return { title: "Pending (Overdue) Follow-ups", data: followUps?.followUps?.pending || [], icon: 'solar:danger-triangle-line-duotone', color: 'orange' };
      default:
        return { title: "Follow-ups", data: [], icon: 'solar:calendar-search-line-duotone', color: 'gray' };
    }
  };




  const { title, data, icon, color } = getTitleAndData();



  const getUniqueStatuses = () => {
    if (!data) return [];
    const statuses = new Set(
      data
        .filter(followUp => followUp.lead)
        .map(followUp => followUp.lead.status || followUp.lead.currentStatus?.name)
        .filter(status => status)
    );
    return Array.from(statuses).sort();
  };

  const getFilteredFollowUps = () => {
    const filtered = filter === 'all' ? data : data.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === filter
    );
    return showMore ? filtered : filtered.slice(0, 10);
  };

  const getTotalFilteredFollowUps = () => {
    return filter === 'all' ? data : data.filter(followUp =>
      followUp.lead && (followUp.lead.status || followUp.lead.currentStatus?.name) === filter
    );
  };

  const handleLeadClick = (leadId: string) => {
    router.push(`/apps/leads/${leadId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const colorClasses = {
    red: {
      icon: 'text-red-500',
      badge: 'bg-red-100 text-red-800',
      avatar: 'bg-red-100 dark:bg-red-900',
      avatarText: 'text-red-700 dark:text-red-300'
    },
    yellow: {
      icon: 'text-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
      avatar: 'bg-yellow-100 dark:bg-yellow-900',
      avatarText: 'text-yellow-700 dark:text-yellow-300'
    },
    blue: {
      icon: 'text-blue-500',
      badge: 'bg-blue-100 text-blue-800',
      avatar: 'bg-blue-100 dark:bg-blue-900',
      avatarText: 'text-blue-700 dark:text-blue-300'
    },
    orange: {
      icon: 'text-orange-500',
      badge: 'bg-orange-100 text-orange-800',
      avatar: 'bg-orange-100 dark:bg-orange-900',
      avatarText: 'text-orange-700 dark:text-orange-300'
    },
    gray: {
      icon: 'text-gray-500',
      badge: 'bg-gray-100 text-gray-800',
      avatar: 'bg-gray-100 dark:bg-gray-900',
      avatarText: 'text-gray-700 dark:text-gray-300'
    }
  };

  const currentColors = colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button color="gray" size="sm" onClick={() => router.back()}>
            <Icon icon="solar:arrow-left-line-duotone" />
          </Button>
          <Icon icon={icon} className={`${currentColors.icon} text-2xl`} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-gray-600 dark:text-gray-400">A focused view of your scheduled follow-ups.</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
            <span className={`${currentColors.badge} text-xs font-medium px-2.5 py-1 rounded-full`}>
              {getTotalFilteredFollowUps().length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="statusFilter" value="Filter by Status:" className="text-sm text-gray-600 dark:text-gray-400" />
            <Select id="statusFilter" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40" >
              <option value="all">All Statuses</option>
              {getUniqueStatuses().map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3">Lead Name</th>
                <th scope="col" className="px-4 py-3">Assigned To</th>
                <th scope="col" className="px-4 py-3">Processed By</th>
                <th scope="col" className="px-4 py-3">Contact</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Scheduled At</th>
                <th scope="col" className="px-4 py-3">Last Comment</th>
                <th scope="col" className="px-4 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredFollowUps().filter(followUp => followUp.lead).map(followUp => (
                <tr key={followUp.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => followUp.lead && handleLeadClick(followUp.lead.id || followUp.lead._id || '')}>
                  <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-full ${currentColors.avatar} flex items-center justify-center`}>
                        <span className={`${currentColors.avatarText} font-semibold text-xs`}>
                          {(followUp.lead.customData?.["First Name"] || followUp.lead.customData?.name || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {followUp.lead.customData?.["First Name"] || followUp.lead.customData?.name || 'Unknown'} {followUp.lead.customData?.["Last Name"] || ''}
                    </div>
                  </th>
                  <td className="px-4 py-3">{followUp.assignedTo.name}</td>
                  <td className="px-4 py-3">{followUp.lead.assignedTo.name}</td>
                  <td className="px-4 py-3">{followUp.lead.customData?.["Phone"] || followUp.lead.customData?.phone || followUp.lead.customData?.contact || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <Badge color="blue">
                      {followUp.lead.status || followUp.lead.currentStatus?.name || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{followUp.dateTime.date}</div>
                    <div className="text-xs text-gray-500">{followUp.dateTime.time}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{followUp.lead.customData?.["Summary of the conversation"] || followUp.description || followUp.lead.customData?.["Notes"] || 'N/A'}</td>
                  <td className="px-4 py-3">{followUp.lead.customData?.["Email"] || followUp.lead.customData?.email || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {getFilteredFollowUps().length === 0 && (
            <div className="text-center py-10">
              <Icon icon="solar:check-circle-bold-duotone" className="text-green-500 text-4xl mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">All clear! No follow-ups in this category.</p>
            </div>
          )}
        </div>

        {getTotalFilteredFollowUps().length > 10 && (
          <div className="mt-4 text-center">
            <Button color="light" size="sm" onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 mx-auto">
              <Icon icon={showMore ? "solar:arrow-up-line-duotone" : "solar:arrow-down-line-duotone"} className="text-sm" />
              {showMore ? 'Show Less' : `Show More (${getTotalFilteredFollowUps().length - 10} more)`}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FollowUpViewPage;